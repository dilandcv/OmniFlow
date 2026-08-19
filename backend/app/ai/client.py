"""Cliente HTTP para proveedores de IA externos (Anthropic / OpenAI / Gemini).

Maneja: timeout, reintento simple ante fallos transitorios y validación de que
la respuesta tenga el formato esperado.

Modos de configuración:
- Variables de entorno (``AI_PROVIDER`` y ``AI_API_KEY``; ver
  ``backend/.env.example``), usadas como fallback.
- Configuración en memoria (``app.ai.runtime``), setada por el usuario desde
  la pantalla "Configuración de IA". La API key NO se persiste nunca.

COMPATIBILIDAD:
``app/services/content_service.py`` importa ``generar_variantes`` desde este
módulo (``from app.ai.client import generar_variantes``). Para no romper ese
contrato, este módulo re-exporta la función de forma perezosa (PEP 562) desde
``app.ai.generator``, que contiene la implementación real.
"""

from __future__ import annotations

import logging
import time
import warnings
from collections.abc import Mapping

import httpx

logger = logging.getLogger("omniflow.ai")


class IAClientError(Exception):
    """Error base de la integración con el proveedor de IA."""


class IAConfigError(IAClientError):
    """Configuración inválida o incompleta (p. ej. falta la API key)."""


class IATimeoutError(IAClientError):
    """El proveedor tardó más del tiempo permitido en responder."""


class IAHttpError(IAClientError):
    """El proveedor respondió con un estado HTTP de error o se cayó la conexión."""

    def __init__(self, mensaje: str, status: int | None = None) -> None:
        super().__init__(mensaje)
        self.status = status


class IAFormatError(IAClientError):
    """La respuesta no tiene la forma esperada (JSON mal formado, vacío, etc.)."""


def _dormir(intento: int) -> None:
    """Backoff exponencial simple: 1s, 2s, 4s..."""
    time.sleep(2**intento)


class BaseIAClient:
    """Cliente base: petición con timeout, reintentos y extracción del texto."""

    provider_name = "base"

    def __init__(
        self,
        api_key: str,
        model: str,
        timeout: float = 60.0,
        max_retries: int = 2,
        max_tokens: int = 1200,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self.api_key = api_key
        self.model = model
        self.timeout = timeout
        self.max_retries = max_retries
        self.max_tokens = max_tokens
        # Transport inyectable para pruebas (httpx.MockTransport). None = real.
        self.transport = transport

    # --- hooks por proveedor -------------------------------------------
    def _url(self) -> str:
        raise NotImplementedError

    def _headers(self) -> dict[str, str]:
        raise NotImplementedError

    def _payload(self, system: str, prompt: str, max_tokens: int) -> dict:
        raise NotImplementedError

    def _extraer_texto(self, json_resp: Mapping) -> str:
        """Devuelve el texto generado; cadena vacía si no está en el formato esperado."""
        raise NotImplementedError

    # --- lógica común con timeout/reintento ----------------------------
    def complete(self, system: str, prompt: str, *, max_tokens: int | None = None) -> str:
        """Ejecuta la llamada al proveedor con reintentos y validación de formato."""
        limite = max_tokens or self.max_tokens
        url = self._url()
        headers = self._headers()
        body = self._payload(system, prompt, limite)

        ultimo_error: IAClientError | None = None
        for intento in range(self.max_retries + 1):
            try:
                with httpx.Client(timeout=self.timeout, transport=self.transport) as cliente:
                    resp = cliente.post(url, headers=headers, json=body)
            except httpx.TimeoutException as exc:  # noqa: PERF203
                ultimo_error = IATimeoutError(
                    f"Timeout al llamar a '{self.provider_name}' (límite {self.timeout}s)."
                )
                if intento < self.max_retries:
                    logger.warning("%s. Intento %d/%d", ultimo_error, intento + 1, self.max_retries)
                    _dormir(intento)
                    continue
                raise ultimo_error from exc
            except httpx.HTTPError as exc:
                ultimo_error = IAHttpError(f"No se pudo conectar con '{self.provider_name}': {exc}")
                if intento < self.max_retries:
                    logger.warning("%s. Intento %d/%d", ultimo_error, intento + 1, self.max_retries)
                    _dormir(intento)
                    continue
                raise ultimo_error from exc

            # 429 y 5xx son transitorios: reintentamos con backoff.
            if resp.status_code in (429, 500, 502, 503, 504) and intento < self.max_retries:
                logger.warning(
                    "'%s' respondió %d. Reintentando (%d/%d)...",
                    self.provider_name,
                    resp.status_code,
                    intento + 1,
                    self.max_retries,
                )
                _dormir(intento)
                continue

            if resp.status_code >= 400:
                raise IAHttpError(
                    f"'{self.provider_name}' respondió HTTP {resp.status_code}: {resp.text[:300]}",
                    status=resp.status_code,
                )

            try:
                datos = resp.json()
            except ValueError as exc:  # noqa: PERF203
                raise IAFormatError(
                    f"La respuesta de '{self.provider_name}' no es JSON válido: {resp.text[:200]}"
                ) from exc

            texto = self._extraer_texto(datos)
            if not texto:
                raise IAFormatError(
                    f"La respuesta de '{self.provider_name}' no incluye el texto esperado "
                    f"(formato distinto al del contrato)."
                )
            return texto.strip()

        assert ultimo_error is not None  # sólo se alcanza si se agotaron los reintentos
        raise ultimo_error


class AnthropicClient(BaseIAClient):
    """Cliente para la API Messages de Anthropic (Claude)."""

    provider_name = "anthropic"

    def _url(self) -> str:
        return "https://api.anthropic.com/v1/messages"

    def _headers(self) -> dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

    def _payload(self, system: str, prompt: str, max_tokens: int) -> dict:
        return {
            "model": self.model,
            "max_tokens": max_tokens,
            "system": system,
            "messages": [{"role": "user", "content": prompt}],
        }

    def _extraer_texto(self, json_resp: Mapping) -> str:
        try:
            bloques = json_resp["content"] or []
            return "".join(
                b.get("text", "") for b in bloques if isinstance(b, dict) and b.get("type") == "text"
            )
        except (KeyError, TypeError, AttributeError):
            return ""


class OpenAIClient(BaseIAClient):
    """Cliente para la API de Chat Completions de OpenAI."""

    provider_name = "openai"

    def _url(self) -> str:
        return "https://api.openai.com/v1/chat/completions"

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "content-type": "application/json",
        }

    def _payload(self, system: str, prompt: str, max_tokens: int) -> dict:
        return {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": 0.7,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        }

    def _extraer_texto(self, json_resp: Mapping) -> str:
        try:
            return json_resp["choices"][0]["message"]["content"]
        except (KeyError, TypeError, AttributeError, IndexError):
            return ""


class GeminiClient(BaseIAClient):
    """Cliente para la API generateContent de Google Gemini.

    La API key se envía como query param ``?key=`` (estilo de Google) y el
    sistema/prompt se combinan en un único mensaje de usuario porque el endpoint
    usado no separa roles en los mismos términos que Anthropic/OpenAI.
    """

    provider_name = "gemini"

    def _url(self) -> str:
        return f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    def _headers(self) -> dict[str, str]:
        # La clave viaja en el header x-goog-api-key (evita la URL con ?key=,
        # que podría quedar en logs de proxies).
        return {
            "content-type": "application/json",
            "x-goog-api-key": self.api_key,
        }

    def _payload(self, system: str, prompt: str, max_tokens: int) -> dict:
        return {
            "contents": [{"parts": [{"text": f"{system}\n\n{prompt}"}]}],
            "generationConfig": {
                "maxOutputTokens": max_tokens,
                "temperature": 0.7,
            },
        }

    def _extraer_texto(self, json_resp: Mapping) -> str:
        try:
            partes = json_resp["candidates"][0]["content"]["parts"] or []
            return "".join(p.get("text", "") for p in partes if isinstance(p, dict))
        except (KeyError, TypeError, AttributeError, IndexError):
            return ""


def __getattr__(name: str):  # pragma: no cover - compat con content_service
    """Re-export perezoso de ``generar_variantes`` desde app.ai.generator (PEP 562)."""
    if name == "generar_variantes":
        warnings.warn(
            "Importa ``generar_variantes`` desde app.ai.generator (el alias en "
            "app.ai.client es temporal para no romper el contrato actual).",
            DeprecationWarning,
            stacklevel=2,
        )
        from app.ai.generator import generar_variantes

        return generar_variantes
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")


__all__ = [
    "BaseIAClient",
    "AnthropicClient",
    "OpenAIClient",
    "GeminiClient",
    "IAClientError",
    "IAConfigError",
    "IATimeoutError",
    "IAHttpError",
    "IAFormatError",
]