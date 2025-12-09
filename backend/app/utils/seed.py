from sqlmodel import Session, select
from app.entities.role import Role
from app.entities.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


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
        Role(id=2, name="admin", description="Administrator role"),
        Role(id=3, name="moderator", description="Moderator role"),
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
        email="admin@example.com",
        hashed_password=pwd_context.hash("admin123"),
        roles_ids=[2],  # Admin role
        active_role=2,
        is_active=True,
    )

    session.add(admin_user)
    session.commit()
    print(f"✓ Seeded admin user (email: admin@example.com)")
