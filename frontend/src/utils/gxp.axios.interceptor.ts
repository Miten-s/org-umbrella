import { toast } from "@/lib/toast";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { AUTH_TOKEN_KEY } from "./common.constants";
import { getErrorMessage } from "./error.utils";

const BASE_URL =
  import.meta.env.VITE_API_GXP_BASE_URL ?? "http://localhost:9001/v1/api";

const gxpApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: false
});

// Track refresh state and queue
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}[] = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

// Interceptors
gxpApi.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem(AUTH_TOKEN_KEY) ??
    localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

gxpApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      (error?.response?.data as { message?: string })?.message ===
        "Token Expired" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(gxpApi(originalRequest)),
            reject
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // API Call for refreshing token will be here

        processQueue(null);
        return gxpApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (
      error.response?.status !== 404 &&
      (error.response?.data as { message?: string })?.message !==
        "Token not found"
    ) {
      toast(getErrorMessage(error), "error");
    }
    return Promise.reject(error);
  }
);

export default gxpApi;
