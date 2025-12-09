from sqlmodel import SQLModel, Field
from typing import Optional

from app.entities.user import User


class Group(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    nom: str = Field()
    description: Optional[str] = Field(default=None)
    image_url: Optional[str] = Field(default=None)
    created_by: User = Field()
