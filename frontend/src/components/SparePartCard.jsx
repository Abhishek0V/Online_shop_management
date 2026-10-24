import { formatCurrency } from "../utils/formatCurrency";

export default function SparePartCard({ part, onAdd, showAction }) {
  return (
    <div className="spare-card">
      <div className="spare-img">
        {part.image ? <img src={part.image} alt={part.name} loading="lazy" /> : <span className="no-image">No image</span>}
      </div>
      <h4>{part.name}</h4>
      {part.part_code && <span className="product-code">Part code: {part.part_code}</span>}
      <span className="price">{formatCurrency(part.price)}</span>
      {part.stock === 0 ? <span className="stock-out">Out of stock</span> : <span className="stock-in">In stock</span>}
      {showAction && (
        <button type="button" className="btn btn-primary" disabled={part.stock === 0} onClick={() => onAdd(part)}>Add to cart</button>
      )}
    </div>
  );
}