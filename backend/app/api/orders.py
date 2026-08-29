from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.models import Payment, AuditLog

from app.schemas.order_schema import (
    RazorpayOrderRequest,
    RazorpayOrderResponse
)

from app.schemas.payment_verification_schema import (
    PaymentVerificationRequest
)

from app.services.razorpay_service import (
    create_razorpay_order,
    verify_payment_signature
)


router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"]
)


# ---------------------------------------------------
# CREATE RAZORPAY ORDER
# ---------------------------------------------------

@router.post(
    "/create",
    response_model=RazorpayOrderResponse
)
def create_order(
    order_data: RazorpayOrderRequest
):
    try:

        return create_razorpay_order(
            amount_rupees=order_data.amount,
            receipt=order_data.receipt
        )

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to create Razorpay order: {str(exc)}"
        )


# ---------------------------------------------------
# VERIFY PAYMENT
# ---------------------------------------------------

@router.post("/verify")
def verify_payment(
    payment_data: PaymentVerificationRequest,
    db: Session = Depends(get_db)
):
    # -----------------------------------------
    # STEP 1: Verify Razorpay signature
    # -----------------------------------------

    is_valid = verify_payment_signature(
        razorpay_order_id=payment_data.razorpay_order_id,
        razorpay_payment_id=payment_data.razorpay_payment_id,
        razorpay_signature=payment_data.razorpay_signature,
    )

    if not is_valid:
        raise HTTPException(
            status_code=400,
            detail="Payment signature verification failed"
        )

    # -----------------------------------------
    # STEP 2: Check duplicate payment
    # -----------------------------------------

    existing_payment = (
        db.query(Payment)
        .filter(
            Payment.razorpay_payment_id
            == payment_data.razorpay_payment_id
        )
        .first()
    )

    if existing_payment:
        return {
            "verified": True,
            "message": "Payment already recorded",
            "payment_database_id": existing_payment.id,
        }

    # -----------------------------------------
    # STEP 3: Store payment + audit log
    # -----------------------------------------

    try:
        new_payment = Payment(
            order_id=payment_data.local_order_id,
            razorpay_payment_id=payment_data.razorpay_payment_id,
            method="RAZORPAY",
            amount=payment_data.amount,
            status="SUCCESS",
            failure_reason=None,
            attempt_number=1,
        )

        db.add(new_payment)

        # Generate payment ID before audit log
        db.flush()

        audit_log = AuditLog(
            payment_id=new_payment.id,
            event_type="PAYMENT_VERIFIED",
            actor="RAZORPAY",
            details={
                "razorpay_order_id":
                    payment_data.razorpay_order_id,

                "razorpay_payment_id":
                    payment_data.razorpay_payment_id,

                "status": "SUCCESS",

                "signature_verified": True,
            },
        )

        db.add(audit_log)

        # Save both records
        db.commit()

        db.refresh(new_payment)

        return {
            "verified": True,
            "message":
                "Payment verified and stored successfully",
            "payment_database_id":
                new_payment.id,
            "razorpay_payment_id":
                new_payment.razorpay_payment_id,
        }

    except Exception as exc:

        # Undo transaction if something fails
        db.rollback()

        print(
            "Error storing verified payment:",
            str(exc)
        )

        raise HTTPException(
            status_code=500,
            detail="Could not store verified payment"
        )