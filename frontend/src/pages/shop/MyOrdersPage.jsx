
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Package,
  CalendarDays,
  ReceiptText,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";

import { listMyOrders } from "../../api/orderApi";
import InvoiceButton from "../../components/InvoiceButton";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import StatusPill from "../../components/StatusPill";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

export default function MyOrdersPage() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    listMyOrders({ page })
      .then((res) => !cancelled && setData(res.data))
      .catch(() => !cancelled && setError("Could not load your orders."))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#242424]">
      {/* Page heading */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-stone-500 transition hover:text-[#a17b00]"
          >
            <ArrowLeft size={14} />
            Back to shop
          </Link>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#a17b00]">
                Your purchases
              </p>

              <h1 className="mt-2 text-3xl font-black uppercase sm:text-4xl">
                My Orders<span className="text-[#d8a500]">.</span>
              </h1>

              <p className="mt-2 text-sm text-stone-500">
                View your orders, check their status, and download invoices.
              </p>
            </div>

            <div className="flex items-center gap-3 border border-stone-200 bg-[#f7f7f5] px-4 py-3">
              <ClipboardList size={20} className="text-[#a17b00]" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-stone-500">
                  Total orders
                </p>
                <p className="text-lg font-black">{data.count}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Intro strip */}
        <div className="mb-6 flex items-center gap-3 border border-stone-200 bg-white p-4 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#f5c32c] text-black">
            <Package size={23} />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wide">
              Your order history
            </h2>
            <p className="mt-1 text-xs leading-5 text-stone-500">
              Your recent purchases and order information in one place.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="border border-stone-200 bg-white p-8">
            <Loader />
          </div>
        ) : error ? (
          <div
            className="flex items-start gap-3 border border-red-200 bg-red-50 p-5 text-sm text-red-700"
            role="alert"
          >
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">{error}</p>
              <p className="mt-1 text-xs">
                Please refresh the page and try again.
              </p>
            </div>
          </div>
        ) : data.results.length === 0 ? (
          <div className="border border-stone-200 bg-white px-5 py-16 text-center sm:py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center bg-[#f5c32c] text-black">
              <ShoppingBag size={36} strokeWidth={1.5} />
            </div>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.2em] text-[#a17b00]">
              Nothing here yet
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase">
              No orders yet
            </h2>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-stone-500">
              Once you place an order, it will appear here so you can track
              its status and access your invoice.
            </p>

            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-3 bg-[#f5c32c] px-6 py-4 text-[10px] font-black uppercase tracking-wide text-black transition hover:bg-[#e7b51b]"
            >
              Start shopping
              <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden border border-stone-200 bg-white md:block">
              <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
                <h2 className="text-xs font-black uppercase tracking-wide">
                  Order history
                </h2>
                <span className="text-xs text-stone-500">
                  {data.count} {data.count === 1 ? "order" : "orders"}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#f7f7f5] text-[10px] font-black uppercase tracking-wider text-stone-500">
                      <th className="px-5 py-4">Order</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Items</th>
                      <th className="px-5 py-4">Total</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4">Invoice</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-100">
                    {data.results.map((o) => (
                      <tr
                        key={o.order_number}
                        className="transition hover:bg-[#fffdf5]"
                      >
                        <td className="px-5 py-5">
                          <Link
                            to={`/my-orders/${o.order_number}`}
                            className="font-bold text-stone-900 transition hover:text-[#a17b00]"
                          >
                            {o.order_number}
                          </Link>
                        </td>

                        <td className="whitespace-nowrap px-5 py-5 text-xs text-stone-500">
                          <span className="flex items-center gap-2">
                            <CalendarDays
                              size={14}
                              className="text-stone-400"
                            />
                            {formatDate(o.created_at)}
                          </span>
                        </td>

                        <td className="px-5 py-5 text-sm text-stone-600">
                          {o.item_count}
                        </td>

                        <td className="whitespace-nowrap px-5 py-5 text-sm font-black">
                          {formatCurrency(o.total_amount)}
                        </td>

                        <td className="px-5 py-5">
                          <StatusPill status={o.status} />
                        </td>

                        <td className="px-5 py-5">
                          {o.status === "paid" ? (
                            <InvoiceButton
                              orderNumber={o.order_number}
                              className="inline-flex items-center gap-2 border border-stone-200 px-3 py-2 text-[10px] font-bold uppercase transition hover:border-[#f5c32c] hover:bg-[#fff9df]"
                            >
                              <ReceiptText size={14} />
                              Download
                            </InvoiceButton>
                          ) : (
                            <span className="text-xs text-stone-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile order cards */}
            <div className="space-y-4 md:hidden">
              {data.results.map((o) => (
                <article
                  key={o.order_number}
                  className="border border-stone-200 bg-white"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-stone-100 p-4">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-wider text-stone-400">
                        Order number
                      </p>
                      <Link
                        to={`/my-orders/${o.order_number}`}
                        className="mt-1 block break-all text-sm font-black text-stone-900 hover:text-[#a17b00]"
                      >
                        {o.order_number}
                      </Link>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
                        <CalendarDays size={13} />
                        {formatDate(o.created_at)}
                      </p>
                    </div>

                    <StatusPill status={o.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                        Items
                      </p>
                      <p className="mt-1 text-sm font-bold">{o.item_count}</p>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                        Order total
                      </p>
                      <p className="mt-1 text-base font-black">
                        {formatCurrency(o.total_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 bg-[#fdfdfb] p-4">
                    <Link
                      to={`/my-orders/${o.order_number}`}
                      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wide hover:text-[#a17b00]"
                    >
                      View details
                      <ArrowRight size={14} />
                    </Link>

                    {o.status === "paid" && (
                      <InvoiceButton
                        orderNumber={o.order_number}
                        className="inline-flex items-center gap-2 bg-[#f5c32c] px-3 py-2.5 text-[10px] font-black uppercase text-black transition hover:bg-[#e7b51b]"
                      >
                        <ReceiptText size={14} />
                        Invoice
                      </InvoiceButton>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 border border-stone-200 bg-white px-4 py-4 sm:px-5">
              <Pagination
                page={page}
                count={data.count}
                pageSize={12}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
