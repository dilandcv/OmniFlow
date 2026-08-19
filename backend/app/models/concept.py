"""Modelo SQLModel de ContentConcept (propuesta de contenido por canal).

Un concepto responde "¿qué contenido podría crear?" (estratega). El contenido
final (ContentVariant) responde "¿cuál es el contenido final?" (redactor) y se
generará en una fase posterior. Por eso ContentConcept NO se acopla a
ScheduledPost: la programación sigue dependiendo de ContentVariant.
"""

from datetime import datetime, timezone

from sqlmodel import Field, Relationship, SQLModel


class ContentConcept(SQLModel, table=True):
    """Propuesta de contenido para un canal, generada por el estratega de IA."""

    id: int | None = Field(default=None, primary_key=True)
    idea_id: int = Field(foreign_key="idea.id", index=True)
    canal_id: int = Field(foreign_key="channel.id", index=True)

    title: str
    description: str = Field(default="")
    format: str
    hook: str | None = None
    objective: str | None = None
    target_audience: str | None = None
    call_to_action: str | None = None
    estimated_duration: int | None = None
    rationale: str | None = None

    seleccionado: bool = Field(default=False)
    fecha_creacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    idea: "Idea" = Relationship(back_populates="conceptos")
    canal: "Channel" = Relationship(back_populates="conceptos")
