from sqlmodel import SQLModel, Field

from app.entities.user import User
from app.entities.group import Group


class GroupMember(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    user_id: User = Field()
    group_id: Group = Field()
    role: int = Field()
