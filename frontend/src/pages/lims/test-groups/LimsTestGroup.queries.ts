import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import { extractList } from "@/utils/listResponse";
import type { LimsAuditEntry } from "@/components/data/AuditTrailDialog";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsTestGroup,
  bulkDeleteLimsTestGroup,
  createLimsTestGroup,
  fetchLimsTestGroupOptions,
  fetchLimsTestGroupAudit,
  restoreLimsTestGroup,
  updateLimsTestGroup
} from "./LimsTestGroup.api";
import type { LimsTestGroupPayload } from "./LimsTestGroup.types";

export const limsTestGroupKeys = {
  all: ["limsTestGroup"] as const,
  list: (params: ServerListParams) => ["limsTestGroup", "list", params] as const,
  audit: (id: string) => ["limsTestGroup", "audit", id] as const,
  options: ["limsTestGroup", "options"] as const
};


/** Consumed by other modules selecting this entity. */
export const useLimsTestGroupOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsTestGroupKeys.options,
    fetchPage: fetchLimsTestGroupOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsTestGroupAudit = (id?: string) =>
  useQuery({
    queryKey: limsTestGroupKeys.audit(id ?? "none"),
    queryFn: async ({ signal }) =>
      extractList<LimsAuditEntry>(await fetchLimsTestGroupAudit(id as string, signal), [
        "audit",
        "auditTrail",
        "entries"
      ]),
    enabled: Boolean(id)
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsTestGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsTestGroupPayload) => createLimsTestGroup(payload),
    onSuccess: () => {
      toast("Pick list created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsTestGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsTestGroupPayload }) =>
      updateLimsTestGroup(id, payload),
    onSuccess: () => {
      toast("Pick list updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsTestGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsTestGroup(selection, changeReason),
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

export const useBulkCloneLimsTestGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsTestGroup(selection),
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

export const useRestoreLimsTestGroup = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsTestGroup(id, changeReason),
    onSuccess: () => {
      toast("Pick list restored successfully.", "success");
      invalidate();
    }
  });
};
