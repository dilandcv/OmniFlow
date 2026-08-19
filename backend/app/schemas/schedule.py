"""Esquemas request/response para programaciones."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ScheduledPostCreate(BaseModel):
    """Cuerpo para programar una variante aprobada."""

    variante_id: int
    programado_para: datetime


class ScheduledPostOut(BaseModel):
    """Respuesta de una programación."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    variante_id: int
    programado_para: datetime
    estado: str
    fecha_publicacion: datetime | None = None
    enlace_externo: str | None = None