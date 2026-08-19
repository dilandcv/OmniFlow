"""Fábrica del proveedor de IA configurado (anthropic | openai).

Lee la configuración de ``app.core.config.settings`` (alimentada por variables
de entorno / ``.env``) y construye/guarda una única instancia del cliente.
"""

from __future__ import annotations

import logging
import os

from app.ai.client import (
    AnthropicClient,
    BaseIAClient,
    IAConfigError,
    OpenAIClient,
)
from app.core.config import settings

logger = logging.getLogger("omniflow.ai")

DEFAULT_MODELOS: dict[str, str] = {
    "anthropic": "claude-3-5-sonnet-latest",
    "openai": "gpt-4o-mini",
}

_cliente_activo: BaseIAClient | None = None


def _entero_env(nombre: str, por_defecto: int) -> int:
    try:
        return int(os.getenv(nombre, str(por_defecto)))
    except ValueError:
        logger.warning("Variable %s no es un entero; usando %s.", nombre, por_defecto)
        return por_defecto


def get_provider() -> BaseIAClient:
    """Devuelve el cliente de IA configurado (cacheado tras la primera llamada)."""
    global _cliente_activo

    if _cliente_activo is not None:
        return _cliente_activo

    proveedor = (settings.ai_provider or os.getenv("AI_PROVIDER") or "anthropic").strip().lower()
    api_key = (settings.ai_api_key or os.getenv("AI_API_KEY") or "").strip()

    if not api_key:
        raise IAConfigError(
            "AI_API_KEY no está configurada. Creá un archivo backend/.env a partir de "
            "backend/.env.example y definí la clave del proveedor."
        )
    if proveedor not in DEFAULT_MODELOS:
        raise IAConfigError(
            f"AI_PROVIDER desconocido: '{proveedor}'. Valores válidos: {sorted(DEFAULT_MODELOS)}."
        )

    modelo = (settings.ai_model or os.getenv("AI_MODEL") or "").strip() or DEFAULT_MODELOS[proveedor]
    clase = AnthropicClient if proveedor == "anthropic" else OpenAIClient

    _cliente_activo = clase(
        api_key=api_key,
        model=modelo,
        timeout=float(os.getenv("AI_TIMEOUT_SECONDS", "60")),
        max_retries=_entero_env("AI_MAX_RETRIES", 2),
        max_tokens=_entero_env("AI_MAX_TOKENS", 1200),
    )
    logger.info("Proveedor de IA configurado: %s (modelo %s)", proveedor, modelo)
    return _cliente_activo


def reset_provider() -> None:
    """Limpia el cliente cacheado (útil en pruebas)."""
    global _cliente_activo
    _cliente_activo = None


__all__ = ["get_provider", "reset_provider", "DEFAULT_MODELOS"]