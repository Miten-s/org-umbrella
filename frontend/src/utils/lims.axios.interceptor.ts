import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "./error.utils";
import { AUTH_TOKEN_KEY } from "./common.constants";

/**
 * lims-service. backend runs on 9002 and gxp-service on 9001. Exported so
 * `getLimsImageUrl` (utils.service.ts) derives attachment URLs from this same
 * value instead of re-declaring it — one env var to change for a production
 * deploy, not two things that can drift apart.
 */
export const BASE_URL =
  import.meta.env.VITE_API_LIMS_BASE_URL ?? "http://localhost:9003/v1/api";

const limsApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: false
});

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

limsApi.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem(AUTH_TOKEN_KEY) ?? localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

limsApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    // Ignore aborted/canceled requests (e.g. React Query aborting an in-flight
    // query when a modal closes). These are not user-facing errors, so never toast.
    // A canceled request carries no response, so the status check below would
    // otherwise treat it as a failure.
    if (error.code === "ERR_CANCELED" || error.name === "CanceledError") {
      return Promise.reject(error);
    }

    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      (error?.response?.data as { message?: string })?.message === "Token Expired" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: () => resolve(limsApi(originalRequest)),
            reject
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        processQueue(null);
        return limsApi(originalRequest);
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

    // MIGRATION.md Rule 2: the interceptor is the SOLE owner of error toasts.
    // Mutations must never toast onError.
    if (
      error.response?.status !== 404 &&
      (error.response?.data as { message?: string })?.message !== "Token not found"
    ) {
      toast(getErrorMessage(error), "error");
    }

    return Promise.reject(error);
  }
);

export default limsApi;
