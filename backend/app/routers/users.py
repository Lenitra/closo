from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlmodel import Session
from pydantic import BaseModel
from app.entities.user import User, UserRead
from app.repositories.user_repository import UserRepository
from app.repositories.post_repository import PostRepository
from app.utils.auth.roles import get_current_user
from app.utils.auth.auth import get_password_hash, verify_password
from app.utils.core.database import get_db
from app.utils.slave_manager.orchestrator import save_media


class UpdateUsernameRequest(BaseModel):
    username: str


class UpdatePasswordRequest(BaseModel):
    current_password: str
    new_password: str


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


@router.post("/me/upload-avatar", response_model=UserRead)
async def upload_avatar_for_current_user(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload avatar for current user"""
    # Verify file is an image
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Upload file to slave storage
    try:
        avatar_url = save_media(file.file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload avatar: {str(e)}")

    # Update user avatar URL
    updated_user = user_repo.update_avatar(db, current_user.id, avatar_url)
    return updated_user


@router.put("/me/username", response_model=UserRead)
def update_username(
    data: UpdateUsernameRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's username"""
    if not data.username or len(data.username.strip()) < 2:
        raise HTTPException(status_code=400, detail="Le nom d'utilisateur doit contenir au moins 2 caractères")

    updated_user = user_repo.update_username(db, current_user.id, data.username.strip())
    return updated_user


@router.put("/me/password", response_model=UserRead)
def update_password(
    data: UpdatePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update current user's password"""
    # Verify current password
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")

    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit contenir au moins 6 caractères")

    hashed_password = get_password_hash(data.new_password)
    updated_user = user_repo.update_password(db, current_user.id, hashed_password)
    return updated_user