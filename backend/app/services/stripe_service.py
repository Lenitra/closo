import stripe
from app.utils.core.config import settings
from app.entities.payment import Payment, PaymentStatus
from app.repositories.payment_repository import PaymentRepository
from app.repositories.group_repository import GroupRepository
from sqlmodel import Session
from fastapi import HTTPException
from datetime import datetime

stripe.api_key = settings.STRIPE_SECRET_KEY

payment_repo = PaymentRepository()
group_repo = GroupRepository()


def create_payment_intent(
    db: Session,
    group_id: int,
    user_id: int,
    amount_cents: int = 100,
    photos_to_add: int = 100,
) -> Payment:
    group = group_repo.get_by_id(db, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")

    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=amount_cents,
            currency="eur",
            metadata={
                "group_id": str(group_id),
                "user_id": str(user_id),
                "photos_to_add": str(photos_to_add),
            },
            automatic_payment_methods={"enabled": True},
        )
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

    payment = Payment(
        user_id=user_id,
        group_id=group_id,
        stripe_payment_intent_id=payment_intent.id,
        stripe_client_secret=payment_intent.client_secret,
        amount_cents=amount_cents,
        photos_added=photos_to_add,
        status=PaymentStatus.PENDING,
    )

    payment = payment_repo.save(db, payment)
    return payment


def handle_payment_success(db: Session, payment_intent_id: str) -> Payment:
    payment = payment_repo.get_by_payment_intent_id(db, payment_intent_id)
    if not payment:
        raise ValueError(f"Payment not found: {payment_intent_id}")

    # Idempotence check
    if payment.status == PaymentStatus.SUCCEEDED:
        return payment

    group = group_repo.get_by_id(db, payment.group_id)
    if not group:
        payment.status = PaymentStatus.FAILED
        payment.error_message = "Group not found"
        db.commit()
        raise ValueError(f"Group {payment.group_id} not found")

    # Update quota
    group.max_photos += payment.photos_added

    # Update payment status
    payment.status = PaymentStatus.SUCCEEDED
    payment.completed_at = datetime.utcnow()

    db.commit()
    return payment


def handle_payment_failed(
    db: Session, payment_intent_id: str, error: str | None = None
) -> Payment:
    payment = payment_repo.get_by_payment_intent_id(db, payment_intent_id)
    if not payment:
        raise ValueError(f"Payment not found: {payment_intent_id}")

    payment.status = PaymentStatus.FAILED
    payment.error_message = error
    payment.completed_at = datetime.utcnow()

    db.commit()
    return payment
