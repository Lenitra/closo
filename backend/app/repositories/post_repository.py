from typing import List
from sqlmodel import Session, select, func
from app.repositories.base_repository import BaseRepository
from app.entities.post import Post
from app.entities.groupmember import GroupMember


class PostRepository(BaseRepository[Post]):
    def __init__(self):
        super().__init__(Post)

    def get_posts_by_group_id(self, db: Session, group_id: int) -> List[Post]:
        """Get all posts in a specific group"""
        statement = select(Post).where(Post.group_id == group_id)
        return db.exec(statement).all()

    def get_nb_posts_by_user_id(self, db: Session, user_id: int) -> int:
        """Get the number of posts created by a specific user"""
        statement = (
            select(func.count(Post.id))
            .join(GroupMember, Post.group_member_id == GroupMember.id)
            .where(GroupMember.user_id == user_id)
        )
        return db.exec(statement).one()