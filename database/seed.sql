-- ============================================
-- RazorRescue AI Demo Data
-- ============================================

INSERT INTO customers (name, email, phone)
VALUES
('Rahul Sharma', 'rahul@example.com', '9876543210'),
('Priya Patil', 'priya@example.com', '9876543211'),
('Amit Deshmukh', 'amit@example.com', '9876543212');


INSERT INTO orders (customer_id, amount, currency, status)
VALUES
(1, 4999.00, 'INR', 'PAYMENT_FAILED'),
(2, 2499.00, 'INR', 'PAYMENT_FAILED'),
(3, 999.00, 'INR', 'PAYMENT_SUCCESS');


INSERT INTO payments
(order_id, razorpay_payment_id, method, amount, status, failure_reason, attempt_number)
VALUES
(1, 'pay_demo_001', 'UPI', 4999.00, 'FAILED', 'BANK_SERVER_ERROR', 1),
(2, 'pay_demo_002', 'CARD', 2499.00, 'FAILED', 'NETWORK_TIMEOUT', 1),
(3, 'pay_demo_003', 'UPI', 999.00, 'SUCCESS', NULL, 1);