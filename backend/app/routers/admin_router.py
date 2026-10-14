from typing import List
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import require_role
from app.logging_config import logger
from app.models import (
    AdminDashboardStats,
    QuestionAdmin,
    QuestionCreate,
    QuizAdminDetail,
    QuizCreateRequest,
    QuizUpdateRequest,
    Role,
    UserInDB,
)
from app.storage import storage_service

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin Management"],
    dependencies=[Depends(require_role(Role.ADMIN))],
)


@router.get("/dashboard", response_model=AdminDashboardStats)
def get_dashboard_stats(current_user: UserInDB = Depends(require_role(Role.ADMIN))):
    """
    Returns aggregated metrics for the admin dashboard.
    """
    return storage_service.get_admin_dashboard_stats()


@router.get("/quizzes", response_model=List[QuizAdminDetail])
def list_quizzes_admin(current_user: UserInDB = Depends(require_role(Role.ADMIN))):
    """
    Lists all quizzes including drafts and complete question keys.
    """
    return storage_service.list_all_quizzes_for_admin()


@router.get("/quizzes/{quiz_id}", response_model=QuizAdminDetail)
def get_quiz_admin(quiz_id: str, current_user: UserInDB = Depends(require_role(Role.ADMIN))):
    """
    Retrieves full details of a specific quiz for editing.
    """
    quiz = storage_service.get_quiz_for_admin(quiz_id)
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )
    return quiz


@router.post("/quizzes", response_model=QuizAdminDetail, status_code=status.HTTP_201_CREATED)
def create_quiz(
    req: QuizCreateRequest,
    current_user: UserInDB = Depends(require_role(Role.ADMIN)),
):
    """
    Creates a new quiz along with optional questions.
    """
    questions_dicts = [q.model_dump() for q in req.questions]
    created = storage_service.create_quiz(
        title=req.title,
        description=req.description,
        duration_minutes=req.duration_minutes,
        passing_percentage=req.passing_percentage,
        is_published=req.is_published,
        questions_data=questions_dicts,
    )
    return created


@router.put("/quizzes/{quiz_id}", response_model=QuizAdminDetail)
def update_quiz(
    quiz_id: str,
    req: QuizUpdateRequest,
    current_user: UserInDB = Depends(require_role(Role.ADMIN)),
):
    """
    Updates quiz settings such as title, duration, passing percentage, and publication status.
    """
    updates = req.model_dump(exclude_unset=True)
    updated = storage_service.update_quiz(quiz_id, updates)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )
    return updated


@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quiz(quiz_id: str, current_user: UserInDB = Depends(require_role(Role.ADMIN))):
    """
    Permanently deletes a quiz.
    """
    deleted = storage_service.delete_quiz(quiz_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )
    return None


# ==========================================
# Question Management
# ==========================================

@router.post("/quizzes/{quiz_id}/questions", response_model=QuestionAdmin, status_code=status.HTTP_201_CREATED)
def add_question(
    quiz_id: str,
    req: QuestionCreate,
    current_user: UserInDB = Depends(require_role(Role.ADMIN)),
):
    """
    Adds a new multiple-choice question to an existing quiz.
    """
    created_q = storage_service.add_question_to_quiz(quiz_id, req.model_dump())
    if not created_q:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found.",
        )
    return created_q


@router.put("/quizzes/{quiz_id}/questions/{question_id}", response_model=QuestionAdmin)
def update_question(
    quiz_id: str,
    question_id: str,
    req: QuestionCreate,
    current_user: UserInDB = Depends(require_role(Role.ADMIN)),
):
    """
    Updates a question in a quiz.
    """
    updated_q = storage_service.update_question_in_quiz(quiz_id, question_id, req.model_dump())
    if not updated_q:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz or Question not found.",
        )
    return updated_q


@router.delete("/quizzes/{quiz_id}/questions/{question_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_question(
    quiz_id: str,
    question_id: str,
    current_user: UserInDB = Depends(require_role(Role.ADMIN)),
):
    """
    Deletes a question from a quiz.
    """
    deleted = storage_service.delete_question_from_quiz(quiz_id, question_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz or Question not found.",
        )
    return None
