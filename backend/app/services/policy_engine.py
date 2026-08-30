MAX_RECOVERY_ATTEMPTS = 3


def evaluate_recovery_policy(
    recommended_action: str,
    attempt_number: int,
    amount: float
):
    # -----------------------------
    # STOP AFTER MAX ATTEMPTS
    # -----------------------------

    if attempt_number >= MAX_RECOVERY_ATTEMPTS:
        return {
            "allowed": False,
            "reason":
                "Maximum recovery attempt limit reached."
        }

    # -----------------------------
    # STOP_RECOVERY NEVER EXECUTES
    # -----------------------------

    if recommended_action == "STOP_RECOVERY":
        return {
            "allowed": False,
            "reason":
                "Recovery engine requested stopping further attempts."
        }

    # -----------------------------
    # LARGE VALUE ESCALATION
    # -----------------------------

    if amount >= 50000:
        return {
            "allowed": False,
            "reason":
                "High-value payment requires manual review."
        }

    # -----------------------------
    # ALLOWED ACTIONS
    # -----------------------------

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

    return {
        "allowed": True,
        "reason":
            "Recovery action is allowed by current policy."
    }