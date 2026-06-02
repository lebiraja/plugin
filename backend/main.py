"""Application entrypoint: FastAPI app, lifespan, middleware, routers."""

import logging
import os
import time
import uuid
import warnings
from contextlib import asynccontextmanager

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# Suppress noisy third-party warnings before heavy imports.
warnings.filterwarnings("ignore", category=UserWarning, module="torch")
warnings.filterwarnings("ignore", category=UserWarning, module="torchvision")
warnings.filterwarnings("ignore", message=".*telemetry.*")

os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("logs/app.log"), logging.StreamHandler()],
)
logging.getLogger("watchfiles.main").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

load_dotenv()

from config import settings  # noqa: E402
from errors import (  # noqa: E402
    AppError,
    app_error_handler,
    unhandled_error_handler,
)
from routers import (  # noqa: E402
    chat,
    deep_research,
    files,
    health,
    models,
    sessions,
    tools,
)
from services.database_service import db_service  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect to MongoDB on startup, disconnect on shutdown."""
    try:
        await db_service.connect()
        logger.info("Application startup complete")
    except Exception:
        logger.exception("Startup failed")
        raise
    yield
    await db_service.disconnect()
    logger.info("Application shutdown complete")


app = FastAPI(title="Local LLM Chat API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    """Tag each request with a correlation id and log method/path/status/latency."""
    correlation_id = uuid.uuid4().hex[:8]
    start = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Request-ID"] = correlation_id
    logger.info(
        "[%s] %s %s -> %d (%.1fms)",
        correlation_id,
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


app.add_exception_handler(AppError, app_error_handler)
app.add_exception_handler(Exception, unhandled_error_handler)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(models.router, prefix="/api/models", tags=["models"])
app.include_router(tools.router, prefix="/api/tools", tags=["tools"])
app.include_router(
    deep_research.router, prefix="/api/deep-research", tags=["deep-research"]
)
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])


@app.get("/")
async def root():
    return {"message": "Local LLM Chat API", "version": "2.0.0"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        reload_excludes=["logs/*", "vector_db/*", "*.log", "__pycache__/*"],
    )
