from fastapi import APIRouter, Depends
from app.entities.user import User, UserRead
from app.repositories.user_repository import UserRepository
from app.utils.auth.roles import get_current_user


router = APIRouter(prefix="/users", tags=["Users"])
user_repo = UserRepository()


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user
