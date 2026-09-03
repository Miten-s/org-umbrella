import api from "@/utils/axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { normalizeIdWithRelations } from "@/lib/query/normalizeId";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import type { User } from "./User.types";

/**
 * User API — the ONLY place user endpoints live (STANDARDS.md §1/§2).
 * List responses normalize ids (incl. nested location/department/designation).
 */
const ROUTE = "/auth/users";
const DATA_KEYS = ["users"];
const RELATION_KEYS = ["location", "department", "designation"];

export const fetchUserList = async (params: ServerListParams, signal?: AbortSignal) => {
  const response = await api.get(ROUTE, { params: buildServerParams(params), signal });
  return toListResult<User>(response.data, params, DATA_KEYS, RELATION_KEYS);
};

/** Options for AsyncSelect consumers that select a user (e.g. department manager). */
export const fetchUserOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await api.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<User>(
    response.data,
    params,
    (row) => row.fullName || row.name || row.email,
    DATA_KEYS
  );
};

/**
 * Build multipart FormData for create/update: JSON payload under `data`, and the
 * signature (data-URL → PNG blob) as a file. Moved from the old page component.
 */
const buildUserFormData = (payload: Record<string, unknown>): FormData => {
  const formData = new FormData();
  const { signature, ...rest } = payload;
  formData.append("data", JSON.stringify(rest));

  if (typeof signature === "string" && signature.startsWith("data:")) {
    const [meta, base64] = signature.split(",");
    const mime = meta.match(/data:(.*);base64/)?.[1] || "image/png";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    formData.append("signature", new Blob([bytes], { type: mime }), "signature.png");
  }

  return formData;
};

export const createUser = async (payload: Record<string, unknown>) => {
  const response = await api.post(ROUTE, buildUserFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const updateUser = async (id: string, payload: Record<string, unknown>) => {
  const response = await api.patch(`${ROUTE}/${id}`, buildUserFormData(payload), {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return response.data;
};

export const deleteUser = async (id: string) => {
  const response = await api.delete(`${ROUTE}/${id}`);
  return response.data;
};

export const bulkDeleteUser = async (selection: BulkSelection) => {
  const response = await api.post(`${ROUTE}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};

/** Full-detail fetch for the Bulk Edit/View review steppers. */
export const fetchUserById = async (id: string, signal?: AbortSignal) => {
  const response = await api.get(`${ROUTE}/${id}`, { signal });
  return normalizeIdWithRelations(response.data?.user ?? response.data, RELATION_KEYS) as User;
};

/** Bulk Edit's batched save — only the records actually reviewed and changed. */
export const bulkUpdateUser = async (updates: { id: string; payload: Record<string, unknown> }[]) => {
  const response = await api.patch(`${ROUTE}/bulk-update`, { updates });
  return response.data as {
    message: string;
    count: number;
    results: { id: string; skipped?: boolean }[];
  };
};
