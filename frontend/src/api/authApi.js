import axiosClient from "./axiosClient";

const pub = { skipAuth: true }; // public endpoints: never send a token

export const registerUser = (data) => axiosClient.post("/auth/register/", data, pub);
export const loginUser = (data) => axiosClient.post("/auth/login/", data, pub);
export const fetchMe = () => axiosClient.get("/auth/me/");
export const forgotPassword = (email) => axiosClient.post("/auth/forgot-password/", { email }, pub);
export const resetPassword = (payload) => axiosClient.post("/auth/reset-password/", payload, pub);