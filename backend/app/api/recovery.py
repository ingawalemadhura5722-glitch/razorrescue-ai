from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.models import (
    Payment,
    AIDecision,
    PolicyDecision,
    RecoveryAttempt,
    AuditLog
)

from app.schemas.recovery_schema import (
    RecoveryRequest
)

from app.services.recovery_engine import (
    diagnose_failure
)

from app.services.policy_engine import (
    evaluate_recovery_policy
)


router = APIRouter(
    prefix="/api/recovery",
    tags=["Recovery"]
)


@router.post("/analyze")
def analyze_recovery(
    recovery_data: RecoveryRequest,
    db: Session = Depends(get_db)
):
    # -----------------------------------------
    # STEP 1: Find payment
    # -----------------------------------------

    payment = (
        db.query(Payment)
        .filter(
            Payment.id == recovery_data.payment_id
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    # -----------------------------------------
    # STEP 2: Only failed payments recoverable
    # -----------------------------------------

    if payment.status != "FAILED":
        raise HTTPException(
            status_code=400,
            detail="Only failed payments can enter recovery"
        )

    # -----------------------------------------
    # STEP 3: Diagnose failure
    # -----------------------------------------

    decision = diagnose_failure(
        failure_reason=payment.failure_reason,
        method=payment.method,
        attempt_number=payment.attempt_number
    )

    # -----------------------------------------
    # STEP 4: Save AI-style decision
    # -----------------------------------------

    ai_decision = AIDecision(
        payment_id=payment.id,
        diagnosis=decision["diagnosis"],
        confidence=decision["confidence"],
        recommended_action=
            decision["recommended_action"],
        reasoning=decision["reasoning"]
    )

    db.add(ai_decision)
    db.flush()

    # -----------------------------------------
    # STEP 5: Policy evaluation
    # -----------------------------------------

    policy = evaluate_recovery_policy(
        recommended_action=
            decision["recommended_action"],

        attempt_number=
            payment.attempt_number,

        amount=
            float(payment.amount)
    )

    policy_decision = PolicyDecision(
        ai_decision_id=ai_decision.id,
        allowed=policy["allowed"],
        reason=policy["reason"]
    )

    db.add(policy_decision)

    # -----------------------------------------
    # STEP 6: Audit log
    # -----------------------------------------

    audit_log = AuditLog(
        payment_id=payment.id,
        event_type="RECOVERY_ANALYZED",
        actor="RECOVERY_ENGINE",
        details={
            "diagnosis":
                decision["diagnosis"],

            "recommended_action":
                decision["recommended_action"],

            "confidence":
                decision["confidence"],

            "policy_allowed":
                policy["allowed"]
        }
    )

    db.add(audit_log)

    db.commit()

    return {
        "payment_id":
            payment.id,

        "diagnosis":
            decision["diagnosis"],

        "confidence":
            float(decision["confidence"]),

        "recommended_action":
            decision["recommended_action"],

        "reasoning":
            decision["reasoning"],

        "policy_allowed":
            policy["allowed"],

        "policy_reason":
            policy["reason"]
    }

@router.post("/execute")
def execute_recovery(
    recovery_data: RecoveryRequest,
    db: Session = Depends(get_db)
):
    payment = (
        db.query(Payment)
        .filter(
            Payment.id == recovery_data.payment_id
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    if payment.status != "FAILED":
        raise HTTPException(
            status_code=400,
            detail="Only failed payments can be recovered"
        )
    if payment.attempt_number >= 3:
        raise HTTPException(
        status_code=403,
        detail="Maximum recovery attempts reached"
    )
    # Get latest AI decision

    ai_decision = (
        db.query(AIDecision)
        .filter(
            AIDecision.payment_id == payment.id
        )
        .order_by(
            AIDecision.id.desc()
        )
        .first()
    )

    if not ai_decision:
        raise HTTPException(
            status_code=400,
            detail="Analyze payment before executing recovery"
        )

    # Get latest policy decision

    policy_decision = (
        db.query(PolicyDecision)
        .filter(
            PolicyDecision.ai_decision_id
            == ai_decision.id
        )
        .first()
    )

    if not policy_decision:
        raise HTTPException(
            status_code=400,
            detail="Policy decision missing"
        )

    if not policy_decision.allowed:
        raise HTTPException(
            status_code=403,
            detail=policy_decision.reason
        )

    next_attempt_number = (
        payment.attempt_number + 1
    )

    recovery_attempt = RecoveryAttempt(
        payment_id=payment.id,
        action=
            ai_decision.recommended_action,
        status="EXECUTED",
        amount_recovered=0,
        attempt_number=
            next_attempt_number
    )

    db.add(recovery_attempt)

    payment.attempt_number = (
        next_attempt_number
    )

    audit_log = AuditLog(
        payment_id=payment.id,
        event_type="RECOVERY_EXECUTED",
        actor="RECOVERY_ENGINE",
        details={
            "action":
                ai_decision.recommended_action,

            "attempt_number":
                next_attempt_number,

            "status":
                "EXECUTED"
        }
    )

    db.add(audit_log)

    db.commit()

    db.refresh(recovery_attempt)

    return {
        "payment_id":
            payment.id,

        "action":
            recovery_attempt.action,

        "status":
            recovery_attempt.status,

        "attempt_number":
            recovery_attempt.attempt_number,

        "amount_recovered":
            float(
                recovery_attempt.amount_recovered
            ),

        "message":
            "Recovery action executed successfully"
    }
@router.get("/queue")
def get_recovery_queue(
    db: Session = Depends(get_db)
):
    payments = (
        db.query(Payment)
        .filter(
            Payment.status == "FAILED",
            Payment.attempt_number < 3
        )
        .order_by(
            Payment.created_at.asc()
        )
        .all()
    )

    return {
        "count": len(payments),
        "payments": [
            {
                "id":
                    payment.id,

                "amount":
                    float(payment.amount),

                "method":
                    payment.method,

                "failure_reason":
                    payment.failure_reason,

                "attempt_number":
                    payment.attempt_number
            }
            for payment in payments
        ]
    }
@router.get("/metrics")
def get_recovery_metrics(
    db: Session = Depends(get_db)
):
    attempts = (
        db.query(RecoveryAttempt)
        .all()
    )

    total_attempts = len(attempts)

    total_recovered = sum(
        float(attempt.amount_recovered or 0)
        for attempt in attempts
    )

    successful_recoveries = len([
        attempt
        for attempt in attempts
        if float(
            attempt.amount_recovered or 0
        ) > 0
    ])

    return {
        "total_recovery_attempts":
            total_attempts,

        "successful_recoveries":
            successful_recoveries,

        "total_revenue_recovered":
            total_recovered,

        "currency":
            "INR"
    }
@router.post("/{payment_id}/mark-recovered")
def mark_payment_recovered(
    payment_id: int,
    db: Session = Depends(get_db)
):
    payment = (
        db.query(Payment)
        .filter(
            Payment.id == payment_id
        )
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    attempt = (
        db.query(RecoveryAttempt)
        .filter(
            RecoveryAttempt.payment_id
            == payment.id
        )
        .order_by(
            RecoveryAttempt.id.desc()
        )
        .first()
    )

    if not attempt:
        raise HTTPException(
            status_code=400,
            detail="No recovery attempt found"
        )

    attempt.status = "RECOVERED"

    attempt.amount_recovered = (
        payment.amount
    )

    payment.status = "RECOVERED"

    audit_log = AuditLog(
        payment_id=payment.id,
        event_type="PAYMENT_RECOVERED",
        actor="SYSTEM",
        details={
            "amount_recovered":
                float(payment.amount),

            "recovery_attempt_id":
                attempt.id
        }
    )

    db.add(audit_log)

    db.commit()

    return {
        "message":
            "Payment marked as recovered",

        "payment_id":
            payment.id,

        "amount_recovered":
            float(payment.amount)
    }