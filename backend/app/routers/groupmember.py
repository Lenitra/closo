from fastapi import Body, APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.entities.groupmember import GroupMember
from app.repositories.groupmember_repository import GroupMemberRepository
from app.utils.core.database import get_db
from app.utils.auth.roles import require_role


router = APIRouter(prefix="/groupmembers", tags=["GroupMember"])
repo = GroupMemberRepository()


@router.get(
    "/",
    response_model=list[GroupMember],
    description="Route disponible pour les rôles: ['admin']",
)
def get_all_groupmembers(
    db: Session = Depends(get_db), current_user=Depends(require_role(["User"]))
):
    return repo.list(db)


@router.get(
    "/{id}",
    response_model=GroupMember,
    description="Route disponible pour les rôles: ['admin']",
)
def get_groupmember_by_id(
    id: int, db: Session = Depends(get_db), current_user=Depends(require_role(["User"]))
):
    obj = repo.get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="GroupMember not found")
    return obj


@router.post(
    "/",
    response_model=GroupMember,
    status_code=201,
    description="Route disponible pour les rôles: ['admin']",
)
def create_groupmember(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["User"])),
):
    return repo.save(db, payload)


@router.put(
    "/{id}",
    response_model=GroupMember,
    description="Route disponible pour les rôles: ['admin']",
)
def update_groupmember(
    id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["User"])),
):
    obj = repo.save(db, id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="GroupMember not found")
    return obj


@router.delete(
    "/{id}", status_code=204, description="Route disponible pour les rôles: ['admin']"
)
def delete_groupmember(
    id: int, db: Session = Depends(get_db), current_user=Depends(require_role(["User"]))
):
    ok = repo.delete(db, id)
    if not ok:
        raise HTTPException(status_code=404, detail="GroupMember not found")
