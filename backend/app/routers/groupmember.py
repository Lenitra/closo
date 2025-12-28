from fastapi import Body, APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.entities.groupmember import GroupMember, GroupMemberRead
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
    "/{id}", status_code=204, description="Route disponible pour les rôles: ['user']"
)
def delete_groupmember(
    id: int, db: Session = Depends(get_db), current_user=Depends(require_role(["user"]))
):
    ok = repo.delete(db, id)
    if not ok:
        raise HTTPException(status_code=404, detail="GroupMember not found")


@router.get(
    "/group/{group_id}",
    response_model=list[GroupMemberRead],
    description="Récupère tous les membres d'un groupe avec les informations utilisateur.",
)
def get_members_by_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["any"])),
):
    """
    Récupère tous les membres d'un groupe avec eager loading des relations user.
    """
    statement = (
        select(GroupMember)
        .where(GroupMember.group_id == group_id)
        .options(selectinload(GroupMember.user))
        .order_by(GroupMember.role.desc(), GroupMember.id.asc())
    )
    members = db.exec(statement).all()
    return members
