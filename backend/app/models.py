from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class Role(str, Enum):
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"


# ==========================================
# User Models
# ==========================================

class UserRegisterRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=100)
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=100)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        clean = v.strip().lower()
        if "@" not in clean or "." not in clean.split("@")[-1]:
            raise ValueError("Invalid email format")
        return clean


class UserLoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.strip().lower()


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: Role
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UserInDB(BaseModel):
    id: str
    email: str
    full_name: str
    role: Role
    hashed_password: str
    created_at: str


# ==========================================
# Question Models
# ==========================================

class QuestionBase(BaseModel):
    text: str = Field(..., min_length=3)
    options: List[str] = Field(..., min_length=2)
    points: int = Field(default=1, ge=1)

    @field_validator("options")
    @classmethod
    def validate_options(cls, options: List[str]) -> List[str]:
        if len(options) < 2:
            raise ValueError("Question must have at least 2 options")
        for opt in options:
            if not opt.strip():
                raise ValueError("Options cannot be empty")
        return [opt.strip() for opt in options]


class QuestionCreate(QuestionBase):
    correct_index: int = Field(..., ge=0)
    explanation: str = Field(default="")

    @field_validator("correct_index")
    @classmethod
    def validate_correct_index(cls, idx: int, info) -> int:
        options = info.data.get("options")
        if options and (idx < 0 or idx >= len(options)):
            raise ValueError(f"correct_index must be between 0 and {len(options) - 1}")
        return idx


class QuestionAdmin(QuestionCreate):
    id: str


class QuestionStudent(QuestionBase):
    id: str
    # Note: correct_index and explanation are strictly omitted for students!


# ==========================================
# Quiz Models
# ==========================================

class QuizBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(default="", max_length=2000)
    duration_minutes: int = Field(default=10, ge=1, le=180)
    passing_percentage: int = Field(default=60, ge=0, le=100)
    is_published: bool = False


class QuizCreateRequest(QuizBase):
    questions: List[QuestionCreate] = Field(default_factory=list)


class QuizUpdateRequest(BaseModel):
    title: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)
    duration_minutes: Optional[int] = Field(default=None, ge=1, le=180)
    passing_percentage: Optional[int] = Field(default=None, ge=0, le=100)
    is_published: Optional[bool] = None


class QuizStudentListItem(QuizBase):
    id: str
    question_count: int
    total_points: int
    created_at: str


class QuizStudentDetail(QuizBase):
    id: str
    question_count: int
    total_points: int
    questions: List[QuestionStudent]


class QuizAdminDetail(QuizBase):
    id: str
    question_count: int
    total_points: int
    questions: List[QuestionAdmin]
    created_at: str
    updated_at: str


# ==========================================
# Attempt & Submission Models
# ==========================================

class AttemptAnswerSubmission(BaseModel):
    question_id: str
    selected_index: Optional[int] = None  # None if unanswered


class AttemptSubmitRequest(BaseModel):
    quiz_id: str
    answers: List[AttemptAnswerSubmission]


class QuestionReviewItem(BaseModel):
    question_id: str
    text: str
    options: List[str]
    selected_index: Optional[int]
    correct_index: int
    is_correct: bool
    points_earned: int
    points_possible: int
    explanation: str


class AttemptResult(BaseModel):
    id: str
    quiz_id: str
    quiz_title: str
    user_id: str
    user_name: str
    score: int
    total_points: int
    percentage: float
    passed: bool
    correct_count: int
    incorrect_count: int
    unanswered_count: int
    started_at: str
    completed_at: str
    reviews: List[QuestionReviewItem] = Field(default_factory=list)


class AttemptSummary(BaseModel):
    id: str
    quiz_id: str
    quiz_title: str
    score: int
    total_points: int
    percentage: float
    passed: bool
    completed_at: str


# ==========================================
# Dashboard & Health Models
# ==========================================

class AdminDashboardStats(BaseModel):
    total_quizzes: int
    published_quizzes: int
    total_questions: int
    total_students: int
    total_attempts: int
    average_score_percentage: float


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    storage_healthy: bool
    version: str
    environment: str
    message: str
