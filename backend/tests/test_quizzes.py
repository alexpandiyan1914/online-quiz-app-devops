import pytest
from fastapi.testclient import TestClient


def test_student_list_published_quizzes(client: TestClient, student_headers: dict):
    resp = client.get("/api/quizzes", headers=student_headers)
    assert resp.status_code == 200
    quizzes = resp.json()
    assert len(quizzes) >= 3
    for q in quizzes:
        assert q["is_published"] is True
        assert q["question_count"] >= 5


def test_student_get_quiz_details_does_not_leak_answers(client: TestClient, student_headers: dict):
    # Fetch first quiz
    list_resp = client.get("/api/quizzes", headers=student_headers)
    quiz_id = list_resp.json()[0]["id"]

    resp = client.get(f"/api/quizzes/{quiz_id}", headers=student_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == quiz_id
    assert len(data["questions"]) >= 5

    # CRITICAL CHECK: Verify neither correct_index nor explanation are present in response
    for q in data["questions"]:
        assert "correct_index" not in q
        assert "explanation" not in q


def test_student_submit_quiz_full_score(client: TestClient, student_headers: dict):
    list_resp = client.get("/api/quizzes", headers=student_headers)
    quiz_id = "quiz-devops-001"

    # Known correct answers for quiz-devops-001:
    # q-devops-1: index 0
    # q-devops-2: index 1
    # q-devops-3: index 1
    # q-devops-4: index 1
    # q-devops-5: index 0
    submission = {
        "quiz_id": quiz_id,
        "answers": [
            {"question_id": "q-devops-1", "selected_index": 0},
            {"question_id": "q-devops-2", "selected_index": 1},
            {"question_id": "q-devops-3", "selected_index": 1},
            {"question_id": "q-devops-4", "selected_index": 1},
            {"question_id": "q-devops-5", "selected_index": 0},
        ],
    }

    resp = client.post(f"/api/quizzes/{quiz_id}/submit", json=submission, headers=student_headers)
    assert resp.status_code == 200
    result = resp.json()

    assert result["score"] == 5
    assert result["total_points"] == 5
    assert result["percentage"] == 100.0
    assert result["passed"] is True
    assert result["correct_count"] == 5
    assert result["incorrect_count"] == 0
    assert result["unanswered_count"] == 0
    assert len(result["reviews"]) == 5
    assert all(r["is_correct"] is True for r in result["reviews"])


def test_student_submit_quiz_partial_score(client: TestClient, student_headers: dict):
    quiz_id = "quiz-devops-001"
    submission = {
        "quiz_id": quiz_id,
        "answers": [
            {"question_id": "q-devops-1", "selected_index": 0},  # Correct
            {"question_id": "q-devops-2", "selected_index": 1},  # Correct
            {"question_id": "q-devops-3", "selected_index": 0},  # Wrong (correct is 1)
            {"question_id": "q-devops-4", "selected_index": 2},  # Wrong (correct is 1)
            {"question_id": "q-devops-5", "selected_index": None},  # Unanswered
        ],
    }

    resp = client.post(f"/api/quizzes/{quiz_id}/submit", json=submission, headers=student_headers)
    assert resp.status_code == 200
    result = resp.json()

    assert result["score"] == 2
    assert result["total_points"] == 5
    assert result["percentage"] == 40.0
    assert result["passed"] is False  # 40% < 60%
    assert result["correct_count"] == 2
    assert result["incorrect_count"] == 2
    assert result["unanswered_count"] == 1


def test_student_attempt_history_and_review(client: TestClient, student_headers: dict):
    # Fetch attempt list
    resp = client.get("/api/attempts/my", headers=student_headers)
    assert resp.status_code == 200
    attempts = resp.json()
    assert len(attempts) >= 1
    attempt_id = attempts[0]["id"]

    # Review attempt details
    detail_resp = client.get(f"/api/attempts/{attempt_id}", headers=student_headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == attempt_id
    assert len(detail["reviews"]) > 0
    # On review page, explanations and correct answers ARE shown
    assert "correct_index" in detail["reviews"][0]
    assert "explanation" in detail["reviews"][0]
