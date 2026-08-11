import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "@/lib/toast";
import { getErrorMessage } from "./error.utils";
import { AUTH_TOKEN_KEY } from "./common.constants";
import {
  applyRequestShim,
  applyResponseShim,
  emulateBulk,
  LIMS_SHIM_ENABLED,
  parseLimsUrl,
  SHIM_ERROR
} from "./lims.backend.shim";

/** lims-service on 9003. backend (auth) runs on 9001 and gxp-service on 9002. */
const BASE_URL =
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

  if (!LIMS_SHIM_ENABLED) return config;

  // Remember the contract URL before rewriting — the response shim keys off it.
  (config as { _limsShimUrl?: string })._limsShimUrl = config.url;
  return applyRequestShim(config) as typeof config;
});

limsApi.interceptors.response.use(
  (response: AxiosResponse) => (LIMS_SHIM_ENABLED ? applyResponseShim(response) : response),
  async (error: AxiosError) => {
    // Operations lims-service cannot serve yet fail loudly with one clear reason
    // rather than a raw 404 — see LIMS_BACKEND_PUNCHLIST.md.
    if (error.name === SHIM_ERROR) {
      toast(error.message, "error");
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

/**
 * `bulk-delete` / `bulk-duplicate` do not exist in lims-service yet (punch list
 * B1), so those two POSTs are fanned out over the per-record endpoints. Every
 * call still goes to the server; nothing is resolved client-side. Remove this
 * wrapper — and `lims.backend.shim.ts` — once the batch endpoints ship.
 */
if (LIMS_SHIM_ENABLED) {
  const post = limsApi.post.bind(limsApi);

  limsApi.post = ((url: string, data?: unknown, config?: AxiosRequestConfig) => {
    // `bulk-delete` ships and works — it goes straight through now. `bulk-duplicate`
    // exists but 500s (`column X.isRemoved does not exist`), so it stays emulated
    // until that one-word fix lands; delete this branch then.
    const operation = url.endsWith("/bulk-duplicate") ? "bulk-duplicate" : null;

    if (!operation || !parseLimsUrl(url)) return post(url, data, config);

    const base = url.slice(0, url.lastIndexOf("/"));
    return emulateBulk(operation, base, data, (request) => limsApi.request(request));
  }) as typeof limsApi.post;
}

export default limsApi;
