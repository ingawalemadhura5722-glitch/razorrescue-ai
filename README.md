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

## Merchant Operations Dashboard

RazorRescue AI provides a merchant-facing
operations dashboard for monitoring failed
payments and recovery activity.

### Dashboard Capabilities

- Revenue-at-risk monitoring
- Simulated recovered-revenue metrics
- Failed payment tracking
- Search and filtering
- AI/rule decision visibility
- Confidence and reasoning display
- Policy decision visibility
- Manual review queue
- Recovery attempt history
- Payment recovery timeline
- Audit event visibility
- High-value transaction protection
- Maximum automated recovery attempts
- AI fallback through a deterministic rule engine

### Safety Architecture

The AI decision layer does not directly control
payment execution.

Every recommended action is evaluated by a
deterministic policy engine before execution.

Examples of policy controls include:

- High-value transaction protection
- Maximum retry attempts
- Minimum decision confidence
- Explicit action allow-list
- Manual review escalation

### Prototype Notice

Recovery results displayed in the current
prototype are deterministic simulations
performed on synthetic/test payment data.

The prototype does not claim that simulated
revenue represents real production money
recovered from customers.