import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

export const tokenStore = {
  get access() { return localStorage.getItem("access_token"); },
  get refresh() { return localStorage.getItem("refresh_token"); },
  set({ access, refresh }) {
    if (access) localStorage.setItem("access_token", access);
    if (refresh) localStorage.setItem("refresh_token", refresh);
  },
  clear() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },
};

const axiosClient = axios.create({ baseURL: API_BASE_URL });

// Attach the access token, except for public calls flagged with { skipAuth: true }.
// (An expired token sent to a public endpoint would be rejected with 401.)
axiosClient.interceptors.request.use((config) => {
  if (!config.skipAuth && tokenStore.access) {
    config.headers.Authorization = `Bearer ${tokenStore.access}`;
  }
  return config;
});

let refreshPromise = null; // one refresh at a time, shared by parallel requests

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/token/refresh/`, { refresh: tokenStore.refresh })
      .then((res) => {
        tokenStore.set({ access: res.data.access, refresh: res.data.refresh });
        return res.data.access;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const expired = error.response?.status === 401 && original && !original.skipAuth && !original._retry;
    if (!expired || !tokenStore.refresh) return Promise.reject(error);

    original._retry = true;
    try {
      const access = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${access}`;
      return axiosClient(original);
    } catch (refreshError) {
      tokenStore.clear();
      window.dispatchEvent(new Event("auth:logout"));
      return Promise.reject(refreshError);
    }
  }
);

export default axiosClient;