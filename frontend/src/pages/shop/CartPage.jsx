
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Trash2,
  ShieldCheck,
  Truck,
  Package,
  Tag,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react";

import Loader from "../../components/Loader";
import QuantityInput from "../../components/QuantityInput";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatCurrency";

export default function CartPage() {
  const { cart, loading, updateQuantity, removeItem } = useCart();
  const [busyId, setBusyId] = useState(null);

  const withBusy = async (id, action) => {
    setBusyId(id);
    try {
      await action();
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loader />;

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] text-[#242424]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-stone-500 transition hover:text-black"
          >
            <ArrowLeft size={15} />
            Continue shopping
          </Link>

          <div className="mx-auto flex max-w-xl flex-col items-center py-20 text-center sm:py-28">
            <div className="flex h-24 w-24 items-center justify-center bg-[#f5c32c] text-black">
              <ShoppingBag size={42} strokeWidth={1.5} />
            </div>

            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.25em] text-[#a17b00]">
              Your next project starts here
            </p>

            <h1 className="mt-3 text-3xl font-black uppercase sm:text-4xl">
              Your cart is empty
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-6 text-stone-500">
              Looks like you haven't added any tools yet. Explore our
              collection and find what you need for your next project.
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex items-center gap-3 bg-[#f5c32c] px-6 py-4 text-xs font-black uppercase tracking-wide text-black transition hover:bg-[#e7b51b]"
            >
              Browse products
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#242424]">
      {/* Page heading */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
            <Link to="/" className="transition hover:text-[#a17b00]">
              Home
            </Link>
            <span>/</span>
            <span className="text-stone-800">Shopping Cart</span>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#a17b00]">
                Ready for checkout?
              </p>
              <h1 className="mt-2 text-3xl font-black uppercase sm:text-4xl">
                Your Cart
                <span className="ml-3 text-[#d8a500]">.</span>
              </h1>
              <p className="mt-2 text-sm text-stone-500">
                Review your items before placing your order.
              </p>
            </div>

            <div className="flex items-center gap-2 border border-stone-200 bg-[#f7f7f5] px-4 py-3">
              <ShoppingCart size={18} className="text-[#a17b00]" />
              <span className="text-xs font-bold">
                {cart.total_quantity}{" "}
                {cart.total_quantity === 1 ? "ITEM" : "ITEMS"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {cart.has_issues && (
          <div
            className="mb-6 flex items-start gap-3 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
            role="alert"
          >
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-bold">Please review your cart</p>
              <p className="mt-1 text-xs leading-5">
                Some items are unavailable or exceed the available stock.
                Update their quantities or remove them before checkout.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-9">
          {/* Cart items */}
          <section className="min-w-0">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wide">
                Cart Items
              </h2>
              <span className="text-xs text-stone-500">
                {cart.items.length}{" "}
                {cart.items.length === 1 ? "product" : "products"}
              </span>
            </div>

            <div className="space-y-3">
              {cart.items.map((item) => (
                <article
                  key={item.id}
                  className={`flex flex-col gap-4 border bg-white p-4 transition sm:p-5 ${
                    item.available
                      ? "border-stone-200"
                      : "border-red-300"
                  }`}
                >
                  <div className="flex min-w-0 gap-4 sm:gap-5">
                    {/* Product image */}
                    <Link
                      to="/"
                      aria-label={`Continue shopping for ${item.name}`}
                      className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden bg-[#f5f4f0] sm:h-32 sm:w-32"
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="h-full w-full object-contain p-2 transition duration-300 hover:scale-105 sm:p-3"
                        />
                      ) : (
                        <Package
                          size={34}
                          strokeWidth={1.3}
                          className="text-stone-300"
                        />
                      )}
                    </Link>

                    {/* Product details */}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="break-words text-sm font-bold leading-5 text-stone-900 sm:text-base">
                            {item.name}
                          </h3>

                          {item.subtitle && (
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-500">
                              {item.subtitle}
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() =>
                            withBusy(item.id, () => removeItem(item.id))
                          }
                          aria-label={`Remove ${item.name}`}
                          title="Remove item"
                          className="shrink-0 p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>

                      <div className="mt-auto pt-3">
                        <p className="text-sm font-black text-stone-900">
                          {formatCurrency(item.unit_price)}
                          <span className="ml-1 text-[10px] font-normal text-stone-400">
                            / unit
                          </span>
                        </p>

                        {item.available ? (
                          <span className="mt-2 inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wide text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                            Available
                          </span>
                        ) : (
                          <span className="mt-2 inline-flex items-start gap-1.5 text-[10px] font-semibold leading-4 text-red-600">
                            <AlertTriangle
                              size={13}
                              className="mt-0.5 shrink-0"
                            />
                            Only {item.stock} available. Please adjust.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity and line total */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-stone-100 pt-4">
                    <div>
                      <p className="mb-2 text-[9px] font-bold uppercase tracking-wider text-stone-400">
                        Quantity
                      </p>
                      <QuantityInput
                        value={item.quantity}
                        max={Math.max(item.stock, 1)}
                        disabled={busyId === item.id}
                        onChange={(q) =>
                          withBusy(item.id, () =>
                            updateQuantity(item.id, q)
                          )
                        }
                      />
                    </div>

                    <div className="text-right">
                      <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-stone-400">
                        Item total
                      </p>
                      <p className="text-base font-black sm:text-lg">
                        {formatCurrency(item.line_total)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-stone-600 transition hover:text-[#a17b00]"
            >
              <ArrowLeft size={15} />
              Continue shopping
            </Link>
          </section>

          {/* Order summary */}
          <aside className="border border-stone-200 bg-white lg:sticky lg:top-28">
            <div className="bg-[#242424] px-5 py-5 text-white sm:px-6">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#f5c32c]">
                FORGE checkout
              </p>
              <h2 className="mt-1 text-lg font-black uppercase">
                Order Summary
              </h2>
            </div>

            <div className="p-5 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-stone-500">
                    Subtotal ({cart.total_quantity}{" "}
                    {cart.total_quantity === 1 ? "item" : "items"})
                  </span>
                  <span className="font-bold">
                    {formatCurrency(cart.subtotal)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-stone-500">
                    GST ({Number(cart.gst_percent)}%)
                  </span>
                  <span className="font-bold">
                    {formatCurrency(cart.tax_amount)}
                  </span>
                </div>

                <div className="border-t border-dashed border-stone-300 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-black uppercase">
                      Total
                    </span>
                    <span className="text-xl font-black">
                      {formatCurrency(cart.total)}
                    </span>
                  </div>
                  <p className="mt-1 text-right text-[10px] text-stone-400">
                    Including applicable GST
                  </p>
                </div>
              </div>

              {cart.has_issues ? (
                <button
                  type="button"
                  disabled
                  className="mt-6 flex w-full cursor-not-allowed items-center justify-center gap-2 bg-stone-300 px-4 py-4 text-[10px] font-black uppercase tracking-wide text-stone-500"
                >
                  Resolve cart issues first
                </button>
              ) : (
                <Link
                  to="/checkout"
                  className="mt-6 flex w-full items-center justify-center gap-3 bg-[#f5c32c] px-4 py-4 text-[10px] font-black uppercase tracking-wide text-black transition hover:bg-[#e7b51b]"
                >
                  Proceed to checkout
                  <ArrowRight size={16} />
                </Link>
              )}

              <div className="mt-4 flex items-start gap-2 border border-stone-100 bg-[#f7f7f5] p-3">
                <ShieldCheck
                  size={17}
                  className="shrink-0 text-[#a17b00]"
                />
                <p className="text-[10px] leading-4 text-stone-500">
                  Your order total and applicable taxes are shown before
                  you continue to checkout.
                </p>
              </div>

              <div className="mt-5 space-y-3 border-t border-stone-100 pt-5">
                <div className="flex items-center gap-3">
                  <Truck size={17} className="text-[#a17b00]" />
                  <span className="text-[10px] text-stone-500">
                    Delivery options shown at checkout
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Tag size={17} className="text-[#a17b00]" />
                  <span className="text-[10px] text-stone-500">
                    Review your items before ordering
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
