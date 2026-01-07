from fastapi import Body, APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.entities.groupmember import GroupMember, GroupMemberRead
from app.repositories.groupmember_repository import GroupMemberRepository
from app.utils.core.database import get_db
from app.utils.auth.roles import require_role, get_current_user
from app.entities.user import User


class UpdateRoleRequest(BaseModel):
    role: int  # 1: member, 2: admin


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


@router.put(
    "/{id}/role",
    response_model=GroupMemberRead,
    description="Modifier le rôle d'un membre. Seul le créateur du groupe peut effectuer cette action.",
)
def update_member_role(
    id: int,
    data: UpdateRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Change le rôle d'un membre du groupe.
    - Seul le créateur (role=3) peut promouvoir/rétrograder des membres.
    - On ne peut pas modifier le rôle du créateur.
    - Les rôles valides sont: 1 (membre) et 2 (admin).
    """
    # Vérifier que le rôle demandé est valide (1 ou 2 uniquement)
    if data.role not in [1, 2]:
        raise HTTPException(
            status_code=400,
            detail="Rôle invalide. Les rôles valides sont: 1 (membre) ou 2 (admin)."
        )

    # Récupérer le membre à modifier
    target_member = repo.get_by_id(db, id)
    if not target_member:
        raise HTTPException(status_code=404, detail="Membre non trouvé")

    # Vérifier qu'on ne modifie pas le créateur
    if target_member.role == 3:
        raise HTTPException(
            status_code=403,
            detail="Impossible de modifier le rôle du créateur du groupe."
        )

    # Vérifier que l'utilisateur actuel est le créateur du groupe
    statement = select(GroupMember).where(
        GroupMember.group_id == target_member.group_id,
        GroupMember.user_id == current_user.id
    )
    current_member = db.exec(statement).first()

    if not current_member or current_member.role != 3:
        raise HTTPException(
            status_code=403,
            detail="Seul le créateur du groupe peut modifier les rôles des membres."
        )

    # Mettre à jour le rôle
    target_member.role = data.role
    db.add(target_member)
    db.commit()
    db.refresh(target_member)

    # Recharger avec les relations pour le response_model
    statement = (
        select(GroupMember)
        .where(GroupMember.id == target_member.id)
        .options(selectinload(GroupMember.user))
    )
    updated_member = db.exec(statement).first()

    return updated_member


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
