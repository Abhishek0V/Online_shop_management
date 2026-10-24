import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">Hardware Shop</Link>
      <nav>
        <Link to="/">Products</Link>
        {user ? (
          <>
            {isAdmin ? (
              <>
                <Link to="/admin/products">Manage products</Link>
                <Link to="/admin/orders">Orders</Link>
              </>
            ) : (
              <>
                <Link to="/my-orders">My orders</Link>
                <Link to="/cart" className="cart-link" aria-label={`Cart, ${itemCount} items`}>
                  Cart{itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
                </Link>
              </>
            )}
            <span className="nav-user">Hi, {user.first_name}</span>
            <button type="button" className="btn btn-outline" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}