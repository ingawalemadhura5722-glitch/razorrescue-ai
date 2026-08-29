from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func

from app.database.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=False, unique=True)
    phone = Column(String(20))
    created_at = Column(DateTime, server_default=func.now())


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(30), nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    razorpay_payment_id = Column(String(100))
    method = Column(String(50))
    amount = Column(Numeric(12, 2), nullable=False)
    status = Column(String(30), nullable=False)
    failure_reason = Column(String(100))
    attempt_number = Column(Integer, default=1)
    created_at = Column(DateTime, server_default=func.now())


class RecoveryAttempt(Base):
    __tablename__ = "recovery_attempts"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    action = Column(String(100), nullable=False)
    status = Column(String(30), nullable=False)
    amount_recovered = Column(Numeric(12, 2), default=0)
    attempt_number = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class AIDecision(Base):
    __tablename__ = "ai_decisions"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    diagnosis = Column(Text, nullable=False)
    confidence = Column(Numeric(5, 2))
    recommended_action = Column(String(100), nullable=False)
    reasoning = Column(Text)
    created_at = Column(DateTime, server_default=func.now())


class PolicyDecision(Base):
    __tablename__ = "policy_decisions"

    id = Column(Integer, primary_key=True, index=True)
    ai_decision_id = Column(Integer, ForeignKey("ai_decisions.id"), nullable=False)
    allowed = Column(Boolean, nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"))
    event_type = Column(String(50), nullable=False)
    actor = Column(String(50), nullable=False)
    details = Column(JSONB)
    created_at = Column(DateTime, server_default=func.now())