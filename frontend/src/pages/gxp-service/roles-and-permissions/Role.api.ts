import api from "@/utils/axios.interceptor";
import { buildServerParams, toListResult, toOptionsPage } from "@/lib/query/listAdapter";
import { normalizeList } from "@/lib/query/normalizeId";
import { extractList, extractPaginationMetadata } from "@/utils/listResponse";
import { bulkSelectionToBody, type BulkSelection } from "@/lib/query/listTypes";
import type { ServerListParams } from "@/lib/query/listTypes";
import { RoleType, PermissionType } from "@/utils/common.constants";
import type { GxpPermissionOption, GxpRole, GxpRolePayload } from "./Role.types";

/**
 * GXP Role API — same admin `/roles` + `/permissions` endpoints the pre-migration
 * code used, scoped to type = GXP_SERVICE. `.api` is pure HTTP (toasts in queries).
 */
const ROLES = "/roles";
const PERMISSIONS = "/permissions";

export const fetchRoleList = async (params: ServerListParams, signal?: AbortSignal) => {
  const response = await api.get(ROLES, {
    params: buildServerParams({ ...params, type: RoleType.GXP_SERVICE }),
    signal
  });
  return toListResult<GxpRole>(response.data, params, ["roles"]);
};

/** All GXP permissions (id + name) for the role form's permission picker. */
export const fetchRolePermissions = async (signal?: AbortSignal): Promise<GxpPermissionOption[]> => {
  const limit = 100;
  const permissions: { id: string; _id: string; name: string }[] = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await api.get(PERMISSIONS, {
      params: { type: PermissionType.GXP_SERVICE, limit, page },
      signal
    });
    permissions.push(
      ...normalizeList<{ id?: string; _id?: string; name: string }>(
        extractList(response.data, ["permissions"])
      )
    );
    totalPages = extractPaginationMetadata(response.data, { currentPage: page, limit }).totalPages;
    page += 1;
  } while (page <= totalPages);
  return permissions.map((p) => ({ id: p.id, _id: p._id, name: p.name }));
};

/** GXP role options for AsyncSelect consumers (e.g. GXP Users' role picker). */
export const fetchGxpRoleOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = {
    page: args.page,
    limit: 20,
    search: args.search || undefined,
    type: RoleType.GXP_SERVICE
  };
  const response = await api.get(ROLES, { params: buildServerParams(params), signal });
  return toOptionsPage<GxpRole>(response.data, params, (row) => row.name, ["roles"]);
};

export const createRole = async (payload: GxpRolePayload) => {
  const response = await api.post(ROLES, payload);
  return response.data;
};

export const updateRole = async (id: string, payload: GxpRolePayload) => {
  const response = await api.patch(`${ROLES}/${id}`, payload);
  return response.data;
};

export const bulkDeleteRole = async (selection: BulkSelection) => {
  const response = await api.post(`${ROLES}/bulk-delete`, bulkSelectionToBody(selection));
  return response.data;
};
