from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.entities.user import User, UserRead
from app.repositories.user_repository import UserRepository
from app.repositories.post_repository import PostRepository
from app.utils.auth.roles import get_current_user
from app.utils.core.database import get_db


router = APIRouter(prefix="/users", tags=["Users"])
user_repo = UserRepository()
post_repo = PostRepository()


@router.get("/me", response_model=UserRead)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


@router.get("/me/posts/count", response_model=dict)
def get_current_user_posts_count(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """Get current user posts count"""
    count = post_repo.get_nb_posts_by_user_id(db, current_user.id)
    return {"count": count}
