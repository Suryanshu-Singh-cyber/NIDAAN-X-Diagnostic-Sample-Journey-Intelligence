"""
NIDAAN-X — Diagnostic Sample Journey Intelligence
Production-grade FastAPI application.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import Base, engine
# We import all routers here, including the new chat router
from app.routers import specimens, anomalies, analytics, chat

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized")
    yield
    logger.info("Shutting down")


# 1. CREATE THE APP FIRST
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Diagnostic Sample Journey Intelligence for Indian Hospitals",
    lifespan=lifespan,
)

# 2. ADD MIDDLEWARE
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. INCLUDE ROUTERS (Now that 'app' exists, this will work)
app.include_router(specimens.router)
app.include_router(anomalies.router)
app.include_router(analytics.router)
app.include_router(chat.router) # <--- Added the chat router here


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "environment": settings.APP_ENV,
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "healthy", "version": settings.APP_VERSION}