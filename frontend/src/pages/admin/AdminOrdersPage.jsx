import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAdminOrders } from "../../api/orderApi";
import InvoiceButton from "../../components/InvoiceButton";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import StatusPill from "../../components/StatusPill";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [input, setInput] = useState("");
  const search = useDebounce(input.trim());
  const [data, setData] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { setPage(1); }, [search, status]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listAdminOrders({ page, status: status || undefined, search: search || undefined })
      .then((res) => !cancelled && setData(res.data))
      .catch(() => !cancelled && setError("Could not load orders."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [page, status, search]);

  return (
    <div className="container">
      <div className="page-head">
        <h1>Orders</h1>
        <div className="head-actions">
          <input type="search" className="search-input" placeholder="Order no, customer email or name..." value={input} onChange={(e) => setInput(e.target.value)} aria-label="Search orders" />
          <select className="search-input" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending_payment">Pending payment</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? <Loader /> : error ? <div className="form-error" role="alert">{error}</div> : data.results.length === 0 ? (
        <p className="empty-state">No orders found.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Invoice</th></tr></thead>
              <tbody>
                {data.results.map((o) => (
                  <tr key={o.order_number}>
                    <td><Link to={`/admin/orders/${o.order_number}`}>{o.order_number}</Link></td>
                    <td>{o.customer_name}<br /><span className="muted">{o.customer_email}</span></td>
                    <td>{formatDate(o.created_at)}</td>
                    <td>{o.item_count}</td>
                    <td>{formatCurrency(o.total_amount)}</td>
                    <td><StatusPill status={o.status} /></td>
                    <td>{o.status === "paid" ? <InvoiceButton orderNumber={o.order_number} className="link-btn">Download</InvoiceButton> : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} count={data.count} pageSize={12} onChange={setPage} />
        </>
      )}
    </div>
  );
}