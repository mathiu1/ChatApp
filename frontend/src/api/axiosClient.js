import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || ""; // keep your existing env usage

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ensures cookies are sent when available
});

// attach token from localStorage (if present)
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

export default api;
