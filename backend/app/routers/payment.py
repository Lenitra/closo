from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlmodel import Session
from app.utils.core.database import get_db
from app.utils.auth.roles import get_current_user
from app.entities.user import User
from app.entities.payment import PaymentStatus
from app.services import stripe_service
from app.repositories.group_repository import GroupRepository
from app.repositories.groupmember_repository import GroupMemberRepository
from app.repositories.payment_repository import PaymentRepository
from app.utils.core.config import settings
from pydantic import BaseModel
import stripe

router = APIRouter(prefix="/payments", tags=["payments"])

group_repo = GroupRepository()
member_repo = GroupMemberRepository()
payment_repo = PaymentRepository()


class CreatePaymentRequest(BaseModel):
    group_id: int


class CreatePaymentResponse(BaseModel):
    client_secret: str
    payment_id: int
    publishable_key: str


class PaymentStatusResponse(BaseModel):
    payment_id: int
    status: PaymentStatus
    group_id: int
    photos_added: int
    new_max_photos: int


@router.post("/create-payment-intent", response_model=CreatePaymentResponse)
def create_payment_intent(
    request: CreatePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify user is member of the group
    membership = member_repo.get_by_user_and_group(db, current_user.id, request.group_id)
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this group")

    payment = stripe_service.create_payment_intent(
        db=db,
        group_id=request.group_id,
        user_id=current_user.id,
        amount_cents=100,
        photos_to_add=100,
    )

    return CreatePaymentResponse(
        client_secret=payment.stripe_client_secret,
        payment_id=payment.id,
        publishable_key=settings.STRIPE_PUBLISHABLE_KEY,
    )


@router.get("/status/{payment_id}", response_model=PaymentStatusResponse)
def get_payment_status(
    payment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payment = payment_repo.get_by_id(db, payment_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    group = group_repo.get_by_id(db, payment.group_id)

    return PaymentStatusResponse(
        payment_id=payment.id,
        status=payment.status,
        group_id=payment.group_id,
        photos_added=payment.photos_added,
        new_max_photos=group.max_photos if group else 0,
    )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="Stripe-Signature"),
    db: Session = Depends(get_db),
):
    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event.type == "payment_intent.succeeded":
        payment_intent = event.data.object
        stripe_service.handle_payment_success(db, payment_intent.id)
    elif event.type == "payment_intent.payment_failed":
        payment_intent = event.data.object
        error = (
            payment_intent.last_payment_error.message
            if payment_intent.last_payment_error
            else None
        )
        stripe_service.handle_payment_failed(db, payment_intent.id, error)

    return {"status": "success"}
