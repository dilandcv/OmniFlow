"""Lógica de negocio de la configuración runtime del proveedor de IA."""

from app.ai.provider import reset_provider


def activar_configuracion() -> None:
    """Invalida el cliente cacheado para que la próxima llamada use la config activa.

    Se llama tras guardar o eliminar la configuración runtime. La API key sigue
    viviendo solo en ``app.ai.runtime`` (memoria del proceso).
    """
    reset_provider()


__all__ = ["activar_configuracion"]