import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsSampleTemplate,
  bulkCopyLimsSampleTemplate,
  bulkDeleteLimsSampleTemplate,
  bulkRestoreLimsSampleTemplate,
  bulkUpdateLimsSampleTemplate,
  createLimsSampleTemplate,
  fetchLimsSampleTemplateOptions,
  fetchLimsSampleTemplateAudit,
  restoreLimsSampleTemplate,
  updateLimsSampleTemplate,
  fetchLimsSampleTemplateById
} from "./LimsSampleTemplate.api";
import type { LimsSampleTemplatePayload } from "./LimsSampleTemplate.types";

export const limsSampleTemplateKeys = {
  all: ["limsSampleTemplate"] as const,
  list: (params: ServerListParams) =>
    ["limsSampleTemplate", "list", params] as const,
  audit: (id: string) => ["limsSampleTemplate", "audit", id] as const,
  options: ["limsSampleTemplate", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsSampleTemplateOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsSampleTemplateKeys.options,
    fetchPage: fetchLimsSampleTemplateOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsSampleTemplateAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsSampleTemplateKeys.audit(id ?? "none"),
    fetchPage: fetchLimsSampleTemplateAudit,
    id
  });

export const useLimsSampleTemplateById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsSampleTemplateKeys.all,
    fetchById: fetchLimsSampleTemplateById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsSampleTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsSampleTemplatePayload) =>
      createLimsSampleTemplate(payload),
    onSuccess: () => {
      toast("Sample template created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsSampleTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string;
      payload: LimsSampleTemplatePayload;
    }) => updateLimsSampleTemplate(id, payload),
    onSuccess: () => {
      toast("Sample template updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsSampleTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsSampleTemplate(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} sample templates removed successfully.`
          : "Sample template removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkRestoreLimsSampleTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkRestoreLimsSampleTemplate(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} sample templates restored successfully.`
          : "Sample template restored successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsSampleTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) =>
      bulkCloneLimsSampleTemplate(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} sample templates copied successfully.`
          : "Sample template copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

/** The Copy flow's batched save (CopyStepper): one request creates every reviewed
 * record; a collision is warned, not rejected. */
export const useBulkCopyLimsSampleTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsSampleTemplatePayload[]) =>
      bulkCopyLimsSampleTemplate(records),
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

export const useBulkUpdateLimsSampleTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsSampleTemplatePayload }[];
      changeReason: string;
    }) => bulkUpdateLimsSampleTemplate(updates, changeReason),
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

export const useRestoreLimsSampleTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsSampleTemplate(id, changeReason),
    onSuccess: () => {
      toast("Sample template restored successfully.", "success");
      invalidate();
    }
  });
};
