from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import Optional
from app.entities.post import Post


class Media(SQLModel, table=True):
    __tablename__ = "media"

    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="post.id")
    media_url: str = Field()
    order: int = Field(default=0)

    # Relations
    post: Optional["Post"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Media.post_id]"}
    )


# Schemas basiques pour eviter les imports circulaires
class UserBasic(SQLModel):
    """Schema basique pour l'utilisateur"""

    model_config = {"from_attributes": True}

    id: int
    username: str
    email: str
    avatar_url: Optional[str] = None


class GroupBasic(SQLModel):
    """Schema basique pour le groupe"""

    model_config = {"from_attributes": True}

    id: int
    nom: str
    image_url: Optional[str] = None


class GroupMemberBasic(SQLModel):
    """Schema basique pour le membre du groupe"""

    model_config = {"from_attributes": True}

    id: int
    user_id: int
    group_id: int
    role: int
    user: Optional[UserBasic] = None


class PostBasic(SQLModel):
    """Schema basique pour le post"""

    model_config = {"from_attributes": True}

    id: int
    group_member_id: Optional[int] = None
    group_id: int
    caption: Optional[str] = None
    created_at: Optional[datetime] = None
    group_member: Optional[GroupMemberBasic] = None
    group: Optional[GroupBasic] = None


class MediaRead(SQLModel):
    """Schema de lecture pour les medias avec post imbrique"""

    model_config = {"from_attributes": True}

    id: int
    post_id: int
    media_url: str
    order: int
    post: Optional[PostBasic] = None
