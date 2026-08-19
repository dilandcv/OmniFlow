"""Configuración central (pydantic-settings): variables de entorno (.env) y ajustes de la app."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Ajustes de la aplicación leídos desde variables de entorno / archivo .env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "OmniFlow API"
    database_url: str = "sqlite:///./omniflow.db"
    secret_key: str = "change-me"

    ai_provider: str = "anthropic"
    ai_api_key: str = ""
    ai_model: str = ""
    ai_prompt_version: str = "1"

    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        """Lista de orígenes CORS permitidos (separados por coma en el .env)."""
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()