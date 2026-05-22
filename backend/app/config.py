from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    upload_dir: str = "uploads"

    # Tessellation quality: linear deflection in mm.
    # Lower = finer mesh and larger GLB file. 0.1mm is a good default
    # for single machined parts. Override in .env if needed.
    tessellation_deflection: float = 0.1

    class Config:
        env_file = ".env"


settings = Settings()
