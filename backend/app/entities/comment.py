from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from app.entities.user import User
    from app.entities.post import Post


class Comment(SQLModel, table=True):
    __tablename__ = "comment"

    id: Optional[int] = Field(default=None, primary_key=True)
    post_id: int = Field(foreign_key="post.id")
    group_member: int = Field(foreign_key="groupmember.id")
    text: str = Field()
    created_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
