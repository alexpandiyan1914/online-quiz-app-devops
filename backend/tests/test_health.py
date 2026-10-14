from fastapi.testclient import TestClient


def test_health_check_endpoint(client: TestClient):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["storage_healthy"] is True
    assert "timestamp" in data
    assert "version" in data


def test_root_endpoint(client: TestClient):
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert "docs_url" in data
    assert data["health_url"] == "/api/health"
