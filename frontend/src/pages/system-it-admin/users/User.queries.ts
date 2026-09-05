import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import { bulkDeleteUser, bulkUpdateUser, createUser, fetchUserOptions, updateUser } from "./User.api";

/** React Query keys (STANDARDS.md §2). */
export const userKeys = {
  all: ["user"] as const,
  list: (params: ServerListParams) => ["user", "list", params] as const,
  detail: (id: string) => ["user", "detail", id] as const,
  options: ["user", "options"] as const
};

/** Bound options hook for AsyncSelect consumers selecting a user. */
export const useUserOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: userKeys.options,
    fetchPage: fetchUserOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

const useInvalidateUsers = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: userKeys.all });
};

export const useCreateUser = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => createUser(payload),
    onSuccess: () => {
      toast("User created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateUser = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      updateUser(id, payload),
    onSuccess: () => {
      toast("User updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteUser = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteUser(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1 ? `${count} users deleted successfully.` : "User deleted successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkUpdateUser = () => {
  const invalidate = useInvalidateUsers();
  return useMutation({
    mutationFn: (updates: { id: string; payload: Record<string, unknown> }[]) => bulkUpdateUser(updates),
    onSuccess: (data) => {
      toast(
        data.count > 1 ? `${data.count} users updated successfully.` : "User updated successfully.",
        "success"
      );
      invalidate();
    }
  });
};
