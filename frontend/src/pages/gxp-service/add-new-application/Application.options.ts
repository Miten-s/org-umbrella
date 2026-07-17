import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toOptionsPage } from "@/lib/query/listAdapter";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { ServerListParams } from "@/lib/query/listTypes";

/**
 * Application options for AsyncSelect (parent of App/Software Modules, etc.).
 * Option-only surface today; becomes the seed of the full Application module
 * when add-new-application migrates (Track B).
 */
const ROUTE = "/gxp-applications";
const DATA_KEYS = ["applications", "data"];

export const applicationKeys = { options: ["application", "options"] as const };

interface ApplicationRow {
  id: string;
  applicationName: string;
}

export const fetchApplicationOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await gxpApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<ApplicationRow>(response.data, params, (row) => row.applicationName, DATA_KEYS);
};

export const useApplicationOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: applicationKeys.options,
    fetchPage: fetchApplicationOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });
