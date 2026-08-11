import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import LimsShowRemovedSwitch from "@/components/lims/LimsShowRemovedSwitch";
import { LIMS_SUPPORTS_SEARCH } from "@/utils/lims.backend.shim";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TimeIcon, TrashBinIcon } from "@/public/icons";
import { fetchLimsSupplierList } from "./LimsSupplier.api";
import { getLimsSupplierColumns } from "./LimsSupplier.columns";
import {
  limsSupplierKeys,
  useBulkCloneLimsSupplier,
  useBulkDeleteLimsSupplier,
  useCreateLimsSupplier,
  useLimsSupplierAudit,
  useRestoreLimsSupplier,
  useUpdateLimsSupplier
} from "./LimsSupplier.queries";
import LimsSupplierForm, { type LimsSupplierFormMode } from "./LimsSupplierForm";
import type { LimsSupplier, LimsSupplierPayload } from "./LimsSupplier.types";

/** LIMS Suppliers — Track A module. */
const LimsSupplierList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsSupplier | null>(null);
  const [formMode, setFormMode] = useState<LimsSupplierFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsSupplier, LimsSupplierPayload>();
  const auditQuery = useLimsSupplierAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsSupplierList>[1], signal?: AbortSignal) =>
      fetchLimsSupplierList(includeRemoved, params, signal),
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
  const bulkDelete = useBulkDeleteLimsSupplier();
  const restoreSupplier = useRestoreLimsSupplier();

  const busy =
    createSupplier.isPending ||
    updateSupplier.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restoreSupplier.isPending;

  const columnDefs = useMemo(() => getLimsSupplierColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsSupplierFormMode, supplier: LimsSupplier | null) => {
      setFormMode(mode);
      setActive(supplier);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (payload: LimsSupplierPayload, files: File[]) => {
    if (active) {
      compliance.requestUpdate(active.id, payload, files);
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
    setActive(null);
    setFormMode("create");
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy suppliers" : "Copy supplier"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_SUPPLIER,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Remove suppliers" : "Remove supplier"),
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
    [bulkClone, compliance, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsSupplier>[]>(
    () => [
      {
        key: "view",
        label: "View supplier",
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_SUPPLIER,
        onClick: (supplier) => openForm("view", supplier)
      },
      {
        key: "edit",
        label: "Edit supplier",
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_SUPPLIER,
        onClick: (supplier) => openForm("edit", supplier)
      },
      {
        key: "audit",
        label: "Audit trail",
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_SUPPLIER,
        onClick: (supplier) => compliance.openAudit(supplier)
      },
      {
        key: "clone",
        label: "Copy supplier",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_SUPPLIER,
        onClick: (supplier) => bulkClone.mutate({ mode: "ids", ids: [supplier.id] })
      },
      {
        key: "restore",
        label: "Restore supplier",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_SUPPLIER,
        hidden: (supplier: LimsSupplier) => !supplier.isRemoved,
        onClick: (supplier) => compliance.requestRestore(supplier)
      },
      {
        key: "delete",
        label: "Remove supplier",
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
    [bulkClone, compliance, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsSupplier>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsSuppliers")}
        searchable={LIMS_SUPPORTS_SEARCH}
        searchPlaceholder="Search suppliers…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        titleExtra={
          <LimsShowRemovedSwitch checked={includeRemoved} onChange={setIncludeRemoved} />
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
        className="m-4 max-h-[90vh] max-w-[1000px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <LimsSupplierForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createSupplier.isPending || updateSupplier.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="supplier"
        entityLabelPlural="suppliers"
        getRecordLabel={(row) => row.supplierId || row.supplierName}
        updating={updateSupplier.isPending}
        deleting={bulkDelete.isPending}
        restoring={restoreSupplier.isPending}
        auditEntries={auditQuery.data ?? []}
        auditLoading={auditQuery.isLoading}
        onUpdate={confirmUpdate}
        onDelete={async (reason) => {
          const pending = compliance.pendingDelete;
          if (pending) {
            await bulkDelete.mutateAsync({ selection: pending.selection, changeReason: reason });
            table.clearSelection();
          }
          compliance.clearDelete();
        }}
        onRestore={async (reason) => {
          const pending = compliance.pendingRestore;
          if (pending) {
            await restoreSupplier.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsSupplierList;
