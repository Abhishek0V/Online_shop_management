import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/formatCurrency";

export default function ProductCard({ product }) {
  const saving = Number(product.discount_amount);
  return (
    <Link to={`/products/${product.slug}`} className="product-card">
      <div className="product-card-img">
        {saving > 0 && <span className="badge-save">Save {formatCurrency(saving)}</span>}
        {product.primary_image ? <img src={product.primary_image} alt={product.name} loading="lazy" /> : <span className="no-image">No image</span>}
      </div>
      <div className="product-card-body">
        <span className="product-brand">{product.brand}</span>
        <h3>{product.name}</h3>
        <span className="product-code">[{product.model_code}]</span>
        <div className="price-row">
          <span className="price">{formatCurrency(product.price)}</span>
          {saving > 0 && <span className="mrp">{formatCurrency(product.mrp)}</span>}
        </div>
        {product.stock === 0 && <span className="stock-out">Out of stock</span>}
      </div>
    </Link>
  );
}