import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsProject,
  bulkCopyLimsProject,
  bulkDeleteLimsProject,
  bulkRestoreLimsProject,
  bulkUpdateLimsProject,
  createLimsProject,
  fetchLimsProjectAudit,
  fetchLimsProjectOptions,
  restoreLimsProject,
  updateLimsProject,
  fetchLimsProjectById
} from "./LimsProject.api";
import type { LimsProjectPayload } from "./LimsProject.types";

export const limsProjectKeys = {
  all: ["limsProject"] as const,
  list: (params: ServerListParams) => ["limsProject", "list", params] as const,
  audit: (id: string) => ["limsProject", "audit", id] as const,
  options: ["limsProject", "options"] as const
};

export const useLimsProjectOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsProjectKeys.options,
    fetchPage: fetchLimsProjectOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsProjectAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsProjectKeys.audit(id ?? "none"),
    fetchPage: fetchLimsProjectAudit,
    id
  });

export const useLimsProjectById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsProjectKeys.all,
    fetchById: fetchLimsProjectById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsProject = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ payload, files }: { payload: LimsProjectPayload; files?: File[] }) =>
      createLimsProject(payload, files),
    onSuccess: () => {
      toast("Project created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsProject = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      payload,
      files
    }: {
      id: string;
      payload: LimsProjectPayload;
      files?: File[];
    }) => updateLimsProject(id, payload, files),
    onSuccess: () => {
      toast("Project updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsProject = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsProject(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} projects removed successfully.`
          : "Project removed successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkRestoreLimsProject = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkRestoreLimsProject(selection, changeReason),
    onSuccess: (_data, { selection }) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} projects restored successfully.`
          : "Project restored successfully.",
        "success"
      );
      invalidate();
    }
  });
};

export const useBulkCloneLimsProject = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsProject(selection),
    onSuccess: (_data, selection) => {
      const count = selection.mode === "ids" ? selection.ids.length : undefined;
      toast(
        count && count > 1
          ? `${count} projects copied successfully.`
          : "Project copied successfully.",
        "success"
      );
      invalidate();
    }
  });
};

/** The Copy flow's batched save (CopyStepper): one request creates every reviewed
 * record; a collision is warned, not rejected. */
export const useBulkCopyLimsProject = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsProjectPayload[]) => bulkCopyLimsProject(records),
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

export const useBulkUpdateLimsProject = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsProjectPayload }[];
      changeReason: string;
    }) => bulkUpdateLimsProject(updates, changeReason),
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

export const useRestoreLimsProject = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsProject(id, changeReason),
    onSuccess: () => {
      toast("Project restored successfully.", "success");
      invalidate();
    }
  });
};
