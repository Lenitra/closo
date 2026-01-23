from sqlmodel import Session, select
from app.entities.user import User
from app.repositories.base_repository import BaseRepository
from typing import List


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, db: Session, email: str) -> User | None:
        statement = select(User).where(User.email == email)
        return db.exec(statement).first()

    def get_by_role(self, db: Session, role_name: str) -> List[User]:
        """Get users by role name"""
        statement = select(User).where(User.roles.__contains__(role_name))
        return list(db.exec(statement).all())

    def update_avatar(self, db: Session, user_id: int, avatar_url: str) -> User:
        """Update user avatar URL"""
        user = self.get(db, user_id)
        if not user:
            raise ValueError(f"User with id {user_id} not found")
        user.avatar_url = avatar_url
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update_username(self, db: Session, user_id: int, username: str) -> User:
        """Update user username"""
        user = self.get(db, user_id)
        if not user:
            raise ValueError(f"User with id {user_id} not found")
        user.username = username
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update_password(self, db: Session, user_id: int, hashed_password: str) -> User:
        """Update user password"""
        user = self.get(db, user_id)
        if not user:
            raise ValueError(f"User with id {user_id} not found")
        user.hashed_password = hashed_password
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
