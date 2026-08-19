"""Configuración del proveedor de IA en memoria (runtime), NO persistida.

La API key se guarda únicamente en una variable de este módulo, dentro del
proceso del backend. Nunca se escribe en la base de datos, en archivos, en el
localStorage del frontend, en logs, en tracebacks ni en respuestas HTTP.

Comportamiento esperado: si el backend se reinicia, la configuración se pierde
y ``POST /api/ai/status`` vuelve a ``{configured: false, ...}``. Es un diseño
intencional: no implementar persistencia de credenciales.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RuntimeConfig:
    """Configuración de IA activa en el proceso (proveedor + credencial + modelo)."""

    provider: str
    api_key: str  # NO loguear ni devolver en ninguna salida.
    model: str


_runtime: RuntimeConfig | None = None


def get_runtime_config() -> RuntimeConfig | None:
    """Devuelve la configuración de IA activa o ``None`` si no se configuró."""
    return _runtime


def set_runtime_config(provider: str, api_key: str, model: str) -> RuntimeConfig:
    """Guarda la configuración en memoria. ``api_key`` nunca se persiste."""
    global _runtime
    _runtime = RuntimeConfig(
        provider=provider.strip().lower(),
        api_key=api_key.strip(),
        model=model.strip(),
    )
    return _runtime


def clear_runtime_config() -> None:
    """Elimina la configuración de IA (y con ella la API key) de la memoria."""
    global _runtime
    _runtime = None


__all__ = ["RuntimeConfig", "get_runtime_config", "set_runtime_config", "clear_runtime_config"]