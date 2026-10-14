from datetime import datetime, timezone
from fastapi import APIRouter, Response, status

from app.config import settings
from app.models import HealthResponse
from app.storage import storage_service

router = APIRouter(prefix="/api/health", tags=["Health & Diagnostics"])


@router.get("", response_model=HealthResponse)
def get_health(response: Response):
    """
    Returns application health, JSON storage availability, and runtime environment.
    If storage is unavailable or corrupted, returns HTTP 503 Service Unavailable.
    """
    storage_ok = storage_service.check_health()
    now_str = datetime.now(timezone.utc).isoformat()

    if not storage_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(
            status="unhealthy",
            timestamp=now_str,
            storage_healthy=False,
            version=settings.VERSION,
            environment=settings.ENVIRONMENT,
            message="JSON storage is inaccessible, corrupted, or has permission issues."
        )

    return HealthResponse(
        status="healthy",
        timestamp=now_str,
        storage_healthy=True,
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        message="Online Quiz Application backend and JSON storage are operating normally."
    )
