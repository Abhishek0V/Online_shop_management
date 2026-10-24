import { useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../../components/Loader";
import QuantityInput from "../../components/QuantityInput";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatCurrency";

export default function CartPage() {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const [busyId, setBusyId] = useState(null);

  const withBusy = async (id, action) => {
    setBusyId(id);
    await action();
    setBusyId(null);
  };

  if (loading) return <Loader />;

  if (cart.items.length === 0) {
    return (
      <div className="container">
        <h1>Your cart</h1>
        <p className="empty-state">Your cart is empty. <Link to="/">Browse products</Link></p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Your cart</h1>
      {cart.has_issues && (
        <div className="form-error" role="alert">
          Some items are unavailable or exceed the available stock. Update or remove them to continue.
        </div>
      )}

      <div className="cart-layout">
        <div className="cart-lines">
          {cart.items.map((item) => (
            <div key={item.id} className={item.available ? "cart-line" : "cart-line unavailable"}>
              <div className="cart-img">
                {item.image ? <img src={item.image} alt="" /> : <span className="no-image">No image</span>}
              </div>
              <div className="cart-info">
                <strong>{item.name}</strong>
                <span className="muted">{item.subtitle}</span>
                <span>{formatCurrency(item.unit_price)}</span>
                {!item.available && <span className="stock-out">Only {item.stock} available, please adjust.</span>}
              </div>
              <QuantityInput
                value={item.quantity} max={Math.max(item.stock, 1)} disabled={busyId === item.id}
                onChange={(q) => withBusy(item.id, () => updateQuantity(item.id, q))}
              />
              <div className="cart-total">{formatCurrency(item.line_total)}</div>
              <button type="button" className="link-btn danger" disabled={busyId === item.id}
                onClick={() => withBusy(item.id, () => removeItem(item.id))}>Remove</button>
            </div>
          ))}
        </div>

        <aside className="summary-card">
          <h2>Order summary</h2>
          <div className="summary-row"><span>Subtotal ({cart.total_quantity} items)</span><span>{formatCurrency(cart.subtotal)}</span></div>
          <div className="summary-row"><span>GST ({Number(cart.gst_percent)}%)</span><span>{formatCurrency(cart.tax_amount)}</span></div>
          <div className="summary-row total"><span>Total</span><span>{formatCurrency(cart.total)}</span></div>
          {cart.has_issues ? (
            <button type="button" className="btn btn-primary btn-block" disabled>Proceed to checkout</button>
          ) : (
            <Link to="/checkout" className="btn btn-primary btn-block">Proceed to checkout</Link>
          )}
          <Link to="/" className="auth-footer">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}