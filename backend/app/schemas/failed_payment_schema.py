from pydantic import BaseModel


class FailedPaymentRequest(BaseModel):
    local_order_id: int
    amount: float

    razorpay_order_id: str | None = None
    razorpay_payment_id: str | None = None

    method: str | None = None
    failure_reason: str
    failure_code: str | None = None