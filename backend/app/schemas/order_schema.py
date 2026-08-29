from pydantic import BaseModel, Field


class RazorpayOrderRequest(BaseModel):
    amount: float = Field(gt=0)
    receipt: str


class RazorpayOrderResponse(BaseModel):
    id: str
    amount: int
    currency: str
    receipt: str
    status: str