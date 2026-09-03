from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.recovery import router as recovery_router
from app.api.orders import router as orders_router
from app.api.payments import router as payments_router
from app.api.audit import router as audit_router
from sqlalchemy import text
import os
from app.database.database import engine
from app.api.batch_recovery import (
    router as batch_recovery_router
)
app = FastAPI(
    title="RazorRescue AI",
    description="AI-powered Revenue Recovery Agent",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(payments_router)
app.include_router(orders_router)
app.include_router(audit_router)
app.include_router(recovery_router)
app.include_router(batch_recovery_router)
@app.get("/")
def home():
    return {
        "message": "RazorRescue AI backend is running"
    }

@app.get("/system-status")
def system_status():

    return {
        "backend": "ONLINE",
        "database": "POSTGRESQL",
        "payment_gateway":
            "RAZORPAY_TEST_MODE",
        "ai_configured": bool(
            os.getenv("OPENAI_API_KEY")
        ),
        "fallback_engine":
            "RULE_ENGINE",
        "recovery_mode":
            "DEMO_SIMULATION"
    }
@app.get("/health")
def health():

    try:

        with engine.connect() as connection:

            connection.execute(
                text("SELECT 1")
            )

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as exc:

        return {
            "status": "degraded",
            "database": "unavailable",
            "error": str(exc)
        }