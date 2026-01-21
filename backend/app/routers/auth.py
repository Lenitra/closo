from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlmodel import Session
from app.utils.auth.auth import verify_password, create_access_token, get_password_hash
from app.utils.core.database import get_db
from app.repositories.user_repository import UserRepository
from app.entities.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])
user_repo = UserRepository()


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = user_repo.get_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Inactive user"
        )

    access_token = create_access_token(user_id=user.id, role_id=user.role_id)
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = user_repo.get_by_email(db, data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        username=data.username,
        role_id=2,
        is_active=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )

    created_user = user_repo.save(db, user)
    access_token = create_access_token(
        user_id=created_user.id, role_id=created_user.role_id
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": created_user.id,
            "email": created_user.email,
            "username": created_user.username,
        },
    }
