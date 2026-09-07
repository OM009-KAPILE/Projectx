import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "ProjectX AI Microservice"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    PORT: int = int(os.getenv("PORT", "8000"))
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    BACKEND_SECRET: str = os.getenv("BACKEND_SECRET", "projectx_ai_internal_token")

settings = Settings()
