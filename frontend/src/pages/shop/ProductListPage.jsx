
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  ShoppingCart,
  UserRound,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ArrowRight,
  Truck,
  RotateCcw,
  CreditCard,
  Wrench,
  Phone,
  Mail,
  Clock3,
  ShieldCheck,
  Hammer,
} from "lucide-react";

import { listProducts } from "../../api/productApi";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import ProductCard from "../../components/ProductCard";

const PAGE_SIZE = 8;

const categories = [
  "Power Tools",
  "Hand Tools",
  "Electrical",
  "Accessories",
  "Safety",
];

const money = (price) =>
  `₹${Number(price).toLocaleString("en-IN")}`;

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [input, setInput] = useState(query);
  const [data, setData] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  // Keep the input synchronized with browser navigation.
  useEffect(() => {
    setInput(query);
  }, [query]);

  // Update URL search parameters without losing existing functionality.
  const updateParams = (next) => {
    const search = next.search ?? query;
    const nextPage = next.page ?? page;

    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (nextPage > 1) params.set("page", String(nextPage));

    setSearchParams(params);
  };

  // Debounced product search.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim() !== query) {
        updateParams({ search: input.trim(), page: 1 });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [input, query]);

  // Fetch actual products from Django.
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");

    listProducts({
      search: query || undefined,
      page,
      page_size: PAGE_SIZE,
    })
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load products. Please try again.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query, page]);

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const searchCategory = (category) => {
    setInput(category);
    updateParams({ search: category, page: 1 });
    scrollToProducts();
  };

  const resetFilters = () => {
    setInput("");
    updateParams({ search: "", page: 1 });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f7f5] text-[#242424]">


      <main>
        {/* HERO BANNERS */}
        <section
          id="home"
          className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-12">

            {/* MAIN BANNER */}
            <div className="relative min-h-[350px] overflow-hidden bg-[#252525] md:col-span-8 md:min-h-[380px] lg:min-h-[420px]">
              <img
                src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1400&q=90"
                alt="Professional hardware tools in a workshop"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />

              <div className="relative z-10 flex min-h-[350px] items-center p-6 text-white sm:p-10 md:min-h-[380px] lg:min-h-[420px] lg:p-12">
                <div className="max-w-md">
                  <span className="bg-[#f5c32c] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-black">
                    Big Sale
                  </span>

                  <h2 className="mt-5 text-4xl font-black uppercase leading-[1.08] sm:text-5xl lg:text-6xl">
                    Power Tools.
                    <br />
                    <span className="text-[#f5c32c]">
                      Power Deals.
                    </span>
                  </h2>

                  <p className="mt-4 max-w-sm text-xs leading-6 text-white/80 sm:text-sm">
                    Professional tools and trusted hardware for every
                    project, workshop, and worksite.
                  </p>

                  <button
                    onClick={scrollToProducts}
                    className="mt-6 inline-flex items-center gap-3 bg-[#f5c32c] px-5 py-3 text-[11px] font-black uppercase text-black transition hover:bg-white"
                  >
                    Shop Products <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* SIDE BANNER */}
            <div className="relative min-h-[230px] overflow-hidden bg-[#e8b91f] md:col-span-4">
              <img
                src="https://images.unsplash.com/photo-1581147036324-c1c89c2c8b5c?auto=format&fit=crop&w=700&q=85"
                alt="Tools for a professional workshop"
                className="absolute inset-0 h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#f5c32c] via-[#f5c32c]/60 to-transparent" />

              <div className="relative flex min-h-[230px] flex-col justify-end p-6">
                <p className="text-[10px] font-black uppercase tracking-widest">
                  For every professional
                </p>

                <h3 className="mt-2 max-w-[230px] text-2xl font-black uppercase leading-tight">
                  Find the right tool for the job
                </h3>

                <button
                  onClick={scrollToProducts}
                  className="mt-4 flex w-fit items-center gap-2 border border-black px-4 py-2 text-[10px] font-black uppercase transition hover:bg-black hover:text-white"
                >
                  Explore Range <ArrowRight size={13} />
                </button>
              </div>
            </div>

            {/* SECONDARY BANNERS */}
            <div className="relative flex min-h-[155px] items-center overflow-hidden bg-[#f5c32c] sm:min-h-[180px] md:col-span-5">
              <div className="relative z-10 w-[55%] p-5 sm:p-7">
                <p className="text-[9px] font-black uppercase tracking-widest">
                  New Collection
                </p>

                <h3 className="mt-2 text-xl font-black uppercase leading-tight sm:text-2xl">
                  Workshop Essentials
                </h3>

                <button
                  onClick={scrollToProducts}
                  className="mt-4 border border-black px-3 py-2 text-[9px] font-black uppercase hover:bg-black hover:text-white"
                >
                  Shop Now
                </button>
              </div>

              <img
                src="https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=600&q=85"
                alt="Hand tools collection"
                className="absolute right-0 h-full w-[48%] object-cover"
              />
            </div>

            <div className="relative flex min-h-[155px] items-end overflow-hidden bg-[#202020] sm:min-h-[180px] md:col-span-7">
              <img
                src="https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=1000&q=85"
                alt="Hardware and power tools"
                className="absolute inset-0 h-full w-full object-cover opacity-60"
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/85 to-transparent" />

              <div className="relative z-10 p-5 text-white sm:p-7">
                <p className="text-[9px] font-bold uppercase tracking-widest text-[#f5c32c]">
                  Reliable. Durable. Affordable.
                </p>

                <h3 className="mt-2 max-w-xs text-xl font-black uppercase leading-tight sm:text-2xl">
                  Get your next project started
                </h3>

                <button
                  onClick={scrollToProducts}
                  className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase hover:text-[#f5c32c]"
                >
                  Explore Products <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* SERVICE STRIP */}
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            {[
              {
                Icon: Truck,
                title: "FREE DELIVERY",
                sub: "On eligible orders",
              },
              {
                Icon: RotateCcw,
                title: "EASY RETURNS",
                sub: "Simple return process",
              },
              {
                Icon: CreditCard,
                title: "SECURE PAYMENTS",
                sub: "Safe checkout",
              },
            ].map(({ Icon, title, sub }) => (
              <div
                key={title}
                className="flex items-center gap-4 border border-stone-200 bg-white px-5 py-4"
              >
                <Icon size={23} className="shrink-0 text-[#bd9200]" />

                <div>
                  <h3 className="text-[10px] font-black tracking-wide">
                    {title}
                  </h3>

                  <p className="mt-1 text-[10px] text-stone-500">
                    {sub}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CATEGORIES */}
        <section
          id="categories"
          className="mx-auto max-w-7xl px-4 pb-4 pt-12 sm:px-6 lg:px-8 lg:pt-16"
        >
          <div className="mb-6 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#b58a00]">
              Browse our collection
            </p>

            <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">
              Shop by Category
            </h2>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => searchCategory(category)}
                className="bg-[#262626] px-4 py-3 text-[10px] font-black uppercase tracking-wide text-white transition hover:bg-[#f5c32c] hover:text-black sm:px-5"
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* REAL PRODUCT LIST */}
        <section id="products" className="bg-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#b58a00]">
                  Quality you can trust
                </p>

                <h2 className="mt-2 text-2xl font-black uppercase sm:text-3xl">
                  {query ? "Search Results" : "Our Products"}
                </h2>

                <p className="mt-2 text-xs text-stone-500">
                  Find the right tools and supplies for your next project.
                </p>
              </div>

              <button
                onClick={resetFilters}
                className="flex items-center gap-2 text-[10px] font-black uppercase hover:text-[#b58a00]"
              >
                View All Products <ChevronRight size={15} />
              </button>
            </div>

            {/* SEARCH AND FILTER STATUS */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-4">
              <p className="text-xs text-stone-500">
                {loading
                  ? "Loading products..."
                  : `${data.count} product${data.count === 1 ? "" : "s"} found`}
              </p>

              {query && (
                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-[#987000] hover:underline"
                >
                  Clear search: "{query}" ×
                </button>
              )}
            </div>

            {/* LOADING, ERROR, EMPTY, PRODUCT GRID */}
            {loading ? (
              <Loader />
            ) : error ? (
              <div
                className="border border-red-200 bg-red-50 p-5 text-sm text-red-700"
                role="alert"
              >
                <p>{error}</p>

                <button
                  onClick={() => {
                    setSearchParams(
                      query ? { search: query, page: String(page) } : {}
                    );
                  }}
                  className="mt-3 font-bold underline"
                >
                  Try again
                </button>
              </div>
            ) : data.results.length === 0 ? (
              <div className="py-16 text-center">
                <Search
                  className="mx-auto mb-3 text-stone-400"
                  size={30}
                />

                <h3 className="font-bold">No products found</h3>

                <p className="mt-2 text-sm text-stone-500">
                  {query
                    ? `No products match "${query}".`
                    : "No products available yet."}
                </p>

                <button
                  onClick={resetFilters}
                  className="mt-4 bg-[#f5c32c] px-5 py-3 text-xs font-bold"
                >
                  Reset Search
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
                  {data.results.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
                </div>

                <div className="mt-8">
                  <Pagination
                    page={page}
                    count={data.count}
                    pageSize={PAGE_SIZE}
                    onChange={(nextPage) =>
                      updateParams({ page: nextPage })
                    }
                  />
                </div>
              </>
            )}
          </div>
        </section>

        {/* PROMOTIONAL BANNER */}
        <section
          id="offers"
          className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14"
        >
          <div className="relative flex min-h-[230px] items-center overflow-hidden bg-[#f5c32c] sm:min-h-[270px]">
            <img
              src="https://images.unsplash.com/photo-1581147036324-c1c89c2c8b5c?auto=format&fit=crop&w=1400&q=85"
              alt="Professional workshop tools"
              className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-multiply"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#f5c32c] via-[#f5c32c]/90 to-transparent" />

            <div className="relative z-10 max-w-xl p-6 sm:p-10 lg:p-14">
              <p className="text-[10px] font-black uppercase tracking-[0.25em]">
                Your next project starts here
              </p>

              <h2 className="mt-3 text-3xl font-black uppercase leading-tight sm:text-4xl">
                Build more.
                <br />
                Spend less.
              </h2>

              <p className="mt-3 max-w-sm text-xs leading-5 sm:text-sm">
                Discover tools, hardware, and workshop essentials.
              </p>

              <button
                onClick={scrollToProducts}
                className="mt-5 flex items-center gap-3 bg-[#242424] px-5 py-3 text-[10px] font-black uppercase text-white transition hover:bg-white hover:text-black"
              >
                Shop Products <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
          <div className="mb-7 text-center">
            <h2 className="text-xl font-black uppercase sm:text-2xl">
              Why Choose Forge?
            </h2>

            <p className="mt-2 text-xs text-stone-500">
              The right products. The right support. Every time.
            </p>
          </div>

          <div className="grid grid-cols-2 border-l border-t border-stone-200 bg-white sm:grid-cols-4">
            {[
              {
                Icon: ShieldCheck,
                title: "Quality Assured",
                text: "Products selected for reliability",
              },
              {
                Icon: Truck,
                title: "Reliable Delivery",
                text: "Convenient shipping options",
              },
              {
                Icon: Wrench,
                title: "Expert Support",
                text: "Help choosing the right tools",
              },
              {
                Icon: CreditCard,
                title: "Secure Checkout",
                text: "Protected payment process",
              },
            ].map(({ Icon, title, text }) => (
              <div
                key={title}
                className="border-b border-r border-stone-200 p-5 text-center sm:p-7"
              >
                <Icon
                  className="mx-auto text-[#b58a00]"
                  size={28}
                  strokeWidth={1.6}
                />

                <h3 className="mt-3 text-xs font-black uppercase">
                  {title}
                </h3>

                <p className="mt-2 text-[10px] leading-4 text-stone-500">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer id="footer" className="bg-[#222222] text-white">
        <div className="mx-auto grid max-w-7xl gap-9 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center bg-[#f5c32c] text-black">
                <Hammer size={23} />
              </span>

              <span className="text-2xl font-black uppercase">
                Forge<span className="text-[#f5c32c]">.</span>
              </span>
            </div>

            <p className="mt-4 max-w-xs text-xs leading-6 text-white/60">
              Your destination for dependable hardware, tools, and
              construction essentials.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#f5c32c]">
              Quick Links
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-xs text-white/70">
              <a href="#home" className="hover:text-[#f5c32c]">Home</a>
              <a href="#categories" className="hover:text-[#f5c32c]">Categories</a>
              <a href="#products" className="hover:text-[#f5c32c]">Products</a>
              <a href="#offers" className="hover:text-[#f5c32c]">Offers</a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#f5c32c]">
              Customer Service
            </h3>

            <div className="mt-4 flex flex-col gap-3 text-xs text-white/70">
              <a href="#footer" className="hover:text-[#f5c32c]">Contact Us</a>
              <a href="#footer" className="hover:text-[#f5c32c]">Shipping Policy</a>
              <a href="#footer" className="hover:text-[#f5c32c]">Returns & Refunds</a>
              <a href="#footer" className="hover:text-[#f5c32c]">Privacy Policy</a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#f5c32c]">
              Get in Touch
            </h3>

            <div className="mt-4 flex flex-col gap-4 text-xs text-white/70">
              <p className="flex items-center gap-2">
                <Phone size={15} /> +91 98765 43210
              </p>

              <p className="flex items-center gap-2">
                <Mail size={15} /> support@forge.example
              </p>

              <p className="flex items-center gap-2">
                <Clock3 size={15} /> Mon–Sat, 9 AM–7 PM
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/20 px-4 py-4 text-center text-[10px] text-white/50">
          © {new Date().getFullYear()} Forge Hardware. All rights reserved.
        </div>
      </footer>
    </div>
  );
}