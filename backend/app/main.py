"""Punto de entrada de la aplicación FastAPI: monta routers, CORS e inicializa la BD."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import channels, content, schedule
from app.core.config import settings
from app.core.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # TODO (workers, compañero de automatización):
    # aquí se arrancará APScheduler con el job de distribución.
    yield


app = FastAPI(title=settings.app_name, version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(content.router)
app.include_router(channels.router)
app.include_router(schedule.router)


@app.get("/health")
def health() -> dict[str, str]:
    """Healthcheck básico."""
    return {"status": "ok"}