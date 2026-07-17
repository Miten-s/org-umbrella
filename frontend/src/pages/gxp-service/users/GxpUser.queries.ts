import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import type { BulkSelection, ListResult, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkDeleteGxpUser,
  createGxpUser,
  disableGxpUser,
  enableGxpUser,
  updateGxpUser
} from "./GxpUser.api";
import type { GxpUser, GxpUserPayload } from "./GxpUser.types";

export const gxpUserKeys = {
  all: ["gxpUser"] as const,
  list: (params: ServerListParams) => ["gxpUser", "list", params] as const
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
