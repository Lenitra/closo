from sqlmodel import SQLModel, Field

from app.entities.post import Post
from app.entities.user import User

class Like(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    user_id: User = Field()
    post_id: Post = Field()
