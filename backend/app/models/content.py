"""Modelo SQLModel de ContentVariant (pieza de contenido generada por canal)."""

from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel

BORRADOR = "borrador"
APROBADO = "aprobado"
PROGRAMADO = "programado"
PUBLICADO = "publicado"
ESTADOS_VARIANTE = (BORRADOR, APROBADO, PROGRAMADO, PUBLICADO)

# Transiciones válidas del flujo: borrador -> aprobado -> programado -> publicado.
# (la transicion programado -> publicado la ejecuta el worker de distribución)
TRANSICIONES_VARIANTE: dict[str, set[str]] = {
    BORRADOR: {APROBADO},
    APROBADO: {PROGRAMADO},
    PROGRAMADO: {PUBLICADO},
    PUBLICADO: set(),
}


class ContentVariant(SQLModel, table=True):
    """Variante de contenido generada para un canal a partir de una idea."""

    id: int | None = Field(default=None, primary_key=True)
    idea_id: int = Field(foreign_key="idea.id", index=True)
    canal_id: int = Field(foreign_key="channel.id", index=True)
    formato: str
    contenido: str
    estado: str = Field(default=BORRADOR, index=True)
    rechazada: bool = Field(default=False)
    motivo_rechazo: str | None = None
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    fecha_actualizacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    idea: "Idea" = Relationship(back_populates="variantes")
    canal: "Channel" = Relationship()
    programacion: "ScheduledPost" = Relationship(back_populates="variante")