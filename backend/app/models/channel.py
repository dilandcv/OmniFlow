"""Modelo SQLModel de Canal (red social disponible para publicar)."""

from sqlalchemy import JSON, Column
from sqlmodel import Field, Relationship, SQLModel


class Channel(SQLModel, table=True):
    """Canal disponible para publicar contenido (X, LinkedIn, Boletín, Blog, etc.)."""

    id: int | None = Field(default=None, primary_key=True)
    nombre: str = Field(index=True)
    slug: str = Field(unique=True, index=True)
    plataforma: str = Field(default="otro")
    config: dict | None = Field(default=None, sa_column=Column(JSON))

    conceptos: list["ContentConcept"] = Relationship(back_populates="canal")