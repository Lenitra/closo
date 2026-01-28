from datetime import datetime, timezone
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from sqlmodel import Session, select
from app.entities.post import Post
from app.entities.media import Media
from app.repositories.post_repository import PostRepository
from app.repositories.media_repository import MediaRepository
from app.repositories.groupmember_repository import GroupMemberRepository
from app.utils.core.database import get_db
from app.utils.auth.roles import require_role
from typing import Optional
from app.utils.slave_manager import orchestrator
from app.utils.file_validation import validate_media_files


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
    description="Crée un post avec des médias. Maximum 10 fichiers de 2 MB chacun.",
)
async def create_post(
    group_id: int = Form(...),
    caption: Optional[str] = Form(None),
    files: list[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(require_role(["any"])),
):
    """
    Crée un post avec des médias.

    Validations:
    - Taille maximale par fichier: 2 MB
    - Maximum 10 fichiers par post
    - Types autorisés: JPEG, PNG, GIF, WebP
    - Vérification des magic bytes (type MIME réel)
    """
    # Valider les fichiers (taille, type, nombre)
    validate_media_files(files, max_size_per_file=2 * 1024 * 1024, max_files=10)

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


@router.delete(
    "/{post_id}",
    description="Supprime un post et tous ses médias associés. L'auteur, les admins ou le créateur du groupe peuvent supprimer.",
)
def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(require_role(["any"])),
):
    """
    Supprime un post et tous les médias associés.
    Les fichiers sont également supprimés du slave storage.

    Permissions:
    - L'auteur du post peut supprimer son propre post
    - Les admins (role >= 2) du groupe peuvent supprimer n'importe quel post
    - Le créateur (role == 3) du groupe peut supprimer n'importe quel post
    """
    from app.entities.groupmember import GroupMember

    # Récupérer le post
    post = repo.get_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Vérifier les permissions
    # 1. Vérifier si l'utilisateur est l'auteur du post
    is_author = False
    if post.group_member_id:
        post_author = groupmember_repo.get_by_id(db, post.group_member_id)
        is_author = post_author and post_author.user_id == current_user_id

    # 2. Vérifier si l'utilisateur est admin/créateur du groupe
    current_member = groupmember_repo.get_by_user_and_group(
        db, user_id=current_user_id, group_id=post.group_id
    )
    is_admin_or_creator = current_member and current_member.role >= 2

    # 3. Vérifier si l'utilisateur est admin global (role_id == 3)
    is_global_admin = False
    if not is_author and not is_admin_or_creator:
        from app.entities.user import User
        current_user = db.get(User, current_user_id)
        is_global_admin = current_user and current_user.role_id == 3

    # L'utilisateur doit être soit l'auteur, soit admin/créateur du groupe, soit admin global
    if not is_author and not is_admin_or_creator and not is_global_admin:
        raise HTTPException(
            status_code=403,
            detail="Vous n'avez pas la permission de supprimer ce post"
        )

    # Récupérer tous les médias associés au post
    medias = db.exec(
        select(Media).where(Media.post_id == post_id)
    ).all()

    # Supprimer chaque fichier du slave storage
    for media in medias:
        # Extraire l'ID du fichier depuis l'URL (format: /media/proxy/{file_id})
        file_id = media.media_url.split("/")[-1]
        try:
            orchestrator.delete_file_from_slave(file_id)
            print(f"  🗑️  Deleted file from slave: {file_id}")
        except Exception as e:
            print(f"  ⚠️  Failed to delete file from slave: {file_id} - {e}")

    # Supprimer les médias de la base de données
    for media in medias:
        media_repo.delete(db, media.id)

    # Supprimer le post
    repo.delete(db, post_id)

    return {"message": "Post and associated media deleted successfully", "post_id": post_id}


@router.patch(
    "/{post_id}",
    response_model=Post,
    description="Modifie la légende d'un post.",
)
def update_post_caption(
    post_id: int,
    caption: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user_id: int = Depends(require_role(["any"])),
):
    """
    Modifie la légende d'un post.
    Seul le créateur du post peut le modifier.
    """
    # Récupérer le post
    post = repo.get_by_id(db, post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Vérifier que l'utilisateur est bien le créateur du post
    group_member = groupmember_repo.get_by_id(db, post.group_member_id)
    if not group_member or group_member.user_id != current_user_id:
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to modify this post"
        )

    # Modifier la légende
    post.caption = caption
    updated_post = repo.save(db, post)

    return updated_post
