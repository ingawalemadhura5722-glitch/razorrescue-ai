from pydantic import BaseModel


class PaymentVerificationRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

    local_order_id: int
    amount: float