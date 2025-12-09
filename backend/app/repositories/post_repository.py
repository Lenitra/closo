from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.entities.post import Post

class PostRepository(BaseRepository[Post]):
    def __init__(self):
        super().__init__(Post)
