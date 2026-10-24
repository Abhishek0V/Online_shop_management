import axiosClient from "./axiosClient";

export const listAdminProducts = (params) => axiosClient.get("/admin/products/", { params });
export const getAdminProduct = (id) => axiosClient.get(`/admin/products/${id}/`);
export const createProduct = (formData) => axiosClient.post("/admin/products/", formData);
export const updateProduct = (id, data) => axiosClient.patch(`/admin/products/${id}/`, data);

export const setPrimaryImage = (imageId) => axiosClient.patch(`/admin/product-images/${imageId}/`, { is_primary: true });
export const deleteImage = (imageId) => axiosClient.delete(`/admin/product-images/${imageId}/`);

export const createSparePart = (data) => axiosClient.post("/admin/spare-parts/", data);
export const updateSparePart = (id, data) => axiosClient.patch(`/admin/spare-parts/${id}/`, data);
export const deleteSparePart = (id) => axiosClient.delete(`/admin/spare-parts/${id}/`);