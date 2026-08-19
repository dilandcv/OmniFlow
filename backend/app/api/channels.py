"""Router de canales: CRUD de canales disponibles y sus configuraciones."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.db import get_session
from app.models.channel import Channel
from app.schemas.channel import ChannelCreate, ChannelOut, ChannelUpdate
from app.services import channel_service

router = APIRouter(prefix="/api/canales", tags=["canales"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.get("", response_model=list[ChannelOut])
def listar_canales(session: SessionDep) -> list[Channel]:
    """Lista los canales disponibles."""
    return channel_service.listar_canales(session)


@router.post("", response_model=ChannelOut, status_code=status.HTTP_201_CREATED)
def crear_canal(data: ChannelCreate, session: SessionDep) -> Channel:
    """Crea un canal nuevo."""
    return channel_service.crear_canal(session, data)


@router.get("/{canal_id}", response_model=ChannelOut)
def obtener_canal(canal_id: int, session: SessionDep) -> Channel:
    """Obtiene un canal por id."""
    return channel_service.obtener_canal(session, canal_id)


@router.patch("/{canal_id}", response_model=ChannelOut)
def actualizar_canal(canal_id: int, data: ChannelUpdate, session: SessionDep) -> Channel:
    """Actualiza un canal existente."""
    return channel_service.actualizar_canal(session, canal_id, data)


@router.delete("/{canal_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_canal(canal_id: int, session: SessionDep) -> None:
    """Elimina un canal (si no tiene variantes asociadas)."""
    channel_service.eliminar_canal(session, canal_id)