"""Esquemas request/response para canales."""

from pydantic import BaseModel, ConfigDict, Field


class ChannelCreate(BaseModel):
    """Cuerpo para crear un canal."""

    nombre: str = Field(min_length=1)
    slug: str = Field(min_length=1, pattern=r"^[a-z0-9-]+$")
    plataforma: str = Field(default="otro")
    config: dict | None = None


class ChannelUpdate(BaseModel):
    """Cuerpo para actualizar un canal (campos opcionales)."""

    nombre: str | None = None
    plataforma: str | None = None
    config: dict | None = None


class ChannelOut(BaseModel):
    """Respuesta de canal."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    slug: str
    plataforma: str
    config: dict | None = None