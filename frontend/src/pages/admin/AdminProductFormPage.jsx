
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  FileImage,
  Image as ImageIcon,
  ImagePlus,
  Package,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Wrench,
} from "lucide-react";

import {
  createProduct,
  createSparePart,
  deleteImage,
  deleteSparePart,
  getAdminProduct,
  setPrimaryImage,
  updateProduct,
  updateSparePart,
} from "../../api/adminProductApi";
import FormField from "../../components/FormField";
import Loader from "../../components/Loader";
import { parseApiError } from "../../utils/apiErrors";

const EMPTY = {
  name: "",
  brand: "",
  model_code: "",
  description: "",
  mrp: "",
  price: "",
  stock: "0",
  is_active: true,
};

const EMPTY_PART = {
  id: null,
  name: "",
  part_code: "",
  price: "",
  stock: "0",
  is_active: true,
  image: null,
  file: null,
  preview: null,
  removeImage: false,
};

const MAX_SIZE = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

const isBlankPart = (p) =>
  !p.id &&
  !p.name.trim() &&
  !String(p.price).trim() &&
  !p.part_code.trim();

const isWholeNumber = (v) =>
  v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0;

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
        name: p.name,
        brand: p.brand,
        model_code: p.model_code,
        description: p.description,
        mrp: p.mrp,
        price: p.price,
        stock: String(p.stock),
        is_active: p.is_active,
      });

      setExistingImages(p.images || []);

      setParts(
        (p.spare_parts || []).map((s) => ({
          id: s.id,
          name: s.name,
          part_code: s.part_code,
          price: s.price,
          stock: String(s.stock),
          is_active: s.is_active,
          image: s.image || null,
          file: null,
          preview: null,
          removeImage: false,
        }))
      );

      setRemovedPartIds([]);
    } catch {
      toast.error("Product not found.");
      navigate("/admin/products");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (isEdit) loadProduct();
  }, [isEdit, loadProduct]);

  const previews = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files]
  );

  useEffect(
    () => () => previews.forEach((url) => URL.revokeObjectURL(url)),
    [previews]
  );

  // Clean up spare-part preview URLs when the component unmounts.
  useEffect(() => {
    return () => {
      parts.forEach((part) => {
        if (part.preview) URL.revokeObjectURL(part.preview);
      });
    };
  }, [parts]);

  const setField = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "" }));
  };

  const handleChange = (e) =>
    setField(
      e.target.name,
      e.target.type === "checkbox" ? e.target.checked : e.target.value
    );

  // Product images
  const handleFiles = (e) => {
    const picked = Array.from(e.target.files);
    e.target.value = "";

    const bad = picked.find(
      (f) => !TYPES.includes(f.type) || f.size > MAX_SIZE
    );

    const good = picked.filter(
      (f) => TYPES.includes(f.type) && f.size <= MAX_SIZE
    );

    setErrors((prev) => ({
      ...prev,
      images: bad
        ? "Only JPG, PNG or WebP images up to 2 MB are allowed. Some files were skipped."
        : "",
    }));

    setFiles((prev) => [...prev, ...good]);
  };

  const removeNewFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPrimaryIndex((p) =>
      index === p ? 0 : index < p ? p - 1 : p
    );
  };

  const refreshImages = async () => {
    const { data } = await getAdminProduct(id);
    setExistingImages(data.images || []);
  };

  const makePrimary = async (image) => {
    try {
      await setPrimaryImage(image.id);
      await refreshImages();
      toast.success("Primary image updated.");
    } catch {
      toast.error("Could not change the primary image.");
    }
  };

  const removeImage = async (image) => {
    if (!window.confirm("Delete this image?")) return;

    try {
      await deleteImage(image.id);
      await refreshImages();
      toast.success("Image deleted.");
    } catch (err) {
      toast.error(
        parseApiError(err).message || "Could not delete the image."
      );
    }
  };

  // Spare parts
  const updatePart = (index, field, value) => {
    setParts((prev) =>
      prev.map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      )
    );

    setPartErrors((prev) => ({ ...prev, [index]: undefined }));
  };

  const addPart = () => {
    setParts((prev) => [...prev, { ...EMPTY_PART }]);
  };

  const removePart = (index) => {
    const row = parts[index];

    if (row.preview) URL.revokeObjectURL(row.preview);
    if (row.id) setRemovedPartIds((ids) => [...ids, row.id]);

    setParts((prev) => prev.filter((_, i) => i !== index));
    setPartErrors({});
  };

  const handlePartImageChange = (index, file) => {
    if (!file) return;

    if (!TYPES.includes(file.type) || file.size > MAX_SIZE) {
      toast.error("Spare part image must be JPG, PNG, or WebP up to 2 MB.");
      return;
    }

    setParts((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;

        return {
          ...p,
          file,
          preview: URL.createObjectURL(file),
          removeImage: false,
        };
      })
    );
  };

  const handlePartImageRemove = (index) => {
    setParts((prev) =>
      prev.map((p, i) => {
        if (i !== index) return p;

        return {
          ...p,
          file: null,
          preview: null,
          image: null,
          removeImage: true,
        };
      })
    );
  };

  // Validation
  const validateProduct = () => {
    const e = {};

    if (!values.name.trim()) e.name = "Name is required.";
    if (!values.brand.trim()) e.brand = "Brand is required.";
    if (!values.model_code.trim())
      e.model_code = "Model code is required.";

    const mrp = Number(values.mrp);
    const price = Number(values.price);

    if (!(mrp > 0)) e.mrp = "Enter an MRP greater than 0.";

    if (!(price > 0)) {
      e.price = "Enter a price greater than 0.";
    } else if (mrp > 0 && price > mrp) {
      e.price = "Price cannot be greater than MRP.";
    }

    if (!isWholeNumber(values.stock)) {
      e.stock = "Stock must be a whole number, 0 or more.";
    }

    if (!isEdit && files.length === 0) {
      e.images = "Upload at least one image.";
    }

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

      if (!(Number(p.price) > 0)) {
        row.price = "Price must be above 0.";
      }

      if (!isWholeNumber(p.stock)) {
        row.stock = "Whole number, 0 or more.";
      }

      if (Object.keys(row).length) e[i] = row;
    });

    return e;
  };

  // Submit product and synchronize spare parts
  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const productErrors = validateProduct();
    const rowErrors = validateParts();

    setErrors(productErrors);
    setPartErrors(rowErrors);

    if (
      Object.keys(productErrors).length ||
      Object.keys(rowErrors).length
    ) {
      setFormError("Please fix the highlighted fields.");
      return;
    }

    setSubmitting(true);
    let productId = id;

    try {
      const fd = new FormData();

      [
        "name",
        "brand",
        "model_code",
        "description",
        "mrp",
        "price",
        "stock",
      ].forEach((k) => {
        fd.append(k, String(values[k]).trim());
      });

      files.forEach((f) => fd.append("uploaded_images", f));

      if (isEdit) {
        fd.append("is_active", values.is_active);
      } else {
        fd.append("primary_index", primaryIndex);
      }

      const res = isEdit
        ? await updateProduct(id, fd)
        : await createProduct(fd);

      productId = res.data.id;
    } catch (err) {
      const { fieldErrors, message } = parseApiError(err);
      const { uploaded_images: imageProblem, ...rest } = fieldErrors;

      setErrors({ ...rest, images: imageProblem });
      setFormError(
        message ||
          "Could not save the product. Check the highlighted fields."
      );

      setSubmitting(false);
      return;
    }

    const failures = [];

    for (const partId of removedPartIds) {
      try {
        await deleteSparePart(partId);
      } catch {
        failures.push("a removed part");
      }
    }

    for (const row of parts) {
      if (isBlankPart(row)) continue;

      const fd = new FormData();
      fd.append("product", productId);
      fd.append("name", row.name.trim());
      fd.append("part_code", row.part_code.trim());
      fd.append("price", row.price);
      fd.append("stock", Number(row.stock));
      fd.append("is_active", row.is_active);

      if (row.file) {
        fd.append("image", row.file);
      } else if (row.removeImage) {
        fd.append("image", "");
      }

      try {
        if (row.id) {
          await updateSparePart(row.id, fd);
        } else {
          await createSparePart(fd);
        }
      } catch (err) {
        const { fieldErrors, message } = parseApiError(err);
        failures.push(
          `${row.name} (${Object.values(fieldErrors).join(" ") || message})`
        );
      }
    }

    setSubmitting(false);

    if (failures.length) {
      toast.error(
        `Product saved, but some spare parts failed: ${failures.join("; ")}`,
        { duration: 8000 }
      );

      if (isEdit) {
        setFiles([]);
        loadProduct();
      } else {
        navigate(`/admin/products/${productId}/edit`);
      }

      return;
    }

    toast.success(isEdit ? "Product updated." : "Product created.");
    navigate("/admin/products");
  };

  if (loading) return <Loader />;

  return (
    <main className="min-h-screen bg-[#f7f7f5] px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        {/* Page heading */}
        <header className="mb-7 border-b border-stone-200 pb-6">
          <Link
            to="/admin/products"
            className="mb-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500 transition hover:text-[#987000]"
          >
            <ArrowLeft size={14} />
            Back to products
          </Link>

          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#a17b00]">
             INVENTORY MANAGEMENT
          </p>

          <h1 className="text-2xl font-black uppercase tracking-tight text-[#242424] sm:text-3xl">
            {isEdit ? "Edit product" : "Add new product"}
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-6 text-stone-500">
            {isEdit
              ? "Update product details, images, availability, and compatible spare parts."
              : "Add a product to your hardware inventory and configure its pricing, images, and spare parts."}
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && (
            <div
              role="alert"
              className="border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700"
            >
              <p className="font-bold">{formError}</p>
            </div>
          )}

          {/* Product details */}
          <section className="border border-stone-200 bg-white">
            <SectionHeading
              icon={<Package size={19} />}
              title="Product details"
              subtitle="Name, brand, specifications, and pricing"
            />

            <div className="space-y-5 p-4 sm:p-6">
              <FormField
                label="Product name *"
                name="name"
                value={values.name}
                onChange={handleChange}
                error={errors.name}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Brand *"
                  name="brand"
                  value={values.brand}
                  onChange={handleChange}
                  error={errors.brand}
                />

                <FormField
                  label="Model code *"
                  name="model_code"
                  value={values.model_code}
                  onChange={handleChange}
                  error={errors.model_code}
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-[10px] font-black uppercase tracking-widest text-stone-600"
                >
                  Product description
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={values.description}
                  onChange={handleChange}
                  placeholder="Describe the product, specifications, and features..."
                  className="w-full resize-y border border-stone-200 bg-[#f7f7f5] px-3 py-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-[#d8a500] focus:bg-white"
                />

                {errors.description && (
                  <p role="alert" className="mt-1 text-xs text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  label="MRP (₹) *"
                  name="mrp"
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.mrp}
                  onChange={handleChange}
                  error={errors.mrp}
                />

                <FormField
                  label="Selling price (₹) *"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={values.price}
                  onChange={handleChange}
                  error={errors.price}
                  hint="Must not exceed MRP"
                />

                <FormField
                  label="Stock quantity *"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={values.stock}
                  onChange={handleChange}
                  error={errors.stock}
                />
              </div>

              {isEdit && (
                <label className="flex cursor-pointer items-center gap-3 border border-stone-200 bg-[#fafaf8] p-4 transition hover:border-[#e3b51b]">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={values.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 accent-[#d8a500]"
                  />

                  <span className="flex-1">
                    <span className="block text-xs font-black text-stone-800">
                      Visible in the shop
                    </span>
                    <span className="mt-1 block text-[11px] text-stone-500">
                      Allow customers to see this product.
                    </span>
                  </span>

                  {values.is_active ? (
                    <Eye size={18} className="text-green-700" />
                  ) : (
                    <EyeOff size={18} className="text-stone-400" />
                  )}
                </label>
              )}
            </div>
          </section>

          {/* Product images */}
          <section className="border border-stone-200 bg-white">
            <SectionHeading
              icon={<FileImage size={19} />}
              title={`Product images ${!isEdit ? "*" : ""}`}
              subtitle="Upload clear product photos"
            />

            <div className="space-y-5 p-4 sm:p-6">
              {isEdit && existingImages.length > 0 && (
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-stone-500">
                    Current images
                  </p>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {existingImages.map((image) => (
                      <div
                        key={image.id}
                        className={`overflow-hidden border bg-white ${
                          image.is_primary
                            ? "border-[#d8a500] ring-1 ring-[#f5c32c]"
                            : "border-stone-200"
                        }`}
                      >
                        <div className="relative flex aspect-square items-center justify-center bg-[#f7f7f5] p-3">
                          <img
                            src={image.image}
                            alt=""
                            className="h-full w-full object-contain"
                          />

                          {image.is_primary && (
                            <span className="absolute left-2 top-2 inline-flex items-center gap-1 bg-[#f5c32c] px-2 py-1 text-[8px] font-black uppercase text-black">
                              <Check size={10} />
                              Primary
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 p-2">
                          {!image.is_primary && (
                            <button
                              type="button"
                              onClick={() => makePrimary(image)}
                              className="border border-stone-200 px-2 py-2 text-[9px] font-black uppercase tracking-wide text-stone-600 transition hover:border-[#d8a500] hover:bg-[#fff9e5]"
                            >
                              Make primary
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => removeImage(image)}
                            className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[9px] font-black uppercase tracking-wide text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={12} />
                            Delete image
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="images"
                  className="flex cursor-pointer flex-col items-center justify-center border border-dashed border-stone-300 bg-[#fafaf8] px-4 py-8 text-center transition hover:border-[#d8a500] hover:bg-[#fffdf5] sm:py-10"
                >
                  <div className="flex h-12 w-12 items-center justify-center bg-[#fff5cc] text-[#987000]">
                    <ImagePlus size={24} />
                  </div>

                  <span className="mt-4 text-xs font-black uppercase tracking-wider text-stone-800">
                    {isEdit ? "Add more images" : "Choose product images"}
                  </span>

                  <span className="mt-2 text-xs text-stone-500">
                    Select one or multiple files
                  </span>

                  <span className="mt-2 text-[10px] text-stone-400">
                    JPG, PNG or WebP · Maximum 2 MB per image
                  </span>
                </label>

                <input
                  id="images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFiles}
                  className="sr-only"
                />

                {errors.images && (
                  <p role="alert" className="mt-2 text-xs text-red-600">
                    {errors.images}
                  </p>
                )}
              </div>

              {files.length > 0 && (
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-stone-500">
                    Selected images ({files.length})
                  </p>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${file.size}-${index}`}
                        className={`overflow-hidden border bg-white ${
                          !isEdit && index === primaryIndex
                            ? "border-[#d8a500] ring-1 ring-[#f5c32c]"
                            : "border-stone-200"
                        }`}
                      >
                        <div className="relative aspect-square bg-[#f7f7f5] p-3">
                          <img
                            src={previews[index]}
                            alt={file.name}
                            className="h-full w-full object-contain"
                          />

                          {!isEdit && index === primaryIndex && (
                            <span className="absolute left-2 top-2 bg-[#f5c32c] px-2 py-1 text-[8px] font-black uppercase text-black">
                              Primary
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 p-2">
                          <p className="truncate text-[10px] font-bold text-stone-700">
                            {file.name}
                          </p>

                          {!isEdit && (
                            <label className="flex cursor-pointer items-center gap-2 py-1 text-[10px] font-bold text-stone-600">
                              <input
                                type="radio"
                                name="primary"
                                checked={index === primaryIndex}
                                onChange={() => setPrimaryIndex(index)}
                                className="accent-[#d8a500]"
                              />
                              Use as primary
                            </label>
                          )}

                          <button
                            type="button"
                            onClick={() => removeNewFile(index)}
                            className="inline-flex items-center gap-1 py-1 text-[9px] font-black uppercase tracking-wide text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={12} />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Spare parts */}
          <section className="border border-stone-200 bg-white">
            <SectionHeading
              icon={<Wrench size={19} />}
              title="Spare parts"
              subtitle="Images, pricing, stock, and compatible replacement parts"
              action={
                <button
                  type="button"
                  onClick={addPart}
                  className="inline-flex items-center justify-center gap-2 border border-stone-300 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-stone-700 transition hover:border-[#d8a500] hover:bg-[#fff9e5]"
                >
                  <Plus size={14} />
                  Add part
                </button>
              }
            />

            <div className="space-y-4 p-4 sm:p-6">
              <p className="text-xs leading-5 text-stone-500">
                For example: Armature (220–240V), Field Coil (220–240V).
                Spare-part images are optional. Leave this section empty if
                the product has no spare parts.
              </p>

              {parts.length === 0 ? (
                <div className="border border-dashed border-stone-300 bg-[#fafaf8] px-4 py-8 text-center">
                  <Wrench
                    size={25}
                    className="mx-auto text-stone-400"
                    strokeWidth={1.5}
                  />
                  <p className="mt-3 text-xs font-bold text-stone-700">
                    No spare parts added
                  </p>
                  <p className="mt-1 text-[10px] text-stone-500">
                    Add compatible spare parts if available.
                  </p>
                  <button
                    type="button"
                    onClick={addPart}
                    className="mt-4 inline-flex items-center gap-2 bg-[#f5c32c] px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-black hover:bg-[#e5b51f]"
                  >
                    <Plus size={14} />
                    Add spare part
                  </button>
                </div>
              ) : (
                parts.map((part, index) => {
                  const displayImg = part.preview || (
                    part.removeImage ? null : part.image
                  );

                  return (
                    <div
                      key={part.id ?? `new-${index}`}
                      className="border border-stone-200 bg-[#fafaf8] p-4 sm:p-5"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center bg-[#242424] text-[10px] font-black text-white">
                            {index + 1}
                          </span>
                          <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-700">
                            Spare part {index + 1}
                          </h3>
                        </div>

                        <button
                          type="button"
                          onClick={() => removePart(index)}
                          className="inline-flex items-center gap-1.5 px-2 py-1.5 text-[9px] font-black uppercase tracking-wide text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 size={13} />
                          Remove part
                        </button>
                      </div>

                      {/* Spare part image upload */}
                      <div className="mb-5 flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-start">
                        <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden border border-stone-200 bg-white">
                          {displayImg ? (
                            <img
                              src={displayImg}
                              alt={part.name || "Spare part"}
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-stone-400">
                              <ImageIcon size={26} strokeWidth={1.5} />
                              <span className="text-[9px] font-bold uppercase tracking-wider">
                                No image
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 bg-[#f5c32c] px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-black transition hover:bg-[#e5b51f]">
                            <ImagePlus size={14} />
                            {displayImg ? "Change photo" : "Upload photo"}
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handlePartImageChange(index, file);
                                e.target.value = "";
                              }}
                            />
                          </label>

                          {displayImg && (
                            <button
                              type="button"
                              onClick={() => handlePartImageRemove(index)}
                              className="inline-flex items-center gap-2 border border-stone-300 px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-red-600 transition hover:border-red-300 hover:bg-red-50"
                            >
                              <Trash2 size={13} />
                              Remove photo
                            </button>
                          )}

                          <p className="w-full text-[10px] leading-5 text-stone-400">
                            JPG, PNG or WebP · Up to 2 MB. Optional.
                          </p>
                        </div>
                      </div>

                      {/* Spare part fields */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField
                          label="Part name *"
                          name={`part-name-${index}`}
                          value={part.name}
                          onChange={(e) =>
                            updatePart(index, "name", e.target.value)
                          }
                          error={partErrors[index]?.name}
                        />

                        <FormField
                          label="Part code"
                          name={`part-code-${index}`}
                          value={part.part_code}
                          onChange={(e) =>
                            updatePart(index, "part_code", e.target.value)
                          }
                        />

                        <FormField
                          label="Price (₹) *"
                          name={`part-price-${index}`}
                          type="number"
                          min="0"
                          step="0.01"
                          value={part.price}
                          onChange={(e) =>
                            updatePart(index, "price", e.target.value)
                          }
                          error={partErrors[index]?.price}
                        />

                        <FormField
                          label="Stock quantity *"
                          name={`part-stock-${index}`}
                          type="number"
                          min="0"
                          step="1"
                          value={part.stock}
                          onChange={(e) =>
                            updatePart(index, "stock", e.target.value)
                          }
                          error={partErrors[index]?.stock}
                        />
                      </div>

                      <label className="mt-4 flex cursor-pointer items-center gap-3 border-t border-stone-200 pt-4">
                        <input
                          type="checkbox"
                          checked={part.is_active}
                          onChange={(e) =>
                            updatePart(index, "is_active", e.target.checked)
                          }
                          className="h-4 w-4 accent-[#d8a500]"
                        />

                        <span className="flex-1 text-xs font-bold text-stone-700">
                          Spare part is active
                        </span>

                        {part.is_active ? (
                          <Eye size={16} className="text-green-700" />
                        ) : (
                          <EyeOff size={16} className="text-stone-400" />
                        )}
                      </label>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Save actions */}
          <section className="border border-stone-200 bg-white p-4 sm:p-5">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Link
                to="/admin/products"
                className="inline-flex items-center justify-center border border-stone-300 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-stone-600 transition hover:bg-stone-100"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 bg-[#f5c32c] px-7 py-3.5 text-[10px] font-black uppercase tracking-widest text-black transition hover:bg-[#e5b51f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    {isEdit ? "Save changes" : "Create product"}
                  </>
                )}
              </button>
            </div>

            <p className="mt-4 flex items-center justify-center gap-2 border-t border-stone-100 pt-4 text-[9px] font-semibold uppercase tracking-wider text-stone-400">
              <ShieldCheck size={13} />
              Check product details before saving
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}

function SectionHeading({ icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-3 border-b border-stone-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#fff5cc] text-[#987000]">
          {icon}
        </div>
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-[#242424]">
            {title}
          </h2>
          <p className="mt-1 text-[10px] text-stone-500">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}
