import json
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = None

if OPENAI_API_KEY:
    client = OpenAI(
        api_key=OPENAI_API_KEY
    )


ALLOWED_ACTIONS = {
    "RETRY_PAYMENT",
    "REMIND_LATER",
    "SUGGEST_ALTERNATE_METHOD",
    "ESCALATE",
    "STOP_RECOVERY",
}


def analyze_payment_with_ai(
    amount: float,
    method: str | None,
    failure_reason: str | None,
    attempt_number: int,
):
    """
    Analyze a failed payment using an AI model.

    Returns a dictionary when successful.
    Returns None when AI is unavailable or fails.
    """

    if client is None:
        return None

    prompt = f"""
You are the decision engine for RazorRescue AI,
a payment revenue-recovery system.

Analyze the failed payment below.

Payment information:

Amount: INR {amount}
Payment method: {method or "UNKNOWN"}
Failure reason: {failure_reason or "UNKNOWN"}
Attempt number: {attempt_number}

Choose exactly one recommended_action from:

RETRY_PAYMENT
REMIND_LATER
SUGGEST_ALTERNATE_METHOD
ESCALATE
STOP_RECOVERY

Rules:

1. Never recommend unlimited retries.
2. If attempts are already high, prefer STOP_RECOVERY.
3. Temporary network/server problems may be retried.
4. Insufficient balance should usually use REMIND_LATER.
5. Payment limits or method-specific issues may use
   SUGGEST_ALTERNATE_METHOD.
6. Unknown or suspicious failures should use ESCALATE.
7. The decision must be conservative.
8. Do not invent payment facts.

Return ONLY valid JSON in exactly this format:

{{
    "diagnosis": "SHORT_DIAGNOSIS",
    "confidence": 0.0,
    "recommended_action": "ACTION",
    "reasoning": "Short explanation"
}}
"""

    try:
        response = client.responses.create(
            model="gpt-5.1",
            input=prompt,
        )

        raw_text = response.output_text.strip()

        result = json.loads(raw_text)

        required_keys = {
            "diagnosis",
            "confidence",
            "recommended_action",
            "reasoning",
        }

        if not required_keys.issubset(
            result.keys()
        ):
            return None

        action = result[
            "recommended_action"
        ]

        if action not in ALLOWED_ACTIONS:
            return None

        confidence = float(
            result["confidence"]
        )

        confidence = max(
            0.0,
            min(confidence, 1.0)
        )

        return {
            "diagnosis":
                str(result["diagnosis"]),

            "confidence":
                confidence,

            "recommended_action":
                action,

            "reasoning":
                str(result["reasoning"]),

            "source":
                "AI",
        }

    except Exception as exc:
        print(
            "AI recovery analysis failed:",
            str(exc)
        )

        return None