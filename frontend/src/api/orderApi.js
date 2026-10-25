import axiosClient from "./axiosClient";

// Customer
export const startCheckout = (shipping) => axiosClient.post("/orders/checkout/", shipping);
export const verifyPayment = (payload) => axiosClient.post("/payments/verify/", payload);
export const reportPaymentFailed = (razorpayOrderId) =>
  axiosClient.post("/payments/failed/", { razorpay_order_id: razorpayOrderId });
export const listMyOrders = (params) => axiosClient.get("/orders/", { params });
export const getMyOrder = (orderNumber) => axiosClient.get(`/orders/${orderNumber}/`);

// Admin
export const listAdminOrders = (params) => axiosClient.get("/admin/orders/", { params });
export const getAdminOrder = (orderNumber) => axiosClient.get(`/admin/orders/${orderNumber}/`);

// Invoice PDF (customers: own orders, admin: any). Sent with the login token, then saved as a file.
export async function downloadInvoice(orderNumber) {
  const res = await axiosClient.get(`/orders/${orderNumber}/invoice/`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${orderNumber.replace("ORD-", "INV-")}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}