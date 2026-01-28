from fastapi import Body, APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from app.entities.groupmember import GroupMember, GroupMemberRead
from app.entities.post import Post
from app.repositories.groupmember_repository import GroupMemberRepository
from app.utils.core.database import get_db
from app.utils.auth.roles import get_current_user
from app.entities.user import User


class UpdateRoleRequest(BaseModel):
    role: int  # 1: member, 2: admin


router = APIRouter(prefix="/groupmembers", tags=["GroupMember"])
repo = GroupMemberRepository()


@router.get(
    "/",
    response_model=list[GroupMember],
    description="Liste tous les membres de tous les groupes. Réservé aux administrateurs.",
)
def get_all_groupmembers(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux administrateurs."
        )
    return repo.list(db)


@router.get(
    "/{id}",
    response_model=GroupMember,
    description="Récupère un membre par son ID. Réservé aux administrateurs.",
)
def get_groupmember_by_id(
    id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    if current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux administrateurs."
        )
    obj = repo.get_by_id(db, id)
    if not obj:
        raise HTTPException(status_code=404, detail="GroupMember not found")
    return obj


@router.post(
    "/",
    response_model=GroupMember,
    status_code=201,
    description="Crée un membre de groupe. Réservé aux administrateurs.",
)
def create_groupmember(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux administrateurs."
        )
    return repo.save(db, payload)


@router.put(
    "/{id}",
    response_model=GroupMember,
    description="Met à jour un membre de groupe. Réservé aux administrateurs.",
)
def update_groupmember(
    id: int,
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux administrateurs."
        )
    obj = repo.save(db, id, payload)
    if not obj:
        raise HTTPException(status_code=404, detail="GroupMember not found")
    return obj


@router.delete(
    "/{id}", status_code=204, description="Route disponible pour les rôles: ['user']"
)
def delete_groupmember(
    id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Récupérer le membre à supprimer
    member = repo.get_by_id(db, id)
    if not member:
        raise HTTPException(status_code=404, detail="GroupMember not found")

    # Le créateur ne peut pas quitter le groupe
    if member.role == 3:
        raise HTTPException(
            status_code=403,
            detail="Le créateur ne peut pas quitter le groupe. Transférez d'abord la propriété ou supprimez le groupe."
        )

    # Vérifier que l'utilisateur est soit le membre lui-même, soit un admin/créateur du groupe
    is_self = member.user_id == current_user.id
    current_member_statement = select(GroupMember).where(
        GroupMember.group_id == member.group_id,
        GroupMember.user_id == current_user.id
    )
    current_member = db.exec(current_member_statement).first()
    is_admin_or_creator = current_member and current_member.role >= 2

    if not is_self and not is_admin_or_creator:
        raise HTTPException(
            status_code=403,
            detail="Vous n'avez pas la permission de retirer ce membre."
        )

    # Dissocier les posts du membre (mettre group_member_id à NULL)
    posts_statement = select(Post).where(Post.group_member_id == id)
    posts = db.exec(posts_statement).all()
    for post in posts:
        post.group_member_id = None
        db.add(post)

    # Supprimer le membre
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
    description="Récupère tous les membres d'un groupe. L'utilisateur doit être membre du groupe.",
)
def get_members_by_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Récupère tous les membres d'un groupe avec eager loading des relations user.
    L'utilisateur doit être membre du groupe ou admin global.
    """
    # Vérifier que l'utilisateur est membre du groupe (ou admin global)
    current_member = db.exec(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id
        )
    ).first()
    if not current_member and current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Vous devez être membre du groupe pour voir ses membres."
        )

    statement = (
        select(GroupMember)
        .where(GroupMember.group_id == group_id)
        .options(selectinload(GroupMember.user))
        .order_by(GroupMember.role.desc(), GroupMember.id.asc())
    )
    members = db.exec(statement).all()
    return members
