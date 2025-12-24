from fastapi import Body, APIRouter, HTTPException, Depends
from sqlmodel import Session
from app.entities.group import Group, GroupRead
from app.repositories.group_repository import GroupRepository
from app.repositories.groupmember_repository import GroupMemberRepository
from app.utils.core.database import get_db
from app.utils.auth.roles import require_role


router = APIRouter(prefix="/groups", tags=["Group"])
repo = GroupRepository()
member_repo = GroupMemberRepository()


@router.get(
    "/",
    response_model=list[GroupRead],
    description="Route permettant à un utilisateur authentifié de récupérer la liste des groupes dont lesquel il fait partie.",
)
def get_all_groups(
    db: Session = Depends(get_db), current_user_id=Depends(require_role(["any"]))
):
    groups = repo.get_groups_by_user_id(db, current_user_id)
    return groups


@router.get(
    "/{id}",
    response_model=GroupRead,
    description="Route permettant de récupérer un groupe par son ID.",
)
def get_group_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user_id=Depends(require_role(["any"])),
):
    group = repo.get_by_id(db, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    return group


@router.post(
    "/",
    response_model=Group,
    status_code=201,
    description="Route disponible pour les rôles: ['user']",
)
def create_group(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user=Depends(require_role(["user"])),
):
    return repo.save(db, payload)


@router.delete(
    "/{id}",
    status_code=204,
    description="Route disponible pour les utilisateurs authentifiés.",
)
def delete_group(
    id: int, db: Session = Depends(get_db), current_user=Depends(require_role(["Any"]))
):
    # TODO: Ajouter une vérification pour s'assurer que l'utilisateur est bien le créateur du groupe
    # ok = repo.delete(db, id)
    ok = False
    if not ok:
        raise HTTPException(status_code=404, detail="Group not found")


@router.get(
    "/{id}/members/count",
    response_model=dict,
    description="Route permettant de récupérer le nombre de membres d'un groupe.",
)
def get_group_members_count(
    id: int,
    db: Session = Depends(get_db),
    _=Depends(require_role(["any"])),
):
    count = member_repo.count_members_in_group(db, id)
    return {"count": count}
