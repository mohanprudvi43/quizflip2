import axios from "axios";

const fallbackApiBaseUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:5000/api`
    : "http://localhost:5000/api";

const apiBaseUrl = import.meta.env.VITE_API_URL || fallbackApiBaseUrl;

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("qf_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) return Promise.reject(error);

    const isUnauthorized = error.response?.status === 401;
    const alreadyRetried = originalRequest._retry;
    const isRefreshCall = originalRequest.url?.includes("/auth/refresh");

    if (!isUnauthorized || alreadyRetried || isRefreshCall) {
      return Promise.reject(error);
    }

    try {
      originalRequest._retry = true;
      const { data } = await axios.post(
        `${apiBaseUrl}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      localStorage.setItem("qf_token", data.token);
      originalRequest.headers.Authorization = `Bearer ${data.token}`;

      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem("qf_token");
      localStorage.removeItem("qf_user");
      sessionStorage.setItem("qf_session_notice", "Session expired. Please log in again.");
      if (window.location.pathname !== "/auth") {
        window.location.href = "/auth";
      }
      return Promise.reject(refreshError);
    }
  }
);

export default api;
