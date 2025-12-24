from sqlmodel import Session, select
from app.repositories.base_repository import BaseRepository
from app.entities.group import Group
from app.entities.groupmember import GroupMember


class GroupRepository(BaseRepository[Group]):
    def __init__(self):
        super().__init__(Group)

    def get_groups_by_user_id(self, db: Session, user_id: int) -> list[Group]:
        """Get all groups where the user is a member"""
        statement = (
            select(Group)
            .join(GroupMember, GroupMember.group_id == Group.id)
            .where(GroupMember.user_id == user_id)
        )
        return db.exec(statement).all()
