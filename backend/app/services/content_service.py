"""Lógica de negocio de contenido: creación de ideas, generación, edición y aprobación de variantes."""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.ai.client import generar_variantes
from app.models.channel import Channel
from app.models.content import BORRADOR, TRANSICIONES_VARIANTE, ContentVariant
from app.models.idea import Idea
from app.schemas.content import ContentVariantUpdate
from app.schemas.idea import IdeaCreate


def _obtener_variante(session: Session, variante_id: int) -> ContentVariant:
    variante = session.get(ContentVariant, variante_id)
    if variante is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="La variante no existe.")
    return variante


def crear_idea_con_variantes(session: Session, data: IdeaCreate) -> Idea:
    """Crea la idea, la vincula a los canales elegidos y genera sus variantes (stub IA)."""
    if not data.canal_ids:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="Selecciona al menos un canal.")

    canales = session.exec(select(Channel).where(Channel.id.in_(data.canal_ids))).all()
    if len(canales) != len(set(data.canal_ids)):
        raise HTTPException(
            status.HTTP_404_NOT_FOUND,
            detail="Alguno de los canales seleccionados no existe.",
        )

    idea = Idea(premisa=data.premisa, tono=data.tono, canales=canales)
    session.add(idea)
    session.commit()
    session.refresh(idea)

    for variante in generar_variantes(idea):
        session.add(variante)
    session.commit()
    session.refresh(idea)

    # Forzar carga de relaciones dentro de la sesión para poder serializarlas.
    list(idea.canales)
    variantes = list(idea.variantes)
    for variante in variantes:
        list([variante.canal])
    return idea


def listar_variantes(session: Session, idea_id: int) -> list[ContentVariant]:
    """Lista las variantes generadas para una idea."""
    if session.get(Idea, idea_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="La idea no existe.")
    return session.exec(
        select(ContentVariant).where(ContentVariant.idea_id == idea_id).order_by(ContentVariant.canal_id)
    ).all()


def actualizar_variante(session: Session, variante_id: int, data: ContentVariantUpdate) -> ContentVariant:
    """Edita el contenido/formato de una variante (solo en estado borrador)."""
    variante = _obtener_variante(session, variante_id)
    if variante.estado != BORRADOR:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede editar una variante en estado 'borrador' (actual: " f"{variante.estado}).",
        )

    if data.contenido is not None:
        variante.contenido = data.contenido
    if data.formato is not None:
        variante.formato = data.formato
    variante.rechazada = False
    variante.motivo_rechazo = None
    variante.fecha_actualizacion = datetime.now(timezone.utc)

    session.add(variante)
    session.commit()
    session.refresh(variante)
    return variante


def _cambiar_estado(session: Session, variante: ContentVariant, destino: str) -> ContentVariant:
    """Validación central de transición de estados (borrador -> aprobado -> programado -> publicado)."""
    if destino not in TRANSICIONES_VARIANTE.get(variante.estado, set()):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Transición inválida: '{variante.estado}' -> '{destino}'.",
        )
    variante.estado = destino
    variante.fecha_actualizacion = datetime.now(timezone.utc)
    session.add(variante)
    session.commit()
    session.refresh(variante)
    return variante


def aprobar_variante(session: Session, variante_id: int) -> ContentVariant:
    """Aprueba una variante (borrador -> aprobado)."""
    variante = _obtener_variante(session, variante_id)
    variante.rechazada = False
    variante.motivo_rechazo = None
    return _cambiar_estado(session, variante, "aprobado")


def rechazar_variante(session: Session, variante_id: int, motivo: str | None = None) -> ContentVariant:
    """Rechaza una variante: la deja marcada como rechazada, manteniéndola en borrador."""
    variante = _obtener_variante(session, variante_id)
    if variante.estado != BORRADOR:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede rechazar una variante en estado 'borrador' (actual: " f"{variante.estado}).",
        )
    variante.rechazada = True
    variante.motivo_rechazo = motivo
    variante.fecha_actualizacion = datetime.now(timezone.utc)
    session.add(variante)
    session.commit()
    session.refresh(variante)
    return variante