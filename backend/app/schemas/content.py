"""Esquemas request/response para variantes de contenido."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ContentVariantOut(BaseModel):
    """Respuesta de una variante de contenido."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    idea_id: int
    canal_id: int
    formato: str
    contenido: str
    estado: str
    rechazada: bool
    motivo_rechazo: str | None = None
    fecha_creacion: datetime
    fecha_actualizacion: datetime


class ContentVariantUpdate(BaseModel):
    """Cuerpo para editar una variante (solo en estado borrador)."""

    contenido: str | None = Field(default=None, min_length=1)
    formato: str | None = None


class VarianteRechazo(BaseModel):
    """Cuerpo opcional para rechazar una variante."""

    motivo: str | None = None