import gxpApi from "@/utils/gxp.axios.interceptor";
import { buildServerParams, toOptionsPage } from "@/lib/query/listAdapter";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { ServerListParams } from "@/lib/query/listTypes";

/** Service Type options for AsyncSelect (option-only seed; label = service). */
const ROUTE = "/gxp-service-requests/service-types";
const DATA_KEYS = ["serviceTypes", "services", "data"];

export const serviceTypeKeys = { options: ["serviceType", "options"] as const };

interface ServiceTypeRow {
  id: string;
  service?: string;
}

export const fetchServiceTypeOptions = async (args: { search: string; page: number }, signal?: AbortSignal) => {
  const params: ServerListParams = { page: args.page, limit: 20, search: args.search || undefined };
  const response = await gxpApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<ServiceTypeRow>(response.data, params, (s) => s.service ?? "", DATA_KEYS);
};

export const useServiceTypeOptions = (args: { search: string; enabled?: boolean; selectedValues?: string[] }) =>
  useAsyncOptions({
    queryKey: serviceTypeKeys.options,
    fetchPage: fetchServiceTypeOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });
