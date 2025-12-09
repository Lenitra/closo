from sqlmodel import SQLModel, Field
from datetime import datetime

from app.entities.post import Post
from app.entities.user import User


class Comment(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    post_id: Post = Field()
    user_id: User = Field()
    text: str = Field()
    created_at: datetime = Field()
