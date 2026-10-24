import axiosClient from "./axiosClient";

// Catalog is public: skipAuth avoids sending an expired token to a public endpoint.
export const listProducts = (params) => axiosClient.get("/products/", { params, skipAuth: true });
export const getProduct = (slug) => axiosClient.get(`/products/${slug}/`, { skipAuth: true });