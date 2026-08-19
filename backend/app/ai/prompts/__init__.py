"""Prompts versionados y cargador parametrizable por premisa, tono y canal.

Los prompts viven en archivos separados, uno por formato de contenido
(hilo, artículo y boletín). El nombre del archivo incluye la versión
(``hilo_v1.txt``, ``hilo_v2.txt``, ...) para versionar cambios sin romper
generaciones anteriores. La versión activa se configura con
``AI_PROMPT_VERSION`` en el entorno (ver ``backend/.env.example``).

Uso:
    from app.ai.prompts import cargar_prompt
    prompt = cargar_prompt("hilo", premisa="...", tono="divulgativo", canal="X (Twitter)")
"""

from __future__ import annotations

from pathlib import Path
from string import Template

from app.core.config import settings

PROMPT_DIR = Path(__file__).parent
STRATEGY_DIR = PROMPT_DIR / "strategy"

# formato -> archivo de prompt (la versión se sustituye en runtime).
FORMATOS_PROMPT: dict[str, str] = {
    "hilo": "hilo_v{version}.txt",
    "articulo": "articulo_v{version}.txt",
    "boletin": "boletin_v{version}.txt",
}


def _version_activa(version: str | None) -> str:
    if version:
        return version
    return (settings.ai_prompt_version or "1").strip()


def cargar_prompt(
    formato: str,
    *,
    premisa: str,
    tono: str,
    canal: str,
    version: str | None = None,
) -> str:
    """Carga el prompt del formato pedido y sustituye los placeholders ($premisa, $tono, $canal)."""
    ver = _version_activa(version)
    if formato not in FORMATOS_PROMPT:
        raise ValueError(
            f"Formato de prompt no soportado: '{formato}'. Válidos: {sorted(FORMATOS_PROMPT)}."
        )

    archivo = PROMPT_DIR / FORMATOS_PROMPT[formato].format(version=ver)
    if not archivo.exists():
        raise FileNotFoundError(
            f"No existe el prompt versionado '{archivo.name}' (versión '{ver}'). "
            "Creá el archivo o ajustá AI_PROMPT_VERSION."
        )

    plantilla = Template(archivo.read_text(encoding="utf-8"))
    return plantilla.substitute(premisa=premisa, tono=tono, canal=canal)


def cargar_prompt_estrategia(version: str | None = None) -> str:
    """Carga la plantilla del prompt de estrategia de conceptos (content_concepts).

    Devuelve la plantilla sin sustituir; los placeholders ($premisa, $tono,
    $audiencia, $cantidad, $plataformas) los reemplaza el estratega.
    """
    ver = (version or "1").strip()
    archivo = STRATEGY_DIR / f"content_concepts_v{ver}.txt"
    if not archivo.exists():
        raise FileNotFoundError(
            f"No existe el prompt de estrategia '{archivo.name}' (versión '{ver}')."
        )
    return archivo.read_text(encoding="utf-8")


__all__ = ["cargar_prompt", "cargar_prompt_estrategia", "FORMATOS_PROMPT", "PROMPT_DIR", "STRATEGY_DIR"]