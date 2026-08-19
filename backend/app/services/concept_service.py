"""Lógica de negocio de conceptos de contenido (ContentConcept).

Flujo: Idea → (estratega IA) → ContentConcept → (selección) → [fase posterior:
ContentVariant]. Este módulo NO genera contenido final.
"""

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.ai.client import IAConfigError, IAClientError
from app.ai.generator import GeneracionError
from app.ai.strategist import (
    DEFAULT_CONCEPTOS_POR_PLATAFORMA,
    MAX_CONCEPTOS_POR_PLATAFORMA,
    generar_conceptos,
)
from app.models.concept import ContentConcept
from app.models.idea import Idea


def _obtener_idea(session: Session, idea_id: int) -> Idea:
    idea = session.get(Idea, idea_id)
    if idea is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="La idea no existe.")
    return idea


def generar_conceptos_de_idea(
    session: Session,
    idea_id: int,
    cantidad: int | None = None,
) -> list[ContentConcept]:
    """Genera y guarda conceptos por plataforma para la idea (5 por plataforma por defecto)."""
    idea = _obtener_idea(session, idea_id)

    n = cantidad if cantidad is not None else DEFAULT_CONCEPTOS_POR_PLATAFORMA
    if not (1 <= n <= MAX_CONCEPTOS_POR_PLATAFORMA):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=(
                f"La cantidad de conceptos por plataforma debe estar entre 1 y "
                f"{MAX_CONCEPTOS_POR_PLATAFORMA}."
            ),
        )

    try:
        conceptos = generar_conceptos(idea, cantidad=n)
    except IAConfigError:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI provider is not configured",
        )
    except GeneracionError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except IAClientError:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to generate content concepts",
        )

    for concepto in conceptos:
        session.add(concepto)
    session.commit()
    for concepto in conceptos:
        session.refresh(concepto)
    return conceptos


def listar_conceptos(session: Session, idea_id: int) -> list[ContentConcept]:
    """Lista los conceptos de una idea, ordenados por canal."""
    _obtener_idea(session, idea_id)
    return session.exec(
        select(ContentConcept)
        .where(ContentConcept.idea_id == idea_id)
        .order_by(ContentConcept.canal_id, ContentConcept.id)
    ).all()


def seleccionar_concepto(session: Session, concepto_id: int) -> ContentConcept:
    """Marca un concepto como seleccionado (y deselecciona el resto de su idea).

    Un solo concepto queda activo por idea, listo para la fase posterior
    (generar ContentVariant a partir del concepto elegido).
    """
    concepto = session.get(ContentConcept, concepto_id)
    if concepto is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="El concepto no existe.")

    otros = session.exec(
        select(ContentConcept).where(
            ContentConcept.idea_id == concepto.idea_id,
            ContentConcept.id != concepto.id,
        )
    ).all()
    for otro in otros:
        if otro.seleccionado:
            otro.seleccionado = False
            session.add(otro)

    concepto.seleccionado = True
    session.add(concepto)
    session.commit()
    session.refresh(concepto)
    return concepto
