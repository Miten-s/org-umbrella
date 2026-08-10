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
  const openAudit = useCallback((row: TRow) => setAuditRow(row), []);

  const clearUpdate = useCallback(() => setPendingUpdate(null), []);
  const clearDelete = useCallback(() => setPendingDelete(null), []);
  const clearRestore = useCallback(() => setPendingRestore(null), []);
  const closeAudit = useCallback(() => setAuditRow(null), []);

  return {
    pendingUpdate,
    pendingDelete,
    pendingRestore,
    auditRow,
    requestUpdate,
    requestDelete,
    requestRestore,
    openAudit,
    clearUpdate,
    clearDelete,
    clearRestore,
    closeAudit
  };
};

export type UseLimsComplianceReturn<TRow extends { id: string }, TPayload> = ReturnType<
  typeof useLimsCompliance<TRow, TPayload>
>;
