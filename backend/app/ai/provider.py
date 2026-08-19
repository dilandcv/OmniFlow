"""Fábrica del proveedor de IA configurado (anthropic | openai | gemini).

Orden de prioridad de la configuración:
1. Configuración en memoria (``app.ai.runtime``), seteada por el usuario desde
   la pantalla "Configuración de IA". La API key NO se persiste.
2. Fallback a ``app.core.config.settings`` (variables de entorno / ``.env``).

Construye y guarda (cachea) una única instancia del cliente activo.
"""

from __future__ import annotations

import logging
import os

from app.ai.client import (
    AnthropicClient,
    BaseIAClient,
    GeminiClient,
    IAConfigError,
    OpenAIClient,
)
from app.ai.runtime import get_runtime_config
from app.core.config import settings

logger = logging.getLogger("omniflow.ai")

DEFAULT_MODELOS: dict[str, str] = {
    "anthropic": "claude-3-5-sonnet-latest",
    "openai": "gpt-4o-mini",
    "gemini": "gemini-2.5-flash",
}

SUPPORTED_PROVIDERS: tuple[str, ...] = tuple(sorted(DEFAULT_MODELOS))

# Modelos de Gemini conocidos (el inicial por defecto es SUPPORTED_GEMINI_MODELS[0]).
SUPPORTED_GEMINI_MODELS: tuple[str, ...] = (
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
)

_CLASES_PROVEEDOR: dict[str, type[BaseIAClient]] = {
    "anthropic": AnthropicClient,
    "openai": OpenAIClient,
    "gemini": GeminiClient,
}

_cliente_activo: BaseIAClient | None = None


def _entero_env(nombre: str, por_defecto: int) -> int:
    try:
        return int(os.getenv(nombre, str(por_defecto)))
    except ValueError:
        logger.warning("Variable %s no es un entero; usando %s.", nombre, por_defecto)
        return por_defecto


def _kwargs_red():
    """Timeout/reintentos/tokens desde el entorno (mismos límites que el CSV)."""
    return {
        "timeout": float(os.getenv("AI_TIMEOUT_SECONDS", "60")),
        "max_retries": _entero_env("AI_MAX_RETRIES", 2),
        "max_tokens": _entero_env("AI_MAX_TOKENS", 1200),
    }


def construir_cliente(
    provider: str,
    api_key: str,
    model: str | None = None,
    *,
    max_retries: int | None = None,
) -> BaseIAClient:
    """Construye un cliente listo para usar (sin cachearlo).

    ``provider``/``api_key``/``model`` pueden venir de la configuración runtime
    o del entorno. Valida los valores y lanza ``IAConfigError`` ante fallos de
    configuración. ``model`` vacío = el predeterminado del proveedor.
    """
    proveedor = (provider or "").strip().lower()
    if proveedor not in _CLASES_PROVEEDOR:
        raise IAConfigError(
            f"Proveedor de IA desconocido: '{proveedor or ''}'. "
            f"Valores válidos: {SUPPORTED_PROVIDERS}."
        )
    if not (api_key or "").strip():
        raise IAConfigError("Falta la API key del proveedor de IA.")

    modelo = (model or "").strip() or DEFAULT_MODELOS[proveedor]
    kwargs = _kwargs_red()
    if max_retries is not None:
        kwargs["max_retries"] = max_retries
    return _CLASES_PROVEEDOR[proveedor](api_key=api_key.strip(), model=modelo, **kwargs)


def get_provider() -> BaseIAClient:
    """Devuelve el cliente de IA activo (configuración runtime o entorno; cacheado)."""
    global _cliente_activo

    if _cliente_activo is not None:
        return _cliente_activo

    runtime = get_runtime_config()
    if runtime is not None:
        _cliente_activo = construir_cliente(runtime.provider, runtime.api_key, runtime.model)
        logger.info(
            "Proveedor de IA configurado (runtime): %s (modelo %s)",
            runtime.provider,
            runtime.model,
        )
        return _cliente_activo

    proveedor = (settings.ai_provider or os.getenv("AI_PROVIDER") or "anthropic").strip().lower()
    api_key = (settings.ai_api_key or os.getenv("AI_API_KEY") or "").strip()

    if not api_key:
        raise IAConfigError(
            "AI provider is not configured. "
            "Configurá un proveedor desde la pantalla 'Configuración de IA' "
            "(la API key solo vive en memoria) o definí AI_API_KEY en backend/.env."
        )

    modelo = (settings.ai_model or os.getenv("AI_MODEL") or "").strip()
    _cliente_activo = construir_cliente(proveedor, api_key, modelo)
    logger.info("Proveedor de IA configurado: %s (modelo %s)", proveedor, _cliente_activo.model)
    return _cliente_activo


def reset_provider() -> None:
    """Limpia el cliente cacheado (útil al cambiar la configuración runtime o en pruebas)."""
    global _cliente_activo
    _cliente_activo = None


__all__ = [
    "get_provider",
    "reset_provider",
    "construir_cliente",
    "DEFAULT_MODELOS",
    "SUPPORTED_PROVIDERS",
    "SUPPORTED_GEMINI_MODELS",
]