from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from app.entities.user import User
from app.entities.group import Group


class GroupMember(SQLModel, table=True):
    __tablename__ = "groupmember"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    group_id: int = Field(foreign_key="group.id")
    role: int = Field(default=1)  # 1: member, 2: admin, 3: creator
    last_activity: Optional[datetime] = None

    # Relations
    user: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[GroupMember.user_id]"}
    )
    group: Optional["Group"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[GroupMember.group_id]"}
    )


class UserBasic(SQLModel):
    """Schéma basique pour l'utilisateur"""

    model_config = {"from_attributes": True}

    id: int
    username: str
    email: str


class GroupBasic(SQLModel):
    """Schéma basique pour le groupe"""

    model_config = {"from_attributes": True}

    id: int
    nom: str
    image_url: Optional[str] = None


class GroupMemberRead(SQLModel):
    """Schéma de lecture avec user et group inclus"""

    model_config = {"from_attributes": True}

    id: int
    user_id: int
    group_id: int
    role: int
    user: Optional[UserBasic] = None
    group: Optional[GroupBasic] = None
