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
  /** Bulk Edit's one shared reason for the whole reviewed batch — optional, unmigrated callers are unaffected. */
  onBulkUpdate?: (reason: string) => Promise<void> | void;
  /** Bulk Restore's one shared reason for the whole selected batch — optional, unmigrated callers are unaffected. */
  onBulkRestore?: (reason: string) => Promise<void> | void;

  updating?: boolean;
  deleting?: boolean;
  restoring?: boolean;
  bulkUpdating?: boolean;
  bulkRestoring?: boolean;

  auditEntries: LimsAuditEntry[];
  auditLoading?: boolean;
  /** Infinite-scroll paging for the audit trail (useLimsAuditTrail) — optional, unmigrated callers are unaffected. */
  auditHasNextPage?: boolean;
  auditFetchingNextPage?: boolean;
  onAuditLoadMore?: () => void;
}

/** The three reason-gated confirmations plus the audit viewer every LIMS module needs,
 * extracted so the behavior is identical everywhere. */
function LimsComplianceDialogs<TRow extends { id: string }, TPayload>({
  compliance,
  entityLabel,
  entityLabelPlural,
  getRecordLabel,
  onUpdate,
  onDelete,
  onRestore,
  onBulkUpdate,
  onBulkRestore,
  updating = false,
  deleting = false,
  restoring = false,
  bulkUpdating = false,
  bulkRestoring = false,
  auditEntries,
  auditLoading = false,
  auditHasNextPage = false,
  auditFetchingNextPage = false,
  onAuditLoadMore
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

      {/* Bulk Edit: one reason, recorded once, applied to every reviewed record's own audit row. */}
      <ConfirmDialog
        isOpen={compliance.pendingBulkUpdate !== null}
        onClose={compliance.clearBulkUpdate}
        loading={bulkUpdating}
        tone="default"
        requireReason
        title={t("limsConfirmBulkChangesTitle")}
        description={t("limsConfirmBulkChangesBody", {
          count: compliance.pendingBulkUpdate?.count ?? 0
        })}
        onConfirm={(reason) => onBulkUpdate?.(reason ?? "")}
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

      {/* Bulk Restore: one reason, applied to every selected record via its own restore call. */}
      <ConfirmDialog
        isOpen={compliance.pendingBulkRestore !== null}
        onClose={compliance.clearBulkRestore}
        loading={bulkRestoring}
        tone="default"
        requireReason
        items={compliance.pendingBulkRestore?.names ?? []}
        description={
          (compliance.pendingBulkRestore?.count ?? 0) > 1
            ? t("limsRestoreManyPrompt", {
                count: compliance.pendingBulkRestore?.count ?? 0,
                entity: entityLabelPlural
              })
            : t("limsRestorePrompt", { entity: entityLabel })
        }
        onConfirm={(reason) => onBulkRestore?.(reason ?? "")}
      />

      <AuditTrailDialog
        isOpen={compliance.auditRow !== null}
        onClose={compliance.closeAudit}
        recordLabel={compliance.auditRow ? getRecordLabel(compliance.auditRow) : undefined}
        entries={auditEntries}
        loading={auditLoading}
        hasNextPage={auditHasNextPage}
        isFetchingNextPage={auditFetchingNextPage}
        onLoadMore={onAuditLoadMore}
      />
    </>
  );
}

export default LimsComplianceDialogs;
