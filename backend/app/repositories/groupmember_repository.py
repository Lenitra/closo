from sqlalchemy.orm import Session
from app.repositories.base_repository import BaseRepository
from app.entities.groupmember import GroupMember


class GroupMemberRepository(BaseRepository[GroupMember]):
    def __init__(self):
        super().__init__(GroupMember)
