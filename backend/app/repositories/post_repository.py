from typing import List
from sqlmodel import select
from app.repositories.base_repository import BaseRepository
from app.entities.post import Post


class PostRepository(BaseRepository[Post]):
    def __init__(self):
        super().__init__(Post)

    def get_posts_by_group_id(self, group_id: int) -> List[Post]:
        """Get all posts in a specific group"""
        statement = select(Post).where(Post.group_id == group_id)
        return self.db.exec(statement).all()
