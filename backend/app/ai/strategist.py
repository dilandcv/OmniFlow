"""Estratega de contenido: genera ContentConcept por plataforma (rol "strategist").

A partir de una Idea, construye un prompt estratégico específico por plataforma
(TikTok / Instagram / Facebook de entrada, extensible) y valida la respuesta
estructurada de la IA contra un esquema Pydantic antes de devolver conceptos.

NO genera contenido final (eso es rol "writer", fase posterior).
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from string import Template

from pydantic import ValidationError

from app.ai.client import IAClientError, IAFormatError
from app.ai.generator import GeneracionError, _log_estimacion_costo, _parsear_json, _validar_prompt
from app.ai.prompts import cargar_prompt_estrategia
from app.ai.provider import get_provider
from app.models.concept import ContentConcept
from app.models.idea import Idea
from app.schemas.concept import ConceptosIAResponse

logger = logging.getLogger("omniflow.ai")

PROMPT_SISTEMA_ESTRATEGIA = (
    "Sos un estratega de contenido omnicanal. "
    "Respondés únicamente con un objeto JSON válido y nada más."
)

DEFAULT_CONCEPTOS_POR_PLATAFORMA = 5
MAX_CONCEPTOS_POR_PLATAFORMA = 10


@dataclass(frozen=True)
class PlatformStrategy:
    """Estrategia de contenido específica de una plataforma social."""

    key: str
    nombre: str
    formatos: tuple[str, ...]
    foco: str


# Registro extensible: para sumar YouTube/LinkedIn/X/etc. basta agregar una
# entrada acá (y sembrar el canal correspondiente en core/db.py).
PLATFORM_STRATEGIES: dict[str, PlatformStrategy] = {
    "tiktok": PlatformStrategy(
        key="tiktok",
        nombre="TikTok",
        formatos=("short_video", "tutorial", "storytelling", "listicle", "comparison"),
        foco=(
            "videos cortos de ritmo rápido: hook fuerte en los primeros 1-2 segundos, "
            "retención, storytelling, educación rápida, tendencias y un CTA claro."
        ),
    ),
    "instagram": PlatformStrategy(
        key="instagram",
        nombre="Instagram",
        formatos=("reel", "carousel", "post", "story"),
        foco=(
            "contenido visual (Reels, carruseles, posts, stories) pensado para guardados, "
            "compartidos y engagement, con estética cuidada."
        ),
    ),
    "facebook": PlatformStrategy(
        key="facebook",
        nombre="Facebook",
        formatos=("post", "short_video", "discussion", "story"),
        foco=(
            "discusión y comunidad, contenido educativo, historias y videos, priorizando "
            "engagement y conversación."
        ),
    ),
}


def plataforma_de(canal) -> str | None:
    """Devuelve la clave de estrategia de un canal (por slug) o None si no es social."""
    slug = (getattr(canal, "slug", "") or "").strip().lower()
    return slug if slug in PLATFORM_STRATEGIES else None


def es_plataforma_social(canal) -> bool:
    """True si el canal tiene una estrategia social definida (TikTok/Instagram/Facebook)."""
    return plataforma_de(canal) is not None


def _bloque_plataformas(pares: list[tuple]) -> str:
    """Arma el texto inyectado en el prompt con la estrategia de cada plataforma."""
    lineas: list[str] = []
    for canal, clave in pares:
        estrategia = PLATFORM_STRATEGIES[clave]
        formatos = ", ".join(estrategia.formatos)
        lineas.append(
            f"- {estrategia.nombre} (slug '{clave}'): formatos válidos = {formatos}. "
            f"Foco: {estrategia.foco}"
        )
    return "\n".join(lineas)


def _normalizar_titulo(titulo: str) -> str:
    return (titulo or "").strip().lower()


def generar_conceptos(
    idea: Idea,
    cliente=None,
    *,
    cantidad: int = DEFAULT_CONCEPTOS_POR_PLATAFORMA,
) -> list[ContentConcept]:
    """Genera conceptos de contenido por plataforma para la idea.

    - ``cliente`` inyectable (pruebas): debe exponer ``complete(system, prompt) -> str``.
    - ``cantidad`` = conceptos por plataforma (máx. MAX_CONCEPTOS_POR_PLATAFORMA).
    - Lanza ``GeneracionError`` si no hay plataformas sociales seleccionadas y
      ``IAFormatError``/``IAClientError`` si la respuesta de la IA es inválida.
    """
    if not (1 <= cantidad <= MAX_CONCEPTOS_POR_PLATAFORMA):
        raise GeneracionError(
            f"La cantidad de conceptos por plataforma debe estar entre 1 y "
            f"{MAX_CONCEPTOS_POR_PLATAFORMA}."
        )

    proveedor = cliente or get_provider()
    canales = getattr(idea, "canales", None) or []
    pares = [(c, plataforma_de(c)) for c in canales]
    sociales = [(c, k) for c, k in pares if k]
    if not sociales:
        raise GeneracionError(
            "La idea no tiene canales de plataformas sociales (TikTok/Instagram/Facebook) "
            "seleccionados; no se pueden generar conceptos."
        )

    audiencia = getattr(idea, "audiencia", None) or ""
    plantilla = Template(cargar_prompt_estrategia())
    prompt = plantilla.substitute(
        premisa=idea.premisa,
        tono=idea.tono,
        audiencia=audiencia or "(no especificada; inferir una razonable)",
        cantidad=str(cantidad),
        plataformas=_bloque_plataformas(sociales),
    )
    _validar_prompt(prompt)

    try:
        respuesta = proveedor.complete(PROMPT_SISTEMA_ESTRATEGIA, prompt)
    except IAClientError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise IAClientError(
            f"El proveedor de IA falló de forma inesperada: {type(exc).__name__}"
        ) from exc

    _log_estimacion_costo(respuesta, getattr(proveedor, "model", "desconocido"))
    datos = _parsear_json(respuesta)
    try:
        payload = ConceptosIAResponse.model_validate(datos)
    except ValidationError as exc:
        raise IAFormatError("La respuesta de la IA no cumple el esquema esperado.") from exc

    canal_por_plataforma = {k: c for c, k in sociales}
    conceptos: list[ContentConcept] = []
    contador: dict[int, int] = {}
    titulos: dict[int, set[str]] = {}

    for item in payload.concepts:
        clave = (item.platform or "").strip().lower()
        canal = canal_por_plataforma.get(clave)
        if canal is None:
            # plataforma no seleccionada o desconocida: se descarta.
            continue

        cid = canal.id
        contador.setdefault(cid, 0)
        if contador[cid] >= cantidad:
            continue  # ya alcanzamos el máximo por plataforma

        titulo_norm = _normalizar_titulo(item.title)
        if not titulo_norm:
            continue
        if titulo_norm in titulos.setdefault(cid, set()):
            continue  # duplicado básico dentro de la misma plataforma
        titulos[cid].add(titulo_norm)
        contador[cid] += 1

        conceptos.append(
            ContentConcept(
                idea_id=idea.id,
                canal_id=cid,
                title=item.title.strip(),
                description=item.description.strip(),
                format=item.format.strip().lower(),
                hook=(item.hook or "").strip() or None,
                objective=(item.objective or "").strip() or None,
                target_audience=(item.target_audience or "").strip() or None,
                call_to_action=(item.call_to_action or "").strip() or None,
                estimated_duration=item.estimated_duration,
                rationale=(item.rationale or "").strip() or None,
                seleccionado=False,
            )
        )

    plataformas_con_conceptos = {c.canal_id for c in conceptos}
    if len(plataformas_con_conceptos) != len(sociales):
        raise IAFormatError(
            "La IA no devolvió conceptos válidos para todas las plataformas seleccionadas."
        )

    return conceptos


__all__ = [
    "generar_conceptos",
    "plataforma_de",
    "es_plataforma_social",
    "PLATFORM_STRATEGIES",
    "DEFAULT_CONCEPTOS_POR_PLATAFORMA",
    "MAX_CONCEPTOS_POR_PLATAFORMA",
    "PROMPT_SISTEMA_ESTRATEGIA",
]
