import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

export const getPayments = () => {
  return api.get("/api/payments/");
};

export const createRazorpayOrder = (data) => {
  return api.post("/api/orders/create", data);
};

export const verifyRazorpayPayment = (data) => {
  return api.post("/api/orders/verify", data);
};
export const storeFailedPayment = (data) => {
  return api.post("/api/payments/failed", data);
};
export const getFailedPayments = () => {
  return api.get("/api/payments/failed-queue");
};

export const getRevenueAtRisk = () => {
  return api.get("/api/payments/revenue-at-risk");
};

export const getAuditLogs = () => {
  return api.get("/api/audit/");
};
export default api;