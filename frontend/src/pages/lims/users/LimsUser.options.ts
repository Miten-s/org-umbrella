import { useQuery } from "@tanstack/react-query";
import limsApi from "@/utils/lims.axios.interceptor";
import { buildServerParams, toOptionsPage } from "@/lib/query/listAdapter";
import { extractList } from "@/utils/listResponse";
import type { ServerListParams } from "@/lib/query/listTypes";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import { useUserOptions } from "@/pages/system-it-admin/users/User.queries";

/** INTERIM SEED (MIGRATION.md §3.1-B) — once the Lab Users module exists, move the fetcher
 * into `LimsUser.api.ts` and the hook into `LimsUser.queries.ts`, delete this file. */
const ROUTE = "/lims-users";
const DATA_KEYS = ["users", "data"];

interface LimsUserRow extends Record<string, unknown> {
  id: string;
  /** Flat columns, not a nested `user` object — lims-service can't SQL-join across databases. */
  userName?: string;
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
  const response = await limsApi.get(ROUTE, {
    params: buildServerParams(params),
    signal
  });
  return toOptionsPage<LimsUserRow>(
    response.data,
    params,
    (row) => String(row.userName ?? ""),
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

/** Every platform userId already mapped to a Lab User, active OR soft-deleted — included on
 * purpose, since the backend's uniqueness check isn't scoped to active rows either. */
const fetchLinkedPlatformUserIds = async (
  signal?: AbortSignal
): Promise<Set<string>> => {
  const response = await limsApi.get(ROUTE, {
    params: {
      ...buildServerParams({ page: 1, limit: 500 }),
      includeRemoved: true
    },
    signal
  });
  const rows = extractList<{ userId?: string }>(response.data, DATA_KEYS);
  return new Set(
    rows.map((row) => row.userId).filter((id): id is string => Boolean(id))
  );
};

/** The platform-user picker on Lab Users' Create form, filtered to hide anyone already
 * linked — without this, picking one surfaced a raw "already exists" API error. */
export const useAvailablePlatformUserOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) => {
  const base = useUserOptions(args);
  const linked = useQuery({
    queryKey: [...limsUserKeys.options, "linked-platform-ids"],
    queryFn: ({ signal }) => fetchLinkedPlatformUserIds(signal),
    enabled: args.enabled !== false,
    staleTime: 30_000
  });

  const excluded = linked.data;
  if (!excluded?.size) return base;
  return {
    ...base,
    options: base.options.filter((option) => !excluded.has(option.value))
  };
};
