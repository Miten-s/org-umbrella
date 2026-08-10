import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toOptionsPage } from "@/lib/query/listAdapter";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { ServerListParams } from "@/lib/query/listTypes";

/** Application Group options for AsyncSelect (option-only seed; label = appGroup). */
const ROUTE = "/gxp-applications/application-groups";
const DATA_KEYS = ["applicationGroups", "groups", "data"];

export const applicationGroupKeys = { options: ["applicationGroup", "options"] as const };

interface AppGroupRow {
  id: string;
  appGroup?: string;
}

export const fetchApplicationGroupOptions = async (args: { search: string; page: number }, signal?: AbortSignal) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await gxpApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<AppGroupRow>(response.data, params, (g) => g.appGroup ?? "", DATA_KEYS);
};

export const useApplicationGroupOptions = (args: { search: string; enabled?: boolean; selectedValues?: string[] }) =>
  useAsyncOptions({
    queryKey: applicationGroupKeys.options,
    fetchPage: fetchApplicationGroupOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });
