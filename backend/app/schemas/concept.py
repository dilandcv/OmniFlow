"""Esquemas request/response para conceptos de contenido (ContentConcept)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ContentConceptCreate(BaseModel):
    """Cuerpo para crear un concepto manualmente (idea + canal + campos de propuesta)."""

    idea_id: int
    canal_id: int
    title: str = Field(min_length=1)
    description: str = Field(default="")
    format: str = Field(min_length=1)
    hook: str | None = None
    objective: str | None = None
    target_audience: str | None = None
    call_to_action: str | None = None
    estimated_duration: int | None = Field(default=None, ge=0, le=3600)
    rationale: str | None = None


class ContentConceptOut(BaseModel):
    """Respuesta de un concepto. No incluye nada sensible."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    idea_id: int
    canal_id: int
    title: str
    description: str
    format: str
    hook: str | None = None
    objective: str | None = None
    target_audience: str | None = None
    call_to_action: str | None = None
    estimated_duration: int | None = None
    rationale: str | None = None
    seleccionado: bool
    fecha_creacion: datetime


class ContentConceptGenerationResponse(BaseModel):
    """Respuesta del endpoint de generación: conceptos agrupados en una lista."""

    concepts: list[ContentConceptOut] = Field(default_factory=list)


# --- Structured Output: esquema que debe cumplir la respuesta de la IA -------
class ConceptoIA(BaseModel):
    """Un concepto tal como lo devuelve la IA (usa 'platform' = slug del canal)."""

    model_config = ConfigDict(extra="ignore")

    platform: str
    title: str = Field(min_length=1)
    description: str = Field(default="")
    format: str = Field(min_length=1)
    hook: str | None = None
    objective: str | None = None
    target_audience: str | None = None
    call_to_action: str | None = None
    estimated_duration: int | None = Field(default=None, ge=0, le=3600)
    rationale: str | None = None


class ConceptosIAResponse(BaseModel):
    """Contenedor de la respuesta estructurada esperada de la IA."""

    model_config = ConfigDict(extra="ignore")

    concepts: list[ConceptoIA] = Field(default_factory=list)
