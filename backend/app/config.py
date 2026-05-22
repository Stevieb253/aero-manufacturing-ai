from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    upload_dir: str = "uploads"

    class Config:
        env_file = ".env"


settings = Settings()
