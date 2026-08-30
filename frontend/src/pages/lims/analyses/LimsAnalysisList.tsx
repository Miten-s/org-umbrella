import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, {
  type DataTableBulkAction
} from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import CopyStepper from "@/components/data/CopyStepper";
import ViewStepper from "@/components/data/ViewStepper";
import EditStepper from "@/components/data/EditStepper";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import { toast } from "@/lib/toast";
import { idsSelection } from "@/lib/query/listTypes";
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon
} from "@/public/icons";
import { fetchLimsAnalysisById, fetchLimsAnalysisList } from "./LimsAnalysis.api";
import { getLimsAnalysisColumns } from "./LimsAnalysis.columns";
import {
  limsAnalysisKeys,
  useBulkCloneLimsAnalysis,
  useBulkCopyLimsAnalysis,
  useBulkDeleteLimsAnalysis,
  useBulkUpdateLimsAnalysis,
  useCreateLimsAnalysis,
  useLimsAnalysisAudit,
  useRestoreLimsAnalysis,
  useUpdateLimsAnalysis,
  useLimsAnalysisById
} from "./LimsAnalysis.queries";
import LimsAnalysisForm, {
  type LimsAnalysisFormMode
} from "./LimsAnalysisForm";
import type { LimsAnalysis, LimsAnalysisPayload } from "./LimsAnalysis.types";

/** LimsAnalysis list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsAnalysisList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Only the id of the row being edited/viewed — the list row itself is
  // never passed into the form; the full record (including attachments)
  // is fetched fresh the moment the modal actually needs it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsAnalysisFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open —
  // one or more source ids, reviewed via CopyStepper, not fetched/edited
  // as a single record.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  // Same idea as copyIds, but for a multi-select bulk View — stepped
  // through read-only via ViewStepper instead of the single-record modal.
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  // Same idea again, for a multi-select Bulk Edit — reviewed via
  // EditStepper against real records instead of blank/source-copied ones.
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<LimsAnalysis, LimsAnalysisPayload>();
  const auditQuery = useLimsAnalysisAudit(compliance.auditRow?.id);
  const detailQuery = useLimsAnalysisById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsAnalysisList>[1],
      signal?: AbortSignal
    ) => fetchLimsAnalysisList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsAnalysis>({
    entity: "limsAnalysis",
    queryKey: [...limsAnalysisKeys.all, { includeRemoved }],
    fetchList
  });

  const create = useCreateLimsAnalysis();
  const update = useUpdateLimsAnalysis();
  const bulkClone = useBulkCloneLimsAnalysis();
  const bulkCopy = useBulkCopyLimsAnalysis();
  const bulkDelete = useBulkDeleteLimsAnalysis();
  const bulkUpdate = useBulkUpdateLimsAnalysis();
  const restore = useRestoreLimsAnalysis();

  const busy =
    create.isPending ||
    update.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restore.isPending;

  const columnDefs = useMemo(() => getLimsAnalysisColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsAnalysisFormMode, row: LimsAnalysis | null) => {
      setFormMode(mode);
      setActiveId(row?.id ?? null);
      openModal();
    },
    [openModal]
  );

  const openCopy = useCallback(
    (ids: string[]) => {
      setCopyIds(ids);
      openModal();
    },
    [openModal]
  );

  const openView = useCallback(
    (ids: string[]) => {
      setViewIds(ids);
      openModal();
    },
    [openModal]
  );

  const openEdit = useCallback(
    (ids: string[]) => {
      setEditIds(ids);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActiveId(null);
    setFormMode("create");
    setCopyIds(null);
    setViewIds(null);
    setEditIds(null);
  };

  const handleSaveCopies = async (payloads: LimsAnalysisPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  // Closes the review modal first, same as a standalone single-record Edit
  // — the shared reason then comes from `LimsComplianceDialogs`'s own
  // dialog, not from EditStepper itself.
  const handleSaveEdits = (updates: { id: string; payload: LimsAnalysisPayload }[]) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const handleSave = async (payload: LimsAnalysisPayload) => {
    if (activeId) {
      compliance.requestUpdate(activeId, payload);
      closeModal();
      return;
    }
    await create.mutateAsync(payload);
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await update.mutateAsync({
      id: pending.id,
      payload: { ...pending.payload, changeReason: reason }
    });
    compliance.clearUpdate();
    setActiveId(null);
    setFormMode("create");
  };

  const label = (row: LimsAnalysis) => String(row.analysisId ?? row.name ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("view", { entity: t("limsAnalyses") }),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_ANALYSIS,
        onClick: (selection) => {
          // Same split as Copy: an explicit checkbox selection opens the
          // stepper. "Select all matching filter" has no bounded record
          // count to fetch/step through, so it's not offered here.
          if (selection.mode !== "ids") {
            toast(t("viewBulkFilterUnsupported"), "error");
            return;
          }
          openView(selection.ids);
        }
      },
      {
        key: "clone",
        label: () => t("limsCopy"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_ANALYSIS,
        onClick: async (selection) => {
          // A specific checkbox selection opens the Copy review flow. A
          // "select all N matching filter" selection can be far larger than
          // is reasonable to fetch/review record-by-record, so that one
          // path keeps the previous immediate server-side duplicate.
          if (selection.mode === "ids") {
            openCopy(selection.ids);
            return;
          }
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "edit",
        label: () => t("edit"),
        icon: PencilIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.UPDATE_ANALYSIS,
        onClick: (selection) => {
          // Same split as Copy/View: an explicit checkbox selection opens
          // the review stepper. "Select all matching filter" has no bounded
          // record count to fetch/review, so it's not offered here.
          if (selection.mode !== "ids") {
            toast(t("editBulkFilterUnsupported"), "error");
            return;
          }
          openEdit(selection.ids);
        }
      },
      {
        key: "delete",
        label: () => t("limsRemove"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_ANALYSIS,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows
                  .filter((row) => selection.ids.includes(row.id))
                  .map(label)
              : []
          )
      }
    ],
    [bulkClone, compliance, openCopy, openEdit, openView, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsAnalysis>[]>(
    () => [
      {
        key: "view",
        label: t("view", { entity: t("limsAnalysis") }),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_ANALYSIS,
        onClick: (row) => openForm("view", row)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_ANALYSIS,
        onClick: (row) => openForm("edit", row)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_ANALYSIS,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_ANALYSIS,
        onClick: (row) => openCopy([row.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_ANALYSIS,
        hidden: (row: LimsAnalysis) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_ANALYSIS,
        hidden: (row: LimsAnalysis) => Boolean(row.isRemoved),
        onClick: (row) =>
          compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [
            label(row)
          ])
      }
    ],
    [compliance, openCopy, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsAnalysis>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsAnalyses")}
        searchPlaceholder={t("search", { entity: t("limsAnalyses") })}
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        titleExtra={
          <Switch
            checked={includeRemoved}
            onChange={setIncludeRemoved}
            label={t("limsShowRemoved")}
          />
        }
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("limsAnalysis") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_ANALYSIS,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoAnalyses") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1100px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsAnalysis, LimsAnalysisPayload>
            ids={copyIds}
            fetchById={fetchLimsAnalysisById}
            FormComponent={LimsAnalysisForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsAnalysis")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsAnalysis>
            ids={viewIds}
            fetchById={fetchLimsAnalysisById}
            FormComponent={LimsAnalysisForm}
            onClose={handleCloseForm}
            entityLabel={t("limsAnalysis")}
          />
        ) : editIds ? (
          <EditStepper<LimsAnalysis, LimsAnalysisPayload>
            ids={editIds}
            fetchById={fetchLimsAnalysisById}
            FormComponent={LimsAnalysisForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsAnalysis")}
          />
        ) : formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsAnalysisForm
            mode={formMode}
            initialData={
              formMode === "create" ? null : (detailQuery.data ?? null)
            }
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={create.isPending || update.isPending}
          />
        )}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsAnalysis")}
        entityLabelPlural={t("limsAnalyses")}
        getRecordLabel={label}
        updating={update.isPending}
        deleting={bulkDelete.isPending}
        restoring={restore.isPending}
        bulkUpdating={bulkUpdate.isPending}
        auditEntries={auditQuery.entries}

        auditLoading={auditQuery.isLoading}

        auditHasNextPage={auditQuery.hasNextPage}

        auditFetchingNextPage={auditQuery.isFetchingNextPage}

        onAuditLoadMore={auditQuery.fetchNextPage}
        onUpdate={confirmUpdate}
        onBulkUpdate={async (reason) => {
          const pending = compliance.pendingBulkUpdate;
          if (pending) {
            await bulkUpdate.mutateAsync({ updates: pending.updates, changeReason: reason });
            table.clearSelection();
          }
          compliance.clearBulkUpdate();
        }}
        onDelete={async (reason) => {
          const pending = compliance.pendingDelete;
          if (pending) {
            await bulkDelete.mutateAsync({
              selection: pending.selection,
              changeReason: reason
            });
            table.clearSelection();
          }
          compliance.clearDelete();
        }}
        onRestore={async (reason) => {
          const pending = compliance.pendingRestore;
          if (pending) {
            await restore.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsAnalysisList;
