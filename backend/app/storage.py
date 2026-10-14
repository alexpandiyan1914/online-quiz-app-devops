import json
import os
import shutil
import tempfile
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.auth import hash_password
from app.config import settings
from app.logging_config import logger
from app.models import (
    Role,
    UserInDB,
    QuizAdminDetail,
    QuizStudentDetail,
    QuizStudentListItem,
    QuestionAdmin,
    QuestionStudent,
    AttemptResult,
    AttemptSummary,
    AdminDashboardStats,
)


class StorageError(Exception):
    """Raised when storage operations fail or the data file is corrupted."""
    pass


class StorageService:
    """
    Thread-safe JSON file storage service for Online Quiz Application.
    Uses safe write (write to temp file then atomic replace) to prevent corruption.
    """

    def __init__(self, file_path: Optional[str] = None):
        self.file_path = Path(file_path or settings.DATA_FILE_PATH).resolve()
        self._lock = threading.RLock()
        self._ensure_storage_initialized()

    def _ensure_storage_initialized(self) -> None:
        """
        Creates directory and initializes data file if missing.
        Never overwrites valid existing data with seed data.
        """
        with self._lock:
            parent_dir = self.file_path.parent
            parent_dir.mkdir(parents=True, exist_ok=True)

            if not self.file_path.exists():
                logger.info(f"Storage file not found at {self.file_path}. Creating and seeding default data...")
                initial_data = self._build_seed_data()
                self._write_file_unlocked(initial_data)
            else:
                # Validate that existing file is valid JSON
                try:
                    with open(self.file_path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                    if not isinstance(data, dict) or "users" not in data or "quizzes" not in data:
                        raise ValueError("Data file structure is missing required collections (users, quizzes)")
                    logger.info(f"Storage verified: loaded successfully from {self.file_path}")
                except Exception as exc:
                    logger.critical(
                        f"CRITICAL: Storage file at {self.file_path} is malformed or unreadable: {str(exc)}"
                    )
                    raise StorageError(
                        f"Storage file is malformed or corrupted: {str(exc)}. Please restore from backup."
                    )

    def _build_seed_data(self) -> Dict[str, Any]:
        """Creates the initial seed database with demo admin, student, and 3 rich sample quizzes."""
        now = datetime.now(timezone.utc).isoformat()

        admin_user = {
            "id": "admin-user-001",
            "email": "admin@example.com",
            "full_name": "Demo Admin",
            "role": Role.ADMIN.value,
            "hashed_password": hash_password("Admin123!"),
            "created_at": now,
        }

        student_user = {
            "id": "student-user-001",
            "email": "student@example.com",
            "full_name": "Demo Student",
            "role": Role.STUDENT.value,
            "hashed_password": hash_password("Student123!"),
            "created_at": now,
        }

        # Quiz 1: DevOps & Cloud
        quiz_devops = {
            "id": "quiz-devops-001",
            "title": "DevOps & Cloud Computing Fundamentals",
            "description": "Test your core knowledge on CI/CD pipelines, containerization, Kubernetes, and Cloud Run.",
            "duration_minutes": 10,
            "passing_percentage": 60,
            "is_published": True,
            "created_at": now,
            "updated_at": now,
            "questions": [
                {
                    "id": "q-devops-1",
                    "text": "What does CI/CD stand for in modern software engineering?",
                    "options": [
                        "Continuous Integration and Continuous Deployment",
                        "Code Inspection and Cloud Delivery",
                        "Centralized Infrastructure and Continuous Delivery",
                        "Command Interface and Cloud Distribution"
                    ],
                    "correct_index": 0,
                    "points": 1,
                    "explanation": "CI/CD stands for Continuous Integration (automated building and testing) and Continuous Deployment/Delivery (automated releasing to production)."
                },
                {
                    "id": "q-devops-2",
                    "text": "Which tool provides lightweight container virtualization using images and layers?",
                    "options": ["VirtualBox", "Docker", "Apache Tomcat", "Ansible"],
                    "correct_index": 1,
                    "points": 1,
                    "explanation": "Docker packages applications and dependencies into standard container images sharing the host OS kernel."
                },
                {
                    "id": "q-devops-3",
                    "text": "In Kubernetes, what is the smallest deployable computing unit that encapsulates one or more containers?",
                    "options": ["Node", "Pod", "Cluster", "Namespace"],
                    "correct_index": 1,
                    "points": 1,
                    "explanation": "A Pod is the basic execution unit in Kubernetes, hosting one or more containers sharing storage and network namespaces."
                },
                {
                    "id": "q-devops-4",
                    "text": "What is the primary benefit of Infrastructure as Code (IaC)?",
                    "options": [
                        "Running servers without an operating system",
                        "Managing and provisioning infrastructure via declarative version-controlled files",
                        "Replacing all backend code with SQL queries",
                        "Eliminating the need for unit testing"
                    ],
                    "correct_index": 1,
                    "points": 1,
                    "explanation": "IaC allows infrastructure specifications to be documented, automated, version-controlled, and audited just like software code."
                },
                {
                    "id": "q-devops-5",
                    "text": "Which Google Cloud service is a fully managed serverless platform for deploying containerized apps?",
                    "options": ["Google Cloud Run", "Compute Engine", "Google Cloud Storage", "Cloud DNS"],
                    "correct_index": 0,
                    "points": 1,
                    "explanation": "Cloud Run is Google Cloud's serverless runtime that automatically scales stateless containers up or down to zero."
                }
            ]
        }

        # Quiz 2: Python & FastAPI
        quiz_python = {
            "id": "quiz-python-002",
            "title": "Python Programming & FastAPI Mastery",
            "description": "Evaluate your understanding of Python syntax, async/await, Pydantic schemas, and FastAPI conventions.",
            "duration_minutes": 8,
            "passing_percentage": 60,
            "is_published": True,
            "created_at": now,
            "updated_at": now,
            "questions": [
                {
                    "id": "q-python-1",
                    "text": "Which library does FastAPI use for high-performance data validation and typing?",
                    "options": ["Marshmallow", "Pydantic", "SQLAlchemy", "Requests"],
                    "correct_index": 1,
                    "points": 1,
                    "explanation": "FastAPI is built tightly with Pydantic for data validation, serialization, and automatic OpenAPI documentation generation."
                },
                {
                    "id": "q-python-2",
                    "text": "In Python, which keywords are used to define and execute asynchronous coroutines?",
                    "options": ["thread and spawn", "async and await", "defer and yield", "parallel and join"],
                    "correct_index": 1,
                    "points": 1,
                    "explanation": "'async def' declares an asynchronous function and 'await' pauses execution until the awaited awaitable completes."
                },
                {
                    "id": "q-python-3",
                    "text": "What does the 'pass' statement do in Python?",
                    "options": [
                        "Terminates the program immediately",
                        "Acts as a syntactical placeholder statement that does nothing",
                        "Throws an exception to pass control up the stack",
                        "Skips the rest of the loop iteration"
                    ],
                    "correct_index": 1,
                    "points": 1,
                    "explanation": "'pass' is a null operation in Python used when a statement is required syntactically but no code needs to execute."
                },
                {
                    "id": "q-python-4",
                    "text": "What ASGI server is standardly paired with FastAPI for production serving?",
                    "options": ["WSGI", "Uvicorn", "Apache HTTPD", "Nginx directly"],
                    "correct_index": 1,
                    "points": 1,
                    "explanation": "Uvicorn is a lightning-fast ASGI server implementation, using uvloop and httptools to run async Python applications."
                },
                {
                    "id": "q-python-5",
                    "text": "Which Python decorator is used in FastAPI to define a GET endpoint on a router?",
                    "options": ["@router.get('/path')", "@router.route('/path', method='GET')", "@app.post('/path')", "@api.fetch('/path')"],
                    "correct_index": 0,
                    "points": 1,
                    "explanation": "FastAPI uses HTTP-verb decorators like @router.get() or @app.get() to define path operations."
                }
            ]
        }

        # Quiz 3: Web & HTTP
        quiz_web = {
            "id": "quiz-web-003",
            "title": "Web Architecture & HTTP Protocols",
            "description": "Essential knowledge covering HTTP status codes, RESTful methods, React fundamentals, and JWT auth.",
            "duration_minutes": 10,
            "passing_percentage": 60,
            "is_published": True,
            "created_at": now,
            "updated_at": now,
            "questions": [
                {
                    "id": "q-web-1",
                    "text": "What HTTP status code represents '401 Unauthorized'?",
                    "options": [
                        "The client is authenticated but lacks permission",
                        "Authentication credentials are required and either missing or invalid",
                        "The requested resource was permanently moved",
                        "The server encountered an unhandled internal exception"
                    ],
                    "correct_index": 1,
                    "points": 1,
                    "explanation": "HTTP 401 Unauthorized indicates that the request has not been applied because it lacks valid authentication credentials."
                },
                {
                    "id": "q-web-2",
                    "text": "Which HTTP method should be used when submitting answers to create a new quiz attempt?",
                    "options": ["GET", "POST", "DELETE", "HEAD"],
                    "correct_index": 1,
                    "points": 1,
                    "explanation": "POST is used to submit an entity to the specified resource, commonly causing a change in state or creating a subordinate resource."
                },
                {
                    "id": "q-web-3",
                    "text": "In React, which hook is used to perform side effects like fetching data or synchronizing with external APIs?",
                    "options": ["useState", "useEffect", "useMemo", "useCallback"],
                    "correct_index": 1,
                    "points": 1,
                    "explanation": "useEffect lets you perform side effects such as data fetching, timers, and manual DOM mutations after rendering."
                },
                {
                    "id": "q-web-4",
                    "text": "What does CORS stand for in browser web security?",
                    "options": [
                        "Cross-Origin Resource Sharing",
                        "Centralized Origin Request Security",
                        "Client Operation Restricted Scope",
                        "Continuous Online Resource System"
                    ],
                    "correct_index": 0,
                    "points": 1,
                    "explanation": "CORS (Cross-Origin Resource Sharing) is an HTTP-header based mechanism enabling a server to indicate any origins other than its own from which a browser should permit loading resources."
                },
                {
                    "id": "q-web-5",
                    "text": "How many parts separated by dots (.) does a standard JSON Web Token (JWT) contain?",
                    "options": ["Two (Header, Body)", "Three (Header, Payload, Signature)", "Four (Header, Claims, Payload, Hash)", "One (Single encrypted string)"],
                    "correct_index": 1,
                    "points": 1,
                    "explanation": "A JWT consists of three parts separated by dots: Header, Payload, and Signature, formatted as header.payload.signature."
                }
            ]
        }

        return {
            "version": "1.0",
            "initialized_at": now,
            "users": [admin_user, student_user],
            "quizzes": [quiz_devops, quiz_python, quiz_web],
            "attempts": []
        }

    def _read_file_unlocked(self) -> Dict[str, Any]:
        """Reads and parses the JSON file. Caller must hold self._lock."""
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError as exc:
            logger.error(f"JSON storage decode error at {self.file_path}: {str(exc)}")
            raise StorageError(f"Corrupted JSON store: {str(exc)}")
        except Exception as exc:
            logger.error(f"Failed to read storage file at {self.file_path}: {str(exc)}")
            raise StorageError(f"Could not read storage: {str(exc)}")

    def _write_file_unlocked(self, data: Dict[str, Any]) -> None:
        """
        Atomically writes data to the JSON file using a temp file + replace.
        Prevents file corruption if the process or machine crashes mid-write.
        Caller must hold self._lock.
        """
        temp_file = None
        try:
            parent_dir = self.file_path.parent
            parent_dir.mkdir(parents=True, exist_ok=True)
            # Create temp file in same directory for atomic replace guarantee
            with tempfile.NamedTemporaryFile("w", dir=parent_dir, delete=False, encoding="utf-8") as tf:
                temp_file = tf.name
                json.dump(data, tf, indent=2, ensure_ascii=False)
                tf.flush()
                os.fsync(tf.fileno())

            # Atomic rename / replace
            os.replace(temp_file, self.file_path)
            temp_file = None
        except Exception as exc:
            logger.error(f"Failed to write storage file atomically: {str(exc)}")
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                except OSError:
                    pass
            raise StorageError(f"Could not write storage: {str(exc)}")

    def check_health(self) -> bool:
        """Verifies read and write capability of the storage."""
        try:
            with self._lock:
                if not self.file_path.exists():
                    return False
                with open(self.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return isinstance(data, dict) and "users" in data and "quizzes" in data
        except Exception as exc:
            logger.error(f"Storage health check failed: {str(exc)}")
            return False

    # ==========================================
    # User Operations
    # ==========================================

    def get_user_by_id(self, user_id: str) -> Optional[UserInDB]:
        with self._lock:
            data = self._read_file_unlocked()
            for u in data.get("users", []):
                if u["id"] == user_id:
                    return UserInDB(**u)
            return None

    def get_user_by_email(self, email: str) -> Optional[UserInDB]:
        clean_email = email.strip().lower()
        with self._lock:
            data = self._read_file_unlocked()
            for u in data.get("users", []):
                if u["email"].lower() == clean_email:
                    return UserInDB(**u)
            return None

    def create_user(self, email: str, full_name: str, hashed_password: str, role: Role = Role.STUDENT) -> UserInDB:
        clean_email = email.strip().lower()
        with self._lock:
            data = self._read_file_unlocked()
            for u in data.get("users", []):
                if u["email"].lower() == clean_email:
                    raise ValueError(f"Email '{clean_email}' is already registered")

            now = datetime.now(timezone.utc).isoformat()
            user_id = str(uuid.uuid4())
            new_user_dict = {
                "id": user_id,
                "email": clean_email,
                "full_name": full_name.strip(),
                "role": role.value,
                "hashed_password": hashed_password,
                "created_at": now,
            }
            data.setdefault("users", []).append(new_user_dict)
            self._write_file_unlocked(data)
            logger.info(f"New user registered: email='{clean_email}', role='{role.value}', id='{user_id}'")
            return UserInDB(**new_user_dict)

    # ==========================================
    # Quiz Operations (Student & Admin)
    # ==========================================

    def list_published_quizzes_for_students(self) -> List[QuizStudentListItem]:
        """Returns all published quizzes with question counts and points."""
        with self._lock:
            data = self._read_file_unlocked()
            results = []
            for q in data.get("quizzes", []):
                if q.get("is_published", False):
                    questions = q.get("questions", [])
                    total_points = sum(item.get("points", 1) for item in questions)
                    results.append(
                        QuizStudentListItem(
                            id=q["id"],
                            title=q["title"],
                            description=q.get("description", ""),
                            duration_minutes=q.get("duration_minutes", 10),
                            passing_percentage=q.get("passing_percentage", 60),
                            is_published=True,
                            question_count=len(questions),
                            total_points=total_points,
                            created_at=q.get("created_at", "")
                        )
                    )
            return results

    def get_quiz_for_student(self, quiz_id: str) -> Optional[QuizStudentDetail]:
        """
        Returns quiz detail for taking a quiz.
        CRITICAL: Answers and explanations are STRIPPED so students cannot inspect them.
        """
        with self._lock:
            data = self._read_file_unlocked()
            for q in data.get("quizzes", []):
                if q["id"] == quiz_id:
                    if not q.get("is_published", False):
                        return None  # Unpublished quizzes are hidden from students
                    questions = []
                    total_points = 0
                    for item in q.get("questions", []):
                        points = item.get("points", 1)
                        total_points += points
                        questions.append(
                            QuestionStudent(
                                id=item["id"],
                                text=item["text"],
                                options=item["options"],
                                points=points
                            )
                        )
                    return QuizStudentDetail(
                        id=q["id"],
                        title=q["title"],
                        description=q.get("description", ""),
                        duration_minutes=q.get("duration_minutes", 10),
                        passing_percentage=q.get("passing_percentage", 60),
                        is_published=True,
                        question_count=len(questions),
                        total_points=total_points,
                        questions=questions
                    )
            return None

    def list_all_quizzes_for_admin(self) -> List[QuizAdminDetail]:
        """Returns all quizzes (published and drafts) with questions and answers for admin management."""
        with self._lock:
            data = self._read_file_unlocked()
            results = []
            for q in data.get("quizzes", []):
                questions = []
                total_points = 0
                for item in q.get("questions", []):
                    points = item.get("points", 1)
                    total_points += points
                    questions.append(
                        QuestionAdmin(
                            id=item["id"],
                            text=item["text"],
                            options=item["options"],
                            correct_index=item["correct_index"],
                            points=points,
                            explanation=item.get("explanation", "")
                        )
                    )
                results.append(
                    QuizAdminDetail(
                        id=q["id"],
                        title=q["title"],
                        description=q.get("description", ""),
                        duration_minutes=q.get("duration_minutes", 10),
                        passing_percentage=q.get("passing_percentage", 60),
                        is_published=q.get("is_published", False),
                        question_count=len(questions),
                        total_points=total_points,
                        questions=questions,
                        created_at=q.get("created_at", ""),
                        updated_at=q.get("updated_at", "")
                    )
                )
            return results

    def get_quiz_by_id_raw(self, quiz_id: str) -> Optional[Dict[str, Any]]:
        """Returns internal quiz dictionary with full answer keys (for scoring / admin)."""
        with self._lock:
            data = self._read_file_unlocked()
            for q in data.get("quizzes", []):
                if q["id"] == quiz_id:
                    return q
            return None

    def get_quiz_for_admin(self, quiz_id: str) -> Optional[QuizAdminDetail]:
        with self._lock:
            q = self.get_quiz_by_id_raw(quiz_id)
            if not q:
                return None
            questions = [
                QuestionAdmin(
                    id=item["id"],
                    text=item["text"],
                    options=item["options"],
                    correct_index=item["correct_index"],
                    points=item.get("points", 1),
                    explanation=item.get("explanation", "")
                )
                for item in q.get("questions", [])
            ]
            total_points = sum(item.points for item in questions)
            return QuizAdminDetail(
                id=q["id"],
                title=q["title"],
                description=q.get("description", ""),
                duration_minutes=q.get("duration_minutes", 10),
                passing_percentage=q.get("passing_percentage", 60),
                is_published=q.get("is_published", False),
                question_count=len(questions),
                total_points=total_points,
                questions=questions,
                created_at=q.get("created_at", ""),
                updated_at=q.get("updated_at", "")
            )

    def create_quiz(self, title: str, description: str, duration_minutes: int, passing_percentage: int, is_published: bool, questions_data: List[Dict[str, Any]]) -> QuizAdminDetail:
        with self._lock:
            data = self._read_file_unlocked()
            now = datetime.now(timezone.utc).isoformat()
            quiz_id = str(uuid.uuid4())

            formatted_questions = []
            for q in questions_data:
                formatted_questions.append({
                    "id": str(uuid.uuid4()),
                    "text": q["text"].strip(),
                    "options": [opt.strip() for opt in q["options"]],
                    "correct_index": q["correct_index"],
                    "points": q.get("points", 1),
                    "explanation": q.get("explanation", "").strip()
                })

            new_quiz = {
                "id": quiz_id,
                "title": title.strip(),
                "description": description.strip(),
                "duration_minutes": duration_minutes,
                "passing_percentage": passing_percentage,
                "is_published": is_published,
                "created_at": now,
                "updated_at": now,
                "questions": formatted_questions
            }
            data.setdefault("quizzes", []).append(new_quiz)
            self._write_file_unlocked(data)
            logger.info(f"Quiz created: id='{quiz_id}', title='{title}', questions_count={len(formatted_questions)}")
            return self.get_quiz_for_admin(quiz_id)

    def update_quiz(self, quiz_id: str, updates: Dict[str, Any]) -> Optional[QuizAdminDetail]:
        with self._lock:
            data = self._read_file_unlocked()
            target_quiz = None
            for q in data.get("quizzes", []):
                if q["id"] == quiz_id:
                    target_quiz = q
                    break
            if not target_quiz:
                return None

            for key in ["title", "description", "duration_minutes", "passing_percentage", "is_published"]:
                if key in updates and updates[key] is not None:
                    target_quiz[key] = updates[key]

            target_quiz["updated_at"] = datetime.now(timezone.utc).isoformat()
            self._write_file_unlocked(data)
            logger.info(f"Quiz updated: id='{quiz_id}'")
            return self.get_quiz_for_admin(quiz_id)

    def delete_quiz(self, quiz_id: str) -> bool:
        with self._lock:
            data = self._read_file_unlocked()
            quizzes = data.get("quizzes", [])
            initial_count = len(quizzes)
            data["quizzes"] = [q for q in quizzes if q["id"] != quiz_id]
            if len(data["quizzes"]) < initial_count:
                self._write_file_unlocked(data)
                logger.info(f"Quiz deleted: id='{quiz_id}'")
                return True
            return False

    def add_question_to_quiz(self, quiz_id: str, question_data: Dict[str, Any]) -> Optional[QuestionAdmin]:
        with self._lock:
            data = self._read_file_unlocked()
            for q in data.get("quizzes", []):
                if q["id"] == quiz_id:
                    q_id = str(uuid.uuid4())
                    new_q = {
                        "id": q_id,
                        "text": question_data["text"].strip(),
                        "options": [opt.strip() for opt in question_data["options"]],
                        "correct_index": question_data["correct_index"],
                        "points": question_data.get("points", 1),
                        "explanation": question_data.get("explanation", "").strip()
                    }
                    q.setdefault("questions", []).append(new_q)
                    q["updated_at"] = datetime.now(timezone.utc).isoformat()
                    self._write_file_unlocked(data)
                    logger.info(f"Question '{q_id}' added to quiz '{quiz_id}'")
                    return QuestionAdmin(**new_q)
            return None

    def update_question_in_quiz(self, quiz_id: str, question_id: str, question_data: Dict[str, Any]) -> Optional[QuestionAdmin]:
        with self._lock:
            data = self._read_file_unlocked()
            for q in data.get("quizzes", []):
                if q["id"] == quiz_id:
                    for item in q.get("questions", []):
                        if item["id"] == question_id:
                            item["text"] = question_data["text"].strip()
                            item["options"] = [opt.strip() for opt in question_data["options"]]
                            item["correct_index"] = question_data["correct_index"]
                            item["points"] = question_data.get("points", 1)
                            item["explanation"] = question_data.get("explanation", "").strip()
                            q["updated_at"] = datetime.now(timezone.utc).isoformat()
                            self._write_file_unlocked(data)
                            logger.info(f"Question '{question_id}' updated in quiz '{quiz_id}'")
                            return QuestionAdmin(**item)
            return None

    def delete_question_from_quiz(self, quiz_id: str, question_id: str) -> bool:
        with self._lock:
            data = self._read_file_unlocked()
            for q in data.get("quizzes", []):
                if q["id"] == quiz_id:
                    questions = q.get("questions", [])
                    initial_len = len(questions)
                    q["questions"] = [item for item in questions if item["id"] != question_id]
                    if len(q["questions"]) < initial_len:
                        q["updated_at"] = datetime.now(timezone.utc).isoformat()
                        self._write_file_unlocked(data)
                        logger.info(f"Question '{question_id}' deleted from quiz '{quiz_id}'")
                        return True
            return False

    # ==========================================
    # Attempt & Submission Operations
    # ==========================================

    def record_attempt(self, attempt_result: AttemptResult) -> AttemptResult:
        with self._lock:
            data = self._read_file_unlocked()
            data.setdefault("attempts", []).append(attempt_result.model_dump())
            self._write_file_unlocked(data)
            logger.info(
                f"Attempt recorded: id='{attempt_result.id}', user='{attempt_result.user_name}', "
                f"quiz='{attempt_result.quiz_title}', score={attempt_result.score}/{attempt_result.total_points} "
                f"({attempt_result.percentage}%), passed={attempt_result.passed}"
            )
            return attempt_result

    def get_attempt_by_id(self, attempt_id: str) -> Optional[AttemptResult]:
        with self._lock:
            data = self._read_file_unlocked()
            for att in data.get("attempts", []):
                if att["id"] == attempt_id:
                    return AttemptResult(**att)
            return None

    def list_attempts_for_user(self, user_id: str) -> List[AttemptSummary]:
        with self._lock:
            data = self._read_file_unlocked()
            user_attempts = []
            for att in data.get("attempts", []):
                if att["user_id"] == user_id:
                    user_attempts.append(
                        AttemptSummary(
                            id=att["id"],
                            quiz_id=att["quiz_id"],
                            quiz_title=att["quiz_title"],
                            score=att["score"],
                            total_points=att["total_points"],
                            percentage=att["percentage"],
                            passed=att["passed"],
                            completed_at=att["completed_at"]
                        )
                    )
            # Sort newest first
            user_attempts.sort(key=lambda a: a.completed_at, reverse=True)
            return user_attempts

    # ==========================================
    # Admin Dashboard Statistics
    # ==========================================

    def get_admin_dashboard_stats(self) -> AdminDashboardStats:
        with self._lock:
            data = self._read_file_unlocked()
            quizzes = data.get("quizzes", [])
            published = sum(1 for q in quizzes if q.get("is_published", False))
            total_questions = sum(len(q.get("questions", [])) for q in quizzes)

            students = [u for u in data.get("users", []) if u.get("role") == Role.STUDENT.value]
            attempts = data.get("attempts", [])

            if attempts:
                avg_score = sum(att.get("percentage", 0.0) for att in attempts) / len(attempts)
            else:
                avg_score = 0.0

            return AdminDashboardStats(
                total_quizzes=len(quizzes),
                published_quizzes=published,
                total_questions=total_questions,
                total_students=len(students),
                total_attempts=len(attempts),
                average_score_percentage=round(avg_score, 1)
            )


storage_service = StorageService()
