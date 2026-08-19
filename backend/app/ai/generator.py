"""Generador de variantes: arma el prompt, llama a la IA y parsea la respuesta JSON.

CONTRATO / COORDINACIÓN CON LOS MODELOS (app/models/):
El enunciado asumía algunos campos que en el modelo real difieren ligeramente.
Aquí se trabaja con los MODELOS REALES del repositorio:

- ``Idea.canales`` se asumió como ``list[str]``; en el modelo real es
  ``list[Channel]`` (app/models/channel.py: Channel con id/nombre/slug/plataforma).
  Por eso el generador itera ``idea.canales`` y usa ``canal.id``/``canal.nombre``/
  ``canal.plataforma`` para detectar el formato.
- ``ContentVariant.canal`` se asumió como ``str``; el modelo real usa
  ``canal_id: int`` (FK) más la relación ``canal``. El generador setea ``canal_id``.
- ``ScheduledPost`` no lo usa el generador (lo usa el worker en app/workers/).

Si backend/core cambia esas firmas, coordinar aquí antes de tocar este archivo.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

from app.ai.client import IAClientError, IAFormatError
from app.ai.provider import get_provider
from app.ai.prompts import cargar_prompt
from app.models.content import BORRADOR, ContentVariant
from app.models.idea import Idea

logger = logging.getLogger("omniflow.ai")

PROMPT_SISTEMA = (
    "Sos una herramienta de generación de contenido para creadores. "
    "Siempre respondés con un objeto JSON válido y nada más."
)

# --- Guardrails de costos / límites de tokens -----------------------------
# Valores aproximados y documentados en backend/.env.example (AI_MAX_TOKENS,
# AI_TIMEOUT_SECONDS, ...). Son estimaciones simples, no métricas exactas.
TOKENS_MAX_PROMPT = 4000  # si el prompt supera esto, se aborta antes de gastar tokens.
TOKENS_AVISO_SALIDA = 4000  # logs de advertencia si la salida es sospechosamente larga.
MIN_CARACTERES_CONTENIDO = 20  # defensa contra respuestas vacías/alucinadas.

# {fragmento de modelo: (USD por 1M tokens de entrada, USD por 1M de salida)}
# Tarifas públicas aproximadas; solo informativas.
TARIFAS_USD_POR_MILLON: dict[str, tuple[float, float]] = {
    "claude-3-5-sonnet": (3.0, 15.0),
    "claude": (3.0, 15.0),
    "gpt-4o-mini": (0.15, 0.60),
    "gpt-4o": (2.5, 10.0),
}


class GeneracionError(Exception):
    """Error de dominio del generador (el backend lo convierte en HTTP legible)."""


def _detectar_formato(canal: Any) -> str:
    """Elige el prompt según la plataforma/slug del canal (hilo, boletín o artículo)."""
    p = f"{getattr(canal, 'plataforma', '') or ''} {getattr(canal, 'slug', '') or ''}".lower()
    if "hilo" in p or "thread" in p:
        return "hilo"
    if "boletin" in p or "newsletter" in p:
        return "boletin"
    return "articulo"


def _contar_tokens(texto: str) -> int:
    """Estimación grosera de tokens (≈ 4 caracteres por token)."""
    return max(1, len(texto) // 4)


def _validar_prompt(prompt: str) -> None:
    """Aborta si el prompt excede el límite de entrada para no gastar tokens/costo de más."""
    tokens = _contar_tokens(prompt)
    if tokens > TOKENS_MAX_PROMPT:
        raise GeneracionError(
            f"El prompt excede el límite de tokens estimado ({tokens} > {TOKENS_MAX_PROMPT}). "
            "Reducí la premisa o subí AI_MAX_TOKENS en backend/.env."
        )


def _log_estimacion_costo(texto: str, modelo: str) -> None:
    """Informa de tokens y costo aproximado; advierte si la salida es sospechosamente larga."""
    tokens = _contar_tokens(texto)
    tarifa = next(
        (v for m, v in TARIFAS_USD_POR_MILLON.items() if m in modelo.lower()),
        None,
    )
    if tarifa:
        costo_salida = tokens / 1_000_000 * tarifa[1]
        logger.info("IA: salida ~%d tokens con %s -> costo estimado ≈ $%.4f", tokens, modelo, costo_salida)
    else:
        logger.info("IA: salida ~%d tokens con %s", tokens, modelo)

    if tokens > TOKENS_AVISO_SALIDA:
        logger.warning(
            "IA: salida inusualmente larga (~%d tokens). Posible alucinación o formato incorrecto.",
            tokens,
        )


def _parsear_json(respuesta: str) -> dict[str, Any]:
    """Extrae y valida el objeto JSON de la respuesta del modelo (tolera fences de markdown)."""
    texto = respuesta.strip()
    texto = re.sub(r"^```(?:json)?\s*", "", texto, flags=re.IGNORECASE).strip()
    texto = re.sub(r"\s*```$", "", texto).strip()

    inicio, fin = texto.find("{"), texto.rfind("}")
    if inicio == -1 or fin <= inicio:
        raise IAFormatError(
            "La respuesta de la IA no contiene un objeto JSON. Posible respuesta "
            "alucinada o con formato incorrecto."
        )

    bloque = texto[inicio : fin + 1]
    try:
        datos = json.loads(bloque)
    except json.JSONDecodeError as exc:
        raise IAFormatError(f"JSON inválido en la respuesta de la IA: {exc}") from exc

    if not isinstance(datos, dict):
        raise IAFormatError("La respuesta de la IA no es un objeto JSON.")
    return datos


def _extraer_variante(datos: dict[str, Any], formato_esperado: str) -> tuple[str, str]:
    """Valida los campos mínimos de la respuesta y devuelve (contenido, formato)."""
    contenido = datos.get("contenido")
    if not isinstance(contenido, str) or not contenido.strip():
        raise IAFormatError(
            "El JSON de la IA no incluye el campo 'contenido' con texto. "
            "Se descarta la respuesta para evitar contenido vacío."
        )
    if len(contenido.strip()) < MIN_CARACTERES_CONTENIDO:
        raise IAFormatError(
            f"El 'contenido' devuelto por la IA es sospechosamente corto "
            f"(<{MIN_CARACTERES_CONTENIDO} caracteres); se descarta para evitar respuestas alucinadas."
        )

    formato = str(datos.get("formato") or "").strip().lower()
    return contenido.strip(), formato or formato_esperado


def generar_variantes(idea: Idea, cliente: Any = None) -> list[ContentVariant]:
    """Genera una ContentVariant en estado 'borrador' por cada canal de la idea.

    - ``cliente`` es inyectable (para pruebas): debe exponer
      ``complete(system: str, prompt: str) -> str``.
    - Si algo falla lanza ``GeneracionError``, ``IAFormatError`` u otro
      ``IAClientError``; el backend puede capturarlas y convertirlas en HTTP
      (503 si cae el proveedor, 400/422 si la respuesta es inválida).
    """
    proveedor = cliente or get_provider()
    canales = getattr(idea, "canales", None) or []
    if not canales:
        raise GeneracionError("La idea no tiene canales elegidos; no se puede generar contenido.")

    variantes: list[ContentVariant] = []
    for canal in canales:
        formato = _detectar_formato(canal)
        prompt = cargar_prompt(
            formato,
            premisa=idea.premisa,
            tono=idea.tono,
            canal=canal.nombre,
        )
        _validar_prompt(prompt)

        try:
            respuesta = proveedor.complete(PROMPT_SISTEMA, prompt)
        except IAClientError:
            raise  # se propaga tal cual; el backend decide el código HTTP
        except Exception as exc:  # noqa: PERF203
            raise IAClientError(
                f"El proveedor de IA falló de forma inesperada: {type(exc).__name__}: {exc}"
            ) from exc

        _log_estimacion_costo(respuesta, getattr(proveedor, "model", "desconocido"))
        datos = _parsear_json(respuesta)
        contenido, formato_real = _extraer_variante(datos, formato)

        variantes.append(
            ContentVariant(
                idea_id=idea.id,
                canal_id=canal.id,
                formato=formato_real,
                contenido=contenido,
                estado=BORRADOR,
            )
        )

    return variantes


__all__ = [
    "generar_variantes",
    "GeneracionError",
    "PROMPT_SISTEMA",
    "cargar_prompt",
]