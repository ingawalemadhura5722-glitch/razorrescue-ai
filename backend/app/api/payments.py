from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas.failed_payment_schema import FailedPaymentRequest
from app.database.database import get_db

from app.schemas.payment_schema import PaymentCreate, PaymentResponse
from app.models.models import Payment, Order, AuditLog

router = APIRouter(
    prefix="/api/payments",
    tags=["Payments"]
)


@router.get("/", response_model=List[PaymentResponse])
def get_payments(db: Session = Depends(get_db)):
    return db.query(Payment).order_by(Payment.id.desc()).all()

@router.get("/failed-queue")
def get_failed_payment_queue(
    db: Session = Depends(get_db)
):
    failed_payments = (
        db.query(Payment)
        .filter(Payment.status == "FAILED")
        .order_by(Payment.created_at.desc())
        .all()
    )

    return {
        "count": len(failed_payments),
        "payments": [
            {
                "id": payment.id,
                "order_id": payment.order_id,
                "amount": float(payment.amount),
                "method": payment.method,
                "failure_reason": payment.failure_reason,
                "attempt_number": payment.attempt_number,
                "razorpay_payment_id": payment.razorpay_payment_id,
                "created_at": payment.created_at
            }
            for payment in failed_payments
        ]
    }

@router.get("/revenue-at-risk")
def get_revenue_at_risk(
    db: Session = Depends(get_db)
):
    failed_payments = (
        db.query(Payment)
        .filter(Payment.status == "FAILED")
        .all()
    )

    total_amount = sum(
        float(payment.amount)
        for payment in failed_payments
    )

    return {
        "failed_payment_count": len(failed_payments),
        "revenue_at_risk": total_amount,
        "currency": "INR"
    }
@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    return payment


@router.post("/", response_model=PaymentResponse)
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db)
):

    # Check whether the order exists
    order = (
        db.query(Order)
        .filter(Order.id == payment_data.order_id)
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

    # Create payment only if order exists
    payment = Payment(
        order_id=payment_data.order_id,
        amount=payment_data.amount,
        status=payment_data.status,
        method=payment_data.method,
        failure_reason=payment_data.failure_reason,
        attempt_number=payment_data.attempt_number,
        razorpay_payment_id=payment_data.razorpay_payment_id
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment
@router.post("/failed")
def store_failed_payment(
    payment_data: FailedPaymentRequest,
    db: Session = Depends(get_db)
):
    try:

        failed_payment = Payment(
            order_id=payment_data.local_order_id,
            razorpay_payment_id=payment_data.razorpay_payment_id,
            method=payment_data.method or "UNKNOWN",
            amount=payment_data.amount,
            status="FAILED",
            failure_reason=payment_data.failure_reason,
            attempt_number=1
        )

        db.add(failed_payment)
        db.flush()

        audit_log = AuditLog(
            payment_id=failed_payment.id,
            event_type="PAYMENT_FAILED",
            actor="RAZORPAY",
            details={
                "razorpay_order_id":
                    payment_data.razorpay_order_id,

                "razorpay_payment_id":
                    payment_data.razorpay_payment_id,

                "failure_reason":
                    payment_data.failure_reason,

                "failure_code":
                    payment_data.failure_code
            }
        )

        db.add(audit_log)

        db.commit()

        db.refresh(failed_payment)

        return {
            "message":
                "Failed payment stored successfully",

            "payment_database_id":
                failed_payment.id,

            "status":
                failed_payment.status
        }

    except Exception as exc:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Could not store failed payment: {str(exc)}"
        )