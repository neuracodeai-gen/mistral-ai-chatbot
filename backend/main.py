"""Main application entry point for the AI chatbot API."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
import uvicorn

from backend.config import settings
from backend.database.database import init_db, get_db
from backend.routes.chats import router as chat_router
from backend.routes.settings import router as settings_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Initialize database
    init_db()
    logger.info("Database initialized")
    
    # Startup
    logger.info("Starting AI Chatbot API")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Chatbot API")


# Create FastAPI app
app = FastAPI(
    title="AI Chatbot API",
    description="A polished AI chatbot with memory, chat history, and custom instructions using Groq API",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router)
app.include_router(settings_router)

# Mount static files for frontend
app.mount("/static", StaticFiles(directory="frontend/public"), name="static")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "AI Chatbot API",
        "version": "1.0.0",
        "description": "A polished AI chatbot with Groq API",
        "model": settings.MODEL_ID,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": "2024-01-01T00:00:00Z"}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler."""
    logger.error(f"Error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": str(exc)}
    )


def main():
    """Run the application."""
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info"
    )


if __name__ == "__main__":
    main()
