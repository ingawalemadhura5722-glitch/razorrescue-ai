MAX_RECOVERY_ATTEMPTS = 3


def evaluate_recovery_policy(
    recommended_action: str,
    attempt_number: int,
    amount: float,
    confidence: float
):
    if confidence < 0.70:
        return {
            "allowed": False,
            "reason":
                "Decision confidence is below the minimum threshold and requires manual review."
        }

    # ----------------------------------------
    # MAXIMUM ATTEMPTS REACHED
    # ----------------------------------------

    if attempt_number >= MAX_RECOVERY_ATTEMPTS:
        return {
            "allowed": False,
            "reason":
                "Maximum recovery attempt limit reached."
        }

    # ----------------------------------------
    # STOP RECOVERY
    # ----------------------------------------

    if recommended_action == "STOP_RECOVERY":
        return {
            "allowed": False,
            "reason":
                "Recovery engine requested stopping further attempts."
        }

    # ----------------------------------------
    # HIGH VALUE PAYMENT
    # ----------------------------------------

    if amount >= 50000:
        return {
            "allowed": False,
            "reason":
                "High-value payment requires manual review."
        }

    # ----------------------------------------
    # ALLOWED ACTIONS
    # ----------------------------------------

    allowed_actions = {
        "RETRY_PAYMENT",
        "REMIND_LATER",
        "SUGGEST_ALTERNATE_METHOD",
        "ESCALATE"
    }

    if recommended_action not in allowed_actions:
        return {
            "allowed": False,
            "reason":
                "Recommended recovery action is not permitted."
        }

    # ----------------------------------------
    # EVERYTHING PASSED
    # ----------------------------------------

    return {
        "allowed": True,
        "reason":
            "Recovery action is allowed by current policy."
    }