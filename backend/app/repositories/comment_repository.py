from app.repositories.base_repository import BaseRepository
from app.entities.comment import Comment


class CommentRepository(BaseRepository[Comment]):
    def __init__(self):
        super().__init__(Comment)
