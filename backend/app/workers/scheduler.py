"""Worker de distribución: APScheduler que publica las programaciones vencidas.

Cada ``WORKER_INTERVAL_MINUTES`` minutos busca ``ScheduledPost`` pendientes cuya
``programado_para`` ya pasó y las marca como ``publicado`` (simulando la
distribución real con un log ``Distribuyendo contenido X al canal Y``). También
avanza la variante asociada al estado ``publicado`` (programado -> publicado).

COORDINACIÓN CON LOS MODELOS (app/models/):
El enunciado asumía ``ScheduledPost.content_variant_id`` y ``fecha_programada``;
en el modelo real del repositorio son ``variante_id`` y ``programado_para``
(app/models/schedule.py). Este worker usa esos campos reales.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from fastapi import FastAPI
from sqlmodel import Session, select

from app.core.db import engine
from app.models.content import PUBLICADO as PUBLICADO_VARIANTE
from app.models.schedule import PENDIENTE, PUBLICADO, ScheduledPost

logger = logging.getLogger("omniflow.workers")

# Cada cuántos minutos revisa la cola de distribución (env: WORKER_INTERVAL_MINUTES).
INTERVALO_MINUTOS = max(1, int(os.getenv("WORKER_INTERVAL_MINUTES", "1")))

# Única instancia del scheduler (iniciado/guardado a nivel de módulo).
_scheduler: BackgroundScheduler | None = None


def _ahora() -> datetime:
    return datetime.now(timezone.utc)


def distribuir_vencidas() -> int:
    """Marca como publicadas las programaciones pendientes ya vencidas. Devuelve cuántas."""
    ahora = _ahora()
    distribuidas = 0

    with Session(engine) as session:
        # Nota: la comparación de fechas ocurre en SQL (SQLite compara ISO 8601).
        # Las fechas deben guardarse en UTC para que el orden lexicográfico sea correcto.
        vencidas = session.exec(
            select(ScheduledPost).where(
                ScheduledPost.estado == PENDIENTE,
                ScheduledPost.programado_para <= ahora,  # type: ignore[call-overload]
            )
        ).all()

        for post in vencidas:
            post.estado = PUBLICADO
            post.fecha_publicacion = ahora
            session.add(post)

            variante = post.variante
            canal_nombre = "desconocido"
            if variante is not None:
                variante.estado = PUBLICADO_VARIANTE
                session.add(variante)
                canal_nombre = variante.canal.nombre if variante.canal else f"canal_id={variante.canal_id}"

            logger.info(
                "Distribuyendo contenido %s al canal %s",
                post.variante_id,
                canal_nombre,
            )
            distribuidas += 1

        session.commit()

    if distribuidas:
        logger.info("Distribución: %d publicación(es) marcadas como publicadas.", distribuidas)
    return distribuidas


def iniciar_scheduler() -> BackgroundScheduler:
    """Inicia (o devuelve si ya está) el BackgroundScheduler con el job periódico."""
    global _scheduler

    if _scheduler is not None:
        return _scheduler

    _scheduler = BackgroundScheduler(timezone="UTC", daemon=True, coalesce=True, max_instances=1)
    _scheduler.add_job(
        distribuir_vencidas,
        trigger=IntervalTrigger(minutes=INTERVALO_MINUTOS),
        id="distribucion_automatica",
        name="Distribución automática de contenido",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info(
        "Scheduler iniciado: revisa programaciones vencidas cada %d min (job id=%s).",
        INTERVALO_MINUTOS,
        "distribucion_automatica",
    )
    return _scheduler


def detener_scheduler() -> None:
    """Detiene el scheduler si estaba corriendo."""
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        logger.info("Scheduler detenido.")


def registrar_en_fastapi(app: FastAPI) -> None:
    """Engancha el scheduler al ciclo de vida de FastAPI.

    USO (en app/main.py, SIN tocar este archivo):
        from app.workers.scheduler import registrar_en_fastapi

        app = FastAPI(...)
        registrar_en_fastapi(app)          # opción simple: registra handlers startup/shutdown

    O bien, dentro de un lifespan:
        from contextlib import asynccontextmanager
        from app.workers.scheduler import iniciar_scheduler, detener_scheduler

        @asynccontextmanager
        async def lifespan(app):
            iniciar_scheduler()            # arranca el job de distribución
            yield
            detener_scheduler()
    """
    app.add_event_handler("startup", iniciar_scheduler)
    app.add_event_handler("shutdown", detener_scheduler)


__all__ = [
    "distribuir_vencidas",
    "iniciar_scheduler",
    "detener_scheduler",
    "registrar_en_fastapi",
    "INTERVALO_MINUTOS",
]