from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from app.entities.user import User


class Group(SQLModel, table=True):
    __tablename__ = "group"
    model_config = {"from_attributes": True}

    id: Optional[int] = Field(default=None, primary_key=True)
    nom: str = Field()
    description: Optional[str] = Field(default=None)
    image_url: Optional[str] = Field(default=None)
    user_creator_id: int = Field(foreign_key="user.id")

    # Relations (unidirectionnelle)
    creator: Optional["User"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Group.user_creator_id]"}
    )


class UserBasic(SQLModel):
    """Schéma basique pour éviter d'exposer les champs sensibles"""

    id: int
    username: str
    email: str


class GroupRead(SQLModel):
    """Schéma de lecture avec le créateur inclus"""

    model_config = {"from_attributes": True}

    id: int
    nom: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    creator: Optional[UserBasic] = None
