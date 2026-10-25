const STYLES = { paid: "pill pill-ok", pending_payment: "pill pill-off", failed: "pill pill-bad", cancelled: "pill pill-off" };
const LABELS = { paid: "Paid", pending_payment: "Pending", failed: "Failed", cancelled: "Cancelled" };

export default function StatusPill({ status }) {
  return <span className={STYLES[status] || "pill pill-off"}>{LABELS[status] || status}</span>;
}