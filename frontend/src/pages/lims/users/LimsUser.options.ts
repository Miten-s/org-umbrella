import limsApi from "@/utils/lims.axios.interceptor";
import { buildServerParams, toOptionsPage } from "@/lib/query/listAdapter";
import type { ServerListParams } from "@/lib/query/listTypes";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";

/**
 * INTERIM SEED (MIGRATION.md §3.1-B) — lets other LIMS modules select a Lab
 * User before the Lab Users module is built. When it is, move the fetcher into
 * `LimsUser.api.ts` and the hook into `LimsUser.queries.ts`, delete this file,
 * and repoint importers.
 */
const ROUTE = "/lims-users";
const DATA_KEYS = ["users", "data"];

interface LimsUserRow extends Record<string, unknown> {
  id: string;
  /** LIMS user records wrap the platform user as `{ id, name }`. */
  user?: { id: string; name?: string };
}

export const limsUserKeys = {
  options: ["limsUser", "options"] as const
};

export const fetchLimsUserOptions = async (
  args: { search: string; page: number },
  signal?: AbortSignal
) => {
  const params: ServerListParams = {
    page: args.page,
    limit: 20,
    search: args.search || undefined
  };
  const response = await limsApi.get(ROUTE, { params: buildServerParams(params), signal });
  return toOptionsPage<LimsUserRow>(
    response.data,
    params,
    (row) => String(row.user?.name ?? ""),
    DATA_KEYS
  );
};

export const useLimsUserOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsUserKeys.options,
    fetchPage: fetchLimsUserOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });
