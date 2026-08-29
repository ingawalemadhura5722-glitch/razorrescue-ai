-- ============================================
-- RazorRescue AI Database Schema
-- ============================================

-- Customers
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Orders
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
);


-- Payments
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL,
    razorpay_payment_id VARCHAR(100),
    method VARCHAR(50),
    amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(30) NOT NULL,
    failure_reason VARCHAR(100),
    attempt_number INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
);


-- Recovery Attempts
CREATE TABLE recovery_attempts (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER NOT NULL,
    action VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL,
    amount_recovered NUMERIC(12, 2) DEFAULT 0,
    attempt_number INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_recovery_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
);


-- AI Decisions
CREATE TABLE ai_decisions (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER NOT NULL,
    diagnosis TEXT NOT NULL,
    confidence NUMERIC(5, 2),
    recommended_action VARCHAR(100) NOT NULL,
    reasoning TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ai_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
);


-- Policy Decisions
CREATE TABLE policy_decisions (
    id SERIAL PRIMARY KEY,
    ai_decision_id INTEGER NOT NULL,
    allowed BOOLEAN NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_policy_ai
        FOREIGN KEY (ai_decision_id)
        REFERENCES ai_decisions(id)
);


-- Audit Logs
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER,
    event_type VARCHAR(50) NOT NULL,
    actor VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
);