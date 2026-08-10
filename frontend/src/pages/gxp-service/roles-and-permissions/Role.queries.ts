import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkDeleteRole,
  createRole,
  fetchGxpRoleOptions,
  fetchRolePermissions,
  updateRole
} from "./Role.api";
import type { GxpRolePayload } from "./Role.types";

export const roleKeys = {
  all: ["gxpRole"] as const,
  list: (params: ServerListParams) => ["gxpRole", "list", params] as const,
  permissions: ["gxpRole", "permissions"] as const,
  options: ["gxpRole", "options"] as const
};

/** Bound options hook for AsyncSelect consumers selecting GXP roles. */
export const useGxpRoleOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: roleKeys.options,
    fetchPage: fetchGxpRoleOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

/** All GXP permissions for the role form's picker (preserves the limit:100 load). */
export const useRolePermissions = () =>
  useQuery({
    queryKey: roleKeys.permissions,
    queryFn: ({ signal }) => fetchRolePermissions(signal)
  });

const useInvalidateRoles = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: roleKeys.all });
};

export const useCreateRole = () => {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (payload: GxpRolePayload) => createRole(payload),
    onSuccess: () => {
      toast("Role created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateRole = () => {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GxpRolePayload }) => updateRole(id, payload),
    onSuccess: () => {
      toast("Role updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteRole = () => {
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeleteRole(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} roles deleted successfully.` : "Role deleted successfully.", "success");
      invalidate();
    }
  });
};
