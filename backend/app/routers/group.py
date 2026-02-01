from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from sqlmodel import Session, select, func
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
import secrets
import string
from app.entities.group import Group, GroupRead, GroupWithStats
from app.entities.groupmember import GroupMember
from app.repositories.group_repository import GroupRepository
from app.repositories.groupmember_repository import GroupMemberRepository
from app.utils.core.database import get_db
from app.utils.auth.roles import require_role, get_current_user
from app.entities.user import User
from app.utils.slave_manager.orchestrator import save_media
from app.utils.file_validation import validate_image_file


router = APIRouter(prefix="/groups", tags=["Group"])
repo = GroupRepository()
member_repo = GroupMemberRepository()


@router.get(
    "/",
    response_model=list[GroupWithStats],
    description="Route permettant à un utilisateur authentifié de récupérer la liste des groupes dont lesquel il fait partie avec statistiques.",
)
def get_all_groups(
    db: Session = Depends(get_db), current_user_id=Depends(require_role(["any"]))
):
    """
    Récupère tous les groupes de l'utilisateur avec statistiques optimisées:
    - Nombre de membres par groupe
    - Rôle de l'utilisateur actuel dans chaque groupe

    Utilise des requêtes optimisées pour éviter les requêtes N+1.
    """
    # Récupérer les groupes de l'utilisateur avec le créateur
    statement = (
        select(Group)
        .join(GroupMember, GroupMember.group_id == Group.id)
        .where(GroupMember.user_id == current_user_id)
        .options(selectinload(Group.creator))
    )
    groups = db.exec(statement).all()

    if not groups:
        return []

    # Récupérer les IDs des groupes
    group_ids = [group.id for group in groups]

    # Récupérer le nombre de membres pour chaque groupe en une seule requête
    member_counts_statement = (
        select(GroupMember.group_id, func.count(GroupMember.id).label('count'))
        .where(GroupMember.group_id.in_(group_ids))
        .group_by(GroupMember.group_id)
    )
    member_counts_result = db.exec(member_counts_statement).all()
    member_counts = {group_id: count for group_id, count in member_counts_result}

    # Récupérer le rôle de l'utilisateur actuel pour chaque groupe en une seule requête
    roles_statement = (
        select(GroupMember.group_id, GroupMember.role)
        .where(GroupMember.group_id.in_(group_ids), GroupMember.user_id == current_user_id)
    )
    roles_result = db.exec(roles_statement).all()
    user_roles = {group_id: role for group_id, role in roles_result}

    # Construire la réponse avec statistiques pour chaque groupe
    result = []
    for group in groups:
        group_with_stats = GroupWithStats(
            id=group.id,
            nom=group.nom,
            description=group.description,
            image_url=group.image_url,
            invite_code=group.invite_code,
            creator=group.creator,
            max_photos=group.max_photos,
            member_count=member_counts.get(group.id, 0),
            current_user_role=user_roles.get(group.id, 1)  # Default to role 1 if not found
        )
        result.append(group_with_stats)

    return result


@router.get(
    "/{id}",
    response_model=GroupRead,
    description="Récupère un groupe par son ID. L'utilisateur doit être membre du groupe.",
)
def get_group_by_id(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = repo.get_by_id(db, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Vérifier que l'utilisateur est membre du groupe (ou admin global)
    member = db.exec(
        select(GroupMember).where(
            GroupMember.group_id == id,
            GroupMember.user_id == current_user.id
        )
    ).first()
    if not member and current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Vous devez être membre du groupe pour accéder à ses informations."
        )

    return group


class CreateGroupRequest(BaseModel):
    nom: str
    description: str | None = None


@router.post(
    "/",
    response_model=GroupRead,
    status_code=201,
    description="Créer un nouveau groupe et ajouter l'utilisateur comme créateur.",
)
def create_group(
    data: CreateGroupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Crée un nouveau groupe et ajoute automatiquement l'utilisateur actuel
    comme membre avec le rôle de créateur (role=3).
    Génère également un code d'invitation unique.
    """
    # Generate a unique invite code
    max_attempts = 10
    invite_code = None
    for _ in range(max_attempts):
        code = generate_invite_code()
        # Check if code already exists
        existing = db.exec(select(Group).where(Group.invite_code == code)).first()
        if not existing:
            invite_code = code
            break

    if not invite_code:
        raise HTTPException(status_code=500, detail="Failed to generate unique invite code")

    # Create the group with invite code
    group = Group(
        nom=data.nom,
        description=data.description,
        invite_code=invite_code,
        user_creator_id=current_user.id,
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    # Add creator as group member with role=3 (creator)
    group_member = GroupMember(
        user_id=current_user.id,
        group_id=group.id,
        role=3,  # Creator role
    )
    db.add(group_member)
    db.commit()
    db.refresh(group)

    return group


@router.delete(
    "/{id}",
    status_code=204,
    description="Supprimer un groupe. Seul le créateur peut supprimer le groupe.",
)
def delete_group(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Supprime un groupe et toutes ses données associées (posts, médias, membres).
    Seul le créateur du groupe peut effectuer cette action.

    Cascade de suppression:
    1. Suppression des médias de tous les posts
    2. Suppression de tous les posts
    3. Suppression de tous les membres
    4. Suppression du groupe
    """
    from app.entities.post import Post
    from app.entities.media import Media

    # Vérifier que le groupe existe
    group = repo.get_by_id(db, id)
    if not group:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")

    # Vérifier que l'utilisateur actuel est le créateur
    statement = select(GroupMember).where(
        GroupMember.group_id == id,
        GroupMember.user_id == current_user.id
    )
    current_member = db.exec(statement).first()

    if not current_member or current_member.role != 3:
        raise HTTPException(
            status_code=403,
            detail="Seul le créateur du groupe peut le supprimer."
        )

    # 1. Supprimer tous les médias des posts du groupe
    posts_statement = select(Post).where(Post.group_id == id)
    posts = db.exec(posts_statement).all()

    for post in posts:
        # Supprimer les médias du post
        media_statement = select(Media).where(Media.post_id == post.id)
        medias = db.exec(media_statement).all()
        for media in medias:
            db.delete(media)

        # Supprimer le post
        db.delete(post)

    # 2. Supprimer tous les membres du groupe
    members_statement = select(GroupMember).where(GroupMember.group_id == id)
    members = db.exec(members_statement).all()
    for member in members:
        db.delete(member)

    # 3. Supprimer le groupe
    db.delete(group)
    db.commit()


@router.get(
    "/{id}/members/count",
    response_model=dict,
    description="Récupère le nombre de membres d'un groupe. L'utilisateur doit être membre du groupe.",
)
def get_group_members_count(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Vérifier que l'utilisateur est membre du groupe (ou admin global)
    member = db.exec(
        select(GroupMember).where(
            GroupMember.group_id == id,
            GroupMember.user_id == current_user.id
        )
    ).first()
    if not member and current_user.role_id != 3:
        raise HTTPException(
            status_code=403,
            detail="Vous devez être membre du groupe pour accéder à cette information."
        )

    count = member_repo.count_members_in_group(db, id)
    return {"count": count}


def generate_invite_code(length: int = 8) -> str:
    """Génère un code d'invitation aléatoire et unique."""
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


@router.post(
    "/{id}/regenerate-invite-code",
    response_model=dict,
    description="Régénère un nouveau code d'invitation pour le groupe (admin/créateur uniquement).",
)
def regenerate_group_invite_code(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Régénère un code d'invitation unique pour le groupe.
    Seuls les admins et créateurs peuvent régénérer des codes.
    L'ancien code devient invalide.
    """
    # Get the group
    group = repo.get_by_id(db, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Check if user is member of the group
    statement = select(GroupMember).where(
        GroupMember.group_id == id,
        GroupMember.user_id == current_user.id
    )
    member = db.exec(statement).first()

    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    # Check if user has admin or creator role (role >= 2)
    if member.role < 2:
        raise HTTPException(status_code=403, detail="Only admins and creators can generate invite codes")

    # Generate a unique invite code
    max_attempts = 10
    for _ in range(max_attempts):
        code = generate_invite_code()
        # Check if code already exists
        existing = db.exec(select(Group).where(Group.invite_code == code)).first()
        if not existing:
            break
    else:
        raise HTTPException(status_code=500, detail="Failed to generate unique invite code")

    # Update group with new invite code
    group.invite_code = code
    db.add(group)
    db.commit()
    db.refresh(group)

    return {"invite_code": code}


class JoinGroupRequest(BaseModel):
    invite_code: str


@router.post(
    "/join",
    response_model=GroupRead,
    description="Rejoindre un groupe avec un code d'invitation.",
)
def join_group_with_code(
    data: JoinGroupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Permet à un utilisateur de rejoindre un groupe en utilisant un code d'invitation.
    """
    # Find group by invite code
    statement = select(Group).where(Group.invite_code == data.invite_code)
    group = db.exec(statement).first()

    if not group:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    # Check if user is already a member
    existing_member = db.exec(
        select(GroupMember).where(
            GroupMember.group_id == group.id,
            GroupMember.user_id == current_user.id
        )
    ).first()

    if existing_member:
        raise HTTPException(status_code=400, detail="You are already a member of this group")

    # Add user as member with role=1 (regular member)
    new_member = GroupMember(
        user_id=current_user.id,
        group_id=group.id,
        role=1,  # Regular member
    )
    db.add(new_member)
    db.commit()
    db.refresh(group)

    return group


class UpdateGroupRequest(BaseModel):
    nom: str | None = None
    description: str | None = None


@router.put(
    "/{id}",
    response_model=GroupRead,
    description="Mettre à jour les informations d'un groupe (admin/créateur uniquement).",
)
def update_group(
    id: int,
    data: UpdateGroupRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Met à jour les informations d'un groupe.
    Seuls les admins et créateurs peuvent modifier un groupe.
    """
    # Get the group
    group = repo.get_by_id(db, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Check if user is member of the group
    statement = select(GroupMember).where(
        GroupMember.group_id == id,
        GroupMember.user_id == current_user.id
    )
    member = db.exec(statement).first()

    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    # Check if user has admin or creator role (role >= 2)
    if member.role < 2:
        raise HTTPException(status_code=403, detail="Only admins and creators can update group info")

    # Update fields
    if data.nom is not None:
        group.nom = data.nom
    if data.description is not None:
        group.description = data.description

    db.add(group)
    db.commit()
    db.refresh(group)

    return group


@router.post(
    "/{id}/upload-image",
    response_model=GroupRead,
    description="Upload image for a group (admin/creator only).",
)
async def upload_group_image(
    id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload image for group.

    Validations:
    - Taille maximale: 8 MB
    - Types autorisés: JPEG, PNG, GIF, WebP
    - Vérification des magic bytes (type MIME réel)
    """
    # Get the group
    group = repo.get_by_id(db, id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    # Check if user is member of the group
    statement = select(GroupMember).where(
        GroupMember.group_id == id,
        GroupMember.user_id == current_user.id
    )
    member = db.exec(statement).first()

    if not member:
        raise HTTPException(status_code=403, detail="You are not a member of this group")

    # Check if user has admin or creator role (role >= 2)
    if member.role < 2:
        raise HTTPException(status_code=403, detail="Only admins and creators can upload group image")

    # Valider le fichier (taille, type MIME réel, extension)
    validate_image_file(file)

    # Upload file to slave storage
    try:
        image_url = save_media(file.file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

    # Update group image URL
    group.image_url = image_url
    db.add(group)
    db.commit()
    db.refresh(group)

    return group
