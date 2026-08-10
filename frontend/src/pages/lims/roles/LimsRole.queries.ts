import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import { extractList } from "@/utils/listResponse";
import type { LimsAuditEntry } from "@/components/data/AuditTrailDialog";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsRole,
  bulkDeleteLimsRole,
  createLimsRole,
  fetchLimsRoleOptions,
  fetchLimsRoleAudit,
  restoreLimsRole,
  updateLimsRole
} from "./LimsRole.api";
import type { LimsRolePayload } from "./LimsRole.types";

export const limsRoleKeys = {
  all: ["limsRole"] as const,
  list: (params: ServerListParams) => ["limsRole", "list", params] as const,
  audit: (id: string) => ["limsRole", "audit", id] as const,
  options: ["limsRole", "options"] as const
};


/** Consumed by other modules selecting this entity. */
export const useLimsRoleOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsRoleKeys.options,
    fetchPage: fetchLimsRoleOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsRoleAudit = (id?: string) =>
  useQuery({
    queryKey: limsRoleKeys.audit(id ?? "none"),
    queryFn: async ({ signal }) =>
      extractList<LimsAuditEntry>(await fetchLimsRoleAudit(id as string, signal), [
        "audit",
        "auditTrail",
        "entries"
      ]),
    enabled: Boolean(id)
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: limsRoleKeys.all });
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsRolePayload) => createLimsRole(payload),
    onSuccess: () => {
      toast("Pick list created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsRolePayload }) =>
      updateLimsRole(id, payload),
    onSuccess: () => {
      toast("Pick list updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsRole(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} pick lists removed successfully.`
          : "Pick list removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsRole(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} pick lists copied successfully.`
          : "Pick list copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useRestoreLimsRole = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsRole(id, changeReason),
    onSuccess: () => {
      toast("Pick list restored successfully.", "success");
      invalidate();
    }
  });
};
