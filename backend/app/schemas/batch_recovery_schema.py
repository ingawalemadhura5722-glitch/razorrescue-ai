from pydantic import BaseModel


class BatchRecoveryRequest(BaseModel):
    limit: int = 50


class BatchRecoveryItem(BaseModel):
    payment_id: int
    amount: float
    diagnosis: str
    recommended_action: str
    decision_source: str
    policy_allowed: bool
    outcome: str
    amount_recovered: float


class BatchRecoveryResponse(BaseModel):
    total_processed: int
    recovered_count: int
    pending_count: int
    escalated_count: int
    blocked_count: int
    total_revenue_at_risk: float
    total_revenue_recovered: float
    recovery_rate: float
    items: list[BatchRecoveryItem]