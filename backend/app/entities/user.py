from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING
from app.entities.role import Role


class User(SQLModel, table=True):
    """Database table model for User"""

    __tablename__ = "user"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    username: str = Field(default=None)
    role_id: int = Field(default=1, foreign_key="roles.id")
    is_active: bool = Field(default=True)
    created_at: datetime | None = Field(default=None)
    updated_at: datetime | None = Field(default=None)

    # Relations
    role: Optional["Role"] = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[User.role_id]"}
    )


# Schémas de lecture (Pydantic)


class RoleBasic(SQLModel):
    """Schéma basique pour le rôle"""

    model_config = {"from_attributes": True}

    id: int
    name: str
    description: Optional[str] = None


class UserRead(SQLModel):
    """Schéma de lecture complet avec toutes les relations imbriquées"""

    model_config = {"from_attributes": True}

    id: int
    email: str
    username: str
    role_id: int
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    role: Optional[RoleBasic] = None
