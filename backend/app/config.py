from pydantic_settings import BaseSettings, SettingsConfigDict
import json
from typing import List

class Settings(BaseSettings):
    database_url: str = "postgresql://postgres:postgres@localhost:5432/taskmanager"
    cors_origins: str = '["http://localhost:5173"]'

    @property
    def cors_origins_list(self) -> List[str]:
        try:
            return json.loads(self.cors_origins)
        except json.JSONDecodeError:
            return ["http://localhost:5173"]

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
