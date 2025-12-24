from typing import List
from sqlmodel import Session, select
from app.repositories.base_repository import BaseRepository
from app.entities.media import Media
from app.entities.post import Post


class MediaRepository(BaseRepository[Media]):
    def __init__(self):
        super().__init__(Media)

    def get_medias_by_group_id(self, db: Session, group_id: int) -> List[Media]:
        """Get all medias in a specific group via Post"""
        statement = (
            select(Media)
            .join(Post, Media.post_id == Post.id)
            .where(Post.group_id == group_id)
            .order_by(Media.order)
        )
        return db.exec(statement).all()
