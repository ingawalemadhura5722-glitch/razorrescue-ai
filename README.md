# RazorRescue AI

**AI-Powered Revenue Recovery Agent for Failed Digital Payments**

RazorRescue AI is an intelligent revenue recovery system designed to help merchants identify, analyze, and respond to failed digital payments.

Instead of applying the same retry strategy to every payment failure, RazorRescue AI diagnoses the failure reason, recommends a suitable recovery action, validates that action using a deterministic policy engine, and records the entire recovery journey in an auditable timeline.

The current prototype uses Razorpay Test Mode, PostgreSQL, FastAPI, React, AI-based decision support, deterministic fallback logic, policy validation, manual review, and batch recovery analytics.

---

## Problem Statement

Digital payment failures directly affect merchant revenue.

A failed payment can occur because of several reasons:

- Network timeout
- Bank server error
- Insufficient funds
- UPI or transaction limit exceeded
- Card payment failure
- Customer cancellation
- Unknown or unclassified payment failure

A simple automatic retry mechanism is not enough because different payment failures require different recovery strategies.

```text
NETWORK_TIMEOUT
→ Retry may be useful

INSUFFICIENT_FUNDS
→ Immediate retry may not help

UPI LIMIT EXCEEDED
→ Alternative payment method may be better

UNKNOWN FAILURE
→ Human review may be safer

HIGH-VALUE PAYMENT
→ Automatic recovery may be risky
```

Therefore, merchants need an intelligent recovery system that can determine:

- Which failed payments should be recovered?
- How should they be recovered?
- When should automation stop?
- When should a human review the payment?

---

## Solution

RazorRescue AI creates an intelligent recovery layer for failed digital payments.

When a payment fails, the system:

1. Stores the failed payment in PostgreSQL.
2. Adds it to the recovery queue.
3. Calculates the revenue at risk.
4. Analyzes the failed payment.
5. Generates a diagnosis.
6. Generates a confidence score.
7. Recommends a recovery action.
8. Sends the recommendation to the policy engine.
9. Allows or blocks recovery based on deterministic safety rules.
10. Routes risky cases to manual review.
11. Stores recovery attempts.
12. Maintains an audit trail.
13. Measures batch-level recovery metrics.

The AI model provides flexible reasoning, while the deterministic rule engine acts as a fallback if the AI service is unavailable.

**Most importantly, the AI does not directly control payment execution.**

Every recommendation is validated by a deterministic policy engine before any recovery action is allowed.

---

## Why RazorRescue AI?

Traditional failed-payment systems often rely on generic retry logic.

RazorRescue AI treats payment recovery as a decision-making problem.

Different payment failures receive different recovery strategies:

- Temporary technical failures can be retried.
- Insufficient funds can be delayed.
- Payment limits can trigger alternate payment method suggestions.
- Customer-cancelled payments can be reminded later.
- Unknown failures can be escalated.
- Repeated failures can stop automatic recovery.
- High-value transactions can be routed for manual review.

```text
AI Decision-Making
+
Deterministic Rule Fallback
+
Policy Validation
+
Manual Review
+
Auditability
+
Recovery Analytics
```

This allows the system to remain intelligent while keeping automation controlled and explainable.

---

## Key Features

### 1. Revenue-at-Risk Detection

RazorRescue AI identifies failed payments and calculates the total amount of merchant revenue currently at risk.

The dashboard displays:

- Total Revenue at Risk
- Number of Failed Payments
- Simulated Revenue Recovered
- Number of Payments Requiring Manual Review

### 2. Failed Payment Recovery Queue

Failed payments are automatically added to a recovery queue.

Each payment contains information such as:

- Payment ID
- Order ID
- Amount
- Payment Method
- Failure Reason
- Attempt Number
- Razorpay Payment ID
- Current Status

### 3. AI-Powered Payment Failure Diagnosis

The recovery decision engine analyzes:

- Payment amount
- Payment method
- Failure reason
- Previous recovery attempts

It generates:

- Failure diagnosis
- Confidence score
- Recommended action
- Reasoning
- Decision source

### 4. Policy-Controlled Recovery

Every recommendation passes through a deterministic policy engine before execution.

### 5. Manual Review

High-risk, high-value, low-confidence, or otherwise blocked cases can be routed for human review.

### 6. Recovery Timeline and Audit Trail

Each payment maintains a history of decisions, policy results, recovery attempts, and audit events.

### 7. Batch Recovery Analytics

The system can process a batch of failed payments using deterministic simulation and measure recovery outcomes.

---

## Supported Recovery Actions

```text
RETRY_PAYMENT
REMIND_LATER
SUGGEST_ALTERNATE_METHOD
ESCALATE
STOP_RECOVERY
```

---

## Example Recovery Decisions

| Failure Scenario | Recommended Recovery Action |
|---|---|
| Network Timeout | RETRY_PAYMENT |
| Temporary Bank Server Issue | RETRY_PAYMENT |
| Insufficient Funds | REMIND_LATER |
| UPI Limit Exceeded | SUGGEST_ALTERNATE_METHOD |
| Customer Cancelled | REMIND_LATER |
| Card Failure | SUGGEST_ALTERNATE_METHOD |
| Unknown Payment Failure | ESCALATE |
| Maximum Attempts Reached | STOP_RECOVERY |

---

## AI Decision Engine

The AI decision engine analyzes failed payment data and produces structured recovery decisions.

Example:

```json
{
  "diagnosis": "TEMPORARY_TECHNICAL_FAILURE",
  "confidence": 0.95,
  "recommended_action": "RETRY_PAYMENT",
  "reasoning": "The failure appears temporary, so another attempt may succeed."
}
```

The AI engine can only recommend predefined recovery actions.

---

## Rule Engine Fallback

RazorRescue AI includes a deterministic rule-based fallback engine.

If the external AI service is unavailable, misconfigured, or unable to return a valid response, the system falls back to the rule engine.

```text
AI Service Available
       ↓
Use AI Decision

AI Service Unavailable
       ↓
Use Deterministic Rule Engine
```

This allows payment recovery analysis to continue even when the external AI service is unavailable.

---

## Policy and Safety Layer

AI recommendations do not automatically authorize recovery execution.

Current policy checks include:

- Minimum confidence threshold
- Maximum recovery attempt limit
- High-value payment protection
- Allowed action validation
- Stop-recovery rules
- Manual review routing

This separates AI reasoning from execution authority.

### Important Design Principle

```text
AI recommends.
Policy authorizes.
Recovery executes.
Audit records.
Analytics measures.
```

---

## High-Value Payment Protection

High-value transactions can be prevented from automatic recovery.

Example:

```text
Payment Amount:
₹75,000

Failure:
NETWORK_TIMEOUT

Recovery Recommendation:
RETRY_PAYMENT

Policy:
BLOCKED

Reason:
High-value payment requires manual review.
```

The payment is then displayed in the Manual Review Queue.

---

## Maximum Retry Protection

RazorRescue AI prevents unlimited payment recovery attempts.

When the maximum number of attempts is reached:

```text
Diagnosis:
REPEATED_PAYMENT_FAILURE

Recommended Action:
STOP_RECOVERY
```

The policy engine blocks further automatic recovery.

---

## Manual Review Queue

Payments blocked by policy are routed to the Manual Review Queue.

The queue can display:

- Payment ID
- Amount
- Payment Method
- Failure Reason
- Recommended Action
- Policy Reason

A reviewer can inspect the full recovery timeline for the payment.

---

## Recovery Timeline

Each payment has a detailed recovery timeline containing:

### Payment Information

- Payment ID
- Amount
- Method
- Status
- Failure Reason
- Attempt Number

### Decision History

- Diagnosis
- Confidence
- Recommended Action
- Reasoning
- Policy result
- Policy reason
- Decision timestamp

### Recovery Attempts

- Action
- Status
- Attempt number
- Simulated recovered amount
- Attempt timestamp

### Audit Events

- Event type
- Actor
- Timestamp
- Event details

This provides traceability for the recovery workflow.

---

## Audit Logging

Important system events are stored in the audit log.

Examples include:

```text
PAYMENT_FAILED
PAYMENT_VERIFIED
RECOVERY_ANALYZED
RECOVERY_EXECUTED
PAYMENT_RECOVERED
```

Audit logging improves transparency and makes the recovery workflow explainable.

---

## Batch Revenue Recovery

RazorRescue AI supports batch processing of failed payments.

```text
Failed Payment
      ↓
Recovery Analysis
      ↓
Diagnosis
      ↓
Recommended Action
      ↓
Policy Validation
      ↓
Recovery Outcome Simulation
      ↓
Recovery Attempt
      ↓
Audit Log
      ↓
Analytics
```

---

## Recovery Analytics

The dashboard provides metrics such as:

- Total Recovery Attempts
- Successful Recoveries
- Remaining Failed Payments
- Recovered Payments
- Revenue at Risk
- Simulated Revenue Recovered
- Recovery Rate
- Pending Recoveries
- Escalated Payments
- Blocked Payments

---

## Recovery Simulation

The current buildathon prototype uses deterministic recovery simulation.

```text
RETRY_PAYMENT
→ May result in RECOVERED or PENDING

REMIND_LATER
→ PENDING

SUGGEST_ALTERNATE_METHOD
→ May result in RECOVERED or PENDING

ESCALATE
→ ESCALATED

Policy Block
→ BLOCKED

STOP_RECOVERY
→ STOPPED
```

This demonstrates end-to-end recovery analytics without automatically retrying real customer payments.

---

## Razorpay Integration

RazorRescue AI integrates with Razorpay Test Mode.

```text
React Frontend
      ↓
FastAPI Backend
      ↓
Create Razorpay Order
      ↓
Razorpay Checkout
      ↓
Test Payment
      ↓
Signature Verification
      ↓
Payment Stored in PostgreSQL
      ↓
Audit Log
      ↓
Dashboard Updated
```

Successful Razorpay payments are verified by the backend before being stored.

---

## System Architecture

```text
                    RazorRescue AI

                 Merchant Dashboard
                         │
                         ▼
                  React Frontend
                         │
                         ▼
                   FastAPI Backend
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    PostgreSQL      Razorpay Test     Recovery Engine
                      Mode                 │
                                      ┌────┴────┐
                                      │         │
                                      ▼         ▼
                                  AI Model   Rule Engine
                                              Fallback
                                      │         │
                                      └────┬────┘
                                           ▼
                                    Failure Diagnosis
                                           │
                                           ▼
                                 Recommended Action
                                           │
                                           ▼
                                     Policy Engine
                                      /         \
                                     /           \
                               ALLOWED          BLOCKED
                                  │                 │
                                  ▼                 ▼
                           Recovery Flow       Manual Review
                                  │
                                  ▼
                           Recovery Attempt
                                  │
                         ┌────────┴─────────┐
                         ▼                  ▼
                     Audit Logs         Analytics
```

---

## Recovery Workflow

```text
Failed Payment
      ↓
Revenue-at-Risk Detection
      ↓
Recovery Queue
      ↓
AI / Rule-Based Diagnosis
      ↓
Confidence Score
      ↓
Recommended Recovery Action
      ↓
Policy Validation
      ↓
Allowed / Blocked
      ↓
Recovery Attempt / Manual Review
      ↓
Audit Logging
      ↓
Recovery Analytics
```

---

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- Axios

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic

### Database

- PostgreSQL

### Payment Gateway

- Razorpay Test Mode

### AI

- OpenAI API for model-backed recovery reasoning
- Deterministic rule engine as fallback

### Development Tools

- Visual Studio Code
- Git
- GitHub
- Swagger / OpenAPI

---

## Database Design

The project uses the following PostgreSQL tables:

- `customers`
- `orders`
- `payments`
- `recovery_attempts`
- `ai_decisions`
- `policy_decisions`
- `audit_logs`

### customers
Stores customer information.

### orders
Stores order information.

### payments
Stores payment attempts, failures, amount, method, status, and recovery attempt count.

### ai_decisions
Stores failure diagnosis, confidence score, recommended action, and reasoning.

### policy_decisions
Stores whether a recommendation was allowed or blocked and the reason.

### recovery_attempts
Stores recovery actions and outcomes.

### audit_logs
Stores important events in the recovery lifecycle.

---

## Project Structure

```text
RazorRescueAI/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── database/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── index.html
│
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── synthetic_batch.sql
│
├── docs/
│   ├── PRODUCT_SPEC.md
│   ├── razorrescue-architecture.png
│   └── screenshots/
│
├── tests/
├── .gitignore
└── README.md
```

---

## Running the Project Locally

### Prerequisites

Install:

- Python
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/ingawalemadhura5722-glitch/razorrescue-ai.git
cd razorrescue-ai
```

### 2. Configure PostgreSQL

```bash
psql -U postgres
```

Inside PostgreSQL:

```sql
CREATE DATABASE razorrescue;
\c razorrescue
```

Run the provided database SQL files as required.

### 3. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Backend Environment Variables

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/razorrescue
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
OPENAI_API_KEY=your_openai_api_key
```

**Never commit the real `.env` file to GitHub.**

### 5. Start the Backend

```bash
python -m uvicorn app.main:app --reload
```

Backend:

`http://127.0.0.1:8000`

Swagger API Documentation:

`http://127.0.0.1:8000/docs`

Health:

`http://127.0.0.1:8000/health`

System Status:

`http://127.0.0.1:8000/system-status`

### 6. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

### 7. Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

**Do not place the Razorpay Key Secret in the frontend.**

### 8. Start the Frontend

```bash
npm run dev
```

Open:

`http://localhost:5173`

---

## Important API Endpoints

### System

```text
GET /
GET /health
GET /system-status
```

### Payments

```text
GET  /api/payments/
POST /api/payments/
POST /api/payments/failed
GET  /api/payments/failed-queue
GET  /api/payments/revenue-at-risk
```

### Razorpay Orders

```text
POST /api/orders/create
POST /api/orders/verify
```

### Recovery

```text
POST /api/recovery/analyze
POST /api/recovery/execute
GET  /api/recovery/queue
GET  /api/recovery/metrics
GET  /api/recovery/ai-status
GET  /api/recovery/manual-review
GET  /api/recovery/{payment_id}/timeline
POST /api/recovery/{payment_id}/mark-recovered
```

### Batch Recovery

```text
POST /api/batch-recovery/run
GET  /api/batch-recovery/metrics
```

### Audit

```text
GET /api/audit/
```

---

## Example Demo Scenarios

### Temporary Network Failure

```text
Amount: ₹4,999
Method: UPI
Failure: NETWORK_TIMEOUT
Expected Recommendation: RETRY_PAYMENT
```

### Insufficient Funds

```text
Amount: ₹499
Failure: Insufficient funds
Expected Recommendation: REMIND_LATER
```

### UPI Limit Exceeded

```text
Failure: UPI limit exceeded
Expected Recommendation: SUGGEST_ALTERNATE_METHOD
```

### Unknown Payment Failure

```text
Failure: Unknown payment failure
Expected Recommendation: ESCALATE
```

### High-Value Payment

```text
Amount: ₹75,000
Failure: NETWORK_TIMEOUT
Possible Recommendation: RETRY_PAYMENT
Policy: BLOCKED
Reason: High-value payment requires manual review.
```

### Maximum Recovery Attempts

```text
Attempt Number: 3
Expected Recommendation: STOP_RECOVERY
Policy: BLOCKED
```

---

## Dashboard Features

- Revenue at Risk
- Simulated Revenue Recovered
- Failed Payment Count
- Manual Review Count
- AI Decision Engine Status
- System Status
- Recovery Metrics
- Recovery Queue
- Recovery Decision
- Payment Search
- Status Filtering
- Payment Method Filtering
- Recovery Timeline
- Decision History
- Recovery Attempts
- Audit Events
- Manual Review Queue
- Batch Recovery
- Recovery Analytics
- Razorpay Test Payment

---

## AI Explainability

Each recovery decision can include:

- Diagnosis
- Confidence
- Recommended Action
- Reasoning
- Decision Source
- Policy Result
- Policy Reason

This makes recommendations easier to inspect and audit.

---

## Failure Resilience

```text
AI Available
    ↓
AI Decision

AI Unavailable
    ↓
Rule Engine Fallback
```

The policy layer validates recommendations regardless of their source.

---

## Security Considerations

- API secrets are stored in backend environment variables.
- Razorpay Key Secret is never exposed to the frontend.
- `.env` files are excluded from Git.
- `.env.example` contains placeholders only.
- Razorpay payment signatures are verified on the backend.
- Recovery execution is validated by the policy engine.
- High-value payments can be routed for manual review.
- Retry limits prevent unlimited recovery attempts.

---

## Prototype Limitations

RazorRescue AI is currently a buildathon prototype.

- Razorpay runs in Test Mode.
- Batch recovery outcomes are deterministic simulations.
- Synthetic/test payment data is used for batch analytics.
- No real customer payment is automatically retried.
- Simulated recovered revenue is not actual production revenue.
- AI availability depends on the external AI service.
- Rule-based fallback is used when AI analysis is unavailable.
- Authentication and merchant-level user management are not yet implemented.

---

## Future Scope

- Real payment retry orchestration with merchant authorization
- Automated payment-link generation
- Customer reminder workflows
- Email, SMS, or WhatsApp recovery communication
- Webhook-driven payment status updates
- Dynamic retry scheduling
- Merchant-specific policy configuration
- Customer risk scoring
- Recovery probability prediction
- Cost-aware recovery optimization
- Fraud and anomaly detection
- Multi-merchant architecture
- Authentication and role-based access control
- Production-grade logging and monitoring
- AI model evaluation
- Recovery strategy experimentation
- Historical recovery-performance analysis

---

## Screenshots

> Add the following section only after the image files exist in `docs/screenshots/`.

```markdown
### Merchant Dashboard

![Merchant Dashboard](docs/screenshots/dashboard.png)

### Recovery Decision

![Recovery Decision](docs/screenshots/recovery-decision.png)

### High-Value Policy Protection

![Policy Block](docs/screenshots/policy-block.png)

### Manual Review Queue

![Manual Review](docs/screenshots/manual-review.png)

### Recovery Timeline

![Recovery Timeline](docs/screenshots/timeline.png)

### Batch Recovery Analytics

![Batch Analytics](docs/screenshots/batch-analytics.png)
```

---

## Architecture Diagram

> Add this line only after `docs/razorrescue-architecture.png` exists.

```markdown
![RazorRescue AI Architecture](docs/razorrescue-architecture.png)
```

---

## Project Highlights

- AI-assisted payment failure diagnosis
- Context-aware recovery recommendations
- Deterministic safety policies
- Rule-engine fallback
- Retry stopping rules
- High-value payment protection
- Manual review routing
- Recovery timeline
- Audit logging
- Revenue-at-risk calculation
- Batch recovery simulation
- Recovery analytics
- Razorpay Test Mode integration
- PostgreSQL persistence

---

## Buildathon Track

**Track 3: AI Revenue Recovery**

RazorRescue AI focuses on:

- Detecting revenue at risk
- Diagnosing payment failures
- Selecting recovery actions
- Executing bounded recovery workflows
- Preventing unsafe automation
- Escalating risky cases
- Measuring recovery performance across batches
- Maintaining an auditable decision history

---

## Team

**Project:** RazorRescue AI

**Built for:** Razorpay AI Buildathon 2026

**Developer:** Madhura Mahesh Ingawale

---

## Disclaimer

RazorRescue AI is an educational and buildathon prototype.

The project currently operates using Razorpay Test Mode and synthetic/test payment data.

Recovery outcomes shown in the dashboard are simulated for demonstration and evaluation purposes.

No real customer payment is automatically retried by the prototype.

---

## Final Summary

RazorRescue AI transforms failed payments from passive transaction records into an intelligent revenue recovery workflow.

```text
Payment Failure Detection
        ↓
AI / Rule-Based Diagnosis
        ↓
Recovery Recommendation
        ↓
Deterministic Policy Validation
        ↓
Bounded Recovery
        ↓
Manual Review
        ↓
Audit Trail
        ↓
Recovery Analytics
```

By separating AI recommendations from deterministic execution control, RazorRescue AI demonstrates how AI-powered payment recovery can remain intelligent, explainable, auditable, and safety-conscious.