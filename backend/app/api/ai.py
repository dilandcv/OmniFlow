"""Router de configuración de IA (runtime, en memoria).

Expone cuatro endpoints:
- ``POST /api/ai/config``   guarda proveedor + API key + modelo EN MEMORIA.
- ``GET  /api/ai/status``   devuelve el estado (nunca la API key).
- ``DELETE /api/ai/config`` elimina la configuración (y con ella la API key).
- ``POST /api/ai/test``     prueba la conexión con credenciales dadas (no las guarda).

La API key NO se persiste en ningún medio (ni BD, ni archivo, ni localStorage,
ni logs) y se pierde al reiniciar el backend. Es un diseño intencional.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from app.ai.client import (
    IAClientError,
    IAConfigError,
    IAFormatError,
    IAHttpError,
    IATimeoutError,
)
from app.ai.provider import DEFAULT_MODELOS, SUPPORTED_PROVIDERS, construir_cliente
from app.ai.runtime import clear_runtime_config, get_runtime_config, set_runtime_config
from app.schemas.ai import AIConfigInput, AIConnectionOut, AIStatusOut
from app.services import ai_service

router = APIRouter(prefix="/api/ai", tags=["IA"])


def _validar_entrada(data: AIConfigInput) -> tuple[str, str, str]:
    """Valida y normaliza (proveedor, api_key, modelo) o devuelve un HTTP 400."""
    proveedor = (data.provider or "").strip().lower()
    if proveedor not in DEFAULT_MODELOS:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Proveedor desconocido: '{proveedor}'. Válidos: {SUPPORTED_PROVIDERS}.",
        )
    api_key = (data.api_key or "").strip()
    if not api_key:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail="La API key es obligatoria.")
    modelo = (data.model or "").strip() or DEFAULT_MODELOS[proveedor]
    return proveedor, api_key, modelo


@router.get("/status", response_model=AIStatusOut)
def estado_ia() -> AIStatusOut:
    """Estado de la configuración de IA (nunca expone la API key)."""
    runtime = get_runtime_config()
    if runtime is None:
        return AIStatusOut(configured=False)
    return AIStatusOut(configured=True, provider=runtime.provider, model=runtime.model)


@router.post("/config", response_model=AIStatusOut)
def configurar_ia(data: AIConfigInput) -> AIStatusOut:
    """Guarda el proveedor de IA en memoria y activa el cliente para /api/ideas."""
    proveedor, api_key, modelo = _validar_entrada(data)
    set_runtime_config(proveedor, api_key, modelo)
    ai_service.activar_configuracion()
    return AIStatusOut(configured=True, provider=proveedor, model=modelo)


@router.delete("/config", response_model=AIStatusOut)
def eliminar_configuracion_ia() -> AIStatusOut:
    """Elimina la configuración de IA de la memoria (no hay persistencia)."""
    clear_runtime_config()
    ai_service.activar_configuracion()
    return AIStatusOut(configured=False)


@router.post("/test", response_model=AIConnectionOut)
def probar_conexion(data: AIConfigInput) -> AIConnectionOut:
    """Prueba la conexión con las credenciales dadas SIN guardarlas."""
    proveedor, api_key, modelo = _validar_entrada(data)
    try:
        cliente = construir_cliente(proveedor, api_key, modelo, max_retries=0)
        cliente.complete(
            "Sos un asistente de verificación.",
            "Respondé únicamente con la palabra OK.",
        )
    except IAConfigError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except IATimeoutError as exc:
        raise HTTPException(status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc)) from exc
    except IAHttpError as exc:
        codigo = _mapear_status_http(exc.status)
        raise HTTPException(codigo, detail=str(exc)) from exc
    except IAFormatError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except IAClientError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    return AIConnectionOut(
        connected=True,
        provider=proveedor,
        model=modelo,
        message=f"Conexión correcta con '{proveedor}' (modelo {modelo}).",
    )


def _mapear_status_http(status_proveedor: int | None) -> int:
    """Traduce el status HTTP del proveedor a uno usable por FastAPI (sin exponer crudo)."""
    mapa = {
        400: status.HTTP_400_BAD_REQUEST,
        401: status.HTTP_401_UNAUTHORIZED,
        403: status.HTTP_403_FORBIDDEN,
        429: status.HTTP_429_TOO_MANY_REQUESTS,
    }
    if status_proveedor is not None and status_proveedor in mapa:
        return mapa[status_proveedor]
    return status.HTTP_502_BAD_GATEWAY