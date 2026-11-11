from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Barberia API"
    database_url: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int = 480

    first_admin_nombre: str
    first_admin_telefono: str
    first_admin_password: str

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

settings = Settings()