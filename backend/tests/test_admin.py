import pytest
from fastapi.testclient import TestClient


def test_student_forbidden_from_admin_dashboard(client: TestClient, student_headers: dict):
    resp = client.get("/api/admin/dashboard", headers=student_headers)
    assert resp.status_code == 403
    assert "requires 'ADMIN' role" in resp.json()["detail"]


def test_student_forbidden_from_creating_quiz(client: TestClient, student_headers: dict):
    resp = client.post(
        "/api/admin/quizzes",
        json={
            "title": "Hacked Quiz",
            "description": "Unauthorized",
            "duration_minutes": 10,
            "passing_percentage": 50,
            "is_published": True,
            "questions": [],
        },
        headers=student_headers,
    )
    assert resp.status_code == 403


def test_admin_dashboard_stats(client: TestClient, admin_headers: dict):
    resp = client.get("/api/admin/dashboard", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_quizzes"] >= 3
    assert data["published_quizzes"] >= 3
    assert data["total_students"] >= 1
    assert "average_score_percentage" in data


def test_admin_quiz_crud_workflow(client: TestClient, admin_headers: dict):
    # 1. Create a quiz
    create_payload = {
        "title": "Kubernetes Mastery",
        "description": "Advanced container orchestration quiz",
        "duration_minutes": 15,
        "passing_percentage": 70,
        "is_published": False,
        "questions": [
            {
                "text": "What component is the control plane storage?",
                "options": ["etcd", "kubelet", "kube-proxy", "containerd"],
                "correct_index": 0,
                "points": 2,
                "explanation": "etcd is the distributed key-value store for all cluster data.",
            }
        ],
    }
    create_resp = client.post("/api/admin/quizzes", json=create_payload, headers=admin_headers)
    assert create_resp.status_code == 201
    quiz_data = create_resp.json()
    quiz_id = quiz_data["id"]
    assert quiz_data["title"] == "Kubernetes Mastery"
    assert quiz_data["is_published"] is False
    assert len(quiz_data["questions"]) == 1

    # 2. Add another question
    new_q_payload = {
        "text": "Which controller handles node failures?",
        "options": ["Node Lifecycle Controller", "Ingress Controller", "ReplicaSet", "Scheduler"],
        "correct_index": 0,
        "points": 1,
        "explanation": "Node Controller monitors node health and status.",
    }
    add_q_resp = client.post(
        f"/api/admin/quizzes/{quiz_id}/questions",
        json=new_q_payload,
        headers=admin_headers,
    )
    assert add_q_resp.status_code == 201
    q_data = add_q_resp.json()
    q_id = q_data["id"]

    # 3. Update the quiz (publish it)
    update_resp = client.put(
        f"/api/admin/quizzes/{quiz_id}",
        json={"is_published": True, "title": "Kubernetes Architecture (Published)"},
        headers=admin_headers,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["is_published"] is True
    assert update_resp.json()["title"] == "Kubernetes Architecture (Published)"

    # 4. Update the question
    update_q_resp = client.put(
        f"/api/admin/quizzes/{quiz_id}/questions/{q_id}",
        json={
            "text": "Which component assigns pods to nodes?",
            "options": ["kube-scheduler", "kubelet", "API server", "CoreDNS"],
            "correct_index": 0,
            "points": 1,
            "explanation": "kube-scheduler determines the best node for new pods.",
        },
        headers=admin_headers,
    )
    assert update_q_resp.status_code == 200
    assert update_q_resp.json()["text"] == "Which component assigns pods to nodes?"

    # 5. Delete the question
    del_q_resp = client.delete(
        f"/api/admin/quizzes/{quiz_id}/questions/{q_id}",
        headers=admin_headers,
    )
    assert del_q_resp.status_code == 204

    # 6. Delete the quiz
    del_quiz_resp = client.delete(
        f"/api/admin/quizzes/{quiz_id}",
        headers=admin_headers,
    )
    assert del_quiz_resp.status_code == 204

    # 7. Verify quiz is deleted
    get_resp = client.get(f"/api/admin/quizzes/{quiz_id}", headers=admin_headers)
    assert get_resp.status_code == 404
