import axios from "axios";

const normalizeApiBaseUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (trimmed) {
    return trimmed.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }

  return "http://localhost:8000/api";
};

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
});

// 🔥 INTERCEPTOR (ESSENCIAL)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
