
import { useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Truck,
  ShieldCheck,
  CreditCard,
  Package,
  AlertTriangle,
  ReceiptText,
} from "lucide-react";

import {
  reportPaymentFailed,
  startCheckout,
  verifyPayment,
} from "../../api/orderApi";
import FormField from "../../components/FormField";
import Loader from "../../components/Loader";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { parseApiError } from "../../utils/apiErrors";
import { formatCurrency } from "../../utils/formatCurrency";
import { loadRazorpay } from "../../utils/loadRazorpay";
import {
  normalizePhone,
  required,
  runValidators,
  validatePhone,
  validatePincode,
} from "../../utils/validators";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, loading, refreshCart } = useCart();

  const [values, setValues] = useState({
    ship_name: `${user.first_name} ${user.last_name}`.trim(),
    ship_phone: user.phone || "",
    ship_address_line: "",
    ship_city: "",
    ship_state: "",
    ship_pincode: "",
  });

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [paying, setPaying] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [unconfirmed, setUnconfirmed] = useState(null);

  const busyRef = useRef(false);

  const handleChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // Confirm payment with the server.
  const confirmPayment = async (orderNumber, response) => {
    try {
      await verifyPayment(response);
      setCompletedOrder(orderNumber);
      refreshCart().catch(() => {});
    } catch (err) {
      setUnconfirmed({
        orderNumber,
        response,
        message: parseApiError(err).message || "Network problem.",
      });
    } finally {
      setPaying(false);
      busyRef.current = false;
    }
  };

  const openRazorpay = (checkout) => {
    let settled = false;

    const rzp = new window.Razorpay({
      key: checkout.razorpay_key_id,
      amount: checkout.amount,
      currency: checkout.currency,
      order_id: checkout.razorpay_order_id,
      name: "Hardware Shop",
      description: `Order ${checkout.order_number}`,
      prefill: checkout.prefill,
      theme: { color: "#f5c32c" },

      handler: (response) => {
        settled = true;
        confirmPayment(checkout.order_number, response);
      },

      modal: {
        ondismiss: () => {
          if (settled) return;

          settled = true;
          reportPaymentFailed(checkout.razorpay_order_id).catch(() => {});
          setPaying(false);
          busyRef.current = false;

          toast("Payment cancelled. Your items are still in the cart.");
        },
      },
    });

    rzp.on("payment.failed", (r) => {
      toast.error(
        r.error?.description ||
          "Payment failed. You can try again."
      );
    });

    rzp.open();
  };

  const handlePay = async (e) => {
    e.preventDefault();

    if (busyRef.current) return;

    setFormError("");

    const found = runValidators(values, {
      ship_name: required("Full name"),
      ship_phone: validatePhone,
      ship_address_line: required("Address"),
      ship_city: required("City"),
      ship_state: required("State"),
      ship_pincode: validatePincode,
    });

    setErrors(found);

    if (Object.keys(found).length) return;

    busyRef.current = true;
    setPaying(true);

    let checkout;

    try {
      ({ data: checkout } = await startCheckout({
        ...values,
        ship_phone: normalizePhone(values.ship_phone),
      }));
    } catch (err) {
      const { fieldErrors, message } = parseApiError(err);

      setErrors(fieldErrors);
      setFormError(message || "Please fix the highlighted fields.");

      if (message) refreshCart().catch(() => {});

      setPaying(false);
      busyRef.current = false;
      return;
    }

    try {
      await loadRazorpay();
    } catch {
      toast.error(
        "Could not load the payment window. Check your internet connection and try again."
      );

      reportPaymentFailed(checkout.razorpay_order_id).catch(() => {});
      setPaying(false);
      busyRef.current = false;
      return;
    }

    openRazorpay(checkout);
  };

  if (completedOrder) {
    return (
      <Navigate
        to={`/order-success/${completedOrder}`}
        replace
      />
    );
  }

  if (loading) return <Loader />;

  if (
    !unconfirmed &&
    (cart.items.length === 0 || cart.has_issues)
  ) {
    return <Navigate to="/cart" replace />;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#242424]">
      {/* Page heading */}
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            <Link
              to="/cart"
              className="transition hover:text-[#a17b00]"
            >
              Cart
            </Link>
            <span>/</span>
            <span className="text-stone-800">Checkout</span>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#a17b00]">
                Almost there
              </p>
              <h1 className="mt-2 text-3xl font-black uppercase sm:text-4xl">
                Checkout<span className="text-[#d8a500]">.</span>
              </h1>
              <p className="mt-2 text-sm text-stone-500">
                Enter your delivery details and complete your order.
              </p>
            </div>

            <div className="flex items-center gap-2 border border-stone-200 bg-[#f7f7f5] px-4 py-3">
              <ShieldCheck size={19} className="text-[#a17b00]" />
              <span className="text-[10px] font-bold uppercase tracking-wide">
                Secure checkout
              </span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Payment confirmation warning */}
        {unconfirmed && (
          <div
            className="mb-6 border border-amber-300 bg-amber-50 p-5 text-amber-950"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                size={22}
                className="mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <h2 className="text-sm font-black">
                  Payment confirmation pending
                </h2>

                <p className="mt-2 text-xs leading-5">
                  Your payment may have succeeded, but the server
                  could not confirm the order yet. {unconfirmed.message}
                </p>

                <p className="mt-2 text-xs font-semibold leading-5">
                  Please do not pay again. Retry confirmation or check
                  your <Link to="/my-orders" className="underline">orders</Link>.
                </p>

                <button
                  type="button"
                  disabled={paying}
                  onClick={() => {
                    setPaying(true);
                    const pending = unconfirmed;
                    setUnconfirmed(null);
                    confirmPayment(
                      pending.orderNumber,
                      pending.response
                    );
                  }}
                  className="mt-4 inline-flex items-center gap-2 bg-[#f5c32c] px-4 py-3 text-[10px] font-black uppercase text-black transition hover:bg-[#e7b51b] disabled:opacity-50"
                >
                  Retry confirmation
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_370px] xl:gap-9">
          {/* Shipping form */}
          <section className="min-w-0">
            <div className="border border-stone-200 bg-white">
              <div className="flex items-center gap-3 border-b border-stone-200 px-5 py-5 sm:px-7">
                <div className="flex h-10 w-10 items-center justify-center bg-[#f5c32c] text-black">
                  <MapPin size={21} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wide">
                    Shipping Details
                  </h2>
                  <p className="mt-1 text-xs text-stone-500">
                    Where should we deliver your order?
                  </p>
                </div>
              </div>

              <form
                className="space-y-5 p-5 sm:p-7"
                onSubmit={handlePay}
                noValidate
              >
                {formError && (
                  <div
                    className="border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    role="alert"
                  >
                    {formError}
                  </div>
                )}

                <FormField
                  label="Full name *"
                  name="ship_name"
                  value={values.ship_name}
                  onChange={handleChange}
                  error={errors.ship_name}
                  autoComplete="name"
                />

                <FormField
                  label="Phone *"
                  name="ship_phone"
                  type="tel"
                  value={values.ship_phone}
                  onChange={handleChange}
                  error={errors.ship_phone}
                  autoComplete="tel"
                />

                <FormField
                  label="Address *"
                  name="ship_address_line"
                  value={values.ship_address_line}
                  onChange={handleChange}
                  error={errors.ship_address_line}
                  autoComplete="street-address"
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="City *"
                    name="ship_city"
                    value={values.ship_city}
                    onChange={handleChange}
                    error={errors.ship_city}
                    autoComplete="address-level2"
                  />

                  <FormField
                    label="State *"
                    name="ship_state"
                    value={values.ship_state}
                    onChange={handleChange}
                    error={errors.ship_state}
                    autoComplete="address-level1"
                  />
                </div>

                <div className="max-w-xs">
                  <FormField
                    label="Pincode *"
                    name="ship_pincode"
                    inputMode="numeric"
                    maxLength={6}
                    value={values.ship_pincode}
                    onChange={handleChange}
                    error={errors.ship_pincode}
                    autoComplete="postal-code"
                  />
                </div>

                <div className="border-t border-stone-100 pt-5">
                  <button
                    type="submit"
                    disabled={paying || Boolean(unconfirmed)}
                    className="flex w-full items-center justify-center gap-3 bg-[#f5c32c] px-5 py-4 text-xs font-black uppercase tracking-wide text-black transition hover:bg-[#e7b51b] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
                  >
                    <CreditCard size={17} />
                    {paying
                      ? "Processing..."
                      : `Pay ${formatCurrency(cart.total)}`}
                    {!paying && <ArrowRight size={16} />}
                  </button>

                  <p className="mt-3 text-center text-[10px] leading-5 text-stone-400">
                    Payment is handled through Razorpay's payment window.
                    Test mode does not charge real money.
                  </p>
                </div>
              </form>
            </div>

            <Link
              to="/cart"
              className="mt-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-stone-500 transition hover:text-[#a17b00]"
            >
              <ArrowLeft size={15} />
              Return to cart
            </Link>
          </section>

          {/* Order summary */}
          <aside className="border border-stone-200 bg-white lg:sticky lg:top-28">
            <div className="bg-[#242424] px-5 py-5 text-white sm:px-6">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#f5c32c]">
                FORGE
              </p>
              <h2 className="mt-1 text-lg font-black uppercase">
                Order Summary
              </h2>
              <p className="mt-1 text-xs text-white/60">
                {cart.total_quantity}{" "}
                {cart.total_quantity === 1 ? "item" : "items"} in your order
              </p>
            </div>

            <div className="p-5 sm:p-6">
              <div className="max-h-72 space-y-4 overflow-y-auto pr-1">
                {cart.items.map((item) => (
                  <div
                    className="flex items-start justify-between gap-4"
                    key={item.id}
                  >
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#f7f7f5]">
                        <Package
                          size={19}
                          className="text-[#a17b00]"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="break-words text-xs font-bold leading-5 text-stone-800">
                          {item.name}
                        </p>
                        <p className="mt-1 text-[10px] text-stone-400">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <span className="shrink-0 text-xs font-bold">
                      {formatCurrency(item.line_total)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-4 border-t border-stone-200 pt-5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-stone-500">Subtotal</span>
                  <span className="font-bold">
                    {formatCurrency(cart.subtotal)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 text-xs">
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

              <div className="mt-5 space-y-3 border-t border-stone-100 pt-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck
                    size={18}
                    className="shrink-0 text-[#a17b00]"
                  />
                  <span className="text-[10px] leading-4 text-stone-500">
                    Secure payment processing
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Truck
                    size={18}
                    className="shrink-0 text-[#a17b00]"
                  />
                  <span className="text-[10px] leading-4 text-stone-500">
                    Delivery details provided above
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <ReceiptText
                    size={18}
                    className="shrink-0 text-[#a17b00]"
                  />
                  <span className="text-[10px] leading-4 text-stone-500">
                    Order confirmation after payment verification
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
