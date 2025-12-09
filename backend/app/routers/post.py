from fastapi import Body, APIRouter, HTTPException, Depends
from app.entities.post import Post
from sqlalchemy.orm import Session
from app.repositories.post_repository import PostRepository
from app.utils.core.database import get_db
from app.utils.auth.roles import require_role


router = APIRouter(prefix="/posts", tags=["Post"])
repo = PostRepository()


@router.get(
    "/",
    response_model=list[Post],
    description="Route disponible pour les rôles: ['User']",
)
def get_all_posts(
    db: Session = Depends(get_db), current_user=Depends(require_role(["User"]))
):
    return repo.list(db)


@router.get(
    "/{id}",
    response_model=Post,
    description="Route disponible pour les rôles: ['User']",
)
def get_post_by_id(
    id: int, db: Session = Depends(get_db), current_user=Depends(require_role(["User"]))
):
    obj = repo.get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Post not found")
    return obj


@router.post(
    "/",
    response_model=Post,
    status_code=201,
    description="Route disponible pour les rôles: ['User']",
)
def create_post(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["User"])),
):
    return repo.save(db, payload)


@router.put(
    "/{id}",
    response_model=Post,
    description="Route disponible pour les rôles: ['User']",
)
def update_post(
    id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["User"])),
):
    obj = repo.save(db, id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="Post not found")
    return obj


@router.delete(
    "/{id}", status_code=204, description="Route disponible pour les rôles: ['User']"
)
def delete_post(
    id: int, db: Session = Depends(get_db), current_user=Depends(require_role(["User"]))
):
    ok = repo.delete(db, id)
    if not ok:
        raise HTTPException(status_code=404, detail="Post not found")
