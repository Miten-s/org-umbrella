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
import { fetchLimsSupplierById, fetchLimsSupplierList } from "./LimsSupplier.api";
import { getLimsSupplierColumns } from "./LimsSupplier.columns";
import {
  limsSupplierKeys,
  useBulkCloneLimsSupplier,
  useBulkCopyLimsSupplier,
  useBulkDeleteLimsSupplier,
  useBulkUpdateLimsSupplier,
  useCreateLimsSupplier,
  useLimsSupplierAudit,
  useRestoreLimsSupplier,
  useBulkRestoreLimsSupplier,
  useUpdateLimsSupplier,
  useLimsSupplierById
} from "./LimsSupplier.queries";
import LimsSupplierForm, {
  type LimsSupplierFormMode
} from "./LimsSupplierForm";
import type { LimsSupplier, LimsSupplierPayload } from "./LimsSupplier.types";

/** LIMS Suppliers — Track A module. */
const LimsSupplierList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Full record (incl. attachments) is fetched fresh from this id, not the list row.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsSupplierFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<LimsSupplier, LimsSupplierPayload>();
  const auditQuery = useLimsSupplierAudit(compliance.auditRow?.id);
  const detailQuery = useLimsSupplierById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsSupplierList>[1],
      signal?: AbortSignal
    ) => fetchLimsSupplierList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsSupplier>({
    entity: "limsSupplier",
    queryKey: [...limsSupplierKeys.all, { includeRemoved }],
    fetchList
  });

  const createSupplier = useCreateLimsSupplier();
  const updateSupplier = useUpdateLimsSupplier();
  const bulkClone = useBulkCloneLimsSupplier();
  const bulkCopy = useBulkCopyLimsSupplier();
  const bulkDelete = useBulkDeleteLimsSupplier();
  const bulkUpdate = useBulkUpdateLimsSupplier();
  const restoreSupplier = useRestoreLimsSupplier();
  const bulkRestoreSupplier = useBulkRestoreLimsSupplier();

  const busy =
    createSupplier.isPending ||
    updateSupplier.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restoreSupplier.isPending ||
    bulkRestoreSupplier.isPending;

  const columnDefs = useMemo(() => getLimsSupplierColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsSupplierFormMode, supplier: LimsSupplier | null) => {
      setFormMode(mode);
      setActiveId(supplier?.id ?? null);
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

  const handleSaveCopies = async (payloads: LimsSupplierPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (updates: { id: string; payload: LimsSupplierPayload }[]) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const handleSave = async (payload: LimsSupplierPayload, files: File[]) => {
    if (activeId) {
      compliance.requestUpdate(activeId, payload, files);
      closeModal();
      return;
    }
    await createSupplier.mutateAsync({ payload, files });
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await updateSupplier.mutateAsync({
      id: pending.id,
      payload: { ...pending.payload, changeReason: reason },
      files: pending.files
    });
    compliance.clearUpdate();
    setActiveId(null);
    setFormMode("create");
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("limsView"),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_SUPPLIER,
        onClick: (selection) => {
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
        permission: LIMS_PERMISSIONS.CREATE_SUPPLIER,
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
        permission: LIMS_PERMISSIONS.UPDATE_SUPPLIER,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast(t("editBulkFilterUnsupported"), "error");
            return;
          }
          openEdit(selection.ids);
        }
      },
      {
        key: "restore",
        label: () => t("limsRestore"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.UPDATE_SUPPLIER,
        // Only offered when the current selection actually has something removed —
        // an all-active selection would otherwise fire a no-op restore request.
        hidden: (rows) => !rows.some((row) => row.isRemoved),
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast(t("editBulkFilterUnsupported"), "error");
            return;
          }
          compliance.requestBulkRestore(
            selection.ids,
            table.rows
              .filter((row) => selection.ids.includes(row.id))
              .map((row) => row.supplierName)
          );
        }
      },
      {
        key: "delete",
        label: () => t("limsRemove"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_SUPPLIER,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows
                  .filter((row) => selection.ids.includes(row.id))
                  .map((row) => row.supplierName)
              : []
          )
      }
    ],
    [bulkClone, compliance, openCopy, openEdit, openView, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsSupplier>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_SUPPLIER,
        onClick: (supplier) => openForm("view", supplier)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_SUPPLIER,
        onClick: (supplier) => openForm("edit", supplier)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_SUPPLIER,
        onClick: (supplier) => compliance.openAudit(supplier)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_SUPPLIER,
        onClick: (supplier) =>
          openCopy([supplier.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_SUPPLIER,
        hidden: (supplier: LimsSupplier) => !supplier.isRemoved,
        onClick: (supplier) => compliance.requestRestore(supplier)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_SUPPLIER,
        hidden: (supplier: LimsSupplier) => Boolean(supplier.isRemoved),
        onClick: (supplier) =>
          compliance.requestDelete({ mode: "ids", ids: [supplier.id] }, 1, [
            supplier.supplierName
          ])
      }
    ],
    [compliance, openCopy, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsSupplier>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsSuppliers")}
        searchPlaceholder="Search suppliers…"
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
            label: t("create", { entity: t("limsSupplier") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_SUPPLIER,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoSuppliers") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1000px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsSupplier, LimsSupplierPayload>
            ids={copyIds}
            fetchById={fetchLimsSupplierById}
            FormComponent={LimsSupplierForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsSupplier")}
          />
        ) : viewIds ? (
          <ViewStepper<LimsSupplier>
            ids={viewIds}
            fetchById={fetchLimsSupplierById}
            FormComponent={LimsSupplierForm}
            onClose={handleCloseForm}
            entityLabel={t("limsSupplier")}
          />
        ) : editIds ? (
          <EditStepper<LimsSupplier, LimsSupplierPayload>
            ids={editIds}
            fetchById={fetchLimsSupplierById}
            FormComponent={LimsSupplierForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsSupplier")}
          />
        ) : formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsSupplierForm
            mode={formMode}
            initialData={
              formMode === "create" ? null : (detailQuery.data ?? null)
            }
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createSupplier.isPending || updateSupplier.isPending}
          />
        )}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="supplier"
        entityLabelPlural="suppliers"
        getRecordLabel={(row) => row.supplierId || row.supplierName}
        updating={updateSupplier.isPending}
        deleting={bulkDelete.isPending}
        restoring={restoreSupplier.isPending}
        bulkRestoring={bulkRestoreSupplier.isPending}
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
            await restoreSupplier.mutateAsync({
              id: pending.id,
              changeReason: reason
            });
          }
          compliance.clearRestore();
        }}
        onBulkRestore={async (reason) => {
          const pending = compliance.pendingBulkRestore;
          if (pending) {
            await bulkRestoreSupplier.mutateAsync({
              selection: { mode: "ids", ids: pending.ids },
              changeReason: reason
            });
            table.clearSelection();
          }
          compliance.clearBulkRestore();
        }}
      />
    </div>
  );
};

export default LimsSupplierList;
