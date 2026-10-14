import os
import tempfile
import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.main import app
from app.storage import StorageService, storage_service


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """
    Creates an isolated temporary JSON data store for the entire test session.
    Cleaned up automatically after tests finish.
    """
    temp_dir = tempfile.mkdtemp()
    temp_file = os.path.join(temp_dir, "test_store.json")
    original_path = settings.DATA_FILE_PATH
    settings.DATA_FILE_PATH = temp_file

    # Re-initialize storage service with test file
    storage_service.file_path = storage_service.file_path.__class__(temp_file)
    storage_service._ensure_storage_initialized()

    yield

    # Cleanup
    settings.DATA_FILE_PATH = original_path
    if os.path.exists(temp_file):
        try:
            os.remove(temp_file)
            os.rmdir(temp_dir)
        except OSError:
            pass


@pytest.fixture
def client():
    """FastAPI TestClient fixture."""
    return TestClient(app)


@pytest.fixture
def admin_headers(client: TestClient):
    """Logs in as default demo admin and returns auth headers."""
    resp = client.post(
        "/api/auth/login",
        json={"email": "admin@example.com", "password": "Admin123!"}
    )
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_headers(client: TestClient):
    """Logs in as default demo student and returns auth headers."""
    resp = client.post(
        "/api/auth/login",
        json={"email": "student@example.com", "password": "Student123!"}
    )
    assert resp.status_code == 200, f"Student login failed: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
