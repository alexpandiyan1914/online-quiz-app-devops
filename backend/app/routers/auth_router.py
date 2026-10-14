from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth import create_access_token, get_current_user, hash_password, verify_password
from app.config import settings
from app.logging_config import logger
from app.models import Role, TokenResponse, UserInDB, UserLoginRequest, UserRegisterRequest, UserResponse
from app.storage import storage_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(req: UserRegisterRequest):
    """
    Registers a new student account.
    Returns a JWT access token and user profile.
    """
    existing_user = storage_service.get_user_by_email(req.email)
    if existing_user:
        logger.warning(f"Registration failed: Email '{req.email}' already exists")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    hashed_pw = hash_password(req.password)
    user = storage_service.create_user(
        email=req.email,
        full_name=req.full_name,
        hashed_password=hashed_pw,
        role=Role.STUDENT
    )

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.value}
    )

    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        created_at=user.created_at
    )
    return TokenResponse(access_token=access_token, user=user_resp)


@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest):
    """
    Authenticates a user with email and password.
    Returns a JWT access token upon successful verification.
    """
    user = storage_service.get_user_by_email(req.email)
    if not user or not verify_password(req.password, user.hashed_password):
        logger.warning(f"Failed login attempt for email: '{req.email}'")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role.value}
    )
    logger.info(f"User logged in successfully: '{user.email}' (role: {user.role})")

    user_resp = UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        created_at=user.created_at
    )
    return TokenResponse(access_token=access_token, user=user_resp)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserInDB = Depends(get_current_user)):
    """
    Returns current authenticated user details.
    """
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        created_at=current_user.created_at
    )
