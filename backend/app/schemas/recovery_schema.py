from typing import Optional

from pydantic import BaseModel


class RecoveryRequest(BaseModel):
    payment_id: int


class RecoveryDecisionResponse(BaseModel):
    payment_id: int
    diagnosis: str
    confidence: float
    recommended_action: str
    reasoning: str
    policy_allowed: bool
    policy_reason: str
    decision_source: str


class RecoveryAttemptResponse(BaseModel):
    payment_id: int
    action: str
    status: str
    attempt_number: int
    amount_recovered: float
    message: Optional[str] = None