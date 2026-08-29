from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PaymentBase(BaseModel):
    order_id: int
    amount: Decimal
    status: str
    method: Optional[str] = None
    failure_reason: Optional[str] = None
    attempt_number: int = 1


class PaymentCreate(PaymentBase):
    razorpay_payment_id: Optional[str] = None


class PaymentResponse(PaymentBase):
    id: int
    razorpay_payment_id: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)