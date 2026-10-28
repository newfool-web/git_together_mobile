import axios from "axios";
import { API_URL } from "@env";
import { getToken } from "./auth";

const api = axios.create({
  baseURL: API_URL || "https://git-together-theta.vercel.app/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
