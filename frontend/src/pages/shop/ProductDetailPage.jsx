
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Package,
  Tag,
  Wrench,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { getProduct } from "../../api/productApi";
import Loader from "../../components/Loader";
import QuantityInput from "../../components/QuantityInput";
import SparePartCard from "../../components/SparePartCard";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { formatCurrency } from "../../utils/formatCurrency";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { user, isAdmin } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [selected, setSelected] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setNotFound(false);

    getProduct(slug)
      .then((res) => {
        if (!cancelled) {
          setProduct(res.data);
          setSelected(0);
          setQuantity(1);
        }
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
  }, [slug]);

  // Keep the existing product and spare-part cart logic.
  const handleAdd = async (kind, item, qty = 1) => {
    if (!user) {
      toast("Please log in to add items to your cart.");
      navigate("/login", {
        state: { from: `/products/${slug}` },
      });
      return;
    }

    setAdding(true);

    try {
      const key =
        kind === "product" ? "product_id" : "spare_part_id";

      await addItem({ [key]: item.id, quantity: qty }, item.name);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <Loader />;

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] px-4 py-20 text-[#242424]">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center bg-[#f5c32c]">
            <Package size={36} />
          </div>

          <h1 className="mt-6 text-2xl font-black uppercase">
            Product not found
          </h1>

          <p className="mt-2 text-sm text-stone-500">
            This product may have been removed or is no longer available.
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 bg-[#f5c32c] px-5 py-3 text-xs font-black uppercase transition hover:bg-[#e7b51b]"
          >
            <ArrowLeft size={15} />
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const saving = Number(product.discount_amount) || 0;
  const mainImage = product.images?.[selected]?.image;
  const outOfStock = Number(product.stock) <= 0;

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-[#242424]">
      {/* Breadcrumb and page heading */}
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-stone-400">
            <Link to="/" className="transition hover:text-[#a17b00]">
              Products
            </Link>
            <span>/</span>
            {product.brand && (
              <>
                <span>{product.brand}</span>
                <span>/</span>
              </>
            )}
            <span className="max-w-[220px] truncate text-stone-800">
              {product.name}
            </span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        {/* Product details */}
        <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-10">
          {/* Product gallery */}
          <div className="min-w-0">
            <div className="relative flex aspect-square max-h-[600px] items-center justify-center overflow-hidden border border-stone-200 bg-white sm:aspect-[5/4]">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="h-full w-full object-contain p-5 transition duration-500 sm:p-10"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-stone-300">
                  <Package size={65} strokeWidth={1.2} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    No image available
                  </span>
                </div>
              )}

              {saving > 0 && (
                <span className="absolute left-4 top-4 flex items-center gap-1.5 bg-[#f5c32c] px-3 py-2 text-[10px] font-black uppercase text-black">
                  <Tag size={13} />
                  Save {formatCurrency(saving)}
                </span>
              )}

              {outOfStock && (
                <span className="absolute bottom-4 left-4 bg-stone-900 px-3 py-2 text-[10px] font-bold uppercase text-white">
                  Out of stock
                </span>
              )}
            </div>

            {/* Image thumbnails */}
            {product.images?.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
                {product.images.map((img, i) => (
                  <button
                    type="button"
                    key={img.id}
                    onClick={() => setSelected(i)}
                    aria-label={`Show image ${i + 1}`}
                    aria-pressed={i === selected}
                    className={`aspect-square overflow-hidden border bg-white p-1.5 transition sm:p-2 ${
                      i === selected
                        ? "border-[#d8a500] ring-1 ring-[#f5c32c]"
                        : "border-stone-200 hover:border-stone-400"
                    }`}
                  >
                    <img
                      src={img.image}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product information */}
          <div className="border border-stone-200 bg-white p-5 sm:p-7 lg:p-8">
            {product.brand && (
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a17b00]">
                {product.brand}
              </p>
            )}

            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl lg:text-4xl">
              {product.name}
            </h1>

            {product.model_code && (
              <p className="mt-3 text-xs text-stone-500">
                Model:{" "}
                <span className="font-semibold text-stone-700">
                  {product.model_code}
                </span>
              </p>
            )}

            <div className="mt-6 border-y border-stone-100 py-5">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-2xl font-black sm:text-3xl">
                  {formatCurrency(product.price)}
                </span>

                {saving > 0 && (
                  <>
                    <span className="text-sm text-stone-400 line-through">
                      {formatCurrency(product.mrp)}
                    </span>
                    <span className="bg-[#fff4c4] px-2 py-1 text-[9px] font-black uppercase text-[#8a6900]">
                      Save {formatCurrency(saving)}
                    </span>
                  </>
                )}
              </div>

              <div className="mt-4">
                {outOfStock ? (
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-red-600">
                    <AlertCircle size={15} />
                    Currently out of stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 text-xs font-bold text-green-700">
                    <CheckCircle2 size={15} />
                    In stock · {product.stock} available
                  </span>
                )}
              </div>
            </div>

            {product.description && (
              <div className="py-5">
                <h2 className="text-[10px] font-black uppercase tracking-[0.15em]">
                  Product description
                </h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-600">
                  {product.description}
                </p>
              </div>
            )}

            {/* Add to cart */}
            {!isAdmin && (
              <div className="border-t border-stone-100 pt-5">
                <p className="mb-3 text-[10px] font-black uppercase tracking-wider">
                  Select quantity
                </p>

                <div className="flex flex-wrap gap-3">
                  <QuantityInput
                    value={quantity}
                    max={Math.max(product.stock, 1)}
                    onChange={setQuantity}
                    disabled={outOfStock || adding}
                  />

                  <button
                    type="button"
                    disabled={outOfStock || adding}
                    onClick={() =>
                      handleAdd("product", product, quantity)
                    }
                    className="flex min-h-11 flex-1 items-center justify-center gap-2 bg-[#f5c32c] px-5 py-3 text-[10px] font-black uppercase tracking-wide text-black transition hover:bg-[#e7b51b] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400 sm:flex-none"
                  >
                    <ShoppingCart size={16} />
                    {adding ? "Adding..." : "Add to cart"}
                  </button>
                </div>

                <p className="mt-3 text-[10px] leading-5 text-stone-400">
                  Please check availability before proceeding to checkout.
                </p>
              </div>
            )}

            {/* Service features */}
            <div className="mt-6 grid grid-cols-1 gap-3 border-t border-stone-100 pt-5 sm:grid-cols-2">
              <div className="flex items-center gap-3 bg-[#f7f7f5] p-3">
                <ShieldCheck
                  size={19}
                  className="shrink-0 text-[#a17b00]"
                />
                <span className="text-[10px] font-bold uppercase">
                  Trusted hardware
                </span>
              </div>

              <div className="flex items-center gap-3 bg-[#f7f7f5] p-3">
                <Truck
                  size={19}
                  className="shrink-0 text-[#a17b00]"
                />
                <span className="text-[10px] font-bold uppercase">
                  Delivery at checkout
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Spare parts */}
        <section className="mt-12 sm:mt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-stone-200 pb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#a17b00]">
                Keep your equipment running
              </p>
              <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">
                Spare Parts<span className="text-[#d8a500]">.</span>
              </h2>
              <p className="mt-2 text-xs text-stone-500">
                Compatible parts listed for this product.
              </p>
            </div>

            <Wrench size={25} className="text-[#a17b00]" />
          </div>

          {product.spare_parts.length === 0 ? (
            <div className="border border-stone-200 bg-white px-5 py-12 text-center">
              <Package
                size={32}
                className="mx-auto text-stone-300"
                strokeWidth={1.4}
              />
              <p className="mt-3 text-sm font-bold">
                No spare parts listed
              </p>
              <p className="mt-1 text-xs text-stone-500">
                There are currently no spare parts listed for this product.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {product.spare_parts.map((part) => (
                <SparePartCard
                  key={part.id}
                  part={part}
                  onAdd={(p) => handleAdd("spare_part", p)}
                  showAction={!isAdmin}
                />
              ))}
            </div>
          )}
        </section>

        {/* Back to products */}
        <div className="mt-10 border-t border-stone-200 pt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wide text-stone-600 transition hover:text-[#a17b00]"
          >
            <ArrowLeft size={15} />
            Back to products
            <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    </div>
  );
}
