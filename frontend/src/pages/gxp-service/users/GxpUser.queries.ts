import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { useUserOptions } from "@/pages/system-it-admin/users/User.queries";
import type { BulkSelection, ListResult, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCopyGxpUser,
  bulkDeleteGxpUser,
  bulkRestoreGxpUser,
  bulkUpdateGxpUser,
  createGxpUser,
  disableGxpUser,
  enableGxpUser,
  fetchGxpUserById,
  fetchLinkedPlatformUserIds,
  updateGxpUser
} from "./GxpUser.api";
import type { GxpUser, GxpUserPayload } from "./GxpUser.types";

export const gxpUserKeys = {
  all: ["gxpUser"] as const,
  list: (params: ServerListParams) => ["gxpUser", "list", params] as const
};

export const useGxpUserById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: gxpUserKeys.all,
    fetchById: fetchGxpUserById,
    id,
    enabled
  });

/** The user picker on Copy — every other platform-user picker in this module
 * (Create/Edit) reuses `useUserOptions` unfiltered; Copy's whole point is
 * assigning the same roles to a DIFFERENT person, so it hides anyone already
 * linked to a GXP user record instead of surfacing a raw "already exists" error. */
export const useAvailablePlatformUserOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) => {
  const base = useUserOptions(args);
  const linked = useQuery({
    queryKey: [...gxpUserKeys.all, "linked-platform-ids"],
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

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: gxpUserKeys.all });
};

export const useCreateGxpUser = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: GxpUserPayload) => createGxpUser(payload),
    onSuccess: () => {
      toast("User created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateGxpUser = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GxpUserPayload }) => updateGxpUser(id, payload),
    onSuccess: () => {
      toast("User updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteGxpUser = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteGxpUser(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} users deleted successfully.` : "User deleted successfully.", "success");
      invalidate();
    }
  });
};

/** The Copy flow's batched save (CopyStepper): one request creates every
 * reviewed record. */
export const useBulkCopyGxpUser = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: GxpUserPayload[]) => bulkCopyGxpUser(records),
    onSuccess: (data) => {
      toast(data.length > 1 ? `${data.length} users copied successfully.` : "User copied successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkUpdateGxpUser = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (updates: { id: string; payload: GxpUserPayload }[]) => bulkUpdateGxpUser(updates),
    onSuccess: (data) => {
      toast(
        data.results.length > 1 ? `${data.results.length} users updated successfully.` : "User updated successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkRestoreGxpUser = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkRestoreGxpUser(selection),
    onSuccess: (data) => {
      toast(data.count > 1 ? `${data.count} users restored successfully.` : "User restored successfully.", "success");
      invalidate();
    }
  });
};

/** Optimistic enable/disable toggle (MIGRATION.md §3.1-D). No onError toast. */
export const useToggleGxpUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: GxpUser) =>
      user.status === "enabled" ? disableGxpUser(user.id) : enableGxpUser(user.id),
    onMutate: async (user) => {
      await queryClient.cancelQueries({ queryKey: gxpUserKeys.all });
      const nextStatus = user.status === "enabled" ? "disabled" : "enabled";
      const snapshots = queryClient.getQueriesData<ListResult<GxpUser>>({ queryKey: gxpUserKeys.all });
      snapshots.forEach(([key, data]) => {
        if (!data?.rows) return;
        queryClient.setQueryData<ListResult<GxpUser>>(key, {
          ...data,
          rows: data.rows.map((row) => (row.id === user.id ? { ...row, status: nextStatus } : row))
        });
      });
      return { snapshots };
    },
    onSuccess: (_data, user) =>
      toast(user.status === "enabled" ? "User disabled successfully." : "User enabled successfully.", "success"),
    onError: (_error, _user, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: gxpUserKeys.all })
  });
};
