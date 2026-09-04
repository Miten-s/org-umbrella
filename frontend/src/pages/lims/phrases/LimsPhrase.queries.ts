import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLimsAuditTrail } from "@/hooks/useLimsAuditTrail";
import { useLimsRecordById } from "@/hooks/useLimsRecordById";
import { invalidateAllLims } from "@/lib/query/invalidateLims";
import { toast } from "@/lib/toast";
import { useAsyncOptions } from "@/hooks/useAsyncOptions";
import type { BulkSelection, ServerListParams } from "@/lib/query/listTypes";
import {
  PHRASE_CODES,
  bulkCloneLimsPhrase,
  bulkCopyLimsPhrase,
  bulkDeleteLimsPhrase,
  bulkUpdateLimsPhrase,
  createLimsPhrase,
  fetchLimsPhraseAudit,
  fetchPhraseEntryOptions,
  restoreLimsPhrase,
  updateLimsPhrase,
  type PhraseCode,
  fetchLimsPhraseById
} from "./LimsPhrase.api";
import type { LimsPhrasePayload } from "./LimsPhrase.types";

export const limsPhraseKeys = {
  all: ["limsPhrase"] as const,
  list: (params: ServerListParams) => ["limsPhrase", "list", params] as const,
  audit: (id: string) => ["limsPhrase", "audit", id] as const,
  entryOptions: (phrase: PhraseCode) => ["limsPhrase", "entries", phrase] as const
};

/**
 * Builds an AsyncSelect-compatible options hook bound to one pick list.
 * Every "select a value" dropdown in LIMS goes through here.
 */
export const makePhraseOptionsHook =
  (phrase: PhraseCode) =>
  (args: { search: string; enabled?: boolean; selectedValues?: string[] }) =>
    useAsyncOptions({
      queryKey: limsPhraseKeys.entryOptions(phrase),
      fetchPage: fetchPhraseEntryOptions(phrase),
      search: args.search,
      enabled: args.enabled,
      selectedValues: args.selectedValues
    });

export const useLocationTypeOptions = makePhraseOptionsHook(PHRASE_CODES.LOCATION_TYPE);
export const useParameterTypeOptions = makePhraseOptionsHook(PHRASE_CODES.PARAMETER_TYPE);
export const useRatingOptions = makePhraseOptionsHook(PHRASE_CODES.RATING);
export const useStockTypeOptions = makePhraseOptionsHook(PHRASE_CODES.STOCK_TYPE);
export const useStockBatchStatusOptions = makePhraseOptionsHook(
  PHRASE_CODES.STOCK_BATCH_STATUS
);
export const useInstrumentTypeOptions = makePhraseOptionsHook(PHRASE_CODES.INSTRUMENT_TYPE);
export const useMeasurementTypeOptions = makePhraseOptionsHook(PHRASE_CODES.MEASUREMENT_TYPE);
export const useInstrumentStatusOptions = makePhraseOptionsHook(
  PHRASE_CODES.INSTRUMENT_STATUS
);
export const useCalibrationTypeOptions = makePhraseOptionsHook(PHRASE_CODES.CALIBRATION_TYPE);
export const useCalibrationStatusOptions = makePhraseOptionsHook(
  PHRASE_CODES.CALIBRATION_STATUS
);
export const useAnalysisTypeOptions = makePhraseOptionsHook(PHRASE_CODES.ANALYSIS_TYPE);
export const useApprovalStatusOptions = makePhraseOptionsHook(PHRASE_CODES.APPROVAL_STATUS);
export const useSampleTypeOptions = makePhraseOptionsHook(PHRASE_CODES.SAMPLE_TYPE);

export const useLimsPhraseAudit = (id?: string) =>
  useLimsAuditTrail({
    queryKey: limsPhraseKeys.audit(id ?? "none"),
    fetchPage: fetchLimsPhraseAudit,
    id
  });

export const useLimsPhraseById = (id?: string, enabled = true) =>
  useLimsRecordById({
    queryKey: limsPhraseKeys.all,
    fetchById: fetchLimsPhraseById,
    id,
    enabled
  });

const useInvalidate = () => {
  const queryClient = useQueryClient();
  return () => invalidateAllLims(queryClient);
};

// Rule 2: one SUCCESS toast per action here; never an onError toast.

export const useCreateLimsPhrase = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (payload: LimsPhrasePayload) => createLimsPhrase(payload),
    onSuccess: () => {
      toast("Pick list created successfully.", "success");
      invalidate();
    }
  });
};

export const useUpdateLimsPhrase = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LimsPhrasePayload }) =>
      updateLimsPhrase(id, payload),
    onSuccess: () => {
      toast("Pick list updated successfully.", "success");
      invalidate();
    }
  });
};

export const useBulkDeleteLimsPhrase = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      selection,
      changeReason
    }: {
      selection: BulkSelection;
      changeReason: string;
    }) => bulkDeleteLimsPhrase(selection, changeReason),
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

export const useBulkCloneLimsPhrase = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (selection: BulkSelection) => bulkCloneLimsPhrase(selection),
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

/** The Copy flow's batched save (CopyStepper): one request creates every reviewed
 * record; a collision is warned, not rejected. */
export const useBulkCopyLimsPhrase = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (records: LimsPhrasePayload[]) => bulkCopyLimsPhrase(records),
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

export const useBulkUpdateLimsPhrase = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      updates,
      changeReason
    }: {
      updates: { id: string; payload: LimsPhrasePayload }[];
      changeReason: string;
    }) => bulkUpdateLimsPhrase(updates, changeReason),
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

export const useRestoreLimsPhrase = () => {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, changeReason }: { id: string; changeReason: string }) =>
      restoreLimsPhrase(id, changeReason),
    onSuccess: () => {
      toast("Pick list restored successfully.", "success");
      invalidate();
    }
  });
};
