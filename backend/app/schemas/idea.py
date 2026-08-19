"""Esquemas request/response para ideas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.channel import ChannelOut
from app.schemas.content import ContentVariantOut


class IdeaCreate(BaseModel):
    """Cuerpo para crear una idea (premisa + tono + canales elegidos)."""

    premisa: str = Field(min_length=3)
    tono: str = Field(default="neutral")
    canal_ids: list[int] = Field(default_factory=list)


class IdeaOut(BaseModel):
    """Respuesta de idea con sus canales elegidos y variantes generadas."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    premisa: str
    tono: str
    fecha_creacion: datetime
    canales: list[ChannelOut] = Field(default_factory=list)
    variantes: list[ContentVariantOut] = Field(default_factory=list)