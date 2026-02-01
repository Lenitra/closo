from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.entities.media import Media, MediaRead
from app.repositories.media_repository import MediaRepository
from app.utils.core.database import get_db
from app.utils.auth.roles import get_current_user
from app.utils.slave_manager.orchestrator import fetch_file_from_slave
from app.entities.user import User
from app.entities.groupmember import GroupMember
from app.entities.post import Post
import httpx


router = APIRouter(prefix="/media", tags=["Media"])
repo = MediaRepository()


@router.get(
    "/",
    response_model=list[Media],
    description="Liste tous les médias. Réservé aux administrateurs.",
)
def get_all_medias(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux administrateurs."
        )
    return repo.list(db)


@router.get(
    "/group/{group_id}",
    response_model=list[MediaRead],
    description="Récupère les médias d'un groupe avec pagination, triés par date décroissante.",
)
def get_medias_by_group_id(
    group_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Récupère les médias d'un groupe avec les informations complètes du post.
    Les médias sont triés par date de création du post (plus récents en premier).
    L'utilisateur doit être membre du groupe.

    Paramètres:
    - skip: nombre de médias à ignorer (default: 0)
    - limit: nombre maximum de médias à retourner (default: 50, max: 100)
    """
    # Vérifier que l'utilisateur est membre du groupe
    member = db.exec(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id
        )
    ).first()
    if not member and current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Vous devez être membre du groupe pour accéder à ses médias."
        )

    # Limiter le limit à 100 pour éviter les abus
    if limit > 100:
        limit = 100

    # Récupérer les médias avec eager loading des relations
    statement = (
        select(Media)
        .join(Post, Media.post_id == Post.id)
        .where(Post.group_id == group_id)
        .order_by(Post.created_at.desc(), Media.order.asc())
        .options(
            selectinload(Media.post).selectinload(Post.group_member),
            selectinload(Media.post).selectinload(Post.group),
        )
        .offset(skip)
        .limit(limit)
    )

    medias = db.exec(statement).all()
    return medias


@router.get(
    "/proxy/{file_id}",
    description="Proxy pour récupérer les fichiers depuis les slaves de stockage. Accès public pour permettre l'affichage des images.",
)
async def proxy_file(
    file_id: str,
):
    """
    Route proxy pour servir les fichiers depuis les slaves de stockage.
    Le frontend appelle cette route, et le backend fetch le fichier depuis le slave.

    Note: Cette route est publique pour permettre l'affichage des images via <img> tags.
    Les permissions d'accès aux médias sont gérées au niveau des routes qui retournent les URLs.
    """
    try:
        response = fetch_file_from_slave(file_id)

        # Déterminer le content-type depuis la réponse du slave
        content_type = response.headers.get("content-type", "application/octet-stream")

        return Response(
            content=response.content,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=86400",
            },
        )
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail="File not found or access denied")
    except httpx.RequestError:
        raise HTTPException(status_code=502, detail="Unable to reach storage server")
