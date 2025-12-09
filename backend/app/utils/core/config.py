from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Closo"
    VERSION: str = "0.1.0"
    DEBUG: bool = True

    # Configuration de base de données
    DB_HOST: str
    DB_PORT: int
    DB_USERNAME: str
    DB_PASSWORD: str
    DB_DATABASE: str

    # Configuration de sécurité
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int


    class Config:
        env_file = ".env"

settings = Settings()
