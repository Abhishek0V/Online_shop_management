import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getProduct } from "../../api/productApi";
import Loader from "../../components/Loader";
import SparePartCard from "../../components/SparePartCard";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/formatCurrency";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    getProduct(slug)
      .then((res) => { if (!cancelled) { setProduct(res.data); setSelected(0); } })
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [slug]);

  // Cart API is connected in the next step; for now only the login check is real.
  const handleAdd = (item) => {
    if (!user) {
      toast("Please log in to add items to your cart.");
      navigate("/login", { state: { from: `/products/${slug}` } });
      return;
    }
    toast.success(`"${item.name}" will be added to the cart once the cart is built.`);
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
            <button type="button" className="btn btn-primary btn-lg" disabled={product.stock === 0} onClick={() => handleAdd(product)}>Add to cart</button>
          )}
        </div>
      </div>

      <section className="spare-section">
        <h2>Spare parts</h2>
        {product.spare_parts.length === 0 ? (
          <p className="empty-state">No spare parts listed for this product.</p>
        ) : (
          <div className="spare-grid">
            {product.spare_parts.map((part) => <SparePartCard key={part.id} part={part} onAdd={handleAdd} showAction={!isAdmin} />)}
          </div>
        )}
      </section>
    </div>
  );
}