import { useEffect, useState } from "react";

import {
  createRazorpayOrder,
  getPayments,
  verifyRazorpayPayment,
  storeFailedPayment,
  getRevenueAtRisk,
} from "./services/api";
function App() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [revenueAtRisk, setRevenueAtRisk] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  // ----------------------------------------
  // Load payments from PostgreSQL
  // ----------------------------------------
  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getPayments();
      setPayments(response.data);
    } catch (err) {
      console.error("Error loading payments:", err);

      setError(
        "Could not load payments from backend."
      );
    } finally {
      setLoading(false);
    }
  };
  const loadRevenueAtRisk = async () => {
  try {
    const response = await getRevenueAtRisk();

    setRevenueAtRisk(
      response.data.revenue_at_risk
    );

    setFailedCount(
      response.data.failed_payment_count
    );
  } catch (err) {
    console.error(
      "Error loading revenue at risk:",
      err
    );
  }
};
  useEffect(() => {
    loadPayments();
    loadRevenueAtRisk();
  }, []);

  // ----------------------------------------
  // Create Razorpay Order + Open Checkout
  // ----------------------------------------
  const handleCreateOrder = async () => {
    try {
      setError("");
      setPaymentMessage("");

      // Create Razorpay order through FastAPI
      const response = await createRazorpayOrder({
        amount: 499,
        receipt: `razorrescue_${Date.now()}`,
      });

      const order = response.data;

      console.log(
        "Razorpay order created:",
        order
      );

      // Check Razorpay Checkout script
      if (!window.Razorpay) {
        setError(
          "Razorpay Checkout could not load. Please refresh the page."
        );
        return;
      }

      // Get Razorpay Key ID
      const razorpayKey =
        import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        setError(
          "Razorpay Key ID is missing from frontend .env file."
        );
        return;
      }

      // ----------------------------------------
      // Razorpay Checkout configuration
      // ----------------------------------------
      const options = {
        key: razorpayKey,

        amount: order.amount,

        currency: order.currency,

        name: "RazorRescue AI",

        description:
          "Revenue Recovery Test Payment",

        order_id: order.id,

        // ----------------------------------------
        // SUCCESS HANDLER
        // ----------------------------------------
        handler: async function (
          paymentResponse
        ) {
          try {
            console.log(
              "Payment response received:",
              paymentResponse
            );

            // Send Razorpay response to FastAPI
            // for secure signature verification
            const verificationResponse =
              await verifyRazorpayPayment({
                 razorpay_order_id:
      paymentResponse.razorpay_order_id,

    razorpay_payment_id:
      paymentResponse.razorpay_payment_id,

    razorpay_signature:
      paymentResponse.razorpay_signature,

    local_order_id: 1,

    amount: 499,
  });

            console.log(
              "Verification response:",
              verificationResponse.data
            );

            // Only show success after backend verifies
            if (
              verificationResponse.data.verified
            ) {
              setPaymentMessage(
                `Payment verified successfully! Payment ID: ${paymentResponse.razorpay_payment_id}`
              );

              setError("");
            }
          } catch (err) {
            console.error(
              "Payment verification failed:",
              err
            );

            setPaymentMessage("");

            setError(
              err.response?.data?.detail ||
                "Payment verification failed."
            );
          }
        },

        // ----------------------------------------
        // Test Customer Details
        // ----------------------------------------
        prefill: {
          name: "Test Customer",
          email: "test@example.com",
          contact: "9999999999",
        },

        notes: {
          project: "RazorRescue AI",
        },

        theme: {
          color: "#3399cc",
        },
      };

      // Create Razorpay Checkout object
      const razorpay =
        new window.Razorpay(options);

      // ----------------------------------------
      // PAYMENT FAILURE HANDLER
      // ----------------------------------------
razorpay.on(
  "payment.failed",
  async function (response) {
    try {
      console.error(
        "Payment failed:",
        response.error
      );

      const failureReason =
        response.error?.description ||
        "Payment could not be completed.";

      const failureCode =
        response.error?.code ||
        "UNKNOWN_ERROR";

      const paymentId =
        response.error?.metadata?.payment_id ||
        null;

      const razorpayOrderId =
        response.error?.metadata?.order_id ||
        order.id;

      await storeFailedPayment({
        local_order_id: 1,
        amount: 499,

        razorpay_order_id:
          razorpayOrderId,

        razorpay_payment_id:
          paymentId,

        method: "RAZORPAY",

        failure_reason:
          failureReason,

        failure_code:
          failureCode,
      });

      setPaymentMessage("");

      setError(
        `Payment Failed: ${failureReason}`
      );

      await loadPayments();
      await loadRevenueAtRisk();

    } catch (err) {
      console.error(
        "Could not store failed payment:",
        err
      );

      setError(
        "Payment failed and could not be stored."
      );
    }
  }
);

      // Open Razorpay Checkout
      razorpay.open();
    } catch (err) {
      console.error(
        "Error creating Razorpay order:",
        err
      );

      const backendMessage =
        err.response?.data?.detail;

      setError(
        backendMessage ||
          "Could not create Razorpay test order."
      );
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* HEADER */}

      <h1>RazorRescue AI</h1>

      <p>
        AI-powered Revenue Recovery Agent
      </p>
      <div
  style={{
    marginTop: "20px",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
  }}
>
  <h2>Revenue at Risk</h2>

  <h3>
    ₹{revenueAtRisk}
  </h3>

  <p>
    Failed Payments: {failedCount}
  </p>
</div>
      <hr />

      {/* PAYMENTS SECTION */}

      <h2>Payments from PostgreSQL</h2>

      <button onClick={loadPayments}>
        Refresh Payments
      </button>

      {loading && (
        <p>Loading payments...</p>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            border: "1px solid red",
          }}
        >
          <strong>Error:</strong>{" "}
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {paymentMessage && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            border: "1px solid green",
          }}
        >
          ✅ {paymentMessage}
        </div>
      )}

      {!loading &&
        payments.length === 0 && (
          <p>No payments found.</p>
        )}

      {/* PAYMENTS TABLE */}

      {payments.length > 0 && (
        <div
          style={{
            overflowX: "auto",
            marginTop: "20px",
          }}
        >
          <table
            border="1"
            cellPadding="10"
            style={{
              borderCollapse:
                "collapse",
              width: "100%",
            }}
          >
            <thead>
              <tr>
                <th>ID</th>
                <th>Order ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Method</th>
                <th>
                  Failure Reason
                </th>
                <th>Attempt</th>
                <th>
                  Razorpay Payment ID
                </th>
              </tr>
            </thead>

            <tbody>
              {payments.map(
                (payment) => (
                  <tr key={payment.id}>
                    <td>
                      {payment.id}
                    </td>

                    <td>
                      {payment.order_id}
                    </td>

                    <td>
                      ₹{payment.amount}
                    </td>

                    <td>
                      {payment.status}
                    </td>

                    <td>
                      {payment.method ||
                        "-"}
                    </td>

                    <td>
                      {payment.failure_reason ||
                        "-"}
                    </td>

                    <td>
                      {
                        payment.attempt_number
                      }
                    </td>

                    <td>
                      {payment.razorpay_payment_id ||
                        "-"}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* RAZORPAY SECTION */}

      <hr
        style={{
          marginTop: "40px",
          marginBottom: "30px",
        }}
      />

      <h2>Razorpay Test Payment</h2>

      <p>
        Create a ₹499 test order and
        complete the payment using
        Razorpay Test Mode.
      </p>

      <button
        onClick={handleCreateOrder}
        style={{
          padding: "12px 20px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Pay ₹499
      </button>

      <p
        style={{
          marginTop: "15px",
          fontSize: "14px",
        }}
      >
        Test Mode only — no real money
        is processed.
      </p>
    </div>
  );
}

export default App;