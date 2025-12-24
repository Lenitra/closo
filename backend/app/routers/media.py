from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.entities.media import Media, MediaRead
from app.repositories.media_repository import MediaRepository
from app.utils.core.database import get_db
from app.utils.auth.roles import require_role
from app.utils.slave_manager.orchestrator import fetch_file_from_slave
import httpx


router = APIRouter(prefix="/media", tags=["Media"])
repo = MediaRepository()


@router.get(
    "/",
    response_model=list[Media],
    description="Route disponible pour les rôles: ['any']",
)
def get_all_medias(
    db: Session = Depends(get_db),
    current_user_id=Depends(require_role(["any"])),
):
    return repo.list(db)


@router.get(
    "/group/{group_id}",
    response_model=list[MediaRead],
    description="Récupère tous les médias d'un groupe avec les informations du post, triés par date décroissante.",
)
def get_medias_by_group_id(
    group_id: int,
    db: Session = Depends(get_db),
    current_user_id=Depends(require_role(["any"])),
):
    """
    Récupère tous les médias d'un groupe avec les informations complètes du post.
    Les médias sont triés par date de création du post (plus récents en premier).
    """
    from app.entities.post import Post

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
    )

    medias = db.exec(statement).all()
    return medias


@router.get(
    "/proxy/{file_id}",
    description="Proxy pour récupérer les fichiers depuis les slaves de stockage.",
)
async def proxy_file(file_id: str):
    """
    Route proxy pour servir les fichiers depuis les slaves de stockage.
    Le frontend appelle cette route, et le backend fetch le fichier depuis le slave.
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
