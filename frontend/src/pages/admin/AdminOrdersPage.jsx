
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileDown,
  Search,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import { listAdminOrders } from "../../api/orderApi";
import InvoiceButton from "../../components/InvoiceButton";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import StatusPill from "../../components/StatusPill";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [input, setInput] = useState("");
  const search = useDebounce(input.trim());

  const [data, setData] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    listAdminOrders({
      page,
      status: status || undefined,
      search: search || undefined,
    })
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load orders.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, status, search]);

  const orders = data.results || [];

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}
        <section className="mb-7 border-b border-stone-200 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#a17b00]">
                 ADMINISTRATION
              </p>

              <h1 className="text-2xl font-black uppercase tracking-tight text-[#242424] sm:text-3xl">
                Order management
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                Review customer orders, track payment status, and download
                invoices.
              </p>
            </div>

            <Link
              to="/admin/products"
              className="inline-flex items-center justify-center gap-2 self-start border border-stone-300 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-wider text-stone-700 transition hover:border-[#f5c32c] hover:bg-[#fff9e5] sm:self-auto"
            >
              <ShoppingBag size={15} />
              Manage products
              <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* OVERVIEW */}
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-4 border border-stone-200 bg-white p-4 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#fff5cc] text-[#987000]">
              <ClipboardList size={22} />
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                Matching orders
              </p>
              <p className="mt-1 text-2xl font-black text-[#242424]">
                {data.count}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border border-stone-200 bg-white p-4 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-green-50 text-green-700">
              <Wallet size={22} />
            </div>

            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                Paid orders on this page
              </p>
              <p className="mt-1 text-2xl font-black text-[#242424]">
                {loading
                  ? "—"
                  : orders.filter((order) => order.status === "paid").length}
              </p>
            </div>
          </div>
        </section>

        {/* SEARCH AND STATUS FILTER */}
        <section className="mb-5 border border-stone-200 bg-white p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#242424]">
              Find an order
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Search by order number, customer name, or email.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="search"
                placeholder="Order no, customer email or name..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Search orders"
                className="h-11 w-full border border-stone-200 bg-[#f7f7f5] pl-10 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#d8a500] focus:bg-white"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
              className="h-11 w-full border border-stone-200 bg-[#f7f7f5] px-3 text-sm text-stone-700 outline-none transition focus:border-[#d8a500] focus:bg-white"
            >
              <option value="">All statuses</option>
              <option value="paid">Paid</option>
              <option value="pending_payment">Pending payment</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </section>

        {/* CONTENT */}
        {loading ? (
          <div className="border border-stone-200 bg-white py-12">
            <Loader />
          </div>
        ) : error ? (
          <div
            role="alert"
            className="border border-red-200 bg-red-50 p-6 text-sm text-red-700"
          >
            <p className="font-bold">{error}</p>
            <button
              type="button"
              onClick={() => setPage((current) => current)}
              className="mt-3 text-xs font-black uppercase tracking-wide underline underline-offset-4"
            >
              Please change a filter or retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="border border-stone-200 bg-white px-5 py-14 text-center sm:py-20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center bg-stone-100 text-stone-500">
              <ClipboardList size={30} strokeWidth={1.4} />
            </div>

            <h2 className="mt-5 text-lg font-black uppercase tracking-tight text-[#242424]">
              No orders found
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
              No orders match your current search or status filter.
            </p>

            {(input || status) && (
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  setStatus("");
                  setPage(1);
                }}
                className="mt-5 bg-[#f5c32c] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-[#e5b51f]"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-hidden border border-stone-200 bg-white lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-stone-200 bg-[#242424] text-[9px] font-bold uppercase tracking-widest text-white">
                      <th className="px-5 py-4">Order</th>
                      <th className="px-4 py-4">Customer</th>
                      <th className="px-4 py-4">Date</th>
                      <th className="px-4 py-4">Items</th>
                      <th className="px-4 py-4">Total</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Invoice</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-100">
                    {orders.map((order) => (
                      <tr
                        key={order.order_number}
                        className="transition hover:bg-[#fffdf5]"
                      >
                        <td className="px-5 py-4">
                          <Link
                            to={`/admin/orders/${order.order_number}`}
                            className="text-xs font-black text-stone-800 transition hover:text-[#987000]"
                          >
                            {order.order_number}
                          </Link>
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-xs font-bold text-stone-800">
                            {order.customer_name}
                          </p>
                          <p className="mt-1 break-all text-[10px] text-stone-500">
                            {order.customer_email}
                          </p>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-xs text-stone-600">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays
                              size={13}
                              className="text-stone-400"
                            />
                            {formatDate(order.created_at)}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-xs text-stone-600">
                          {order.item_count}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-xs font-black text-[#242424]">
                          {formatCurrency(order.total_amount)}
                        </td>

                        <td className="px-4 py-4">
                          <StatusPill status={order.status} />
                        </td>

                        <td className="px-5 py-4 text-right">
                          {order.status === "paid" ? (
                            <InvoiceButton
                              orderNumber={order.order_number}
                              className="link-btn"
                            >
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

            {/* MOBILE AND TABLET CARDS */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
              {orders.map((order) => (
                <article
                  key={order.order_number}
                  className="overflow-hidden border border-stone-200 bg-white"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-stone-100 p-4">
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                        Order number
                      </p>

                      <Link
                        to={`/admin/orders/${order.order_number}`}
                        className="mt-1 block break-words text-xs font-black text-[#242424] hover:text-[#987000]"
                      >
                        {order.order_number}
                      </Link>
                    </div>

                    <div className="shrink-0">
                      <StatusPill status={order.status} />
                    </div>
                  </div>

                  <div className="space-y-4 p-4">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                        Customer
                      </p>
                      <p className="mt-1 text-sm font-bold text-stone-800">
                        {order.customer_name}
                      </p>
                      <p className="mt-1 break-all text-xs text-stone-500">
                        {order.customer_email}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-y border-stone-100 py-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                          Date
                        </p>
                        <p className="mt-1 text-xs font-semibold text-stone-700">
                          {formatDate(order.created_at)}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                          Items
                        </p>
                        <p className="mt-1 text-xs font-semibold text-stone-700">
                          {order.item_count}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                          Order total
                        </p>
                        <p className="mt-1 text-lg font-black text-[#242424]">
                          {formatCurrency(order.total_amount)}
                        </p>
                      </div>

                      <Link
                        to={`/admin/orders/${order.order_number}`}
                        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#987000] hover:text-black"
                      >
                        Details <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>

                  {order.status === "paid" && (
                    <div className="border-t border-stone-100 bg-[#fafaf8] px-4 py-3">
                      <InvoiceButton
                        orderNumber={order.order_number}
                        className="link-btn"
                      >
                        <span className="inline-flex items-center gap-2">
                          <FileDown size={14} />
                          Download invoice
                        </span>
                      </InvoiceButton>
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* PAGINATION */}
            <div className="mt-5 border border-stone-200 bg-white px-3 py-4 sm:px-5">
              <Pagination
                page={page}
                count={data.count}
                pageSize={12}
                onChange={setPage}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
