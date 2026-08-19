"""Conexión e inicialización de la base de datos SQLite (SQLModel/SQLAlchemy)."""

from collections.abc import Iterator

from sqlmodel import Session, SQLModel, create_engine, select

from app.core.config import settings
from app import models  # noqa: F401  (registra los modelos en el metadata antes de create_all)

connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(settings.database_url, connect_args=connect_args)


def init_db() -> None:
    """Crea las tablas y siembra canales por defecto si la BD está vacía."""
    SQLModel.metadata.create_all(engine)

    from app.models.channel import Channel

    with Session(engine) as session:
        if session.exec(select(Channel)).first() is None:
            session.add_all(
                [
                    Channel(nombre="X (Twitter)", slug="x", plataforma="hilo"),
                    Channel(nombre="LinkedIn", slug="linkedin", plataforma="articulo"),
                    Channel(nombre="Boletín", slug="boletin", plataforma="boletin"),
                    Channel(nombre="Blog", slug="blog", plataforma="articulo"),
                    Channel(nombre="TikTok", slug="tiktok", plataforma="tiktok"),
                    Channel(nombre="Instagram", slug="instagram", plataforma="instagram"),
                    Channel(nombre="Facebook", slug="facebook", plataforma="facebook"),
                ]
            )
            session.commit()
        else:
            _asegurar_canales_sociales(session)


def _asegurar_canales_sociales(session: Session) -> None:
    """Agrega los canales sociales (idempotente) a bases de datos ya existentes."""
    from app.models.channel import Channel

    sociales = [
        Channel(nombre="TikTok", slug="tiktok", plataforma="tiktok"),
        Channel(nombre="Instagram", slug="instagram", plataforma="instagram"),
        Channel(nombre="Facebook", slug="facebook", plataforma="facebook"),
    ]
    existentes = {c.slug for c in session.exec(select(Channel)).all()}
    nuevos = [c for c in sociales if c.slug not in existentes]
    if nuevos:
        session.add_all(nuevos)
        session.commit()


def get_session() -> Iterator[Session]:
    """Dependency que entrega una sesión de BD por request."""
    with Session(engine) as session:
        yield session