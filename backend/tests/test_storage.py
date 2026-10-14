import json
import os
import tempfile
import pytest

from app.models import Role
from app.storage import StorageError, StorageService


def test_storage_initializes_file_and_seeds_demo_data():
    with tempfile.TemporaryDirectory() as tmp_dir:
        store_path = os.path.join(tmp_dir, "nested", "dir", "store.json")
        assert not os.path.exists(store_path)

        storage = StorageService(file_path=store_path)
        assert os.path.exists(store_path)

        # Check default seeds
        admin = storage.get_user_by_email("admin@example.com")
        assert admin is not None
        assert admin.role == Role.ADMIN

        student = storage.get_user_by_email("student@example.com")
        assert student is not None
        assert student.role == Role.STUDENT

        quizzes = storage.list_all_quizzes_for_admin()
        assert len(quizzes) >= 3


def test_storage_persistence_across_service_reloads():
    with tempfile.TemporaryDirectory() as tmp_dir:
        store_path = os.path.join(tmp_dir, "store.json")
        service_instance_1 = StorageService(file_path=store_path)

        # Add a custom quiz
        service_instance_1.create_quiz(
            title="Reload Persistence Quiz",
            description="Testing survival across restarts",
            duration_minutes=20,
            passing_percentage=75,
            is_published=True,
            questions_data=[
                {
                    "text": "Does data persist across reloads?",
                    "options": ["Yes", "No"],
                    "correct_index": 0,
                    "points": 1,
                    "explanation": "JSON file retains data on disk.",
                }
            ],
        )

        # Now simulate application restart by creating a new StorageService instance on same file
        service_instance_2 = StorageService(file_path=store_path)
        quizzes = service_instance_2.list_all_quizzes_for_admin()
        found = any(q.title == "Reload Persistence Quiz" for q in quizzes)
        assert found is True, "Custom quiz should persist across service reloads"


def test_storage_malformed_json_raises_clear_error():
    with tempfile.TemporaryDirectory() as tmp_dir:
        store_path = os.path.join(tmp_dir, "corrupt.json")
        # Write corrupted JSON
        with open(store_path, "w", encoding="utf-8") as f:
            f.write("{\n  corrupt_json: true,,,\n}")

        with pytest.raises(StorageError) as exc_info:
            StorageService(file_path=store_path)

        assert "malformed or corrupted" in str(exc_info.value).lower()
