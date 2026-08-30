import { useEffect, useState } from "react";

import {
  createRazorpayOrder,
  getPayments,
  verifyRazorpayPayment,
  storeFailedPayment,
  getRevenueAtRisk,
  analyzeRecovery,
  executeRecovery,
  getRecoveryQueue,
  getRecoveryMetrics,
  markPaymentRecovered,
} from "./services/api";


function App() {
  // =========================================================
  // STATE
  // =========================================================

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

  const [revenueAtRisk, setRevenueAtRisk] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const [recoveryQueue, setRecoveryQueue] = useState([]);
  const [recoveryDecision, setRecoveryDecision] = useState(null);

  const [recoveryMetrics, setRecoveryMetrics] = useState({
    total_recovery_attempts: 0,
    successful_recoveries: 0,
    total_revenue_recovered: 0,
  });


  // =========================================================
  // LOAD PAYMENTS
  // =========================================================

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


  // =========================================================
  // LOAD REVENUE AT RISK
  // =========================================================

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


  // =========================================================
  // LOAD RECOVERY QUEUE
  // =========================================================

  const loadRecoveryQueue = async () => {
    try {
      const response = await getRecoveryQueue();

      setRecoveryQueue(
        response.data.payments
      );
    } catch (err) {
      console.error(
        "Could not load recovery queue:",
        err
      );
    }
  };


  // =========================================================
  // LOAD RECOVERY METRICS
  // =========================================================

  const loadRecoveryMetrics = async () => {
    try {
      const response = await getRecoveryMetrics();

      setRecoveryMetrics(response.data);
    } catch (err) {
      console.error(
        "Could not load recovery metrics:",
        err
      );
    }
  };


  // =========================================================
  // REFRESH DASHBOARD
  // =========================================================

  const refreshDashboard = async () => {
    await Promise.all([
      loadPayments(),
      loadRevenueAtRisk(),
      loadRecoveryQueue(),
      loadRecoveryMetrics(),
    ]);
  };


  // =========================================================
  // ANALYZE FAILED PAYMENT
  // =========================================================

  const handleAnalyzeRecovery = async (paymentId) => {
    try {
      setError("");
      setPaymentMessage("");

      const response = await analyzeRecovery(paymentId);

      setRecoveryDecision(response.data);

      setPaymentMessage(
        `Payment ${paymentId} analyzed successfully.`
      );
    } catch (err) {
      console.error(
        "Could not analyze payment:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Could not analyze payment."
      );
    }
  };


  // =========================================================
  // EXECUTE RECOVERY
  // =========================================================

  const handleExecuteRecovery = async (paymentId) => {
    try {
      setError("");
      setPaymentMessage("");

      const response = await executeRecovery(paymentId);

      setPaymentMessage(
        response.data?.message ||
          "Recovery action executed successfully."
      );

      await refreshDashboard();
    } catch (err) {
      console.error(
        "Could not execute recovery:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Could not execute recovery."
      );
    }
  };


  // =========================================================
  // MARK PAYMENT AS RECOVERED
  // =========================================================

  const handleMarkRecovered = async (paymentId) => {
    try {
      setError("");
      setPaymentMessage("");

      const response =
        await markPaymentRecovered(paymentId);

      setPaymentMessage(
        response.data?.message ||
          "Payment marked as recovered successfully."
      );

      setRecoveryDecision(null);

      await refreshDashboard();
    } catch (err) {
      console.error(
        "Could not mark payment as recovered:",
        err
      );

      setError(
        err.response?.data?.detail ||
          "Could not mark payment as recovered."
      );
    }
  };


  // =========================================================
  // INITIAL PAGE LOAD
  // =========================================================

  useEffect(() => {
    loadPayments();
    loadRevenueAtRisk();
    loadRecoveryQueue();
    loadRecoveryMetrics();
  }, []);


  // =========================================================
  // CREATE RAZORPAY ORDER + OPEN CHECKOUT
  // =========================================================

  const handleCreateOrder = async () => {
    try {
      setError("");
      setPaymentMessage("");

      // -----------------------------------------------------
      // Create Razorpay order through FastAPI
      // -----------------------------------------------------

      const response = await createRazorpayOrder({
        amount: 499,
        receipt: `razorrescue_${Date.now()}`,
      });

      const order = response.data;

      console.log(
        "Razorpay order created:",
        order
      );


      // -----------------------------------------------------
      // Check Razorpay Checkout script
      // -----------------------------------------------------

      if (!window.Razorpay) {
        setError(
          "Razorpay Checkout could not load. Please refresh the page."
        );

        return;
      }


      // -----------------------------------------------------
      // Get Razorpay Key ID
      // -----------------------------------------------------

      const razorpayKey =
        import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        setError(
          "Razorpay Key ID is missing from frontend .env file."
        );

        return;
      }


      // =====================================================
      // RAZORPAY CHECKOUT CONFIGURATION
      // =====================================================

      const options = {
        key: razorpayKey,

        amount: order.amount,

        currency: order.currency,

        name: "RazorRescue AI",

        description:
          "Revenue Recovery Test Payment",

        order_id: order.id,


        // ===================================================
        // PAYMENT SUCCESS HANDLER
        // ===================================================

        handler: async function (paymentResponse) {
          try {
            console.log(
              "Payment response received:",
              paymentResponse
            );

            // -------------------------------------------------
            // Send payment information to FastAPI
            // -------------------------------------------------

            const verificationResponse =
              await verifyRazorpayPayment({
                razorpay_order_id:
                  paymentResponse.razorpay_order_id,

                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,

                razorpay_signature:
                  paymentResponse.razorpay_signature,

                // Day 3 demo order
                local_order_id: 1,

                amount: 499,
              });

            console.log(
              "Verification response:",
              verificationResponse.data
            );


            // -------------------------------------------------
            // Only show success after backend verification
            // -------------------------------------------------

            if (
              verificationResponse.data.verified
            ) {
              setPaymentMessage(
                `Payment verified successfully! Payment ID: ${paymentResponse.razorpay_payment_id}`
              );

              setError("");

              await refreshDashboard();
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


        // ===================================================
        // TEST CUSTOMER DETAILS
        // ===================================================

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


      // =====================================================
      // CREATE RAZORPAY CHECKOUT OBJECT
      // =====================================================

      const razorpay =
        new window.Razorpay(options);


      // =====================================================
      // PAYMENT FAILURE HANDLER
      // =====================================================

      razorpay.on(
        "payment.failed",
        async function (failureResponse) {
          try {
            console.error(
              "Payment failed:",
              failureResponse.error
            );

            const failureReason =
              failureResponse.error?.description ||
              "Payment could not be completed.";

            const failureCode =
              failureResponse.error?.code ||
              "UNKNOWN_ERROR";

            const paymentId =
              failureResponse.error?.metadata
                ?.payment_id || null;

            const razorpayOrderId =
              failureResponse.error?.metadata
                ?.order_id || order.id;


            // -------------------------------------------------
            // Store failed payment in PostgreSQL
            // -------------------------------------------------

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


            // -------------------------------------------------
            // Refresh dashboard after failure
            // -------------------------------------------------

            await refreshDashboard();
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


      // =====================================================
      // OPEN RAZORPAY CHECKOUT
      // =====================================================

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


  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Arial, sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      {/* =================================================== */}
      {/* HEADER */}
      {/* =================================================== */}

      <h1>RazorRescue AI</h1>

      <p>
        AI-powered Revenue Recovery Agent
      </p>

      <hr />


      {/* =================================================== */}
      {/* REVENUE AT RISK */}
      {/* =================================================== */}

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


      {/* =================================================== */}
      {/* RECOVERY METRICS */}
      {/* =================================================== */}

      <div
        style={{
          padding: "20px",
          marginTop: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h2>Recovery Metrics</h2>

        <p>
          Total Attempts:{" "}
          {
            recoveryMetrics
              .total_recovery_attempts
          }
        </p>

        <p>
          Successful Recoveries:{" "}
          {
            recoveryMetrics
              .successful_recoveries
          }
        </p>

        <p>
          Revenue Recovered: ₹
          {
            recoveryMetrics
              .total_revenue_recovered
          }
        </p>
      </div>


      {/* =================================================== */}
      {/* RECOVERY QUEUE */}
      {/* =================================================== */}

      <hr
        style={{
          marginTop: "30px",
        }}
      />

      <h2>Recovery Queue</h2>

      {recoveryQueue.length === 0 && (
        <p>
          No recoverable payments.
        </p>
      )}

      {recoveryQueue.map((payment) => (
        <div
          key={payment.id}
          style={{
            padding: "15px",
            marginBottom: "10px",
            border: "1px solid #ccc",
            borderRadius: "8px",
          }}
        >
          <p>
            <strong>
              Payment ID:
            </strong>{" "}
            {payment.id}
          </p>

          <p>
            <strong>
              Amount:
            </strong>{" "}
            ₹{payment.amount}
          </p>

          <p>
            <strong>
              Method:
            </strong>{" "}
            {payment.method || "-"}
          </p>

          <p>
            <strong>
              Failure:
            </strong>{" "}
            {payment.failure_reason || "-"}
          </p>

          <p>
            <strong>
              Attempt:
            </strong>{" "}
            {payment.attempt_number}
          </p>


          {/* ANALYZE BUTTON */}

          <button
            onClick={() =>
              handleAnalyzeRecovery(
                payment.id
              )
            }
          >
            Analyze
          </button>


          {/* EXECUTE BUTTON */}

          <button
            onClick={() =>
              handleExecuteRecovery(
                payment.id
              )
            }
            style={{
              marginLeft: "10px",
            }}
          >
            Execute Recovery
          </button>


          {/* MARK RECOVERED BUTTON */}

          <button
            onClick={() =>
              handleMarkRecovered(
                payment.id
              )
            }
            style={{
              marginLeft: "10px",
            }}
          >
            Mark Recovered
          </button>
        </div>
      ))}


      {/* =================================================== */}
      {/* RECOVERY DECISION */}
      {/* =================================================== */}

      {recoveryDecision && (
        <div
          style={{
            padding: "20px",
            marginTop: "20px",
            border: "1px solid #999",
            borderRadius: "8px",
          }}
        >
          <h2>
            Recovery Decision
          </h2>

          <p>
            <strong>
              Payment ID:
            </strong>{" "}
            {recoveryDecision.payment_id}
          </p>

          <p>
            <strong>
              Diagnosis:
            </strong>{" "}
            {recoveryDecision.diagnosis}
          </p>

          <p>
            <strong>
              Confidence:
            </strong>{" "}
            {recoveryDecision.confidence}
          </p>

          <p>
            <strong>
              Recommended Action:
            </strong>{" "}
            {
              recoveryDecision
                .recommended_action
            }
          </p>

          <p>
            <strong>
              Reasoning:
            </strong>{" "}
            {recoveryDecision.reasoning}
          </p>

          <p>
            <strong>
              Policy:
            </strong>{" "}

            {recoveryDecision.policy_allowed
              ? "Allowed"
              : "Blocked"}
          </p>

          <p>
            <strong>
              Policy Reason:
            </strong>{" "}
            {
              recoveryDecision
                .policy_reason
            }
          </p>
        </div>
      )}


      {/* =================================================== */}
      {/* ERROR MESSAGE */}
      {/* =================================================== */}

      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            border: "1px solid red",
            borderRadius: "8px",
          }}
        >
          <strong>
            Error:
          </strong>{" "}
          {error}
        </div>
      )}


      {/* =================================================== */}
      {/* SUCCESS MESSAGE */}
      {/* =================================================== */}

      {paymentMessage && (
        <div
          style={{
            marginTop: "20px",
            padding: "12px",
            border: "1px solid green",
            borderRadius: "8px",
          }}
        >
          {paymentMessage}
        </div>
      )}


      {/* =================================================== */}
      {/* PAYMENTS FROM POSTGRESQL */}
      {/* =================================================== */}

      <hr
        style={{
          marginTop: "30px",
        }}
      />

      <h2>
        Payments from PostgreSQL
      </h2>

      <button
        onClick={refreshDashboard}
      >
        Refresh Dashboard
      </button>


      {/* LOADING */}

      {loading && (
        <p>
          Loading payments...
        </p>
      )}


      {/* NO PAYMENTS */}

      {!loading &&
        payments.length === 0 && (
          <p>
            No payments found.
          </p>
        )}


      {/* =================================================== */}
      {/* PAYMENTS TABLE */}
      {/* =================================================== */}

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

                <th>
                  Order ID
                </th>

                <th>
                  Amount
                </th>

                <th>
                  Status
                </th>

                <th>
                  Method
                </th>

                <th>
                  Failure Reason
                </th>

                <th>
                  Attempt
                </th>

                <th>
                  Razorpay Payment ID
                </th>
              </tr>
            </thead>

            <tbody>
              {payments.map(
                (payment) => (
                  <tr
                    key={
                      payment.id
                    }
                  >
                    <td>
                      {payment.id}
                    </td>

                    <td>
                      {
                        payment.order_id
                      }
                    </td>

                    <td>
                      ₹{payment.amount}
                    </td>

                    <td>
                      {
                        payment.status
                      }
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
                        payment
                          .attempt_number
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


      {/* =================================================== */}
      {/* RAZORPAY TEST PAYMENT */}
      {/* =================================================== */}

      <hr
        style={{
          marginTop: "40px",
          marginBottom: "30px",
        }}
      />

      <h2>
        Razorpay Test Payment
      </h2>

      <p>
        Create a ₹499 test order and
        complete the payment using
        Razorpay Test Mode.
      </p>

      <button
        onClick={
          handleCreateOrder
        }
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