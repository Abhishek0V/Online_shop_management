
import { Link } from "react-router-dom";
import { CheckCircle2, FileDown, ShoppingBag } from "lucide-react";

export default function OrderSuccessCard({
  orderNumber = "ORD-20261024-0001",
  email = "",
  onDownloadInvoice,
}) {
  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#f7f7f5] px-4 py-12">
      <section className="w-full max-w-md bg-white p-6 text-center sm:p-9">
        {/* SUCCESS ICON */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-700">
          <CheckCircle2 size={38} strokeWidth={1.7} />
        </div>

        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-[#a17b00]">
          FORGE / ORDER CONFIRMATION
        </p>

        <h1 className="mt-3 text-2xl font-black uppercase tracking-tight text-[#242424]">
          Payment successful
        </h1>

        <p className="mt-3 text-sm leading-6 text-stone-500">
          Thank you for your order. Your payment has been confirmed.
        </p>

        {/* ORDER DETAILS */}
        <div className="mt-6 border border-stone-200 bg-[#f7f7f5] p-4">
          <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
            Order number
          </p>

          <p className="mt-2 break-words text-sm font-black text-[#242424]">
            {orderNumber}
          </p>

          {email && (
            <p className="mt-3 text-xs leading-5 text-stone-500">
              Invoice emailed to{" "}
              <span className="break-all font-semibold text-stone-700">
                {email}
              </span>
            </p>
          )}
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex flex-col gap-3">
          {onDownloadInvoice && (
            <button
              type="button"
              onClick={onDownloadInvoice}
              className="flex w-full items-center justify-center gap-2 bg-[#f5c32c] px-5 py-3.5 text-xs font-black uppercase tracking-widest text-black transition hover:bg-[#e5b51f]"
            >
              <FileDown size={17} />
              Download invoice (PDF)
            </button>
          )}

          <Link
            to="/"
            className="flex w-full items-center justify-center gap-2 border border-stone-300 px-5 py-3.5 text-xs font-black uppercase tracking-widest text-stone-700 transition hover:border-[#f5c32c] hover:bg-[#fff9e5]"
          >
            <ShoppingBag size={16} />
            Continue shopping
          </Link>
        </div>

        <p className="mt-6 border-t border-stone-100 pt-5 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
          Thank you for shopping with FORGE
        </p>
      </section>
    </main>
  );
}
