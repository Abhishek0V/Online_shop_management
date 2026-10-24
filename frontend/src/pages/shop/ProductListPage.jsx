import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { listProducts } from "../../api/productApi";
import Loader from "../../components/Loader";
import Pagination from "../../components/Pagination";
import ProductCard from "../../components/ProductCard";

const PAGE_SIZE = 12;

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("search") || "";
  const page = Number(searchParams.get("page")) || 1;

  const [input, setInput] = useState(query);
  const [data, setData] = useState({ count: 0, results: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const updateParams = (next) => {
    const search = next.search ?? query;
    const nextPage = next.page ?? page;
    const params = {};
    if (search) params.search = search;
    if (nextPage > 1) params.page = String(nextPage);
    setSearchParams(params);
  };

  // Wait until the user stops typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (input.trim() !== query) updateParams({ search: input.trim(), page: 1 });
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    listProducts({ search: query || undefined, page })
      .then((res) => !cancelled && setData(res.data))
      .catch(() => !cancelled && setError("Could not load products. Please try again."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [query, page]);

  return (
    <div className="container">
      <div className="page-head">
        <h1>Hardware &amp; Tools</h1>
        <input
          type="search" className="search-input" placeholder="Search by name, brand or model..."
          value={input} onChange={(e) => setInput(e.target.value)} aria-label="Search products"
        />
      </div>

      {loading ? <Loader /> : error ? (
        <div className="form-error" role="alert">{error}</div>
      ) : data.results.length === 0 ? (
        <p className="empty-state">{query ? `No products match "${query}".` : "No products available yet."}</p>
      ) : (
        <>
          <div className="product-grid">
            {data.results.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <Pagination page={page} count={data.count} pageSize={PAGE_SIZE} onChange={(n) => updateParams({ page: n })} />
        </>
      )}
    </div>
  );
}