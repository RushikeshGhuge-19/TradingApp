from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "Algo Backend"
    DATABASE_URL: str = "sqlite:///./strategy.db"

    class Config:
        env_file = ".env"


settings = Settings()
