import { toast } from "@/lib/ToastProvider";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

const BASE_URL = "http://localhost:9001/v1/api";

const gxpApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true
});

// Track refresh state and queue
let isRefreshing = false;
let failedQueue: {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}[] = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  failedQueue = [];
};

// Interceptors
gxpApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      (error?.response?.data as { message?: string })?.message === "Token Expired" &&
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
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (
      error.response?.status !== 404 &&
      (error.response?.data as { message?: string })?.message !== "Token not found"
    ) {
      const data = error.response?.data as { message?: string; error?: string } | undefined;
      const errorMessage = data?.message ?? data?.error ?? "Something went wrong";  //Getting error message either from message or error
      toast(errorMessage, "error");
    }
    return Promise.reject(error);
  }
);

export default gxpApi;
