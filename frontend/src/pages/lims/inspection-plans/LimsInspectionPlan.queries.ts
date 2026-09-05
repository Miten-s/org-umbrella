import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsInspectionPlan,
  bulkCopyLimsInspectionPlan,
  bulkDeleteLimsInspectionPlan,
  bulkRestoreLimsInspectionPlan,
  bulkUpdateLimsInspectionPlan,
  createLimsInspectionPlan,
  fetchLimsInspectionPlanAudit,
  fetchLimsInspectionPlanOptions,
  restoreLimsInspectionPlan,
  updateLimsInspectionPlan,
  fetchLimsInspectionPlanById
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
  useLimsAuditTrail({
    queryKey: limsInspectionPlanKeys.audit(id ?? "none"),
    fetchPage: fetchLimsInspectionPlanAudit,
    id
  });

export const useLimsInspectionPlanById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsInspectionPlanKeys.all,
    fetchById: fetchLimsInspectionPlanById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
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

export const useBulkRestoreLimsInspectionPlan = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkRestoreLimsInspectionPlan(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} records restored successfully.`
          : "Record restored successfully.",
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

/** The Copy flow's batched save (CopyStepper): one request creates every reviewed
 * record; a collision is warned, not rejected. */
export const useBulkCopyLimsInspectionPlan = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsInspectionPlanPayload[]) => bulkCopyLimsInspectionPlan(records),
    onSuccess: (data) => {
      const warnings = data.results.filter((r) => r.warning);
      toast(
        data.count > 1
          ? `${data.count} records copied successfully.`
          : "Record copied successfully.",
        "success"
      );
      if (warnings.length) {
        toast(
          warnings.length === 1
            ? warnings[0].warning!
            : `${warnings.length} of ${data.count} kept their original name — renamed to stay unique.`,
          "info",
          { duration: 6000 }
        );
      }
      invalidate();
    }
  });
};

export const useBulkUpdateLimsInspectionPlan = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsInspectionPlanPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsInspectionPlan(updates, changeReason),
    onSuccess: (data) => {
      toast(
        data.count > 1
          ? `${data.count} records updated successfully.`
          : "Record updated successfully.",
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
