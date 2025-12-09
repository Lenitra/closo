from fastapi import Body, APIRouter, HTTPException, Depends
from app.entities.group import Group
from sqlalchemy.orm import Session
from app.repositories.group_repository import GroupRepository
from app.utils.core.database import get_db
from app.utils.auth.roles import require_role


router = APIRouter(prefix="/groups", tags=["Group"])
repo = GroupRepository()


@router.get(
    "/",
    response_model=list[Group],
    description="Route disponible pour les rôles: ['User']",
)
def get_all_groups(
    db: Session = Depends(get_db), current_user=Depends(require_role(["User"]))
):
    return repo.list(db)


@router.get(
    "/{id}",
    response_model=Group,
    description="Route disponible pour les rôles: ['User']",
)
def get_group_by_id(
    id: int, db: Session = Depends(get_db), current_user=Depends(require_role(["User"]))
):
    obj = repo.get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="Group not found")
    return obj


@router.post(
    "/",
    response_model=Group,
    status_code=201,
    description="Route disponible pour les rôles: ['User']",
)
def create_group(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["User"])),
):
    return repo.save(db, payload)


@router.put(
    "/{id}",
    response_model=Group,
    description="Route disponible pour les rôles: ['User']",
)
def update_group(
    id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["User"])),
):
    obj = repo.save(db, id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="Group not found")
    return obj


@router.delete(
    "/{id}", status_code=204, description="Route disponible pour les rôles: ['User']"
)
def delete_group(
    id: int, db: Session = Depends(get_db), current_user=Depends(require_role(["User"]))
):
    ok = repo.delete(db, id)
    if not ok:
        raise HTTPException(status_code=404, detail="Group not found")
