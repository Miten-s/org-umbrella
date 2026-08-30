import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, {
  type DataTableBulkAction
} from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import CopyStepper from "@/components/data/CopyStepper";
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
import { fetchLimsAliquotById, fetchLimsAliquotList } from "./LimsAliquot.api";
import { getLimsAliquotColumns } from "./LimsAliquot.columns";
import {
  limsAliquotKeys,
  useBulkCloneLimsAliquot,
  useBulkCopyLimsAliquot,
  useBulkDeleteLimsAliquot,
  useBulkUpdateLimsAliquot,
  useCreateLimsAliquot,
  useLimsAliquotAudit,
  useRestoreLimsAliquot,
  useUpdateLimsAliquot,
  useLimsAliquotById
} from "./LimsAliquot.queries";
import LimsAliquotForm, { type LimsAliquotFormMode } from "./LimsAliquotForm";
import type { LimsAliquot, LimsAliquotPayload } from "./LimsAliquot.types";

/** LimsAliquot list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsAliquotList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Only the id of the row being edited/viewed — the list row itself is
  // never passed into the form; the full record (including attachments)
  // is fetched fresh the moment the modal actually needs it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsAliquotFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<LimsAliquot, LimsAliquotPayload>();
  const auditQuery = useLimsAliquotAudit(compliance.auditRow?.id);
  const detailQuery = useLimsAliquotById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsAliquotList>[1],
      signal?: AbortSignal
    ) => fetchLimsAliquotList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsAliquot>({
    entity: "limsAliquot",
    queryKey: [...limsAliquotKeys.all, { includeRemoved }],
    fetchList
  });

  const create = useCreateLimsAliquot();
  const update = useUpdateLimsAliquot();
  const bulkClone = useBulkCloneLimsAliquot();
  const bulkCopy = useBulkCopyLimsAliquot();
  const bulkDelete = useBulkDeleteLimsAliquot();
  const bulkUpdate = useBulkUpdateLimsAliquot();
  const restore = useRestoreLimsAliquot();

  const busy =
    create.isPending ||
    update.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restore.isPending;

  const columnDefs = useMemo(() => getLimsAliquotColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsAliquotFormMode, row: LimsAliquot | null) => {
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
    setEditIds(null);
  };

  const handleSaveCopies = async (payloads: LimsAliquotPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (updates: { id: string; payload: LimsAliquotPayload }[]) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const handleSave = async (payload: LimsAliquotPayload) => {
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

  const label = (row: LimsAliquot) =>
    String(row.aliquotSetId ?? row.aliquotSetId ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: () => t("limsCopy"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_ALIQUOT,
        onClick: async (selection) => {
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
        permission: LIMS_PERMISSIONS.UPDATE_ALIQUOT,
        onClick: (selection) => {
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
        permission: LIMS_PERMISSIONS.DELETE_ALIQUOT,
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
    [bulkClone, compliance, openCopy, openEdit, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsAliquot>[]>(
    () => [
      {
        key: "view",
        label: t("view", { entity: t("limsAliquot") }),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_ALIQUOT,
        onClick: (row) => openForm("view", row)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_ALIQUOT,
        onClick: (row) => openForm("edit", row)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_ALIQUOT,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_ALIQUOT,
        onClick: (row) => openCopy([row.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_ALIQUOT,
        hidden: (row: LimsAliquot) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_ALIQUOT,
        hidden: (row: LimsAliquot) => Boolean(row.isRemoved),
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
      <DataTable<LimsAliquot>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsAliquots")}
        searchPlaceholder={t("search", { entity: t("limsAliquots") })}
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
            label: t("create", { entity: t("limsAliquot") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_ALIQUOT,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoAliquots") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1100px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsAliquot, LimsAliquotPayload>
            ids={copyIds}
            fetchById={fetchLimsAliquotById}
            FormComponent={LimsAliquotForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsAliquot")}
          />
        ) : editIds ? (
          <EditStepper<LimsAliquot, LimsAliquotPayload>
            ids={editIds}
            fetchById={fetchLimsAliquotById}
            FormComponent={LimsAliquotForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsAliquot")}
          />
        ) : formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsAliquotForm
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
        entityLabel={t("limsAliquot")}
        entityLabelPlural={t("limsAliquots")}
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

export default LimsAliquotList;
