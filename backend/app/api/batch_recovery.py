from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)
from sqlalchemy import func

from app.models.models import (
    Payment,
    RecoveryAttempt
)
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.schemas.batch_recovery_schema import (
    BatchRecoveryRequest,
    BatchRecoveryResponse
)

from app.services.batch_recovery_service import (
    run_batch_recovery
)


router = APIRouter(
    prefix="/api/batch-recovery",
    tags=["Batch Recovery"]
)


@router.post(
    "/run",
    response_model=BatchRecoveryResponse
)
def execute_batch_recovery(
    request: BatchRecoveryRequest,
    db: Session = Depends(get_db)
):
    try:

        if request.limit < 1:
            raise HTTPException(
                status_code=400,
                detail="Batch limit must be at least 1."
            )

        if request.limit > 100:
            raise HTTPException(
                status_code=400,
                detail="Maximum batch size is 100."
            )

        result = run_batch_recovery(
            db=db,
            limit=request.limit
        )

        return result

    except HTTPException:
        raise

    except Exception as exc:

        db.rollback()

        print(
            "Batch recovery failed:",
            str(exc)
        )

        raise HTTPException(
            status_code=500,
            detail="Batch recovery could not be completed."
        )

@router.get("/metrics")
def get_batch_metrics(
    db: Session = Depends(get_db)
):

    total_attempts = (
        db.query(RecoveryAttempt)
        .count()
    )

    recovered_attempts = (
        db.query(RecoveryAttempt)
        .filter(
            RecoveryAttempt.status
            == "RECOVERED"
        )
        .count()
    )

    recovered_amount = (
        db.query(
            func.coalesce(
                func.sum(
                    RecoveryAttempt
                    .amount_recovered
                ),
                0
            )
        )
        .scalar()
    )

    failed_payments = (
        db.query(Payment)
        .filter(
            Payment.status == "FAILED"
        )
        .count()
    )

    recovered_payments = (
        db.query(Payment)
        .filter(
            Payment.status == "RECOVERED"
        )
        .count()
    )

    return {
        "total_recovery_attempts":
            total_attempts,

        "successful_recoveries":
            recovered_attempts,

        "simulated_revenue_recovered":
            float(recovered_amount),

        "remaining_failed_payments":
            failed_payments,

        "recovered_payments":
            recovered_payments
    }