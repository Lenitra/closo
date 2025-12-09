from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

from app.entities.user import User
from app.entities.group import Group

class Post(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    group_id: Group = Field()
    user_id: User = Field()
    caption: Optional[str] = Field(default=None)
    created_at: datetime = Field()
    media_url: str = Field()
