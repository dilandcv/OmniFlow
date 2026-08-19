"""Pruebas del motor de estrategia de contenido (ContentConcept), sin APIs reales.

Ejecutar desde backend/ con el venv:

    .venv/bin/python -m app.ai.concept_tests

Cubre: persistencia/relaciones del modelo, generación con fake Gemini (5 por
plataforma, filtrado de plataformas no seleccionadas, dedup, validación de
schema, errores) y el mapeo de errores del service a HTTP legibles.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

from sqlmodel import Session, SQLModel, create_engine, select

from app import models  # noqa: F401  (registra modelos antes de create_all)
from app.ai.client import IAConfigError, IAFormatError, IAHttpError, IATimeoutError
from app.ai.generator import GeneracionError
from app.ai.strategist import generar_conceptos
from app.models.channel import Channel
from app.models.concept import ContentConcept
from app.models.idea import Idea
from app.schemas.concept import ConceptosIAResponse


def _engine_mem():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    return engine


def _canales_sociales() -> list[Channel]:
    return [
        Channel(id=10, nombre="TikTok", slug="tiktok", plataforma="tiktok"),
        Channel(id=11, nombre="Instagram", slug="instagram", plataforma="instagram"),
        Channel(id=12, nombre="Facebook", slug="facebook", plataforma="facebook"),
    ]


def _idea(canales: list[Channel]) -> Idea:
    return Idea(id=1, premisa="Cómo la IA está cambiando la programación", tono="educativo y divertido", canales=canales)


def _concepto(platform: str, titulo: str, formato: str, **extra) -> dict:
    c = {
        "platform": platform,
        "title": titulo,
        "description": f"Descripción de {titulo}",
        "format": formato,
        "hook": "Hook de ejemplo",
        "objective": "education",
        "target_audience": "programadores",
        "call_to_action": "Guarda este contenido",
        "estimated_duration": 45,
        "rationale": "Racional de ejemplo",
    }
    c.update(extra)
    return c


class FakeStrategist:
    """Fake que devuelve una respuesta JSON prefijada (o lanza una excepción)."""

    def __init__(self, respuesta: str | BaseException) -> None:
        self.respuesta = respuesta
        self.model = "fake-model"
        self.prompt_recibido: str | None = None

    def complete(self, system: str, prompt: str, *, max_tokens: int | None = None) -> str:
        self.prompt_recibido = prompt
        if isinstance(self.respuesta, BaseException):
            raise self.respuesta
        return self.respuesta


def _fake_3x5() -> str:
    """Respuesta válida: 5 conceptos por cada plataforma social."""
    conceptos = []
    for platform, formato in (("tiktok", "short_video"), ("instagram", "carousel"), ("facebook", "discussion")):
        for i in range(1, 6):
            conceptos.append(_concepto(platform, f"{platform} concepto {i}", formato))
    return json.dumps({"concepts": conceptos})


def test_01_modelo_y_relaciones() -> None:
    print("[01] Persistencia y relaciones Idea/Channel -> ContentConcept...")
    engine = _engine_mem()
    with Session(engine) as session:
        tiktok, instagram, facebook = _canales_sociales()
        session.add_all([tiktok, instagram, facebook])
        idea = _idea([tiktok, instagram, facebook])
        session.add(idea)
        session.commit()
        session.refresh(idea)

        c = ContentConcept(idea_id=idea.id, canal_id=tiktok.id, title="Título", format="short_video")
        session.add(c)
        session.commit()
        session.refresh(idea)

        conceptos = list(idea.conceptos)
        assert len(conceptos) == 1
        assert conceptos[0].title == "Título"
        assert conceptos[0].idea_id == idea.id

        session.refresh(tiktok)
        assert len(list(tiktok.conceptos)) == 1
        assert list(tiktok.conceptos)[0].canal_id == tiktok.id
        print("    OK")


def test_02_generar_5_por_plataforma() -> None:
    print("[02] Generar 5 conceptos por plataforma con fake Gemini...")
    idea = _idea(_canales_sociales())
    conceptos = generar_conceptos(idea, cliente=FakeStrategist(_fake_3x5()))
    assert len(conceptos) == 15, f"esperaba 15, obtuvo {len(conceptos)}"
    por_canal: dict[int, int] = {}
    for c in conceptos:
        por_canal[c.canal_id] = por_canal.get(c.canal_id, 0) + 1
    assert por_canal == {10: 5, 11: 5, 12: 5}, por_canal
    assert all(c.seleccionado is False for c in conceptos)
    print("    OK -> 5 por cada una de las 3 plataformas")


def test_03_solo_plataformas_seleccionadas() -> None:
    print("[03] No generar conceptos para plataformas NO seleccionadas...")
    tiktok, instagram, _facebook = _canales_sociales()
    idea = _idea([tiktok, instagram])
    # el fake devuelve también facebook, que NO debe guardarse.
    conceptos = generar_conceptos(idea, cliente=FakeStrategist(_fake_3x5()))
    canales = {c.canal_id for c in conceptos}
    assert canales == {10, 11}, canales
    assert len(conceptos) == 10
    print("    OK -> solo tiktok + instagram")


def test_04_validar_json_estructurado() -> None:
    print("[04] Validación del schema Pydantic de la respuesta...")
    datos = json.loads(_fake_3x5())
    payload = ConceptosIAResponse.model_validate(datos)
    assert len(payload.concepts) == 15
    assert payload.concepts[0].platform == "tiktok"
    assert payload.concepts[0].estimated_duration == 45
    print("    OK")


def test_05_rechazar_respuesta_invalida() -> None:
    print("[05] Respuesta inválida de la IA -> IAFormatError (sin guardar)...")
    idea = _idea(_canales_sociales())
    invalidas = [
        "esto no es json",
        json.dumps({"concepts": [{"title": "sin platform ni format"}]}),
        json.dumps({"concepts": [{"platform": "tiktok", "title": "", "format": ""}]}),
        json.dumps({"otra_cosa": []}),
    ]
    for mala in invalidas:
        try:
            generar_conceptos(idea, cliente=FakeStrategist(mala))
            raise AssertionError(f"debió fallar con: {mala!r}")
        except IAFormatError:
            pass
    print("    OK")


def test_06_evitar_duplicados() -> None:
    print("[06] Dedup básico de títulos duplicados dentro de una plataforma...")
    tiktok = Channel(id=10, nombre="TikTok", slug="tiktok", plataforma="tiktok")
    idea = _idea([tiktok])
    # 6 items: el 5to repite el título del 1ro -> debe quedar fuera.
    conceptos_raw = [
        _concepto("tiktok", "Título A", "short_video"),
        _concepto("tiktok", "Título B", "short_video"),
        _concepto("tiktok", "Título C", "short_video"),
        _concepto("tiktok", "Título D", "short_video"),
        _concepto("tiktok", "Título A", "short_video"),  # duplicado
        _concepto("tiktok", "Título E", "short_video"),
    ]
    conceptos = generar_conceptos(
        idea, cliente=FakeStrategist(json.dumps({"concepts": conceptos_raw}))
    )
    titulos = [c.title for c in conceptos]
    assert len(titulos) == len(set(titulos)), titulos
    assert len(conceptos) == 5, titulos
    print("    OK")


def test_07_cantidad_maxima() -> None:
    print("[07] Validar límite de cantidad (máx 10, rechazar valores absurdos)...")
    idea = _idea(_canales_sociales())
    try:
        generar_conceptos(idea, cliente=FakeStrategist(_fake_3x5()), cantidad=11)
        raise AssertionError("debió fallar con cantidad 11")
    except GeneracionError:
        pass
    try:
        generar_conceptos(idea, cliente=FakeStrategist(_fake_3x5()), cantidad=0)
        raise AssertionError("debió fallar con cantidad 0")
    except GeneracionError:
        pass
    print("    OK")


def test_08_sin_plataformas_sociales() -> None:
    print("[08] Idea sin plataformas sociales -> GeneracionError...")
    x = Channel(id=1, nombre="X (Twitter)", slug="x", plataforma="hilo")
    idea = _idea([x])
    try:
        generar_conceptos(idea, cliente=FakeStrategist(_fake_3x5()))
        raise AssertionError("debió fallar: no hay plataformas sociales")
    except GeneracionError:
        pass
    print("    OK")


def test_09_timeout_y_http() -> None:
    print("[09] Timeout y error HTTP del proveedor se propagan...")
    idea = _idea(_canales_sociales())
    try:
        generar_conceptos(idea, cliente=FakeStrategist(IATimeoutError("timeout")))
        raise AssertionError("debió propagar IATimeoutError")
    except IATimeoutError:
        pass
    try:
        generar_conceptos(idea, cliente=FakeStrategist(IAHttpError("500", status=500)))
        raise AssertionError("debió propagar IAHttpError")
    except IAHttpError:
        pass
    print("    OK")


def test_10_sin_proveedor_configurado() -> None:
    print("[10] Sin proveedor configurado -> IAConfigError (si no hay key en entorno)...")
    import os

    from app.ai.provider import reset_provider
    from app.ai.runtime import clear_runtime_config

    from app.core.config import settings

    clear_runtime_config()
    reset_provider()
    idea = _idea(_canales_sociales())
    tiene_key = bool(os.getenv("AI_API_KEY")) or bool(settings.ai_api_key)
    if not tiene_key:
        try:
            generar_conceptos(idea)
            raise AssertionError("debió lanzar IAConfigError")
        except IAConfigError:
            pass
        print("    OK")
    else:
        print("    SKIP -> hay AI_API_KEY en el entorno")


def test_11_service_listar_y_seleccionar() -> None:
    print("[11] listar_conceptos y seleccionar_concepto (deselecciona el resto)...")
    from app.services import concept_service

    engine = _engine_mem()
    with Session(engine) as session:
        tiktok, instagram, facebook = _canales_sociales()
        session.add_all([tiktok, instagram, facebook])
        idea = _idea([tiktok, instagram, facebook])
        session.add(idea)
        session.commit()
        session.refresh(idea)

        for i in range(1, 4):
            session.add(ContentConcept(idea_id=idea.id, canal_id=tiktok.id, title=f"C{i}", format="short_video"))
        session.commit()

        lista = concept_service.listar_conceptos(session, idea.id)
        assert len(lista) == 3

        primero = lista[0]
        seleccionado = concept_service.seleccionar_concepto(session, primero.id)
        assert seleccionado.seleccionado is True

        # seleccionar otro deselecciona el anterior
        concept_service.seleccionar_concepto(session, lista[1].id)
        actuales = concept_service.listar_conceptos(session, idea.id)
        assert [c.seleccionado for c in actuales].count(True) == 1
        print("    OK")


def test_12_service_mapeo_errores() -> None:
    print("[12] Service mapea IAConfigError/IAClientError a 503 legibles...")
    from unittest.mock import patch

    from fastapi import HTTPException

    from app.services import concept_service

    engine = _engine_mem()
    with Session(engine) as session:
        tiktok, instagram, facebook = _canales_sociales()
        session.add_all([tiktok, instagram, facebook])
        idea = _idea([tiktok, instagram, facebook])
        session.add(idea)
        session.commit()
        session.refresh(idea)

        with patch("app.services.concept_service.generar_conceptos", side_effect=IAConfigError("x")):
            try:
                concept_service.generar_conceptos_de_idea(session, idea.id)
                raise AssertionError("debió lanzar HTTP 503")
            except HTTPException as exc:
                assert exc.status_code == 503 and "AI provider is not configured" in str(exc.detail)

        with patch("app.services.concept_service.generar_conceptos", side_effect=IATimeoutError("x")):
            try:
                concept_service.generar_conceptos_de_idea(session, idea.id)
                raise AssertionError("debió lanzar HTTP 503")
            except HTTPException as exc:
                assert exc.status_code == 503 and "Unable to generate content concepts" in str(exc.detail)

        with patch("app.services.concept_service.generar_conceptos", side_effect=GeneracionError("x")):
            try:
                concept_service.generar_conceptos_de_idea(session, idea.id)
                raise AssertionError("debió lanzar HTTP 400")
            except HTTPException as exc:
                assert exc.status_code == 400
        print("    OK")


if __name__ == "__main__":
    print(f"Pruebas del motor de estrategia — {datetime.now(timezone.utc).isoformat()}\n")
    test_01_modelo_y_relaciones()
    test_02_generar_5_por_plataforma()
    test_03_solo_plataformas_seleccionadas()
    test_04_validar_json_estructurado()
    test_05_rechazar_respuesta_invalida()
    test_06_evitar_duplicados()
    test_07_cantidad_maxima()
    test_08_sin_plataformas_sociales()
    test_09_timeout_y_http()
    test_10_sin_proveedor_configurado()
    test_11_service_listar_y_seleccionar()
    test_12_service_mapeo_errores()
    print("\nTODAS LAS PRUEBAS DEL MOTOR DE ESTRATEGIA PASARON ✔")
