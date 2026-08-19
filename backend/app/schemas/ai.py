"""Esquemas request/response para la configuración runtime del proveedor de IA."""

from pydantic import BaseModel, Field


class AIConfigInput(BaseModel):
    """Cuerpo para configurar/probar el proveedor de IA (solo en memoria)."""

    provider: str = Field(default="gemini", min_length=2)
    api_key: str = Field(min_length=1)
    model: str | None = None


class AIStatusOut(BaseModel):
    """Estado de la configuración. NUNCA incluye la API key."""

    configured: bool
    provider: str | None = None
    model: str | None = None


class AIConnectionOut(BaseModel):
    """Resultado de la prueba de conexión. NUNCA incluye la API key."""

    connected: bool
    provider: str
    model: str
    message: str