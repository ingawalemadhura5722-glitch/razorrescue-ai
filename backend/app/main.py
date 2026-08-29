from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.orders import router as orders_router
from app.api.payments import router as payments_router
from app.api.audit import router as audit_router

app = FastAPI(
    title="RazorRescue AI",
    description="AI-powered Revenue Recovery Agent",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(payments_router)
app.include_router(orders_router)
app.include_router(audit_router)

@app.get("/")
def home():
    return {
        "message": "RazorRescue AI backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }