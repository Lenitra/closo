from sqlmodel import Session, select
from app.repositories.base_repository import BaseRepository
from app.entities.payment import Payment, PaymentStatus


class PaymentRepository(BaseRepository[Payment]):
    def __init__(self):
        super().__init__(Payment)

    def get_by_payment_intent_id(self, db: Session, intent_id: str) -> Payment | None:
        return db.exec(
            select(Payment).where(Payment.stripe_payment_intent_id == intent_id)
        ).first()

    def get_group_payments(self, db: Session, group_id: int) -> list[Payment]:
        return db.exec(
            select(Payment)
            .where(Payment.group_id == group_id)
            .where(Payment.status == PaymentStatus.SUCCEEDED)
            .order_by(Payment.created_at.desc())
        ).all()
