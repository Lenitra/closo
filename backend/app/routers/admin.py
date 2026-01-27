from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select, func
from sqlalchemy.orm import selectinload
from app.entities.user import User
from app.entities.media import Media
from app.entities.group import Group, GroupWithStats
from app.entities.groupmember import GroupMember
from app.utils.auth.roles import get_current_user
from app.utils.core.database import get_db
from app.utils.slave_manager.orchestrator import list_all_files_from_slave


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get(
    "/stats",
    description="Récupère les statistiques globales de la plateforme. Réservé aux administrateurs.",
)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Vérifier que l'utilisateur est admin (role_id = 3)
    if current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux administrateurs."
        )

    # Nombre de photos
    photo_count = db.exec(select(func.count(Media.id))).one()

    # Nombre d'utilisateurs
    user_count = db.exec(select(func.count(User.id))).one()

    # Poids total du stockage depuis le slave storage
    total_storage_size = 0
    try:
        files_data = list_all_files_from_slave()
        if isinstance(files_data, list):
            for f in files_data:
                total_storage_size += f.get("size", 0)
        elif isinstance(files_data, dict) and "files" in files_data:
            for f in files_data["files"]:
                total_storage_size += f.get("size", 0)
    except Exception:
        # Si le slave storage est inaccessible, on renvoie 0
        total_storage_size = 0

    return {
        "photo_count": photo_count,
        "user_count": user_count,
        "total_storage_size": total_storage_size,
    }


@router.get(
    "/groups",
    response_model=list[GroupWithStats],
    description="Récupère tous les groupes de la plateforme avec statistiques. Réservé aux administrateurs.",
)
def get_admin_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Accès réservé aux administrateurs."
        )

    # Récupérer tous les groupes avec le créateur
    statement = (
        select(Group)
        .options(selectinload(Group.creator))
        .order_by(Group.id.desc())
    )
    groups = db.exec(statement).all()

    if not groups:
        return []

    group_ids = [g.id for g in groups]

    # Nombre de membres par groupe
    member_counts_statement = (
        select(GroupMember.group_id, func.count(GroupMember.id).label('count'))
        .where(GroupMember.group_id.in_(group_ids))
        .group_by(GroupMember.group_id)
    )
    member_counts_result = db.exec(member_counts_statement).all()
    member_counts = {group_id: count for group_id, count in member_counts_result}

    result = []
    for group in groups:
        group_with_stats = GroupWithStats(
            id=group.id,
            nom=group.nom,
            description=group.description,
            image_url=group.image_url,
            invite_code=group.invite_code,
            creator=group.creator,
            member_count=member_counts.get(group.id, 0),
            current_user_role=0,
        )
        result.append(group_with_stats)

    return result
