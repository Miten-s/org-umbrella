import { useTranslation } from "react-i18next";
import ConfirmDialog from "./ConfirmDialog";
import AuditTrailDialog, { type LimsAuditEntry } from "./AuditTrailDialog";
import type { UseLimsComplianceReturn } from "@/hooks/useLimsCompliance";

interface LimsComplianceDialogsProps<TRow extends { id: string }, TPayload> {
  compliance: UseLimsComplianceReturn<TRow, TPayload>;
  /** Singular, lowercase — e.g. "storage location". Used in the prompts. */
  entityLabel: string;
  /** Plural, lowercase — e.g. "storage locations". */
  entityLabelPlural: string;
  /** Business key of the audited record, shown in the audit heading. */
  getRecordLabel: (row: TRow) => string;

  onUpdate: (reason: string) => Promise<void> | void;
  onDelete: (reason: string) => Promise<void> | void;
  onRestore: (reason: string) => Promise<void> | void;

  updating?: boolean;
  deleting?: boolean;
  restoring?: boolean;

  auditEntries: LimsAuditEntry[];
  auditLoading?: boolean;
}

/**
 * The three reason-gated confirmations plus the audit viewer that every LIMS
 * module needs. Extracted so the compliance behaviour is identical across all
 * 20 modules rather than re-implemented per list.
 */
function LimsComplianceDialogs<TRow extends { id: string }, TPayload>({
  compliance,
  entityLabel,
  entityLabelPlural,
  getRecordLabel,
  onUpdate,
  onDelete,
  onRestore,
  updating = false,
  deleting = false,
  restoring = false,
  auditEntries,
  auditLoading = false
}: LimsComplianceDialogsProps<TRow, TPayload>) {
  const { t } = useTranslation();
  const deleteCount = compliance.pendingDelete?.count ?? 0;

  return (
    <>
      {/* Every edit records why it happened. */}
      <ConfirmDialog
        isOpen={compliance.pendingUpdate !== null}
        onClose={compliance.clearUpdate}
        loading={updating}
        tone="default"
        requireReason
        title={t("limsConfirmChangesTitle")}
        description={t("limsConfirmChangesBody")}
        onConfirm={(reason) => onUpdate(reason ?? "")}
      />

      <ConfirmDialog
        isOpen={compliance.pendingDelete !== null}
        onClose={compliance.clearDelete}
        loading={deleting}
        requireReason
        items={compliance.pendingDelete?.names ?? []}
        description={
          deleteCount > 1
            ? t("limsRemoveManyPrompt", { count: deleteCount, entity: entityLabelPlural })
            : t("limsRemoveOnePrompt", { entity: entityLabel })
        }
        onConfirm={(reason) => onDelete(reason ?? "")}
      />

      <ConfirmDialog
        isOpen={compliance.pendingRestore !== null}
        onClose={compliance.clearRestore}
        loading={restoring}
        tone="default"
        requireReason
        items={
          compliance.pendingRestore ? [getRecordLabel(compliance.pendingRestore)] : []
        }
        description={t("limsRestorePrompt", { entity: entityLabel })}
        onConfirm={(reason) => onRestore(reason ?? "")}
      />

      <AuditTrailDialog
        isOpen={compliance.auditRow !== null}
        onClose={compliance.closeAudit}
        recordLabel={compliance.auditRow ? getRecordLabel(compliance.auditRow) : undefined}
        entries={auditEntries}
        loading={auditLoading}
      />
    </>
  );
}

export default LimsComplianceDialogs;
