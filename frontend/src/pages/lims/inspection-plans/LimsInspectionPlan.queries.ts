import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import { extractList } from "@/utils/listResponse";
import type { LimsAuditEntry } from "@/components/data/AuditTrailDialog";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsInspectionPlan,
  bulkDeleteLimsInspectionPlan,
  createLimsInspectionPlan,
  fetchLimsInspectionPlanAudit,
  fetchLimsInspectionPlanOptions,
  restoreLimsInspectionPlan,
  updateLimsInspectionPlan
} from "./LimsInspectionPlan.api";
import type { LimsInspectionPlanPayload } from "./LimsInspectionPlan.types";

export const limsInspectionPlanKeys = {
  all: ["limsInspectionPlan"] as const,
  list: (params: ServerListParams) => ["limsInspectionPlan", "list", params] as const,
  audit: (id: string) => ["limsInspectionPlan", "audit", id] as const,
  options: ["limsInspectionPlan", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsInspectionPlanOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsInspectionPlanKeys.options,
    fetchPage: fetchLimsInspectionPlanOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsInspectionPlanAudit = (id?: string) =>
  useQuery({
    queryKey: limsInspectionPlanKeys.audit(id ?? "none"),
    queryFn: async ({ signal }) =>
      extractList<LimsAuditEntry>(await fetchLimsInspectionPlanAudit(id as string, signal), [
        "audit",
        "auditTrail",
        "entries"
      ]),
    enabled: Boolean(id)
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: limsInspectionPlanKeys.all });
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsInspectionPlan = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsInspectionPlanPayload) => createLimsInspectionPlan(payload),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsInspectionPlan = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsInspectionPlanPayload }) => updateLimsInspectionPlan(id, payload),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsInspectionPlan = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsInspectionPlan(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} records removed successfully.`
          : "Record removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsInspectionPlan = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsInspectionPlan(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} records copied successfully.`
          : "Record copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useRestoreLimsInspectionPlan = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsInspectionPlan(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
