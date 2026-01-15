import os
from dotenv import load_dotenv

# Load Environment Variables
load_dotenv()

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    MILVUS_HOST: str = os.getenv("MILVUS_HOST", "localhost")
    MILVUS_PORT: str = os.getenv("MILVUS_PORT", "19530")
    AI_SERVICE_PORT: int = int(os.getenv("PORT", "8000"))
    COLLECTION_NAME: str = "candidate_profiles_v3"
    DIMENSION: int = 768

settings = Settings()
