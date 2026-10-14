import pytest
from fastapi.testclient import TestClient


def test_register_student_success(client: TestClient):
    resp = client.post(
        "/api/auth/register",
        json={
            "email": "newstudent@example.com",
            "password": "Password123!",
            "full_name": "New Student",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newstudent@example.com"
    assert data["user"]["role"] == "STUDENT"


def test_register_duplicate_email_fails(client: TestClient):
    resp = client.post(
        "/api/auth/register",
        json={
            "email": "student@example.com",  # Already exists from demo seed
            "password": "Password123!",
            "full_name": "Duplicate Student",
        },
    )
    assert resp.status_code == 400
    assert "already exists" in resp.json()["detail"].lower()


def test_register_invalid_email_format(client: TestClient):
    resp = client.post(
        "/api/auth/register",
        json={
            "email": "invalid-email-address",
            "password": "Password123!",
            "full_name": "Invalid Email",
        },
    )
    assert resp.status_code == 422


def test_login_success(client: TestClient):
    resp = client.post(
        "/api/auth/login",
        json={"email": "student@example.com", "password": "Student123!"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["role"] == "STUDENT"


def test_login_wrong_password_fails(client: TestClient):
    resp = client.post(
        "/api/auth/login",
        json={"email": "student@example.com", "password": "WrongPassword!"},
    )
    assert resp.status_code == 401
    assert "invalid email or password" in resp.json()["detail"].lower()


def test_login_nonexistent_user_fails(client: TestClient):
    resp = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "SomePassword123!"},
    )
    assert resp.status_code == 401


def test_get_current_user_me(client: TestClient, student_headers: dict):
    resp = client.get("/api/auth/me", headers=student_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == "student@example.com"
    assert data["role"] == "STUDENT"


def test_get_current_user_unauthorized(client: TestClient):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401
