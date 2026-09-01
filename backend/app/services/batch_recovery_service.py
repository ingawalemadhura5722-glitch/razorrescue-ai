from sqlalchemy.orm import Session

from app.models.models import (
    Payment,
    AIDecision,
    PolicyDecision,
    RecoveryAttempt,
    AuditLog
)

from app.services.recovery_engine import (
    get_recovery_decision
)

from app.services.policy_engine import (
    evaluate_recovery_policy
)

from app.services.recovery_simulator import (
    simulate_recovery_outcome
)


def run_batch_recovery(
    db: Session,
    limit: int = 50
):
    payments = (
        db.query(Payment)
        .filter(Payment.status == "FAILED")
        .order_by(Payment.id.asc())
        .limit(limit)
        .all()
    )

    results = []

    total_revenue_at_risk = 0.0
    total_revenue_recovered = 0.0

    recovered_count = 0
    pending_count = 0
    escalated_count = 0
    blocked_count = 0

    for payment in payments:

        amount = float(payment.amount)

        total_revenue_at_risk += amount

        # -----------------------------------------------
        # STEP 1: AI / RULE DECISION
        # -----------------------------------------------

        decision = get_recovery_decision(
            amount=amount,
            failure_reason=payment.failure_reason,
            method=payment.method,
            attempt_number=payment.attempt_number
        )

        # -----------------------------------------------
        # STEP 2: SAVE AI DECISION
        # -----------------------------------------------

        ai_decision = AIDecision(
            payment_id=payment.id,
            diagnosis=decision["diagnosis"],
            confidence=float(
                decision["confidence"]
            ),
            recommended_action=
                decision["recommended_action"],
            reasoning=decision["reasoning"]
        )

        db.add(ai_decision)
        db.flush()

        # -----------------------------------------------
        # STEP 3: POLICY CHECK
        # -----------------------------------------------

        policy = evaluate_recovery_policy(
            recommended_action=
                decision["recommended_action"],

            attempt_number=
                payment.attempt_number,

            amount=
                amount,

            confidence=
                float(decision["confidence"])
        )

        # -----------------------------------------------
        # STEP 4: SAVE POLICY DECISION
        # -----------------------------------------------

        policy_decision = PolicyDecision(
            ai_decision_id=ai_decision.id,
            allowed=policy["allowed"],
            reason=policy["reason"]
        )

        db.add(policy_decision)
        db.flush()

        # -----------------------------------------------
        # STEP 5: SIMULATE OUTCOME
        # -----------------------------------------------

        simulation = simulate_recovery_outcome(
            payment_id=payment.id,
            recommended_action=
                decision["recommended_action"],
            policy_allowed=
                policy["allowed"],
            amount=amount
        )

        outcome = simulation["outcome"]

        amount_recovered = float(
            simulation["amount_recovered"]
        )

        # -----------------------------------------------
        # STEP 6: STORE RECOVERY ATTEMPT
        # -----------------------------------------------

        recovery_attempt = RecoveryAttempt(
            payment_id=payment.id,
            action=decision["recommended_action"],
            status=outcome,
            amount_recovered=amount_recovered,
            attempt_number=payment.attempt_number
        )

        db.add(recovery_attempt)
        if policy["allowed"]:
            payment.attempt_number += 1
        # -----------------------------------------------
        # STEP 7: UPDATE PAYMENT IF RECOVERED
        # -----------------------------------------------

        if outcome == "RECOVERED":

            payment.status = "RECOVERED"

            total_revenue_recovered += (
                amount_recovered
            )

            recovered_count += 1

        elif outcome == "ESCALATED":

            escalated_count += 1

        elif outcome == "BLOCKED":

            blocked_count += 1

        else:

            pending_count += 1

        # -----------------------------------------------
        # STEP 8: AUDIT LOG
        # -----------------------------------------------

        audit_log = AuditLog(
            payment_id=payment.id,
            event_type="BATCH_RECOVERY_PROCESSED",
            actor="RAZORRESCUE_AI",
            details={
                "diagnosis":
                    decision["diagnosis"],

                "confidence":
                    float(
                        decision["confidence"]
                    ),

                "recommended_action":
                    decision[
                        "recommended_action"
                    ],

                "decision_source":
                    decision.get(
                        "source",
                        "UNKNOWN"
                    ),

                "policy_allowed":
                    policy["allowed"],

                "policy_reason":
                    policy["reason"],

                "simulation_outcome":
                    outcome,

                "amount_recovered":
                    amount_recovered,

                "demo_mode":
                    True
            }
        )

        db.add(audit_log)

        # -----------------------------------------------
        # STEP 9: RESPONSE ITEM
        # -----------------------------------------------

        results.append({
            "payment_id":
                payment.id,

            "amount":
                amount,

            "diagnosis":
                decision["diagnosis"],

            "recommended_action":
                decision[
                    "recommended_action"
                ],

            "decision_source":
                decision.get(
                    "source",
                    "UNKNOWN"
                ),

            "policy_allowed":
                policy["allowed"],

            "outcome":
                outcome,

            "amount_recovered":
                amount_recovered
        })

    # ---------------------------------------------------
    # SAVE EVERYTHING
    # ---------------------------------------------------

    db.commit()

    processed_count = len(payments)

    if total_revenue_at_risk > 0:

        recovery_rate = (
            total_revenue_recovered
            / total_revenue_at_risk
        ) * 100

    else:

        recovery_rate = 0.0

    return {
        "total_processed":
            processed_count,

        "recovered_count":
            recovered_count,

        "pending_count":
            pending_count,

        "escalated_count":
            escalated_count,

        "blocked_count":
            blocked_count,

        "total_revenue_at_risk":
            round(
                total_revenue_at_risk,
                2
            ),

        "total_revenue_recovered":
            round(
                total_revenue_recovered,
                2
            ),

        "recovery_rate":
            round(
                recovery_rate,
                2
            ),

        "items":
            results
    }