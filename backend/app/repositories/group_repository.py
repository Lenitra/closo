from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.entities.group import Group


class GroupRepository(BaseRepository[Group]):
    def __init__(self):
        super().__init__(Group)
