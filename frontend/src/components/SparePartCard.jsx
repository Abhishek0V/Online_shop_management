
import { Package, Tag, Wrench, ArrowUpRight, CheckCircle2, XCircle, ShoppingCart } from "lucide-react";
import { formatCurrency } from "../utils/formatCurrency";

export default function SparePartCard({ part, onAdd, showAction }) {
  const outOfStock = Number(part.stock) <= 0;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden border border-stone-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-[#e3b51b] hover:shadow-lg">
      {/* Product image */}
      <div className="relative aspect-square overflow-hidden bg-[#f5f4f0]">
        {part.image ? (
          <img
            src={part.image}
            alt={part.name}
            loading="lazy"
            className="h-full w-full object-contain p-5 transition duration-500 group-hover:scale-105 sm:p-7"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-stone-300">
            <Package size={42} strokeWidth={1.2} />
            <span className="text-[9px] font-bold uppercase tracking-wider">
              No image available
            </span>
          </div>
        )}

        {/* Spare part label */}
        <span className="absolute left-3 top-3 flex items-center gap-1.5 bg-[#f5c32c] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wide text-black">
          <Wrench size={12} />
          Spare Part
        </span>

        {/* Stock status */}
        {outOfStock && (
          <span className="absolute bottom-3 left-3 bg-stone-900 px-2.5 py-1.5 text-[9px] font-bold uppercase text-white">
            Out of stock
          </span>
        )}

        <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center bg-white text-stone-700 shadow-sm transition group-hover:bg-[#f5c32c] group-hover:text-black">
          <ArrowUpRight size={16} />
        </span>
      </div>

      {/* Product information */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.15em] text-[#a17b00]">
          Replacement part
        </p>

        <h4 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-stone-900 transition group-hover:text-[#987000]">
          {part.name}
        </h4>

        {part.part_code && (
          <p className="mt-1 truncate text-[10px] text-stone-400">
            Part code: {part.part_code}
          </p>
        )}

        {/* Price */}
        <div className="mt-4">
          <p className="text-lg font-black text-[#242424]">
            {formatCurrency(part.price)}
          </p>
        </div>

        {/* Availability */}
        <div className="mt-3 flex items-center gap-1.5">
          {outOfStock ? (
            <>
              <XCircle size={14} className="text-red-500" />
              <span className="text-[10px] font-bold uppercase text-red-600">
                Unavailable
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 size={14} className="text-green-700" />
              <span className="text-[10px] font-bold uppercase text-green-700">
                In stock
              </span>
              {part.stock != null && (
                <span className="text-[10px] text-stone-400">
                  · {part.stock} available
                </span>
              )}
            </>
          )}
        </div>

        {/* Action */}
        {showAction && (
          <button
            type="button"
            disabled={outOfStock}
            onClick={() => onAdd(part)}
            className="mt-4 flex w-full items-center justify-center gap-2 bg-[#f5c32c] px-3 py-3 text-[10px] font-black uppercase tracking-wide text-black transition hover:bg-[#e7b51b] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-400"
          >
            <ShoppingCart size={15} />
            {outOfStock ? "Out of stock" : "Add to cart"}
          </button>
        )}

        {!showAction && (
          <div className="mt-auto border-t border-stone-100 pt-4">
            <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide text-stone-500">
              <Tag size={13} className="text-[#a17b00]" />
              Genuine fitment part
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
