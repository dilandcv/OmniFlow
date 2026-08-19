"""Router de conceptos de contenido (estratega IA).

- ``POST /api/ideas/{idea_id}/concepts/generate``  genera conceptos por plataforma.
- ``GET  /api/ideas/{idea_id}/concepts``           lista los conceptos generados.
- ``POST /api/concepts/{concept_id}/select``       selecciona un concepto.

La generación del contenido final (ContentVariant) a partir de un concepto
se implementará en una fase posterior.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlmodel import Session

from app.core.db import get_session
from app.models.concept import ContentConcept
from app.schemas.concept import ContentConceptGenerationResponse, ContentConceptOut
from app.services import concept_service

router = APIRouter(prefix="/api", tags=["conceptos"])

SessionDep = Annotated[Session, Depends(get_session)]


@router.post(
    "/ideas/{idea_id}/concepts/generate",
    response_model=ContentConceptGenerationResponse,
    status_code=status.HTTP_201_CREATED,
)
def generar_conceptos_idea(
    idea_id: int,
    session: SessionDep,
    cantidad: Annotated[int | None, Query(ge=1, le=10)] = None,
) -> dict:
    """Genera conceptos de contenido por plataforma (5 por plataforma por defecto)."""
    conceptos = concept_service.generar_conceptos_de_idea(session, idea_id, cantidad)
    return {"concepts": conceptos}


@router.get("/ideas/{idea_id}/concepts", response_model=list[ContentConceptOut])
def listar_conceptos_idea(idea_id: int, session: SessionDep) -> list[ContentConcept]:
    """Lista los conceptos generados para una idea."""
    return concept_service.listar_conceptos(session, idea_id)


@router.post("/concepts/{concept_id}/select", response_model=ContentConceptOut)
def seleccionar_concepto(concept_id: int, session: SessionDep) -> ContentConcept:
    """Marca un concepto como seleccionado (deselecciona el resto de su idea)."""
    return concept_service.seleccionar_concepto(session, concept_id)
