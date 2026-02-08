from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"


class Payment(SQLModel, table=True):
    __tablename__ = "payment"

    id: Optional[int] = Field(default=None, primary_key=True)

    # References
    user_id: int = Field(foreign_key="user.id")
    group_id: int = Field(foreign_key="group.id")

    # Stripe
    stripe_payment_intent_id: str = Field(unique=True, index=True)
    stripe_client_secret: str

    # Amount and quota
    amount_cents: int = Field(default=100)  # 1€ = 100 cents
    photos_added: int = Field(default=100)

    # State
    status: PaymentStatus = Field(default=PaymentStatus.PENDING)

    # Audit
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = Field(default=None)

    # Error info
    error_message: Optional[str] = Field(default=None)
