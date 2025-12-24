from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from app.entities.user import User


class Role(SQLModel, table=True):
    """Database table model for Role"""

    __tablename__ = "roles"

    id: Optional[int] = Field(default=None, primary_key=True)
    # 1 : user
    # 2 : moderator
    # 3 : admin
    name: str = Field(unique=True, index=True)
    description: Optional[str] = Field(default=None)
    updated_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
