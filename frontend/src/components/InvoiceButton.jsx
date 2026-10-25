import { useState } from "react";
import toast from "react-hot-toast";
import { downloadInvoice } from "../api/orderApi";

export default function InvoiceButton({ orderNumber, className = "btn btn-outline", children = "Download invoice" }) {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      await downloadInvoice(orderNumber);
    } catch {
      toast.error("Could not download the invoice. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return <button type="button" className={className} onClick={handleClick} disabled={busy}>{busy ? "Preparing..." : children}</button>;
}