"""Modelo SQLModel de Idea/Premisa (fuente de todo el flujo)."""

from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel

from app.models.channel import Channel


class IdeaCanal(SQLModel, table=True):
    """Tabla de relación N:M entre ideas y los canales elegidos."""

    idea_id: int = Field(foreign_key="idea.id", primary_key=True)
    canal_id: int = Field(foreign_key="channel.id", primary_key=True)


class Idea(SQLModel, table=True):
    """Premisa de contenido (idea + tono + canales elegidos) que dispara la generación."""

    id: int | None = Field(default=None, primary_key=True)
    premisa: str
    tono: str = Field(default="neutral")
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    canales: list[Channel] = Relationship(link_model=IdeaCanal)
    variantes: list["ContentVariant"] = Relationship(back_populates="idea")