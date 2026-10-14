import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import get_current_user
from app.logging_config import logger
from app.models import (
    AttemptResult,
    AttemptSubmitRequest,
    AttemptSummary,
    QuestionReviewItem,
    QuizStudentDetail,
    QuizStudentListItem,
    Role,
    UserInDB,
)
from app.storage import storage_service

router = APIRouter(prefix="/api/quizzes", tags=["Student Quizzes"])


@router.get("", response_model=List[QuizStudentListItem])
def list_quizzes(current_user: UserInDB = Depends(get_current_user)):
    """
    List all published quizzes available for students.
    """
    return storage_service.list_published_quizzes_for_students()


@router.get("/{quiz_id}", response_model=QuizStudentDetail)
def get_quiz_for_taking(quiz_id: str, current_user: UserInDB = Depends(get_current_user)):
    """
    Returns quiz details and questions.
    Security: Correct answer indices and explanations are completely omitted here.
    """
    quiz = storage_service.get_quiz_for_student(quiz_id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found or is currently unpublished.",
        )
    return quiz


@router.post("/{quiz_id}/submit", response_model=AttemptResult)
def submit_quiz_attempt(
    quiz_id: str,
    submission: AttemptSubmitRequest,
    current_user: UserInDB = Depends(get_current_user),
):
    """
    Submits student answers for a quiz.
    Evaluates scoring entirely on the backend to prevent cheating.
    Generates and records attempt results, passing state, and question reviews.
    """
    raw_quiz = storage_service.get_quiz_by_id_raw(quiz_id)
    if not raw_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )

    questions = raw_quiz.get("questions", [])
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz has no questions configured.",
        )

    # Build question lookup map
    q_map = {q["id"]: q for q in questions}

    # Map student responses by question_id
    answers_map = {ans.question_id: ans.selected_index for ans in submission.answers}

    reviews: List[QuestionReviewItem] = []
    score = 0
    total_points = 0
    correct_count = 0
    incorrect_count = 0
    unanswered_count = 0

    for q in questions:
        q_id = q["id"]
        points = q.get("points", 1)
        total_points += points
        correct_index = q["correct_index"]
        selected_index = answers_map.get(q_id)

        if selected_index is None:
            unanswered_count += 1
            is_correct = False
            earned = 0
        elif selected_index == correct_index:
            correct_count += 1
            is_correct = True
            earned = points
            score += points
        else:
            incorrect_count += 1
            is_correct = False
            earned = 0

        reviews.append(
            QuestionReviewItem(
                question_id=q_id,
                text=q["text"],
                options=q["options"],
                selected_index=selected_index,
                correct_index=correct_index,
                is_correct=is_correct,
                points_earned=earned,
                points_possible=points,
                explanation=q.get("explanation", "")
            )
        )

    percentage = round((score / total_points * 100) if total_points > 0 else 0.0, 1)
    passing_pct = raw_quiz.get("passing_percentage", 60)
    passed = percentage >= passing_pct

    now = datetime.now(timezone.utc).isoformat()
    attempt = AttemptResult(
        id=str(uuid.uuid4()),
        quiz_id=raw_quiz["id"],
        quiz_title=raw_quiz["title"],
        user_id=current_user.id,
        user_name=current_user.full_name,
        score=score,
        total_points=total_points,
        percentage=percentage,
        passed=passed,
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        unanswered_count=unanswered_count,
        started_at=now,
        completed_at=now,
        reviews=reviews,
    )

    storage_service.record_attempt(attempt)
    return attempt


# ==========================================
# Attempts Router (Mounted under /api/attempts)
# ==========================================
attempts_router = APIRouter(prefix="/api/attempts", tags=["Quiz Attempts"])


@attempts_router.get("/my", response_model=List[AttemptSummary])
def get_my_attempts(current_user: UserInDB = Depends(get_current_user)):
    """
    Returns attempt history for the logged-in student.
    """
    return storage_service.list_attempts_for_user(current_user.id)


@attempts_router.get("/{attempt_id}", response_model=AttemptResult)
def get_attempt_detail(attempt_id: str, current_user: UserInDB = Depends(get_current_user)):
    """
    Returns full attempt results including question-by-question review with explanations.
    Security: Students can only view their own attempts; Admins can view any attempt.
    """
    attempt = storage_service.get_attempt_by_id(attempt_id)
    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attempt result not found.",
        )

    if current_user.role != Role.ADMIN and attempt.user_id != current_user.id:
        logger.warning(
            f"Unauthorized attempt review access: user='{current_user.id}' tried to access attempt='{attempt_id}'"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to view this attempt result.",
        )

    return attempt
