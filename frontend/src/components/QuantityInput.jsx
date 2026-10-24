export default function QuantityInput({ value, max = 100, onChange, disabled = false }) {
  return (
    <div className="qty" role="group" aria-label="Quantity">
      <button type="button" disabled={disabled || value <= 1} onClick={() => onChange(value - 1)} aria-label="Decrease quantity">−</button>
      <span aria-live="polite">{value}</span>
      <button type="button" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label="Increase quantity">+</button>
    </div>
  );
}