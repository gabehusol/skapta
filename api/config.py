from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    openai_api_key: str = ""
    groq_api_key: str = ""
    pinecone_api_key: str = ""
    pinecone_index_name: str = "skapta-docs"
    github_client_id: str = ""
    github_client_secret: str = ""
    allowed_origins: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
