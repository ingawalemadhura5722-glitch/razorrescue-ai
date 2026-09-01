INSERT INTO payments
(
    order_id,
    razorpay_payment_id,
    method,
    amount,
    status,
    failure_reason,
    attempt_number
)
SELECT

    CASE
        WHEN gs % 3 = 0 THEN 3
        WHEN gs % 2 = 0 THEN 2
        ELSE 1
    END,

    'synthetic_pay_' || gs,

    CASE
        WHEN gs % 3 = 0 THEN 'CARD'
        WHEN gs % 3 = 1 THEN 'UPI'
        ELSE 'NETBANKING'
    END,

    CASE
        WHEN gs % 10 = 0
            THEN 65000
        ELSE
            499 + (gs * 100)
    END,

    'FAILED',

    CASE
        WHEN gs % 6 = 0
            THEN 'NETWORK_TIMEOUT'

        WHEN gs % 6 = 1
            THEN 'Insufficient funds'

        WHEN gs % 6 = 2
            THEN 'UPI limit exceeded'

        WHEN gs % 6 = 3
            THEN 'Customer cancelled'

        WHEN gs % 6 = 4
            THEN 'BANK_SERVER_ERROR'

        ELSE
            'Unknown payment failure'
    END,

    1

FROM generate_series(
    100,
    149
) AS gs;