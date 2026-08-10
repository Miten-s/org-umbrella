import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toOptionsPage } from "@/lib/query/listAdapter";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { ServerListParams } from "@/lib/query/listTypes";

/** Application Role options for AsyncSelect (option-only seed; label = role/name/roleName). */
const ROUTE = "/gxp-applications/application-roles";
const DATA_KEYS = ["applicationRoles", "roles", "data"];

export const applicationRoleKeys = { options: ["applicationRole", "options"] as const };

interface AppRoleRow {
  id: string;
  role?: string;
  name?: string;
  roleName?: string;
}

export const fetchApplicationRoleOptions = async (args: { search: string; page: number }, signal?: AbortSignal) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await gxpApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<AppRoleRow>(response.data, params, (r) => r.role ?? r.name ?? r.roleName ?? "", DATA_KEYS);
};

export const useApplicationRoleOptions = (args: { search: string; enabled?: boolean; selectedValues?: string[] }) =>
  useAsyncOptions({
    queryKey: applicationRoleKeys.options,
    fetchPage: fetchApplicationRoleOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });
