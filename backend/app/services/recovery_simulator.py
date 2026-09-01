def simulate_recovery_outcome(
    payment_id: int,
    recommended_action: str,
    policy_allowed: bool,
    amount: float
):
    """
    Demo-only deterministic recovery simulator.

    This does NOT perform a real Razorpay retry.

    It produces repeatable outcomes for synthetic/test
    payments so RazorRescue AI can demonstrate
    batch recovery metrics.
    """

    if not policy_allowed:
        return {
            "outcome": "BLOCKED",
            "amount_recovered": 0.0
        }

    if recommended_action == "STOP_RECOVERY":
        return {
            "outcome": "STOPPED",
            "amount_recovered": 0.0
        }

    if recommended_action == "ESCALATE":
        return {
            "outcome": "ESCALATED",
            "amount_recovered": 0.0
        }

    if recommended_action == "REMIND_LATER":
        return {
            "outcome": "PENDING",
            "amount_recovered": 0.0
        }

    if recommended_action == "RETRY_PAYMENT":
        # Deterministic demo rule:
        # even payment IDs recover successfully.
        if payment_id % 2 == 0:
            return {
                "outcome": "RECOVERED",
                "amount_recovered": amount
            }

        return {
            "outcome": "PENDING",
            "amount_recovered": 0.0
        }

    if recommended_action == "SUGGEST_ALTERNATE_METHOD":
        # Deterministic demo rule:
        # every third payment succeeds.
        if payment_id % 3 == 0:
            return {
                "outcome": "RECOVERED",
                "amount_recovered": amount
            }

        return {
            "outcome": "PENDING",
            "amount_recovered": 0.0
        }

    return {
        "outcome": "PENDING",
        "amount_recovered": 0.0
    }