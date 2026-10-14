import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.logging_config import logger
from app.routers.admin_router import router as admin_router
from app.routers.auth_router import router as auth_router
from app.routers.health_router import router as health_router
from app.routers.quiz_router import attempts_router
from app.routers.quiz_router import router as quiz_router
from app.storage import StorageError, storage_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup hook
    logger.info("=" * 60)
    logger.info(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"JSON Store location: {settings.DATA_FILE_PATH}")
    logger.info(f"CORS Allowed Origins: {settings.cors_origins_list}")
    logger.info("=" * 60)
    yield
    # Shutdown hook
    logger.info("Shutting down Online Quiz Application...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "Comprehensive REST API for Online Quiz Application — powered by FastAPI and a local JSON store. "
        "Built for college mini-projects, demonstrating JWT authentication, server-side scoring, "
        "and DevOps CI/CD readiness."
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing and structured access logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    path = request.url.path
    method = request.method

    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000

    # Avoid logging sensitive payloads or query tokens
    logger.info(
        f"{method} {path} - Status: {response.status_code} - Completed in {duration_ms:.2f}ms"
    )
    return response


# Global Exception Handlers
@app.exception_handler(StorageError)
async def storage_error_handler(request: Request, exc: StorageError):
    logger.error(f"Storage error on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": f"Persistent storage error: {str(exc)}"},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    clean_errors = []
    for err in errors:
        loc = " -> ".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "Invalid value")
        clean_errors.append(f"{loc}: {msg}")
    logger.warning(f"Validation failure on {request.url.path}: {clean_errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": clean_errors},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error at {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# Register Routers
app.include_router(health_router)
app.include_router(auth_router)
app.include_router(quiz_router)
app.include_router(attempts_router)
app.include_router(admin_router)


@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "health_url": "/api/health"
    }
