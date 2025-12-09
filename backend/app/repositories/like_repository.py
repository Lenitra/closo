from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.entities.like import Like


class LikeRepository(BaseRepository[Like]):
    def __init__(self):
        super().__init__(Like)
