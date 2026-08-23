import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsProject,
  bulkDeleteLimsProject,
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
