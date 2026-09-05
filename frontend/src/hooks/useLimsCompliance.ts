import { useCallback, useState } from "react";
import type { BulkSelection } from "@/lib/query/listTypes";

/** An edit captured on form submit, waiting for its change reason. */
export interface PendingUpdate<TPayload> {
  id: string;
  payload: TPayload;
  files: File[];
}

export interface PendingDelete {
  selection: BulkSelection;
  count: number;
  names: string[];
}

/** Bulk Edit's reviewed batch, waiting for its one shared change reason. */
export interface PendingBulkUpdate<TPayload> {
  updates: { id: string; payload: TPayload }[];
  count: number;
}

/** Bulk Restore's selected removed rows, waiting for their one shared change reason. */
export interface PendingBulkRestore {
  ids: string[];
  names: string[];
  count: number;
}

/**
 * State for the GxP-compliance actions every LIMS module shares: a mandatory
 * change reason on edit / remove / restore, plus the per-record audit trail.
 *
 * Holds only state and transitions — the module owns the mutations, and
 * `<LimsComplianceDialogs>` renders the UI.
 */
export const useLimsCompliance = <TRow extends { id: string }, TPayload>() => {
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate<TPayload> | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [pendingRestore, setPendingRestore] = useState<TRow | null>(null);
  const [pendingBulkUpdate, setPendingBulkUpdate] =
    useState<PendingBulkUpdate<TPayload> | null>(null);
  const [pendingBulkRestore, setPendingBulkRestore] = useState<PendingBulkRestore | null>(null);
  const [auditRow, setAuditRow] = useState<TRow | null>(null);

  /** Called from the form's submit when editing an existing record. */
  const requestUpdate = useCallback((id: string, payload: TPayload, files: File[] = []) => {
    setPendingUpdate({ id, payload, files });
  }, []);

  const requestDelete = useCallback(
    (selection: BulkSelection, count: number, names: string[] = []) => {
      setPendingDelete({ selection, count, names });
    },
    []
  );

  const requestRestore = useCallback((row: TRow) => setPendingRestore(row), []);
  /** Called from the bulk-selection popover's Restore action — same one-reason-for-the-batch
   * shape as `requestBulkUpdate`, applied per-id via the module's existing single `restore` mutation. */
  const requestBulkRestore = useCallback((ids: string[], names: string[] = []) => {
    setPendingBulkRestore({ ids, names, count: ids.length });
  }, []);
  /** Called from EditStepper's Save-all with the reviewed, already-changed batch. */
  const requestBulkUpdate = useCallback(
    (updates: { id: string; payload: TPayload }[]) => {
      setPendingBulkUpdate({ updates, count: updates.length });
    },
    []
  );
  const openAudit = useCallback((row: TRow) => setAuditRow(row), []);

  const clearUpdate = useCallback(() => setPendingUpdate(null), []);
  const clearDelete = useCallback(() => setPendingDelete(null), []);
  const clearRestore = useCallback(() => setPendingRestore(null), []);
  const clearBulkRestore = useCallback(() => setPendingBulkRestore(null), []);
  const clearBulkUpdate = useCallback(() => setPendingBulkUpdate(null), []);
  const closeAudit = useCallback(() => setAuditRow(null), []);

  return {
    pendingUpdate,
    pendingDelete,
    pendingRestore,
    pendingBulkRestore,
    pendingBulkUpdate,
    auditRow,
    requestUpdate,
    requestDelete,
    requestRestore,
    requestBulkRestore,
    requestBulkUpdate,
    openAudit,
    clearUpdate,
    clearDelete,
    clearRestore,
    clearBulkRestore,
    clearBulkUpdate,
    closeAudit
  };
};

export type UseLimsComplianceReturn<TRow extends { id: string }, TPayload> = ReturnType<
  typeof useLimsCompliance<TRow, TPayload>
>;
