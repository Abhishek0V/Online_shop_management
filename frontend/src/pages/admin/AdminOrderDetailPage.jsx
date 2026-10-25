import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAdminOrder } from "../../api/orderApi";
import InvoiceButton from "../../components/InvoiceButton";
import Loader from "../../components/Loader";
import OrderSummary from "../../components/OrderSummary";
import StatusPill from "../../components/StatusPill";
import { formatDate } from "../../utils/formatDate";

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getAdminOrder(orderNumber)
      .then((res) => !cancelled && setOrder(res.data))
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [orderNumber]);

  if (loading) return <Loader />;
  if (notFound || !order) {
    return <div className="container"><p className="empty-state">Order not found. <Link to="/admin/orders">Back to orders</Link></p></div>;
  }

  return (
    <div className="container">
      <div className="page-head">
        <div>
          <p className="breadcrumb"><Link to="/admin/orders">Orders</Link> / {order.order_number}</p>
          <h1>Order {order.order_number}</h1>
          <p className="muted">Placed {formatDate(order.created_at)} <StatusPill status={order.status} />
            {order.paid_at && <> · Paid {formatDate(order.paid_at)}</>}</p>
        </div>
        {order.status === "paid" && <InvoiceButton orderNumber={order.order_number} />}
      </div>

      <div className="card-box customer-box">
        <h3>Customer</h3>
        <p>{order.customer_name}<br />{order.customer_email}<br />Phone: {order.customer_phone}</p>
      </div>

      <OrderSummary order={order} />
    </div>
  );
}