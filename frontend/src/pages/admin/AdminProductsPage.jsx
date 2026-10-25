
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Wrench,
} from "lucide-react";

import {
  listAdminProducts,
  updateProduct,
} from "../../api/adminProductApi";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import { formatCurrency } from "../../utils/formatCurrency";

export default function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;

  const [input, setInput] = useState(query);
  const [data, setData] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const updateParams = (next) => {
    const search = next.search ?? query;
    const nextPage = next.page ?? page;
    const params = {};

    if (search) params.search = search;
    if (nextPage > 1) params.page = String(nextPage);

    setSearchParams(params);
  };

  useEffect(() => {
    setInput(query);
  }, [query]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim() !== query) {
        updateParams({ search: input.trim(), page: 1 });
      }
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    listAdminProducts({ search: query || undefined, page })
      .then((res) => {
        if (!cancelled) setData(res.data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load products.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [query, page, reloadKey]);

  const toggleActive = async (product) => {
    const action = product.is_active ? "hide" : "show";

    if (
      !window.confirm(
        `Do you want to ${action} "${product.name}" ${
          product.is_active ? "from" : "in"
        } the shop?`
      )
    ) {
      return;
    }

    try {
      await updateProduct(product.id, {
        is_active: !product.is_active,
      });

      toast.success(
        product.is_active
          ? "Product hidden."
          : "Product is visible again."
      );

      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Could not update the product.");
    }
  };

  const products = data.results || [];

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}
        <section className="mb-7 border-b border-stone-200 pb-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#a17b00]">
                FORGE / ADMINISTRATION
              </p>

              <h1 className="text-2xl font-black uppercase tracking-tight text-[#242424] sm:text-3xl">
                Product management
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
                Manage your hardware inventory, product visibility, pricing,
                and spare parts from one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                to="/admin/orders"
                className="inline-flex items-center justify-center gap-2 border border-stone-300 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-wider text-stone-700 transition hover:border-[#f5c32c] hover:bg-[#fff9e5]"
              >
                <ShoppingBag size={15} />
                View orders
              </Link>

              <Link
                to="/admin/products/new"
                className="inline-flex items-center justify-center gap-2 bg-[#f5c32c] px-4 py-3 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-[#e5b51f]"
              >
                <Plus size={16} />
                Add product
              </Link>
            </div>
          </div>
        </section>

        {/* SUMMARY CARDS */}
        <section className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-4 border border-stone-200 bg-white p-4 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#fff5cc] text-[#987000]">
              <Package size={22} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                Matching products
              </p>
              <p className="mt-1 text-2xl font-black text-[#242424]">
                {data.count}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border border-stone-200 bg-white p-4 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-green-50 text-green-700">
              <Eye size={21} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                Active on this page
              </p>
              <p className="mt-1 text-2xl font-black text-[#242424]">
                {loading
                  ? "—"
                  : products.filter((product) => product.is_active).length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 border border-stone-200 bg-white p-4 sm:p-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center bg-stone-100 text-stone-600">
              <Wrench size={21} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">
                Hidden on this page
              </p>
              <p className="mt-1 text-2xl font-black text-[#242424]">
                {loading
                  ? "—"
                  : products.filter((product) => !product.is_active).length}
              </p>
            </div>
          </div>
        </section>

        {/* SEARCH AND FILTER BAR */}
        <section className="mb-5 flex flex-col gap-4 border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-[#242424]">
              Inventory
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Search, edit, or change product visibility.
            </p>
          </div>

          <div className="relative w-full sm:max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            />
            <input
              type="search"
              placeholder="Search products..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Search products"
              className="h-11 w-full border border-stone-200 bg-[#f7f7f5] pl-10 pr-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#d8a500] focus:bg-white"
            />
          </div>
        </section>

        {/* PRODUCT CONTENT */}
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
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-3 inline-flex items-center gap-2 font-black uppercase tracking-wide underline underline-offset-4"
            >
              Try again <ArrowRight size={14} />
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="border border-stone-200 bg-white px-5 py-14 text-center sm:py-20">
            <div className="mx-auto flex h-16 w-16 items-center justify-center bg-stone-100 text-stone-500">
              <Package size={30} strokeWidth={1.4} />
            </div>

            <h2 className="mt-5 text-lg font-black uppercase tracking-tight text-[#242424]">
              No products found
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-stone-500">
              {query
                ? "Try another search term or clear your search."
                : "Your inventory is empty. Add your first product to get started."}
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setInput("");
                    updateParams({ search: "", page: 1 });
                  }}
                  className="border border-stone-300 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-stone-700 transition hover:bg-stone-100"
                >
                  Clear search
                </button>
              )}

              <Link
                to="/admin/products/new"
                className="inline-flex items-center gap-2 bg-[#f5c32c] px-5 py-3 text-[10px] font-black uppercase tracking-wider text-black transition hover:bg-[#e5b51f]"
              >
                <Plus size={15} />
                Add product
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden overflow-hidden border border-stone-200 bg-white lg:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-stone-200 bg-[#242424] text-[9px] font-bold uppercase tracking-widest text-white">
                      <th className="px-5 py-4">Product</th>
                      <th className="px-4 py-4">Model</th>
                      <th className="px-4 py-4">Price</th>
                      <th className="px-4 py-4">Stock</th>
                      <th className="px-4 py-4">Spare parts</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-stone-100">
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="transition hover:bg-[#fffdf5]"
                      >
                        <td className="px-5 py-4">
                          <div className="flex min-w-52 items-center gap-3">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-stone-200 bg-[#f7f7f5]">
                              {product.images?.[0]?.image ? (
                                <img
                                  src={product.images[0].image}
                                  alt={product.name}
                                  loading="lazy"
                                  className="h-full w-full object-contain p-1"
                                />
                              ) : (
                                <Package
                                  size={23}
                                  className="text-stone-400"
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="line-clamp-2 text-xs font-black text-stone-800">
                                {product.name}
                              </p>
                              <p className="mt-1 truncate text-[10px] uppercase tracking-wide text-stone-500">
                                {product.brand || "Unbranded"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-xs text-stone-600">
                          {product.model_code || "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-xs font-black text-[#242424]">
                          {formatCurrency(product.price)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`text-xs font-bold ${
                              Number(product.stock) <= 0
                                ? "text-red-600"
                                : Number(product.stock) <= 5
                                  ? "text-amber-700"
                                  : "text-stone-700"
                            }`}
                          >
                            {product.stock}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-xs text-stone-600">
                          {product.spare_parts?.length ?? 0}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-wide ${
                              product.is_active
                                ? "bg-green-50 text-green-700"
                                : "bg-stone-100 text-stone-500"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                product.is_active
                                  ? "bg-green-600"
                                  : "bg-stone-400"
                              }`}
                            />
                            {product.is_active ? "Active" : "Hidden"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              to={`/admin/products/${product.id}/edit`}
                              className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-stone-600 transition hover:text-[#987000]"
                            >
                              <Pencil size={13} />
                              Edit
                            </Link>

                            <button
                              type="button"
                              onClick={() => toggleActive(product)}
                              className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide transition ${
                                product.is_active
                                  ? "text-red-600 hover:text-red-800"
                                  : "text-green-700 hover:text-green-900"
                              }`}
                            >
                              {product.is_active ? (
                                <EyeOff size={13} />
                              ) : (
                                <Eye size={13} />
                              )}
                              {product.is_active ? "Hide" : "Show"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MOBILE AND TABLET PRODUCT CARDS */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
              {products.map((product) => (
                <article
                  key={product.id}
                  className="overflow-hidden border border-stone-200 bg-white"
                >
                  <div className="flex gap-3 p-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-stone-200 bg-[#f7f7f5]">
                      {product.images?.[0]?.image ? (
                        <img
                          src={product.images[0].image}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <Package
                          size={28}
                          className="text-stone-400"
                        />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-1 text-[8px] font-black uppercase tracking-wide ${
                            product.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-stone-100 text-stone-500"
                          }`}
                        >
                          {product.is_active ? "Active" : "Hidden"}
                        </span>
                      </div>

                      <h3 className="line-clamp-2 text-sm font-black leading-5 text-[#242424]">
                        {product.name}
                      </h3>

                      <p className="mt-1 truncate text-[10px] uppercase tracking-wide text-stone-500">
                        {product.brand || "Unbranded"}
                      </p>

                      <p className="mt-2 text-sm font-black text-[#987000]">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 border-y border-stone-100 bg-[#fafaf8]">
                    <div className="border-r border-stone-100 p-3">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-stone-400">
                        Stock
                      </p>
                      <p
                        className={`mt-1 text-xs font-black ${
                          Number(product.stock) <= 0
                            ? "text-red-600"
                            : Number(product.stock) <= 5
                              ? "text-amber-700"
                              : "text-stone-800"
                        }`}
                      >
                        {product.stock}
                      </p>
                    </div>

                    <div className="border-r border-stone-100 p-3">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-stone-400">
                        Model
                      </p>
                      <p className="mt-1 truncate text-xs font-bold text-stone-700">
                        {product.model_code || "—"}
                      </p>
                    </div>

                    <div className="p-3">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-stone-400">
                        Spare parts
                      </p>
                      <p className="mt-1 text-xs font-bold text-stone-700">
                        {product.spare_parts?.length ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center divide-x divide-stone-200 border-t border-stone-100">
                    <Link
                      to={`/admin/products/${product.id}/edit`}
                      className="flex flex-1 items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-wider text-stone-700 transition hover:bg-[#fff9e5] hover:text-[#987000]"
                    >
                      <Pencil size={14} />
                      Edit product
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleActive(product)}
                      className={`flex flex-1 items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-wider transition hover:bg-stone-50 ${
                        product.is_active ? "text-red-600" : "text-green-700"
                      }`}
                    >
                      {product.is_active ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                      {product.is_active ? "Hide" : "Show"}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 border border-stone-200 bg-white px-3 py-4 sm:px-5">
              <Pagination
                page={page}
                count={data.count}
                pageSize={12}
                onChange={(n) => updateParams({ page: n })}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
