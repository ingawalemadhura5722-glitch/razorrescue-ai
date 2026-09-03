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
  getAIStatus,
  runBatchRecovery,
  getBatchMetrics,
  getRecoveryTimeline,
  getManualReviewQueue,
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
  const [aiStatus, setAIStatus] = useState({
  ai_enabled: false,
  status: "UNKNOWN",
});
  const [batchResult, setBatchResult] =
  useState(null);

const [batchRunning, setBatchRunning] =
  useState(false);

const [batchMetrics, setBatchMetrics] =
  useState({
    total_recovery_attempts: 0,
    successful_recoveries: 0,
    simulated_revenue_recovered: 0,
    remaining_failed_payments: 0,
    recovered_payments: 0,
  });
  
  const [
  selectedPayment,
  setSelectedPayment
] = useState(null);

const [
  paymentTimeline,
  setPaymentTimeline
] = useState(null);

const [
  timelineLoading,
  setTimelineLoading
] = useState(false);

const [
  manualReview,
  setManualReview
] = useState({
  count: 0,
  payments: [],
});

const [
  searchTerm,
  setSearchTerm
] = useState("");

const [
  statusFilter,
  setStatusFilter
] = useState("ALL");

const [
  methodFilter,
  setMethodFilter
] = useState("ALL");


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
  const formatCurrency =
  (value) => {

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }
    ).format(
      Number(value || 0)
    );
  };
  
  const formatDate =
  (dateValue) => {

    if (!dateValue) {
      return "-";
    }

    return new Date(
      dateValue
    ).toLocaleString(
      "en-IN"
    );
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
    loadBatchMetrics(),
    loadManualReview(),
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

  const loadAIStatus = async () => {
    try {
      const response = await getAIStatus();
      setAIStatus(response.data);
    } catch (err) {
      console.error(
        "Could not load AI status:",
        err
      );
    }
  };
  const loadBatchMetrics = async () => {
  try {
    const response =
      await getBatchMetrics();

    setBatchMetrics(
      response.data
    );
  } catch (err) {
    console.error(
      "Could not load batch metrics:",
      err
    );
  }
};
  const handleRunBatchRecovery =
  async () => {

    try {

      setBatchRunning(true);
      setError("");
      setPaymentMessage("");

      const response =
        await runBatchRecovery(50);

      setBatchResult(
        response.data
      );

      setPaymentMessage(
        "Batch recovery simulation completed successfully."
      );

      await refreshDashboard();
      await loadBatchMetrics();

    } catch (err) {

      console.error(
        "Batch recovery failed:",
        err
      );

      setError(
        err.response?.data?.detail ||
        "Could not run batch recovery."
      );

    } finally {

      setBatchRunning(false);
    }
  };

  const loadManualReview = async () => {
  try {

    const response =
      await getManualReviewQueue();

    setManualReview(
      response.data
    );

  } catch (err) {

    console.error(
      "Could not load manual review queue:",
      err
    );
  }
};

const handleViewTimeline =
  async (paymentId) => {

    try {

      setTimelineLoading(true);
      setSelectedPayment(
        paymentId
      );

      const response =
        await getRecoveryTimeline(
          paymentId
        );

      setPaymentTimeline(
        response.data
      );

    } catch (err) {

      console.error(
        "Could not load recovery timeline:",
        err
      );

      setError(
        "Could not load payment timeline."
      );

    } finally {

      setTimelineLoading(false);

    }
  };

useEffect(() => {
  loadPayments();
  loadRevenueAtRisk();
  loadRecoveryQueue();
  loadRecoveryMetrics();
  loadAIStatus();
  loadBatchMetrics();
  loadManualReview();
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
  // FILTER PAYMENTS - DAY 6
  // =========================================================

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      String(payment.id).includes(searchTerm) ||
      (payment.failure_reason || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      payment.status === statusFilter;

    const matchesMethod =
      methodFilter === "ALL" ||
      (payment.method || "").toUpperCase() === methodFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesMethod
    );
  });

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

<p
  style={{
    marginTop: "4px",
    marginBottom: "24px",
    color: "#666",
  }}
>
  AI-powered revenue recovery
  operations dashboard
</p>
<div
  style={{
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "20px",
  }}
>
  <span
    style={{
      padding: "6px 12px",
      border: "1px solid #ccc",
      borderRadius: "20px",
      fontSize: "13px",
    }}
  >
    Environment: Test Mode
  </span>

  <span
    style={{
      padding: "6px 12px",
      border: "1px solid #ccc",
      borderRadius: "20px",
      fontSize: "13px",
    }}
  >
    Recovery: Demo Simulation
  </span>

  <span
    style={{
      padding: "6px 12px",
      border: "1px solid #ccc",
      borderRadius: "20px",
      fontSize: "13px",
    }}
  >
    AI: {aiStatus.status}
  </span>
</div>

      {/* =================================================== */}
      {/* SUMMARY METRICS GRID */}
      {/* =================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "18px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <small>Revenue at Risk</small>
          <h2>
        {formatCurrency(revenueAtRisk)}
        </h2>
        </div>

        <div
          style={{
            padding: "18px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <small>Simulated Recovered</small>
          <h2>
 {formatCurrency(
    batchMetrics.simulated_revenue_recovered
  )}          
  </h2>
        </div>

        <div
          style={{
            padding: "18px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <small>Failed Payments</small>
          <h2>
            {batchMetrics.remaining_failed_payments ?? 0}
          </h2>
        </div>

        <div
          style={{
            padding: "18px",
            border: "1px solid #ddd",
            borderRadius: "10px",
          }}
        >
          <small>Manual Review</small>
          <h2>{manualReview.count ?? 0}</h2>
        </div>
      </div>

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
      {formatCurrency(revenueAtRisk)}
        </h3>

        <p>
          Failed Payments: {failedCount}
        </p>
      </div>

      {/* =================================================== */}
      {/* AI DECISION ENGINE */}
      {/* =================================================== */}

      <div
        style={{
          padding: "20px",
          marginTop: "20px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      >
        <h2>AI Decision Engine</h2>

        <p>
          <strong>Status:</strong>{" "}
          {aiStatus.status}
        </p>

        <p>
          <strong>Primary Engine:</strong>{" "}
          {aiStatus.ai_enabled
            ? "AI Model"
            : "Deterministic Rule Engine"}
        </p>

        <p>
          <strong>Fallback Engine:</strong>{" "}
          {aiStatus.fallback_engine || "RULE_ENGINE"}
        </p>

        <p
          style={{
            marginTop: "12px",
            fontSize: "14px",
            color: "#555",
          }}
        >
          RazorRescue AI uses AI to analyze payment failures and
          recommend recovery actions. If the AI service is unavailable,
          the deterministic rule engine provides a fallback decision.
        </p>

        <p
          style={{
            fontSize: "14px",
            color: "#555",
          }}
        >
          Every recommended action is checked by the policy engine
          before recovery execution.
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
            Decision Source:
          </strong>{" "}
           {recoveryDecision.decision_source}
          </p>

          <p>
            <strong>
              Confidence:
            </strong>{" "}
            {Math.round(
              recoveryDecision.confidence * 100
              )}%
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
      {/* SEARCH AND FILTERS - DAY 6 */}
      {/* =================================================== */}

      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          marginTop: "20px",
          marginBottom: "16px",
        }}
      >
        <input
          type="text"
          placeholder="Search payment ID or failure..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
          style={{
            padding: "10px",
            minWidth: "240px",
          }}
        />

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value)
          }
          style={{
            padding: "10px",
          }}
        >
          <option value="ALL">All Statuses</option>
          <option value="FAILED">Failed</option>
          <option value="RECOVERED">Recovered</option>
          <option value="SUCCESS">Success</option>
        </select>

        <select
          value={methodFilter}
          onChange={(e) =>
            setMethodFilter(e.target.value)
          }
          style={{
            padding: "10px",
          }}
        >
          <option value="ALL">All Methods</option>
          <option value="UPI">UPI</option>
          <option value="CARD">Card</option>
          <option value="NETBANKING">Net Banking</option>
        </select>
      </div>

      {!loading &&
        payments.length > 0 &&
        filteredPayments.length === 0 && (
          <p>No payments match the selected filters.</p>
        )}

      {/* =================================================== */}
      {/* PAYMENTS TABLE */}
      {/* =================================================== */}

      {filteredPayments.length > 0 && (
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

                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.map(
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
                       {formatCurrency(payment.amount)}
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

                    <td>
                      <button
                        onClick={() =>
                          handleViewTimeline(payment.id)
                        }
                      >
                        View Timeline
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* =================================================== */}
      {/* RECOVERY TIMELINE */}
      {/* =================================================== */}

      {selectedPayment && (
        <div
          style={{
            marginTop: "24px",
            padding: "20px",
            border: "1px solid #bbb",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <h2>Recovery Timeline</h2>

            <button
              onClick={() => {
                setSelectedPayment(null);
                setPaymentTimeline(null);
              }}
            >
              Close
            </button>
          </div>

          {timelineLoading && <p>Loading timeline...</p>}

          {!timelineLoading && paymentTimeline && (
            <>
              <h3>Payment #{paymentTimeline.payment.id}</h3>

              <p>
                <strong>Amount:</strong>{" "}
                ₹{paymentTimeline.payment.amount}
              </p>

              <p>
                <strong>Method:</strong>{" "}
                {paymentTimeline.payment.method || "N/A"}
              </p>

              <p>
                <strong>Failure:</strong>{" "}
                {paymentTimeline.payment.failure_reason || "N/A"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {paymentTimeline.payment.status}
              </p>

              <h3>Decision History</h3>

              {paymentTimeline.decisions.length === 0 ? (
                <p>No recovery analysis yet.</p>
              ) : (
                paymentTimeline.decisions.map((decision) => (
                  <div
                    key={decision.ai_decision_id}
                    style={{
                      padding: "14px",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}
                  >
                    <p>
                      <strong>Diagnosis:</strong>{" "}
                      {decision.diagnosis}
                    </p>

                    <p>
                      <strong>Confidence:</strong>{" "}
                      {(decision.confidence * 100).toFixed(0)}%
                    </p>

                    <p>
                      <strong>Recommended Action:</strong>{" "}
                      {decision.recommended_action}
                    </p>

                    <p>
                      <strong>Reasoning:</strong>{" "}
                      {decision.reasoning}
                    </p>

                    {decision.policy && (
                      <>
                        <p>
                          <strong>Policy:</strong>{" "}
                          {decision.policy.allowed
                            ? "Allowed"
                            : "Blocked"}
                        </p>

                        <p>
                          <strong>Policy Reason:</strong>{" "}
                          {decision.policy.reason}
                        </p>
                      </>
                    )}
                  </div>
                ))
              )}

              <h3>Recovery Attempts</h3>

              {paymentTimeline.recovery_attempts.length === 0 ? (
                <p>No recovery attempts recorded.</p>
              ) : (
                paymentTimeline.recovery_attempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <strong>{attempt.action}</strong>
                    <p>Status: {attempt.status}</p>
                    <p>Attempt: {attempt.attempt_number}</p>
                    <p>
                      Simulated Recovered: ₹
                      {attempt.amount_recovered}
                    </p>
                  </div>
                ))
              )}

              <h3>Audit Events</h3>

              {paymentTimeline.audit_logs.length === 0 ? (
                <p>No audit events.</p>
              ) : (
                paymentTimeline.audit_logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: "10px 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <strong>{log.event_type}</strong>
                    <p>Actor: {log.actor}</p>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}

      {/* =================================================== */}
      {/* MANUAL REVIEW QUEUE */}
      {/* =================================================== */}

      <div
        style={{
          marginTop: "24px",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "10px",
          overflowX: "auto",
        }}
      >
        <h2>Manual Review Queue</h2>

        <p>
          Payments blocked from automatic recovery by policy.
        </p>

        <p>
          <strong>Pending Reviews:</strong>{" "}
          {manualReview.count}
        </p>

        {manualReview.payments.length === 0 ? (
          <p>No payments currently require manual review.</p>
        ) : (
          <table
            border="1"
            cellPadding="10"
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th>Payment</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {manualReview.payments.map((payment) => (
                <tr key={payment.payment_id}>
                  <td>#{payment.payment_id}</td>
                  <td> {formatCurrency(payment.amount)}</td>
                  <td>{payment.policy_reason}</td>
                  <td>
                    <button
                      onClick={() =>
                        handleViewTimeline(payment.payment_id)
                      }
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div
  style={{
    padding: "20px",
    marginTop: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
  }}
>
  <h2>
    Batch Revenue Recovery
  </h2>

  <p>
    Analyze and simulate bounded
    recovery across failed payments.
  </p>

  <button
    onClick={
      handleRunBatchRecovery
    }
    disabled={batchRunning}
  >
    {batchRunning
      ? "Running Batch..."
      : "Run 50-Payment Recovery Batch"}
  </button>

  <p
    style={{
      marginTop: "10px",
      fontSize: "13px",
    }}
  >
    Demo simulation only — no real
    payment retries are performed.
  </p>
</div>
{batchResult && (
  <div
    style={{
      padding: "20px",
      marginTop: "20px",
      border: "1px solid #999",
      borderRadius: "8px",
    }}
  >
    <h2>
      Latest Batch Result
    </h2>

    <p>
      <strong>
        Payments Processed:
      </strong>{" "}
      {batchResult.total_processed}
    </p>

    <p>
      <strong>
        Recovered:
      </strong>{" "}
      {batchResult.recovered_count}
    </p>

    <p>
      <strong>
        Pending:
      </strong>{" "}
      {batchResult.pending_count}
    </p>

    <p>
      <strong>
        Escalated:
      </strong>{" "}
      {batchResult.escalated_count}
    </p>

    <p>
      <strong>
        Blocked:
      </strong>{" "}
      {batchResult.blocked_count}
    </p>

    <p>
      <strong>
        Revenue at Risk:
      </strong>{" "}
      ₹
      {
        batchResult
          .total_revenue_at_risk
      }
    </p>

    <p>
      <strong>
        Simulated Revenue Recovered:
      </strong>{" "}
      ₹
      {
        batchResult
          .total_revenue_recovered
      }
    </p>

    <p>
      <strong>
        Recovery Rate:
      </strong>{" "}
      {batchResult.recovery_rate}%
    </p>
  </div>
)}
<div
  style={{
    padding: "20px",
    marginTop: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
  }}
>
  <h2>
    Recovery Analytics
  </h2>

  <p>
    <strong>
      Total Attempts:
    </strong>{" "}
    {
      batchMetrics
        .total_recovery_attempts
    }
  </p>

  <p>
    <strong>
      Successful Recoveries:
    </strong>{" "}
    {
      batchMetrics
        .successful_recoveries
    }
  </p>

  <p>
    <strong>
      Simulated Revenue Recovered:
    </strong>{" "}
    ₹
    {
      batchMetrics
        .simulated_revenue_recovered
    }
  </p>

  <p>
    <strong>
      Remaining Failed:
    </strong>{" "}
    {
      batchMetrics
        .remaining_failed_payments
    }
  </p>

  <p>
    <strong>
      Recovered Payments:
    </strong>{" "}
    {
      batchMetrics
        .recovered_payments
    }
  </p>
</div>

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