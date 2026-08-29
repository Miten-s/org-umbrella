import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  bulkCloneLimsAnalysis,
  bulkCopyLimsAnalysis,
  bulkDeleteLimsAnalysis,
  createLimsAnalysis,
  fetchLimsAnalysisAudit,
  fetchLimsAnalysisOptions,
  restoreLimsAnalysis,
  updateLimsAnalysis,
  fetchLimsAnalysisById
} from "./LimsAnalysis.api";
import type { LimsAnalysisPayload, LimsComponentRow } from "./LimsAnalysis.types";

export const limsAnalysisKeys = {
  all: ["limsAnalysis"] as const,
  list: (params: ServerListParams) => ["limsAnalysis", "list", params] as const,
  audit: (id: string) => ["limsAnalysis", "audit", id] as const,
  options: ["limsAnalysis", "options"] as const
};

/** Consumed by other modules selecting this entity. */
export const useLimsAnalysisOptions = (args: {
  search: string;
  enabled?: boolean;
  selectedValues?: string[];
}) =>
  useAsyncOptions({
    queryKey: limsAnalysisKeys.options,
    fetchPage: fetchLimsAnalysisOptions,
    search: args.search,
    enabled: args.enabled,
    selectedValues: args.selectedValues
  });

export const useLimsAnalysisAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsAnalysisKeys.audit(id ?? "none"),
    fetchPage: fetchLimsAnalysisAudit,
    id
  });

export const useLimsAnalysisById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsAnalysisKeys.all,
    fetchById: fetchLimsAnalysisById,
    id,
    enabled
  });

/**
 * Components of ONE Analysis, as async-select options — for Specification
 * Limits' `componentId` column (see LimsSpecificationForm), scoped per-row
 * to whichever Analysis that row's `analysisId` cell holds. An Analysis's
 * own component count is small (a handful to dozens), so this fetches the
 * whole Analysis once (`fetchLimsAnalysisById`, already React-Query cached
 * by id) and filters/pages its `components[]` in memory — real
 * search-across-everything pagination lives one level up, in
 * `useLimsAnalysisOptions`, for picking the Analysis itself.
 */
export const useLimsAnalysisComponentOptions = (
  args: { search: string; enabled?: boolean; selectedValues?: string[] },
  row?: { analysisId?: string }
) => {
  const analysisId = row?.analysisId;
  return useAsyncOptions({
    queryKey: [...limsAnalysisKeys.all, "components", analysisId ?? "none"],
    enabled: Boolean(analysisId) && (args.enabled ?? true),
    search: args.search,
    selectedValues: args.selectedValues,
    fetchPage: async ({ search }) => {
      if (!analysisId) return { options: [], nextPage: null };
      const analysis = await fetchLimsAnalysisById(analysisId);
      const term = search.trim().toLowerCase();
      const options = (analysis?.components ?? [])
        .filter((component: LimsComponentRow) =>
          term ? String(component.name ?? "").toLowerCase().includes(term) : true
        )
        .map((component: LimsComponentRow) => ({
          value: String(component.id ?? ""),
          label: String(component.name ?? component.componentId ?? ""),
          sublabel: component.unit ? String(component.unit) : undefined,
          data: component
        }))
        .filter((option) => option.value);
      return { options, nextPage: null };
    }
  });
};

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsAnalysis = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsAnalysisPayload) => createLimsAnalysis(payload),
    onSuccess: () => {
      toast("Record created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsAnalysis = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsAnalysisPayload }) => updateLimsAnalysis(id, payload),
    onSuccess: () => {
      toast("Record updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsAnalysis = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsAnalysis(selection, changeReason),
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

export const useBulkCloneLimsAnalysis = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsAnalysis(selection),
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

/**
 * The Copy flow's batched save (see CopyStepper) — one request creates
 * every reviewed record. Collisions on `analysisId`/name are warned, not
 * rejected (server auto-suffixes) — surfaced here per record, since some
 * rows in the batch may warn and others may not.
 */
export const useBulkCopyLimsAnalysis = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsAnalysisPayload[]) => bulkCopyLimsAnalysis(records),
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

export const useRestoreLimsAnalysis = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsAnalysis(id, changeReason),
    onSuccess: () => {
      toast("Record restored successfully.", "success");
      invalidate();
    }
  });
};
