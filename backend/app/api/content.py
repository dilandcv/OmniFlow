"""Router de contenido: creación de ideas, gestión y aprobación de variantes."""

from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlmodel import Session

from app.core.db import get_session
from app.models.content import ContentVariant
from app.models.idea import Idea
from app.schemas.content import ContentVariantOut, ContentVariantUpdate, VarianteRechazo
from app.schemas.idea import IdeaCreate, IdeaOut
from app.services import content_service

router = APIRouter(prefix="/api", tags=["contenido"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.post("/ideas", response_model=IdeaOut, status_code=status.HTTP_201_CREATED)
def crear_idea(data: IdeaCreate, session: SessionDep) -> Idea:
    """Crea una idea con sus canales elegidos y genera las variantes (stub IA)."""
    return content_service.crear_idea_con_variantes(session, data)


@router.get("/ideas/{idea_id}/variantes", response_model=list[ContentVariantOut])
def listar_variantes(idea_id: int, session: SessionDep) -> list[ContentVariant]:
    """Lista las variantes generadas para una idea."""
    return content_service.listar_variantes(session, idea_id)


@router.patch("/variantes/{variante_id}", response_model=ContentVariantOut)
def editar_variante(
    variante_id: int, data: ContentVariantUpdate, session: SessionDep
) -> ContentVariant:
    """Edita el contenido/formato de una variante (solo en estado borrador)."""
    return content_service.actualizar_variante(session, variante_id, data)


@router.post("/variantes/{variante_id}/aprobar", response_model=ContentVariantOut)
def aprobar_variante(variante_id: int, session: SessionDep) -> ContentVariant:
    """Aprueba una variante (borrador -> aprobado)."""
    return content_service.aprobar_variante(session, variante_id)


@router.post("/variantes/{variante_id}/rechazar", response_model=ContentVariantOut)
def rechazar_variante(
    variante_id: int, session: SessionDep, data: VarianteRechazo | None = None
) -> ContentVariant:
    """Rechaza una variante en borrador (queda marcada como rechazada para su revisión)."""
    return content_service.rechazar_variante(session, variante_id, data.motivo if data else None)