from app.services.ai_recovery_service import (
    analyze_payment_with_ai
)


def diagnose_failure(
    failure_reason: str | None,
    method: str | None,
    attempt_number: int
):
    reason = (failure_reason or "").lower()
    method_name = (method or "").upper()

    # -----------------------------
    # NETWORK / TEMPORARY FAILURE
    # -----------------------------

    if (
        "network" in reason
        or "timeout" in reason
        or "server unavailable" in reason
        or "temporarily unavailable" in reason
    ):
        return {
            "diagnosis": "TEMPORARY_TECHNICAL_FAILURE",
            "confidence": 0.95,
            "recommended_action": "RETRY_PAYMENT",
            "reasoning":
                "The failure appears temporary, so another attempt may succeed.",
            "source": "RULE_ENGINE"
        }

    # -----------------------------
    # INSUFFICIENT FUNDS
    # -----------------------------

    if (
        "insufficient" in reason
        or "low balance" in reason
        or "balance" in reason
    ):
        return {
            "diagnosis": "INSUFFICIENT_FUNDS",
            "confidence": 0.94,
            "recommended_action": "REMIND_LATER",
            "reasoning":
                "Immediate retry is unlikely to succeed because the customer may not have sufficient balance.",
            "source": "RULE_ENGINE"
        }

    # -----------------------------
    # LIMIT ISSUE
    # -----------------------------

    if (
        "limit exceeded" in reason
        or "upi limit" in reason
        or "daily limit" in reason
    ):
        return {
            "diagnosis": "PAYMENT_LIMIT_EXCEEDED",
            "confidence": 0.93,
            "recommended_action":
                "SUGGEST_ALTERNATE_METHOD",
            "reasoning":
                "The selected payment method appears to have reached a transaction limit.",
            "source": "RULE_ENGINE"
        }

    # -----------------------------
    # CUSTOMER CANCELLED
    # -----------------------------

    if (
        "cancel" in reason
        or "user cancelled" in reason
        or "customer cancelled" in reason
    ):
        return {
            "diagnosis": "CUSTOMER_CANCELLED",
            "confidence": 0.90,
            "recommended_action": "REMIND_LATER",
            "reasoning":
                "The payment was cancelled by the customer, so an immediate retry should not be forced.",
            "source": "RULE_ENGINE"
            
        }

    # -----------------------------
    # CARD RELATED FAILURE
    # -----------------------------

    if (
        "card" in reason
        or method_name == "CARD"
    ):
        return {
            "diagnosis": "CARD_PAYMENT_FAILURE",
            "confidence": 0.85,
            "recommended_action":
                "SUGGEST_ALTERNATE_METHOD",
            "reasoning":
                "The card payment failed, so another payment method may improve recovery.",
            "source": "RULE_ENGINE"
        }

    # -----------------------------
    # REPEATED FAILURE
    # -----------------------------

    if attempt_number >= 3:
        return {
            "diagnosis": "REPEATED_PAYMENT_FAILURE",
            "confidence": 0.98,
            "recommended_action": "STOP_RECOVERY",
            "reasoning":
                "The payment has already failed multiple times and further automatic attempts should stop.",
            "source": "RULE_ENGINE"
        }

    # -----------------------------
    # DEFAULT CASE
    # -----------------------------

    return {
        "diagnosis": "UNKNOWN_PAYMENT_FAILURE",
        "confidence": 0.60,
        "recommended_action": "ESCALATE",
        "reasoning":
            "The failure could not be classified confidently and should be escalated for review.",
        "source": "RULE_ENGINE"
    }
def get_recovery_decision(
    amount: float,
    failure_reason: str | None,
    method: str | None,
    attempt_number: int
):
    # ----------------------------------------
    # STEP 1: Try AI
    # ----------------------------------------

    ai_result = analyze_payment_with_ai(
        amount=amount,
        method=method,
        failure_reason=failure_reason,
        attempt_number=attempt_number
    )

    if ai_result:
        return ai_result


    # ----------------------------------------
    # STEP 2: Fallback to deterministic rules
    # ----------------------------------------

    rule_result = diagnose_failure(
        failure_reason=failure_reason,
        method=method,
        attempt_number=attempt_number
    )

    return rule_result