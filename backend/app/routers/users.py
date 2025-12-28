from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlmodel import Session
from app.entities.user import User, UserRead
from app.repositories.user_repository import UserRepository
from app.repositories.post_repository import PostRepository
from app.utils.auth.roles import get_current_user
from app.utils.core.database import get_db
from app.utils.slave_manager.orchestrator import save_media


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