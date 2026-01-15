import logging
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.routers import candidates, jobs, interviews, tasks

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

# Configure Gemini


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Milvus Setup via Service
    try:
        from app.services.milvus_service import milvus_service
        milvus_service.connect()
    except Exception as e:
        logger.error(f"❌ Milvus Connection Failed: {e}")
    
    yield

app = FastAPI(title="ATS AI Service", version="3.0", lifespan=lifespan)

# CORS
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(candidates.router)
app.include_router(jobs.router)
app.include_router(interviews.router)
app.include_router(tasks.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "3.0"}

if __name__ == "__main__":
    import uvicorn
    # Reload=True is important for dev, but beware of spawn loops on Windows without this guard
    uvicorn.run("main:app", host="0.0.0.0", port=settings.AI_SERVICE_PORT, reload=True)
