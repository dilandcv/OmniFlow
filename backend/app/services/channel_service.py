"""Lógica de negocio de canales: CRUD con validaciones mínimas."""

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.models.channel import Channel
from app.models.content import ContentVariant
from app.schemas.channel import ChannelCreate, ChannelUpdate


def obtener_canal(session: Session, canal_id: int) -> Channel:
    canal = session.get(Channel, canal_id)
    if canal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="El canal no existe.")
    return canal


def listar_canales(session: Session) -> list[Channel]:
    return session.exec(select(Channel).order_by(Channel.nombre)).all()


def crear_canal(session: Session, data: ChannelCreate) -> Channel:
    if session.exec(select(Channel).where(Channel.slug == data.slug)).first() is not None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=f"Ya existe un canal con slug '{data.slug}'.")
    canal = Channel(**data.model_dump())
    session.add(canal)
    session.commit()
    session.refresh(canal)
    return canal


def actualizar_canal(session: Session, canal_id: int, data: ChannelUpdate) -> Channel:
    canal = obtener_canal(session, canal_id)
    cambios = data.model_dump(exclude_unset=True)
    for campo, valor in cambios.items():
        setattr(canal, campo, valor)
    session.add(canal)
    session.commit()
    session.refresh(canal)
    return canal


def eliminar_canal(session: Session, canal_id: int) -> None:
    canal = obtener_canal(session, canal_id)
    en_uso = session.exec(select(ContentVariant).where(ContentVariant.canal_id == canal_id)).first()
    if en_uso is not None:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail="No se puede eliminar un canal que ya tiene variantes asociadas.",
        )
    session.delete(canal)
    session.commit()