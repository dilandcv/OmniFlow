"""Pruebas MANUALES del pipeline de IA (sin API real ni base de datos).

Validan el generador completo con un cliente falso antes de conectarlo al
backend. Ejecutar desde backend/ con el venv:

    .venv/bin/python -m app.ai.manual_tests

Si además querés probar contra el proveedor real, setea AI_API_KEY (y opcional
AI_PROVIDER/AI_MODEL) en el entorno o en backend/.env y vuelve a ejecutar.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from app.ai.client import (
    GeminiClient,
    IAConfigError,
    IAFormatError,
    IAHttpError,
    IATimeoutError,
)
from app.ai.generator import GeneracionError, _extraer_variante, _parsear_json, generar_variantes
from app.ai.provider import construir_cliente, get_provider, reset_provider
from app.ai.prompts import cargar_prompt
from app.models.channel import Channel
from app.models.content import BORRADOR
from app.models.idea import Idea


class FakeIA:
    """Cliente de IA falso: devuelve respuestas prefijadas o lanza excepciones."""

    def __init__(self, *respuestas) -> None:
        self.respuestas: list = list(respuestas)
        self.model = "fake-model"
        self.llamadas: list[tuple[str, str]] = []

    def complete(self, system: str, prompt: str, *, max_tokens: int | None = None) -> str:
        self.llamadas.append((system, prompt))
        siguiente = self.respuestas.pop(0)
        if isinstance(siguiente, BaseException):
            raise siguiente
        return siguiente


class FakeIAFormato(FakeIA):
    """Fake que responde con el formato que pide el prompt (comporta realista)."""

    def complete(self, system: str, prompt: str, *, max_tokens: int | None = None) -> str:
        self.llamadas.append((system, prompt))
        p = prompt.lower()
        if "hilo" in p:
            fmt = "hilo"
        elif "bolet" in p:
            fmt = "boletin"
        else:
            fmt = "articulo"
        return json.dumps(
            {
                "formato": fmt,
                "titulo": "Título de ejemplo",
                "contenido": (
                    f"Contenido realista de ejemplo para el formato {fmt}, "
                    "con suficiente longitud para pasar las validaciones del generador."
                ),
            }
        )


def _idea_ejemplo(canales: list[Channel] | None = None) -> Idea:
    if canales is None:
        canales = [
            Channel(id=1, nombre="X (Twitter)", slug="x", plataforma="hilo"),
            Channel(id=2, nombre="LinkedIn", slug="linkedin", plataforma="articulo"),
            Channel(id=3, nombre="Boletín", slug="boletin", plataforma="boletin"),
        ]
    return Idea(id=1, premisa="La IA como asistente creativo", tono="divulgativo", canales=canales)


def test_01_prompts_cargables() -> None:
    print("[01] Cargar prompts versionados (hilo/articulo/boletin)...")
    for formato in ("hilo", "articulo", "boletin"):
        prompt = cargar_prompt(formato, premisa="X", tono="Y", canal="Z")
        assert "X" in prompt and "Y" in prompt and "Z" in prompt, f"placeholders no sustituidos en {formato}"
        assert "$premisa" not in prompt and "$canal" not in prompt, f"quedó un placeholder en {formato}"
    try:
        cargar_prompt("podcast", premisa="X", tono="Y", canal="Z")
        raise AssertionError("debió fallar con formato no soportado")
    except ValueError:
        pass
    print("    OK")


def test_02_parsear_json() -> None:
    print("[02] Parseo de JSON (fences de markdown, texto extra)...")
    ok_r = _parsear_json('```json\n{"formato": "hilo", "contenido": "un tweet de ejemplo largo"}\n```')
    assert ok_r["formato"] == "hilo"
    ok2 = _parsear_json('... texto antes {"contenido": "contenido válido y suficientemente largo vale"} texto después')
    assert ok2["contenido"]
    for mala in ("", "sin json", "[1,2,3]", '{"rotto": }'):
        try:
            _parsear_json(mala)
            raise AssertionError(f"debió fallar con: {mala!r}")
        except IAFormatError:
            pass
    print("    OK")


def test_03_extraer_variante() -> None:
    print("[03] Validación de campos mínimos (anti-alucinación)...")
    try:
        _extraer_variante({"formato": "hilo"}, "hilo")
        raise AssertionError("debió fallar sin 'contenido'")
    except IAFormatError:
        pass
    try:
        _extraer_variante({"contenido": "corto"}, "hilo")
        raise AssertionError("debió fallar con contenido muy corto")
    except IAFormatError:
        pass
    contenido, formato = _extraer_variante(
        {"formato": "hilo", "contenido": "un contenido real, completo y útil para el canal"}, "articulo"
    )
    assert contenido and formato == "hilo"
    contenido2, formato2 = _extraer_variante({"contenido": "sin formato, igualmente válido y aceptable"}, "articulo")
    assert formato2 == "articulo"
    print("    OK")


def _json_hilo() -> str:
    return json.dumps(
        {
            "formato": "hilo",
            "titulo": "¿La IA te reemplaza?",
            "contenido": "1. La IA no reemplaza tu criterio.\n---\n2. Es un copiloto.\n---\n3. Aprendé a usarla.",
        }
    )


def test_04_generar_happy_path() -> None:
    print("[04] generar_variantes genera una variante por canal (estado borrador)...")
    fake = FakeIAFormato()
    idea = _idea_ejemplo()
    variantes = generar_variantes(idea, cliente=fake)

    assert len(variantes) == 3, "debe generar una variante por canal"
    assert len(fake.llamadas) == 3
    por_canal = {v.canal_id: v for v in variantes}
    assert all(v.estado == BORRADOR for v in variantes)
    assert por_canal[1].formato == "hilo"
    assert por_canal[2].formato == "articulo"
    assert por_canal[3].formato == "boletin"
    assert all(v.idea_id == idea.id for v in variantes)
    assert all(v.contenido.startswith("Contenido realista") for v in variantes)
    print(f"    OK -> {len(variantes)} variantes, canales {sorted(por_canal)}")


def test_05_generar_json_invalido() -> None:
    print("[05] Respuesta mal formateada -> IAFormatError...")
    fake = FakeIA("no hay json acá", _json_hilo(), _json_hilo())
    try:
        generar_variantes(_idea_ejemplo(), cliente=fake)
        raise AssertionError("debió lanzar IAFormatError")
    except IAFormatError:
        pass
    print("    OK")


def test_06_generar_timeout() -> None:
    print("[06] Timeout del proveedor -> IATimeoutError propagado...")
    fake = FakeIA(IATimeoutError("timeout de prueba"))
    try:
        generar_variantes(_idea_ejemplo(), cliente=fake)
        raise AssertionError("debió propagar IATimeoutError")
    except IATimeoutError:
        pass
    print("    OK")


def test_07_sin_canales() -> None:
    print("[07] Idea sin canales -> GeneracionError...")
    idea = _idea_ejemplo(canales=[])
    try:
        generar_variantes(idea, cliente=FakeIA())
        raise AssertionError("debió lanzar GeneracionError")
    except GeneracionError:
        pass
    print("    OK")


def test_08_real_proveedor_si_hay_key() -> None:
    print("[08] Llamada real al proveedor (solo si AI_API_KEY está seteada)...")
    import os

    if not os.getenv("AI_API_KEY"):
        print("    SKIP -> no hay AI_API_KEY; guardar backend/.env para probar")
        return
    os.environ.setdefault("AI_PROVIDER", "anthropic")
    try:
        from app.ai.generator import generar_variantes
        from app.ai.provider import reset_provider

        reset_provider()
        idea = _idea_ejemplo([Channel(id=1, nombre="X (Twitter)", slug="x", plataforma="hilo")])
        variantes = generar_variantes(idea)
        assert variantes and variantes[0].contenido
        print(f"    OK -> contenido real generado ({len(variantes[0].contenido)} chars)")
    except Exception as exc:  # noqa: BLE001
        print(f"    ERROR -> {type(exc).__name__}: {exc}")
        raise


def test_09_hooks_gemini() -> None:
    print("[09] GeminiClient: URL, headers, payload y extracción de texto...")

    cliente = GeminiClient(api_key="clave-secreta-de-prueba", model="gemini-2.5-flash")
    url = cliente._url()
    assert "models/gemini-2.5-flash:generateContent" in url
    assert "clave-secreta-de-prueba" not in url, "la key no debe ir en la URL"

    headers = cliente._headers()
    assert headers.get("x-goog-api-key") == "clave-secreta-de-prueba"
    assert headers.get("x-goog-api-key") is not None

    payload = cliente._payload("sistema", "prompt", 400)
    assert payload["contents"][0]["parts"][0]["text"] == "sistema\n\nprompt"
    assert payload["generationConfig"]["maxOutputTokens"] == 400

    resp = {
        "candidates": [{"content": {"parts": [{"text": "hola "}, {"text": "mundo"}]}}],
    }
    assert cliente._extraer_texto(resp) == "hola mundo"
    assert cliente._extraer_texto({"candidates": []}) == ""
    assert cliente._extraer_texto({}) == ""
    print("    OK")


def test_10_gemini_complete_con_mocktransport() -> None:
    print("[10] GeminiClient.complete contra httpx.MockTransport (HTTP real simulado)...")
    import httpx

    respuestas: list[httpx.Response] = []

    def handler(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        assert request.headers["x-goog-api-key"] == "clave-secreta-de-prueba"
        assert body["contents"][0]["parts"][0]["text"].startswith("Sos")
        return respuestas.pop(0)

    servicios = {
        "ok": httpx.Response(
            200,
            json={
                "candidates": [{"content": {"parts": [{"text": '{"contenido": "texto valido largo"}'}]}}],
            },
        ),
        "noauth": httpx.Response(401, json={"error": {"message": "API key no válida"}}),
    }

    cliente = GeminiClient(
        api_key="clave-secreta-de-prueba",
        model="gemini-2.5-flash",
        max_retries=0,
        transport=httpx.MockTransport(handler),
    )
    respuestas[:] = [servicios["ok"]]
    texto = cliente.complete("Sos un asistente.", "prompt")
    assert "contenido" in texto

    respuestas[:] = [servicios["noauth"]]
    try:
        cliente.complete("Sos un asistente.", "prompt")
        raise AssertionError("debió lanzar IAHttpError con status 401")
    except IAHttpError as exc:
        assert exc.status == 401
    print("    OK")


def test_11_fabrica_con_config_runtime() -> None:
    print("[11] Fábrica: config runtime -> GeminiClient activo; al eliminar, 'not configured'...")
    import os

    from app.ai.runtime import clear_runtime_config, get_runtime_config, set_runtime_config

    set_runtime_config("gemini", "clave-runtime-de-prueba", "gemini-2.5-flash")
    reset_provider()
    cliente = get_provider()
    assert isinstance(cliente, GeminiClient), "con config runtime debe usarse GeminiClient"
    assert cliente.model == "gemini-2.5-flash"
    assert cliente.api_key == "clave-runtime-de-prueba"

    assert get_runtime_config() is not None
    clear_runtime_config()
    reset_provider()
    assert get_runtime_config() is None

    from app.core.config import settings

    tiene_key = bool(os.getenv("AI_API_KEY")) or bool(settings.ai_api_key)
    if not tiene_key:
        try:
            get_provider()
            raise AssertionError("sin proveedor configurado debió lanzar IAConfigError")
        except IAConfigError as exc:
            assert "AI provider is not configured" in str(exc)
    else:
        print("    (con AI_API_KEY en el entorno; se omite la verificación 'not configured')")

    # construir_cliente con valores mal formados -> IAConfigError.
    try:
        construir_cliente("gemini", "", None)
        raise AssertionError("debió lanzar IAConfigError sin API key")
    except IAConfigError:
        pass
    try:
        construir_cliente("noexiste", "clave", None)
        raise AssertionError("debió lanzar IAConfigError con proveedor desconocido")
    except IAConfigError:
        pass
    print("    OK")


if __name__ == "__main__":
    print(f"Pruebas manuales del pipeline de IA — {datetime.now(timezone.utc).isoformat()}\n")
    test_01_prompts_cargables()
    test_02_parsear_json()
    test_03_extraer_variante()
    test_04_generar_happy_path()
    test_05_generar_json_invalido()
    test_06_generar_timeout()
    test_07_sin_canales()
    test_08_real_proveedor_si_hay_key()
    test_09_hooks_gemini()
    test_10_gemini_complete_con_mocktransport()
    test_11_fabrica_con_config_runtime()
    print("\nTODAS LAS PRUEBAS MANUALES PASARON ✔")