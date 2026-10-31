import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsEntityTemplate,
  bulkCopyLimsEntityTemplate,
  bulkDeleteLimsEntityTemplate,
  bulkRestoreLimsEntityTemplate,
  bulkUpdateLimsEntityTemplate,
  createLimsEntityTemplate,
  fetchEntityRecords,
  fetchFieldOptions,
  fetchLimsEntityTemplateOptions,
  fetchLimsEntityTemplateAudit,
  restoreLimsEntityTemplate,
  updateLimsEntityTemplate,
  fetchLimsEntityTemplateById
} from "./LimsEntityTemplate.api";
import type { LimsEntityTemplatePayload } from "./LimsEntityTemplate.types";

export const limsEntityTemplateKeys = {
  all: ["limsEntityTemplate"] as const,
  list: (params: ServerListParams) =>
    ["limsEntityTemplate", "list", params] as const,
  audit: (id: string) => ["limsEntityTemplate", "audit", id] as const,
  options: ["limsEntityTemplate", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsEntityTemplateOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsEntityTemplateKeys.options,
    fetchPage: fetchLimsEntityTemplateOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

type OptionArgs = {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
};

/** A dropdown hook for one catalog field's values. */
export const fieldOptionsHook =
  (entity: string, field: string) => (args: OptionArgs) =>
    useAsyncOptions({
      queryKey: [...limsEntityTemplateKeys.options, "field", entity, field],
      fetchPage: (page, signal) =>
        fetchFieldOptions(entity, field, page, signal),
      search: args.search,
      enabled: args.enabled
    });

/** A dropdown hook for the records one template matches. */
export const entityRecordsHook = (templateId: string) => (args: OptionArgs) =>
  useAsyncOptions({
    queryKey: [...limsEntityTemplateKeys.options, "records", templateId],
    fetchPage: (page, signal) => fetchEntityRecords(templateId, page, signal),
    search: args.search,
    enabled: args.enabled
  });

export const useLimsEntityTemplateAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsEntityTemplateKeys.audit(id ?? "none"),
    fetchPage: fetchLimsEntityTemplateAudit,
    id
  });

export const useLimsEntityTemplateById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsEntityTemplateKeys.all,
    fetchById: fetchLimsEntityTemplateById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsEntityTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsEntityTemplatePayload) =>
      createLimsEntityTemplate(payload),
    onSuccess: () => {
      toast("Entity template created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsEntityTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      payload
    }: {
      id: string;
      payload: LimsEntityTemplatePayload;
    }) => updateLimsEntityTemplate(id, payload),
    onSuccess: () => {
      toast("Entity template updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsEntityTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsEntityTemplate(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} entity templates removed successfully.`
          : "Entity template removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkRestoreLimsEntityTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkRestoreLimsEntityTemplate(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} entity templates restored successfully.`
          : "Entity template restored successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsEntityTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) =>
      bulkCloneLimsEntityTemplate(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} entity templates copied successfully.`
          : "Entity template copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

/** The Copy flow's batched save (CopyStepper): one request creates every reviewed
 * record; a collision is warned, not rejected. */
export const useBulkCopyLimsEntityTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsEntityTemplatePayload[]) =>
      bulkCopyLimsEntityTemplate(records),
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

export const useBulkUpdateLimsEntityTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsEntityTemplatePayload }[];
      changeReason: string;
    }) => bulkUpdateLimsEntityTemplate(updates, changeReason),
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

export const useRestoreLimsEntityTemplate = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsEntityTemplate(id, changeReason),
    onSuccess: () => {
      toast("Entity template restored successfully.", "success");
      invalidate();
    }
  });
};
