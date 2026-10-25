import { formatCurrency } from "../utils/formatCurrency";

// Items, totals and shipping address of an order. Used by the customer and admin detail pages.
export default function OrderSummary({ order }) {
  return (
    <div className="order-summary">
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Item</th><th>Code</th><th>Qty</th><th>Unit price</th><th>Amount</th></tr></thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.item_name}{item.item_type === "spare_part" && <span className="muted"> (spare part)</span>}</td>
                <td>{item.item_code || "-"}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unit_price)}</td>
                <td>{formatCurrency(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="order-bottom">
        <div className="card-box">
          <h3>Shipping address</h3>
          <p>{order.ship_name}<br />{order.ship_address_line}<br />{order.ship_city}, {order.ship_state} - {order.ship_pincode}<br />Phone: {order.ship_phone}</p>
        </div>
        <div className="card-box totals">
          <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span></div>
          <div className="summary-row"><span>GST ({Number(order.gst_percent)}%)</span><span>{formatCurrency(order.tax_amount)}</span></div>
          <div className="summary-row total"><span>Total</span><span>{formatCurrency(order.total_amount)}</span></div>
        </div>
      </div>
    </div>
  );
}