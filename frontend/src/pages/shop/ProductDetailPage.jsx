import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getProduct } from "../../api/productApi";
import Loader from "../../components/Loader";
import QuantityInput from "../../components/QuantityInput";
import SparePartCard from "../../components/SparePartCard";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatCurrency";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { user, isAdmin } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selected, setSelected] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    getProduct(slug)
      .then((res) => { if (!cancelled) { setProduct(res.data); setSelected(0); setQuantity(1); } })
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [slug]);

  // kind: "product" or "spare_part"
  const handleAdd = async (kind, item, qty = 1) => {
    if (!user) {
      toast("Please log in to add items to your cart.");
      navigate("/login", { state: { from: `/products/${slug}` } });
      return;
    }
    setAdding(true);
    const key = kind === "product" ? "product_id" : "spare_part_id";
    await addItem({ [key]: item.id, quantity: qty }, item.name);
    setAdding(false);
  };

  if (loading) return <Loader />;
  if (notFound || !product) {
    return <div className="container"><p className="empty-state">Product not found. <Link to="/">Back to products</Link></p></div>;
  }

  const saving = Number(product.discount_amount);
  const mainImage = product.images[selected]?.image;

  return (
    <div className="container">
      <p className="breadcrumb"><Link to="/">Products</Link> / {product.name}</p>

      <div className="detail-grid">
        <div className="gallery">
          <div className="gallery-main">
            {mainImage ? <img src={mainImage} alt={product.name} /> : <span className="no-image">No image</span>}
          </div>
          {product.images.length > 1 && (
            <div className="gallery-thumbs">
              {product.images.map((img, i) => (
                <button type="button" key={img.id} className={i === selected ? "thumb active" : "thumb"} onClick={() => setSelected(i)} aria-label={`Show image ${i + 1}`}>
                  <img src={img.image} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="detail-info">
          <span className="product-brand">{product.brand}</span>
          <h1>{product.name}</h1>
          <span className="product-code">Model: {product.model_code}</span>
          <div className="price-row big">
            <span className="price">{formatCurrency(product.price)}</span>
            {saving > 0 && <><span className="mrp">{formatCurrency(product.mrp)}</span><span className="badge-save inline">Save {formatCurrency(saving)}</span></>}
          </div>
          {product.stock === 0 ? <span className="stock-out">Out of stock</span> : <span className="stock-in">In stock ({product.stock} available)</span>}
          {product.description && <p className="description">{product.description}</p>}
          {!isAdmin && (
            <div className="buy-row">
              <QuantityInput value={quantity} max={Math.max(product.stock, 1)} onChange={setQuantity} disabled={product.stock === 0} />
              <button type="button" className="btn btn-primary btn-lg" disabled={product.stock === 0 || adding} onClick={() => handleAdd("product", product, quantity)}>
                {adding ? "Adding..." : "Add to cart"}
              </button>
            </div>
          )}
        </div>
      </div>

      <section className="spare-section">
        <h2>Spare parts</h2>
        {product.spare_parts.length === 0 ? (
          <p className="empty-state">No spare parts listed for this product.</p>
        ) : (
          <div className="spare-grid">
            {product.spare_parts.map((part) => (
              <SparePartCard key={part.id} part={part} onAdd={(p) => handleAdd("spare_part", p)} showAction={!isAdmin} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}