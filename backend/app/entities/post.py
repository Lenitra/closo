from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone
from typing import Optional
from app.entities.groupmember import GroupMember
from app.entities.group import Group


class Post(SQLModel, table=True):
    __tablename__ = "post"

    id: Optional[int] = Field(default=None, primary_key=True)
    group_member_id: Optional[int] = Field(default=None, foreign_key="groupmember.id")
    group_id: int = Field(foreign_key="group.id")
    caption: Optional[str] = Field(default=None)
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relations
    group_member: Optional["GroupMember"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Post.group_member_id]"}
    )
    group: Optional["Group"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Post.group_id]"}
    )


class GroupMemberBasic(SQLModel):
    """Schema basique pour le membre du groupe"""

    model_config = {"from_attributes": True}

    id: int
    user_id: int
    group_id: int
    role: int


class GroupBasic(SQLModel):
    """Schema basique pour le groupe"""

    model_config = {"from_attributes": True}

    id: int
    nom: str
    image_url: Optional[str] = None


class MediaBasic(SQLModel):
    """Schema basique pour les medias"""

    model_config = {"from_attributes": True}

    id: int
    media_url: str
    order: int


class PostRead(SQLModel):
    """Schema de lecture avec group_member, group et medias inclus"""

    model_config = {"from_attributes": True}

    id: int
    group_member_id: Optional[int] = None
    group_id: int
    caption: Optional[str] = None
    created_at: Optional[datetime] = None
    group_member: Optional[GroupMemberBasic] = None
    group: Optional[GroupBasic] = None
    medias: list[MediaBasic] = []
