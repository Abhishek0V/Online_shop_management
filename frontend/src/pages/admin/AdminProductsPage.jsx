import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { listAdminProducts, updateProduct } from "../../api/adminProductApi";
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
    listAdminProducts({ search: query || undefined, page })
      .then((res) => !cancelled && setData(res.data))
      .catch(() => !cancelled && setError("Could not load products."))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [query, page, reloadKey]);

  const toggleActive = async (product) => {
    const action = product.is_active ? "hide" : "show";
    if (!window.confirm(`Do you want to ${action} "${product.name}" ${product.is_active ? "from" : "in"} the shop?`)) return;
    try {
      await updateProduct(product.id, { is_active: !product.is_active });
      toast.success(product.is_active ? "Product hidden." : "Product is visible again.");
      setReloadKey((k) => k + 1);
    } catch {
      toast.error("Could not update the product.");
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <h1>Products</h1>
        <div className="head-actions">
          <input type="search" className="search-input" placeholder="Search products..." value={input} onChange={(e) => setInput(e.target.value)} aria-label="Search products" />
          <Link to="/admin/products/new" className="btn btn-primary">+ Add product</Link>
          <Link to="/admin/orders" className="btn btn-outline">View orders</Link>
        </div>
      </div>

      {loading ? <Loader /> : error ? <div className="form-error" role="alert">{error}</div> : data.results.length === 0 ? (
        <p className="empty-state">No products found.</p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Image</th><th>Name</th><th>Model</th><th>Price</th><th>Stock</th><th>Spare parts</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {data.results.map((p) => (
                  <tr key={p.id}>
                    <td>{p.images[0] ? <img className="thumb-sm" src={p.images[0].image} alt="" /> : "-"}</td>
                    <td>{p.name}<br /><span className="muted">{p.brand}</span></td>
                    <td>{p.model_code}</td>
                    <td>{formatCurrency(p.price)}</td>
                    <td>{p.stock}</td>
                    <td>{p.spare_parts.length}</td>
                    <td><span className={p.is_active ? "pill pill-ok" : "pill pill-off"}>{p.is_active ? "Active" : "Hidden"}</span></td>
                    <td className="actions">
                      <Link to={`/admin/products/${p.id}/edit`}>Edit</Link>
                      <button type="button" className="link-btn" onClick={() => toggleActive(p)}>{p.is_active ? "Hide" : "Show"}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} count={data.count} pageSize={12} onChange={(n) => updateParams({ page: n })} />
        </>
      )}
    </div>
  );
}