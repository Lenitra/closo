from typing import Optional
from sqlmodel import Session, select, func
from app.repositories.base_repository import BaseRepository
from app.entities.groupmember import GroupMember


class GroupMemberRepository(BaseRepository[GroupMember]):
    def __init__(self):
        super().__init__(GroupMember)

    def get_by_user_and_group(
        self, db: Session, user_id: int, group_id: int
    ) -> Optional[GroupMember]:
        """Get GroupMember by user_id and group_id"""
        statement = select(GroupMember).where(
            GroupMember.user_id == user_id, GroupMember.group_id == group_id
        )
        return db.exec(statement).first()

    def count_members_in_group(self, db: Session, group_id: int) -> int:
        """Count the number of members in a specific group"""
        statement = select(func.count(GroupMember.id)).where(
            GroupMember.group_id == group_id
        )
        return db.exec(statement).one()