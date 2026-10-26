
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Package,
  ShoppingBag,
} from "lucide-react";

import { getMyOrder } from "../../api/orderApi";
import InvoiceButton from "../../components/InvoiceButton";
import Loader from "../../components/Loader";
import OrderSummary from "../../components/OrderSummary";
import StatusPill from "../../components/StatusPill";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

export default function OrderDetailPage() {
  const { orderNumber } = useParams();
  const { user } = useAuth();
  const isSuccessPage = useLocation().pathname.startsWith("/order-success");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setNotFound(false);
    setOrder(null);

    getMyOrder(orderNumber)
      .then((res) => {
        if (!cancelled) setOrder(res.data);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  if (loading) return <Loader />;

  if (notFound || !order) {
    return (
      <main className="min-h-[70vh] bg-[#f7f7f5] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl border border-stone-200 bg-white p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center bg-stone-100 text-stone-500">
            <Package size={30} strokeWidth={1.5} />
          </div>

          <h1 className="mt-5 text-2xl font-black uppercase tracking-tight text-[#242424]">
            Order not found
          </h1>

          <p className="mt-2 text-sm leading-6 text-stone-500">
            We couldn't find this order. Please check the order number or
            return to your order history.
          </p>

          <Link
            to="/my-orders"
            className="mt-6 inline-flex items-center justify-center gap-2 bg-[#f5c32c] px-6 py-3 text-xs font-black uppercase tracking-wider text-black transition hover:bg-[#e5b51f]"
          >
            <ArrowLeft size={15} />
            Back to my orders
          </Link>
        </div>
      </main>
    );
  }

  const paid = order.status === "paid";

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        
        <div className="mb-6 flex flex-col gap-4 border-b border-stone-200 pb-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              to={isSuccessPage ? "/" : "/my-orders"}
              className="mb-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 transition hover:text-[#987000]"
            >
              <ArrowLeft size={13} />
              {isSuccessPage ? "Continue shopping" : "Back to my orders"}
            </Link>

            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#a17b00]">
              FORGE / ORDER DETAILS
            </p>

            <h1 className="text-2xl font-black uppercase tracking-tight text-[#242424] sm:text-3xl">
              {isSuccessPage ? "Order confirmation" : "Order details"}
            </h1>

            <p className="mt-2 break-words text-sm text-stone-500">
              Order number:{" "}
              <span className="font-bold text-stone-800">
                {order.order_number}
              </span>
            </p>
          </div>

          {!isSuccessPage && (
            <div className="flex flex-wrap items-center gap-3">
              <StatusPill status={order.status} />
              {paid && (
                <InvoiceButton orderNumber={order.order_number} />
              )}
            </div>
          )}
        </div>

        {isSuccessPage && paid && (
          <section className="mb-8 overflow-hidden border border-stone-200 bg-white">
            <div className="h-1.5 bg-[#f5c32c]" />

            <div className="p-5 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-green-50 text-green-700">
                  <CheckCircle2 size={32} strokeWidth={1.7} />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-600" />
                    Payment successful
                  </span>

                  <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-[#242424] sm:text-2xl">
                    Thank you for your order!
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-stone-600">
                    Order{" "}
                    <strong className="text-stone-900">
                      {order.order_number}
                    </strong>{" "}
                    for{" "}
                    <strong className="text-stone-900">
                      {formatCurrency(order.total_amount)}
                    </strong>{" "}
                    is confirmed.
                  </p>

                  <div className="mt-4 flex items-start gap-2 text-sm leading-6 text-stone-500">
                    <ClipboardCheck
                      size={17}
                      className="mt-0.5 shrink-0 text-[#a17b00]"
                    />
                    <p>
                      {order.invoice_emailed ? (
                        <>
                          Your invoice was emailed to{" "}
                          <strong className="break-all text-stone-800">
                            {user?.email}
                          </strong>
                          .
                        </>
                      ) : (
                        "We couldn't email your invoice yet. You can download it below."
                      )}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <InvoiceButton
                      orderNumber={order.order_number}
                      className="btn btn-primary"
                    />

                    <Link
                      to="/"
                      className="inline-flex items-center justify-center gap-2 border border-stone-300 px-5 py-3 text-xs font-black uppercase tracking-wider text-stone-700 transition hover:border-[#f5c32c] hover:bg-[#fff9e5] hover:text-black"
                    >
                      <ShoppingBag size={15} />
                      Continue shopping
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                <div className="border border-stone-200 bg-[#f7f7f5] px-5 py-4 sm:min-w-44">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                    Amount paid
                  </p>
                  <p className="mt-2 text-xl font-black text-[#242424]">
                    {formatCurrency(order.total_amount)}
                  </p>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-green-700">
                    Paid in full
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {isSuccessPage && !paid && (
          <section
            role="alert"
            className="mb-8 border border-amber-300 bg-amber-50 p-5 sm:p-6"
          >
            <div className="flex items-start gap-3">
              <CircleAlert
                size={24}
                className="shrink-0 text-amber-700"
              />
              <div>
                <h2 className="font-black uppercase tracking-wide text-amber-900">
                  Payment not confirmed
                </h2>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  This order has not been paid. Current status:{" "}
                  <strong>{order.status_label}</strong>.
                </p>
                <Link
                  to="/cart"
                  className="mt-4 inline-flex items-center gap-2 bg-[#242424] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-black"
                >
                  Return to cart
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* ORDER INFORMATION */}
        {!isSuccessPage && (
          <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border border-stone-200 bg-white p-4 sm:p-5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                Order number
              </p>
              <p className="mt-2 break-words text-sm font-black text-stone-800">
                {order.order_number}
              </p>
            </div>

            <div className="border border-stone-200 bg-white p-4 sm:p-5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                Order date
              </p>
              <p className="mt-2 text-sm font-black text-stone-800">
                {formatDate(order.created_at)}
              </p>
            </div>

            <div className="border border-stone-200 bg-white p-4 sm:p-5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                Total amount
              </p>
              <p className="mt-2 text-sm font-black text-stone-800">
                {formatCurrency(order.total_amount)}
              </p>
            </div>
          </section>
        )}

        {/* EXISTING ORDER SUMMARY */}
        <section className="border border-stone-200 bg-white">
          <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-4 sm:px-6">
            <div className="flex h-9 w-9 items-center justify-center bg-[#fff5cc] text-[#987000]">
              <Package size={19} />
            </div>

            <div>
              <h2 className="text-sm font-black uppercase tracking-wide text-[#242424]">
                Order summary
              </h2>
              <p className="mt-1 text-[10px] text-stone-500">
                Review your order details and totals
              </p>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            <OrderSummary order={order} />
          </div>
        </section>

        <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-stone-400">
          <Package size={14} />
          FORGE Hardware &amp; Tools
        </div>
      </div>
    </main>
  );
}
