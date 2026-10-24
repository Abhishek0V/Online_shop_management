import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  createProduct, createSparePart, deleteImage, deleteSparePart, getAdminProduct,
  setPrimaryImage, updateProduct, updateSparePart,
} from "../../api/adminProductApi";
import FormField from "../../components/FormField";
import Loader from "../../components/Loader";
import { parseApiError } from "../../utils/apiErrors";

const EMPTY = { name: "", brand: "", model_code: "", description: "", mrp: "", price: "", stock: "0", is_active: true };
const EMPTY_PART = { id: null, name: "", part_code: "", price: "", stock: "0", is_active: true };
const MAX_SIZE = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

const isBlankPart = (p) => !p.id && !p.name.trim() && !String(p.price).trim() && !p.part_code.trim();
const isWholeNumber = (v) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0;

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [files, setFiles] = useState([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [existingImages, setExistingImages] = useState([]);
  const [parts, setParts] = useState([]);
  const [removedPartIds, setRemovedPartIds] = useState([]);
  const [partErrors, setPartErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);

  const loadProduct = useCallback(async () => {
    try {
      const { data: p } = await getAdminProduct(id);
      setValues({
        name: p.name, brand: p.brand, model_code: p.model_code, description: p.description,
        mrp: p.mrp, price: p.price, stock: String(p.stock), is_active: p.is_active,
      });
      setExistingImages(p.images);
      setParts(p.spare_parts.map((s) => ({ id: s.id, name: s.name, part_code: s.part_code, price: s.price, stock: String(s.stock), is_active: s.is_active })));
      setRemovedPartIds([]);
    } catch {
      toast.error("Product not found.");
      navigate("/admin/products");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { if (isEdit) loadProduct(); }, [isEdit, loadProduct]);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const setField = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "" }));
  };
  const handleChange = (e) => setField(e.target.name, e.target.type === "checkbox" ? e.target.checked : e.target.value);

  // ---- images ----
  const handleFiles = (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = "";
    const bad = picked.find((f) => !TYPES.includes(f.type) || f.size > MAX_SIZE);
    const good = picked.filter((f) => TYPES.includes(f.type) && f.size <= MAX_SIZE);
    setErrors((prev) => ({ ...prev, images: bad ? "Only JPG, PNG or WebP images up to 2 MB are allowed. Some files were skipped." : "" }));
    setFiles((prev) => [...prev, ...good]);
  };

  const removeNewFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPrimaryIndex((p) => (index === p ? 0 : index < p ? p - 1 : p));
  };

  const refreshImages = async () => {
    const { data } = await getAdminProduct(id);
    setExistingImages(data.images);
  };

  const makePrimary = async (image) => {
    try { await setPrimaryImage(image.id); await refreshImages(); toast.success("Primary image updated."); }
    catch { toast.error("Could not change the primary image."); }
  };

  const removeImage = async (image) => {
    if (!window.confirm("Delete this image?")) return;
    try { await deleteImage(image.id); await refreshImages(); }
    catch (err) { toast.error(parseApiError(err).message || "Could not delete the image."); }
  };

  // ---- spare parts ----
  const updatePart = (index, field, value) => {
    setParts((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
    setPartErrors((prev) => ({ ...prev, [index]: undefined }));
  };
  const addPart = () => setParts((prev) => [...prev, { ...EMPTY_PART }]);
  const removePart = (index) => {
    const row = parts[index];
    if (row.id) setRemovedPartIds((ids) => [...ids, row.id]);
    setParts((prev) => prev.filter((_, i) => i !== index));
    setPartErrors({});
  };

  // ---- validation ----
  const validateProduct = () => {
    const e = {};
    if (!values.name.trim()) e.name = "Name is required.";
    if (!values.brand.trim()) e.brand = "Brand is required.";
    if (!values.model_code.trim()) e.model_code = "Model code is required.";
    const mrp = Number(values.mrp);
    const price = Number(values.price);
    if (!(mrp > 0)) e.mrp = "Enter an MRP greater than 0.";
    if (!(price > 0)) e.price = "Enter a price greater than 0.";
    else if (mrp > 0 && price > mrp) e.price = "Price cannot be greater than MRP.";
    if (!isWholeNumber(values.stock)) e.stock = "Stock must be a whole number, 0 or more.";
    if (!isEdit && files.length === 0) e.images = "Upload at least one image.";
    return e;
  };

  const validateParts = () => {
    const e = {};
    const seen = new Set();
    parts.forEach((p, i) => {
      if (isBlankPart(p)) return;
      const row = {};
      const name = p.name.trim().toLowerCase();
      if (!name) row.name = "Name is required.";
      else if (seen.has(name)) row.name = "Duplicate spare part name.";
      seen.add(name);
      if (!(Number(p.price) > 0)) row.price = "Price must be above 0.";
      if (!isWholeNumber(p.stock)) row.stock = "Whole number, 0 or more.";
      if (Object.keys(row).length) e[i] = row;
    });
    return e;
  };

  // ---- submit ----
  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    const productErrors = validateProduct();
    const rowErrors = validateParts();
    setErrors(productErrors);
    setPartErrors(rowErrors);
    if (Object.keys(productErrors).length || Object.keys(rowErrors).length) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    let productId = id;
    try {
      const fd = new FormData();
      ["name", "brand", "model_code", "description", "mrp", "price", "stock"].forEach((k) => fd.append(k, String(values[k]).trim()));
      files.forEach((f) => fd.append("uploaded_images", f));
      if (isEdit) fd.append("is_active", values.is_active);
      else fd.append("primary_index", primaryIndex);
      const res = isEdit ? await updateProduct(id, fd) : await createProduct(fd);
      productId = res.data.id;
    } catch (err) {
      const { fieldErrors, message } = parseApiError(err);
      const { uploaded_images: imageProblem, ...rest } = fieldErrors;
      setErrors({ ...rest, images: imageProblem });
      setFormError(message || "Could not save the product. Check the highlighted fields.");
      setSubmitting(false);
      return;
    }

    // Sync spare parts after the product exists.
    const failures = [];
    for (const partId of removedPartIds) {
      try { await deleteSparePart(partId); } catch { failures.push("a removed part"); }
    }
    for (const row of parts) {
      if (isBlankPart(row)) continue;
      const body = { product: productId, name: row.name.trim(), part_code: row.part_code.trim(), price: row.price, stock: Number(row.stock), is_active: row.is_active };
      try {
        if (row.id) await updateSparePart(row.id, body); else await createSparePart(body);
      } catch (err) {
        const { fieldErrors, message } = parseApiError(err);
        failures.push(`${row.name} (${Object.values(fieldErrors).join(" ") || message})`);
      }
    }
    setSubmitting(false);

    if (failures.length) {
      toast.error(`Product saved, but some spare parts failed: ${failures.join("; ")}`, { duration: 8000 });
      if (isEdit) { setFiles([]); loadProduct(); } else navigate(`/admin/products/${productId}/edit`);
      return;
    }
    toast.success(isEdit ? "Product updated." : "Product created.");
    navigate("/admin/products");
  };

  if (loading) return <Loader />;

  return (
    <div className="container narrow">
      <p className="breadcrumb"><Link to="/admin/products">Products</Link> / {isEdit ? "Edit" : "Add"}</p>
      <h1>{isEdit ? "Edit product" : "Add product"}</h1>

      <form onSubmit={handleSubmit} noValidate className="admin-form">
        {formError && <div className="form-error" role="alert">{formError}</div>}

        <section className="form-section">
          <h2>Details</h2>
          <FormField label="Name *" name="name" value={values.name} onChange={handleChange} error={errors.name} />
          <div className="grid-2">
            <FormField label="Brand *" name="brand" value={values.brand} onChange={handleChange} error={errors.brand} />
            <FormField label="Model code *" name="model_code" value={values.model_code} onChange={handleChange} error={errors.model_code} />
          </div>
          <div className="field">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={4} value={values.description} onChange={handleChange} />
            {errors.description && <p className="field-error" role="alert">{errors.description}</p>}
          </div>
          <div className="grid-3">
            <FormField label="MRP (₹) *" name="mrp" type="number" min="0" step="0.01" value={values.mrp} onChange={handleChange} error={errors.mrp} />
            <FormField label="Selling price (₹) *" name="price" type="number" min="0" step="0.01" value={values.price} onChange={handleChange} error={errors.price} hint="Must not exceed MRP" />
            <FormField label="Stock *" name="stock" type="number" min="0" step="1" value={values.stock} onChange={handleChange} error={errors.stock} />
          </div>
          {isEdit && (
            <label className="check"><input type="checkbox" name="is_active" checked={values.is_active} onChange={handleChange} /> Visible in the shop</label>
          )}
        </section>

        <section className="form-section">
          <h2>Images {!isEdit && "*"}</h2>
          {isEdit && existingImages.length > 0 && (
            <div className="image-grid">
              {existingImages.map((img) => (
                <div key={img.id} className={img.is_primary ? "image-tile primary" : "image-tile"}>
                  <img src={img.image} alt="" />
                  {img.is_primary ? <span className="pill pill-ok">Primary</span> : (
                    <button type="button" className="link-btn" onClick={() => makePrimary(img)}>Make primary</button>
                  )}
                  <button type="button" className="link-btn danger" onClick={() => removeImage(img)}>Delete</button>
                </div>
              ))}
            </div>
          )}
          <div className="field">
            <label htmlFor="images">{isEdit ? "Add more images" : "Upload images"}</label>
            <input id="images" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} />
            <p className="field-hint">JPG, PNG or WebP, up to 2 MB each. You can pick several at once.</p>
            {errors.images && <p className="field-error" role="alert">{errors.images}</p>}
          </div>
          {files.length > 0 && (
            <div className="image-grid">
              {files.map((f, i) => (
                <div key={`${f.name}-${i}`} className={!isEdit && i === primaryIndex ? "image-tile primary" : "image-tile"}>
                  <img src={previews[i]} alt={f.name} />
                  {!isEdit && (
                    <label className="check"><input type="radio" name="primary" checked={i === primaryIndex} onChange={() => setPrimaryIndex(i)} /> Primary</label>
                  )}
                  <button type="button" className="link-btn danger" onClick={() => removeNewFile(i)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="form-section">
          <h2>Spare parts</h2>
          <p className="muted">For example: Armature (220-240V), Field Coil (220-240V). Leave empty if the product has none.</p>
          {parts.map((p, i) => (
            <div className="part-row" key={p.id ?? `new-${i}`}>
              <FormField label="Name" name={`part-name-${i}`} value={p.name} onChange={(e) => updatePart(i, "name", e.target.value)} error={partErrors[i]?.name} />
              <FormField label="Part code" name={`part-code-${i}`} value={p.part_code} onChange={(e) => updatePart(i, "part_code", e.target.value)} />
              <FormField label="Price (₹)" name={`part-price-${i}`} type="number" min="0" step="0.01" value={p.price} onChange={(e) => updatePart(i, "price", e.target.value)} error={partErrors[i]?.price} />
              <FormField label="Stock" name={`part-stock-${i}`} type="number" min="0" step="1" value={p.stock} onChange={(e) => updatePart(i, "stock", e.target.value)} error={partErrors[i]?.stock} />
              <div className="part-actions">
                <label className="check"><input type="checkbox" checked={p.is_active} onChange={(e) => updatePart(i, "is_active", e.target.checked)} /> Active</label>
                <button type="button" className="link-btn danger" onClick={() => removePart(i)}>Remove</button>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-outline" onClick={addPart}>+ Add spare part</button>
        </section>

        <div className="form-actions">
          <Link to="/admin/products" className="btn btn-outline">Cancel</Link>
          <button className="btn btn-primary" disabled={submitting}>{submitting ? "Saving..." : isEdit ? "Save changes" : "Create product"}</button>
        </div>
      </form>
    </div>
  );
}