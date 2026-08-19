"""Modelo SQLModel de ScheduledPost (programación de publicación en un canal)."""

from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel

PENDIENTE = "pendiente"
PUBLICADO = "publicado"
CANCELADO = "cancelado"
ESTADOS_PROGRAMACION = (PENDIENTE, PUBLICADO, CANCELADO)


class ScheduledPost(SQLModel, table=True):
    """Publicación programada de una variante ya aprobada."""

    id: int | None = Field(default=None, primary_key=True)
    variante_id: int = Field(foreign_key="contentvariant.id", index=True, unique=True)
    programado_para: datetime
    estado: str = Field(default=PENDIENTE, index=True)
    fecha_publicacion: datetime | None = None
    enlace_externo: str | None = None

    variante: "ContentVariant" = Relationship(back_populates="programacion")