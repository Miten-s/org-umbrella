import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkDeletePermission,
  createPermission,
  updatePermission
} from "./Permission.api";
import type { GxpPermissionPayload } from "./Permission.types";

export const permissionKeys = {
  all: ["gxpPermission"] as const,
  list: (params: ServerListParams) => ["gxpPermission", "list", params] as const
};

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: permissionKeys.all });
};

export const useCreatePermission = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: GxpPermissionPayload) => createPermission(payload),
    onSuccess: () => {
      toast("Permission created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdatePermission = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: GxpPermissionPayload }) => updatePermission(id, payload),
    onSuccess: () => {
      toast("Permission updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeletePermission = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkDeletePermission(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(count && count > 1 ? `${count} permissions deleted successfully.` : "Permission deleted successfully.", "success");
      invalidate();
    }
  });
};
