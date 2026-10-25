
import { Link } from "react-router-dom";
import { ArrowUpRight, Package, Tag } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

export default function ProductCard({ product }) {
  const saving = Number(product.discount_amount) || 0;
  const outOfStock = Number(product.stock) <= 0;

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex min-w-0 flex-col overflow-hidden border border-stone-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-[#e3b51b] hover:shadow-lg"
    >
      {/* PRODUCT IMAGE */}
      <div className="relative aspect-square overflow-hidden bg-[#f5f4f0]">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105 sm:p-5"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-stone-400">
            <Package size={38} strokeWidth={1.2} />
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              No image available
            </span>
          </div>
        )}

        {/* DISCOUNT BADGE */}
        {saving > 0 && (
          <span className="absolute left-2 top-2 flex items-center gap-1 bg-[#f5c32c] px-2 py-1 text-[9px] font-black uppercase text-black sm:left-3 sm:top-3">
            <Tag size={11} />
            Save {formatCurrency(saving)}
          </span>
        )}

        {/* STOCK BADGE */}
        {outOfStock && (
          <span className="absolute bottom-2 left-2 bg-stone-800 px-2 py-1 text-[9px] font-bold uppercase text-white sm:bottom-3 sm:left-3">
            Out of stock
          </span>
        )}

        {/* VIEW PRODUCT ICON */}
        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center bg-white text-stone-700 shadow-sm transition group-hover:bg-[#f5c32c] group-hover:text-black sm:right-3 sm:top-3">
          <ArrowUpRight size={16} />
        </span>
      </div>

      {/* PRODUCT DETAILS */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.brand && (
          <p className="mb-1 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-[#a17b00] sm:text-[10px]">
            {product.brand}
          </p>
        )}

        <h3 className="line-clamp-2 min-h-10 text-xs font-bold leading-5 text-stone-800 transition group-hover:text-[#987000] sm:text-sm">
          {product.name}
        </h3>

        {product.model_code && (
          <p className="mt-1 truncate text-[10px] text-stone-400">
            Model: {product.model_code}
          </p>
        )}

        {/* PRICE */}
        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-black text-[#242424] sm:text-base">
            {formatCurrency(product.price)}
          </span>

          {saving > 0 && product.mrp != null && (
            <span className="text-[10px] text-stone-400 line-through sm:text-xs">
              {formatCurrency(product.mrp)}
            </span>
          )}
        </div>

        {/* BOTTOM STATUS */}
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between border-t border-stone-100 pt-3">
            <span
              className={`text-[9px] font-bold uppercase tracking-wide ${
                outOfStock ? "text-red-600" : "text-green-700"
              }`}
            >
              {outOfStock ? "Unavailable" : "In stock"}
            </span>

            <span className="flex items-center gap-1 text-[9px] font-black uppercase text-stone-700 transition group-hover:text-[#987000]">
              View <ArrowUpRight size={12} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
