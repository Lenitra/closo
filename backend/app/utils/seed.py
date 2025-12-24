from app.entities.groupmember import GroupMember
from sqlmodel import Session, select
from app.entities.role import Role
from app.entities.group import Group
from app.entities.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def seed_roles(session: Session):
    """Seed initial roles if they don't exist"""
    # Check if roles already exist
    statement = select(Role)
    existing_roles = session.exec(statement).all()

    if existing_roles:
        print("Roles already exist, skipping seed")
        return

    # Create default roles
    roles = [
        Role(id=1, name="user", description="Regular user role"),
        Role(id=2, name="moderator", description="Moderator role"),
        Role(id=3, name="admin", description="Administrator role"),
    ]

    for role in roles:
        session.add(role)

    session.commit()
    print(f"✓ Seeded {len(roles)} roles")


def seed_users(session: Session):
    """Seed initial users if they don't exist"""
    # Check if users already exist
    statement = select(User)
    existing_users = session.exec(statement).all()

    if existing_users:
        print("Users already exist, skipping seed")
        return

    # Create default admin user
    admin_user = User(
        email="lemartinelthomas@gmail.com",
        hashed_password=pwd_context.hash("thomas2001"),
        username="TauMah.L",
        role_id=3,  # Admin role
        is_active=True,
    )

    # Create default user
    regular_user = User(
        email="mellingermaud@gmail.com",
        hashed_password=pwd_context.hash("maud2002"),
        username="Modlinger",
        role_id=1,  # User role
        is_active=True,
    )

    session.add(admin_user)
    session.add(regular_user)
    session.commit()
    print("✓ Seeded users")


def seed_groups(session: Session):
    """Seed initial groups if they don't exist"""
    statement = select(Group)
    existing_groups = session.exec(statement).all()

    if existing_groups:
        print("Groups already exist, skipping seed")
        return

    user_u: User = session.exec(select(User).where(User.email == "mellingermaud@gmail.com")).first()
    user_a: User = session.exec(select(User).where(User.email == "lemartinelthomas@gmail.com")).first()

    groupe_u = Group(nom="Photos d'IA", user_creator_id=user_u.id)
    groupe_a = Group(nom="Album perso", user_creator_id=user_a.id)

    session.add(groupe_u)
    session.add(groupe_a)
    session.commit()

    # Refresh pour récupérer les IDs générés
    session.refresh(groupe_u)
    session.refresh(groupe_a)

    # Créer les group_members pour groupe_u (Photos d'IA)
    groupe_member_u = GroupMember(
        user_id=user_u.id,
        group_id=groupe_u.id,
        role=3,  # Creator
    )
    groupe_member_a_in_u = GroupMember(
        user_id=user_a.id,
        group_id=groupe_u.id,
        role=2,  # Admin
    )

    session.add(groupe_member_u)
    session.add(groupe_member_a_in_u)

    # Créer les group_members pour groupe_a (Album perso)
    groupe_member_a = GroupMember(
        user_id=user_a.id,
        group_id=groupe_a.id,
        role=3,  # Creator
    )

    session.add(groupe_member_a)
    session.commit()

    print("✓ Seeded 2 groups & group members")
