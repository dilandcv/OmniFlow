"""Router de programación: agendar variantes aprobadas, listar y cancelar programaciones."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.db import get_session
from app.models.schedule import ScheduledPost
from app.schemas.schedule import ScheduledPostCreate, ScheduledPostOut
from app.services import schedule_service

router = APIRouter(prefix="/api/programaciones", tags=["programación"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.post("", response_model=ScheduledPostOut, status_code=status.HTTP_201_CREATED)
def programar_variante(data: ScheduledPostCreate, session: SessionDep) -> ScheduledPost:
    """Programa una variante aprobada (crea el ScheduledPost y pasa la variante a 'programado')."""
    return schedule_service.programar_variante(session, data)


@router.get("", response_model=list[ScheduledPostOut])
def listar_programaciones(session: SessionDep, estado: str | None = None) -> list[ScheduledPost]:
    """Lista las programaciones, opcionalmente filtradas por estado (pendiente/publicado/cancelado)."""
    return schedule_service.listar_programaciones(session, estado)


@router.delete("/{programacion_id}", response_model=ScheduledPostOut)
def cancelar_programacion(programacion_id: int, session: SessionDep) -> ScheduledPost:
    """Cancela una programación pendiente: la variante vuelve a 'aprobado'."""
    return schedule_service.cancelar_programacion(session, programacion_id)