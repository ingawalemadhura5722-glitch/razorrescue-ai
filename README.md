# RazorRescue AI

AI-powered Revenue Recovery Agent built for the Razorpay Buildathon.

## Features

- Razorpay Test Mode integration
- Secure payment signature verification
- PostgreSQL payment storage
- Failed payment tracking
- Revenue-at-risk calculation
- Audit logs
- FastAPI backend
- React frontend

## Tech Stack

- React + Vite
- FastAPI
- PostgreSQL
- SQLAlchemy
- Razorpay

## Batch Revenue Recovery

RazorRescue AI can process a batch of failed
payments and determine a bounded recovery
workflow for each transaction.

The recovery pipeline includes:

- AI-powered failure diagnosis
- Confidence scoring
- Recommended recovery action
- Policy validation
- Maximum retry limits
- High-value payment protection
- Manual escalation
- Deterministic recovery simulation
- Recovery metrics
- Audit logging

### Batch Metrics

The system measures:

- Total revenue at risk
- Simulated revenue recovered
- Recovery rate
- Successful recoveries
- Pending recoveries
- Escalated payments
- Policy-blocked payments

> Recovery outcomes in the current prototype
> are simulated on synthetic/test data.
> No real customer payment is automatically
> retried by the simulator.