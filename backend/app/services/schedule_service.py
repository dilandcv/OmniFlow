"""Lógica de negocio de programación: agendar variantes aprobadas, listar y cancelar."""

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.content import APROBADO, ContentVariant
from app.models.schedule import CANCELADO, PUBLICADO, ScheduledPost
from app.schemas.schedule import ScheduledPostCreate


def programar_variante(session: Session, data: ScheduledPostCreate) -> ScheduledPost:
    """Programa una variante aprobada (aprobado -> programado) creando un ScheduledPost."""
    variante = session.get(ContentVariant, data.variante_id)
    if variante is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="La variante no existe.")

    if variante.estado != APROBADO:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Solo se puede programar una variante aprobada (estado actual: {variante.estado}).",
        )

    activa = session.exec(
        select(ScheduledPost).where(
            ScheduledPost.variante_id == data.variante_id,
            ScheduledPost.estado != CANCELADO,
        )
    ).first()
    if activa is not None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="La variante ya tiene una programación activa.",
        )

    programacion = ScheduledPost(variante_id=data.variante_id, programado_para=data.programado_para)
    session.add(programacion)
    variante.estado = "programado"
    variante.fecha_actualizacion = datetime.now(timezone.utc)
    session.add(variante)
    session.commit()
    session.refresh(programacion)
    return programacion


def listar_programaciones(session: Session, estado: str | None = None) -> list[ScheduledPost]:
    query = select(ScheduledPost).order_by(ScheduledPost.programado_para)
    if estado:
        query = query.where(ScheduledPost.estado == estado)
    return session.exec(query).all()


def cancelar_programacion(session: Session, programacion_id: int) -> ScheduledPost:
    """Cancela una programación pendiente: la variante vuelve a 'aprobado'."""
    programacion = session.get(ScheduledPost, programacion_id)
    if programacion is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="La programación no existe.")

    if programacion.estado == PUBLICADO:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="No se puede cancelar una publicación ya realizada.",
        )

    programacion.estado = CANCELADO
    session.add(programacion)

    variante = programacion.variante
    if variante is not None:
        variante.estado = APROBADO
        variante.fecha_actualizacion = datetime.now(timezone.utc)
        session.add(variante)

    session.commit()
    session.refresh(programacion)
    return programacion