import axiosClient from "./axiosClient";

export const getCart = () => axiosClient.get("/cart/");
export const addCartItem = (payload) => axiosClient.post("/cart/items/", payload);
export const updateCartItem = (id, quantity) => axiosClient.patch(`/cart/items/${id}/`, { quantity });
export const removeCartItem = (id) => axiosClient.delete(`/cart/items/${id}/`);