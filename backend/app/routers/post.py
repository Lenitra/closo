from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlmodel import Session
from app.entities.post import Post
from app.entities.media import Media
from app.repositories.post_repository import PostRepository
from app.repositories.media_repository import MediaRepository
from app.repositories.groupmember_repository import GroupMemberRepository
from app.utils.core.database import get_db
from app.utils.auth.roles import require_role
from typing import Optional
from app.utils.slave_manager import orchestrator


router = APIRouter(prefix="/posts", tags=["Post"])
repo = PostRepository()
media_repo = MediaRepository()
groupmember_repo = GroupMemberRepository()


@router.get(
    "/",
    response_model=list[Post],
    description="Route disponible pour les rôles: ['moderator']",
)
def get_all_posts(
    group_id: int,
    db: Session = Depends(get_db),
    current_user_id=Depends(require_role(["moderator"])),
):
    return repo.list(db)


# Créer un post avec des médias attachés
@router.post(
    "/",
    response_model=Post,
    description="Route disponible pour les rôles: ['any']",
)
async def create_post(
    group_id: int = Form(...),
    caption: Optional[str] = Form(None),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(require_role(["any"])),
):
    # Get the group member for this user and group
    group_member = groupmember_repo.get_by_user_and_group(
        db, user_id=current_user_id, group_id=group_id
    )
    if not group_member:
        raise HTTPException(
            status_code=403,
            detail=f"User {current_user_id} is not a member of group {group_id}",
        )

    # Create and persist the post
    new_post = Post(
        group_member_id=group_member.id,
        group_id=group_id,
        caption=caption,
        created_at=datetime.now(timezone.utc),
    )

    created_post = repo.save(db, new_post)
    print(f"✅ Post created with ID: {created_post.id}")

    # Now create media entries linked to the post
    for idx, file in enumerate(files):
        url = orchestrator.save_media(file.file)
        print(f"  📷 Media {idx + 1} uploaded to slave, URL: {url}")
        new_media = Media(
            post_id=created_post.id,
            media_url=url,
            order=idx,
        )
        media_repo.save(db, new_media)
        print(f"  📷 Media {idx + 1} saved: {url}")

    return created_post
