import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import CopyStepper from "@/components/data/CopyStepper";
import ViewStepper from "@/components/data/ViewStepper";
import EditStepper from "@/components/data/EditStepper";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { toast } from "@/lib/toast";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  supplierKeys,
  useBulkCloneSupplier,
  useBulkCopySupplier,
  useBulkDeleteSupplier,
  useBulkRestoreSupplier,
  useBulkUpdateSupplier,
  useCreateSupplier,
  useToggleSupplierStatus,
  useUpdateSupplier
} from "./Supplier.queries";
import { fetchSupplierById, fetchSupplierList } from "./Supplier.api";
import { getSupplierColumns } from "./Supplier.columns";
import SupplierForm, { type SupplierFormMode } from "./SupplierForm";
import type { SupplierFormValues } from "./Supplier.schema";
import type { Supplier } from "./Supplier.types";
import type { BulkSelection } from "@/lib/query/listTypes";

/** Supplier module (GXP) — migrated via MIGRATION.md checklist (validation run). */
const SupplierList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<Supplier | null>(null);
  const [formMode, setFormMode] = useState<SupplierFormMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);
  const [includeDisabled, setIncludeDisabled] = useState(false);
  // Set instead of active/formMode while the Copy/View/Edit review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BulkSelection | null>(null);
  const [restoreNames, setRestoreNames] = useState<string[]>([]);

  // includeDisabled is a supported backend filter param, surfaced as a toggle.
  // It is part of the query key so flipping it refetches (STANDARDS.md §6/§10).
  const table = useServerTable<Supplier>({
    entity: "supplier",
    queryKey: [...supplierKeys.all, { includeDisabled }],
    fetchList: useCallback(
      (params, signal) => fetchSupplierList(includeDisabled, params, signal),
      [includeDisabled]
    )
  });

  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();
  const bulkClone = useBulkCloneSupplier();
  const bulkCopy = useBulkCopySupplier();
  const bulkDelete = useBulkDeleteSupplier();
  const bulkUpdate = useBulkUpdateSupplier();
  const bulkRestore = useBulkRestoreSupplier();
  const toggleStatus = useToggleSupplierStatus();
  const busy =
    createSupplier.isPending ||
    updateSupplier.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    bulkRestore.isPending ||
    toggleStatus.isPending;

  // Stable across renders — the toggle's live pending state goes through
  // gridContext instead, so a status click doesn't give ag-grid a new
  // cellRenderer identity (which would force a destroy/recreate of the cell
  // and kill the Switch's transition — see Supplier.columns.tsx).
  const columnDefs = useMemo(() => getSupplierColumns({ t }), [t]);

  const gridContext = useMemo(
    () => ({
      toggleDisabled: toggleStatus.isPending,
      togglingId: toggleStatus.isPending ? toggleStatus.variables?.id : undefined,
      onToggleStatus: (supplier: Supplier) => {
        if (toggleStatus.isPending) return;
        toggleStatus.mutate(supplier);
      }
    }),
    [toggleStatus]
  );

  const openForm = (mode: SupplierFormMode, supplier: Supplier | null) => {
    setFormMode(mode);
    setActive(supplier);
    openModal();
  };

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
    setActive(null);
    setFormMode("create");
    setCopyIds(null);
    setViewIds(null);
    setEditIds(null);
  };

  const handleSaveCopies = async (payloads: SupplierFormValues[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = async (updates: { id: string; payload: SupplierFormValues }[]) => {
    await bulkUpdate.mutateAsync(updates);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSave = async (values: SupplierFormValues) => {
    if (active) {
      await updateSupplier.mutateAsync({ id: active.id, payload: values });
    } else {
      await createSupplier.mutateAsync(values);
    }
    handleCloseForm();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: (count) => (count > 1 ? "View suppliers" : "View supplier"),
        icon: EyeIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.VIEW_SUPPLIERS,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to view.", "error");
            return;
          }
          openView(selection.ids);
        }
      },
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy suppliers" : "Copy supplier"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.CREATE_SUPPLIERS,
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
        label: (count) => (count > 1 ? "Edit suppliers" : "Edit supplier"),
        icon: PencilIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.UPDATE_SUPPLIERS,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to edit.", "error");
            return;
          }
          openEdit(selection.ids);
        }
      },
      {
        key: "restore",
        label: (count) => (count > 1 ? "Restore suppliers" : "Restore supplier"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.UPDATE_SUPPLIERS,
        hidden: (rows) => !(rows as Supplier[]).some((row) => row.status === "disabled"),
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to restore.", "error");
            return;
          }
          setPendingRestore(selection);
          setRestoreNames(table.getCachedRows(selection.ids).map((r) => r.supplierName));
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete suppliers" : "Delete supplier"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: GXP_PERMISSIONS.DELETE_SUPPLIERS,
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(
            selection.mode === "ids"
              ? table.getCachedRows(selection.ids).map((r) => r.supplierName)
              : []
          );
        }
      }
    ],
    [bulkClone, openCopy, openEdit, openView, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<Supplier>[]>(
    () => [
      {
        key: "view",
        label: "View supplier",
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_SUPPLIERS,
        onClick: (supplier) => openForm("view", supplier)
      },
      {
        key: "edit",
        label: "Edit supplier",
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_SUPPLIERS,
        onClick: (supplier) => openForm("edit", supplier)
      },
      {
        key: "clone",
        label: "Copy supplier",
        icon: CopyIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.CREATE_SUPPLIERS,
        onClick: (supplier) => openCopy([supplier.id])
      },
      {
        key: "restore",
        label: "Restore supplier",
        icon: CopyIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.UPDATE_SUPPLIERS,
        hidden: (supplier) => supplier.status !== "disabled",
        onClick: (supplier) => {
          setPendingRestore({ mode: "ids", ids: [supplier.id] });
          setRestoreNames([supplier.supplierName]);
        }
      },
      {
        key: "delete",
        label: "Delete supplier",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: GXP_PERMISSIONS.DELETE_SUPPLIERS,
        onClick: (supplier) => {
          setPendingDelete({ mode: "ids", ids: [supplier.id] });
          setDeleteCount(1);
          setDeleteNames([supplier.supplierName]);
        }
      }
    ],
    [openCopy, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<Supplier>
        table={table}
        columnDefs={columnDefs}
        gridContext={gridContext}
        tableName={t("gxpSuppliers")}
        searchPlaceholder="Search suppliers…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        titleExtra={
          <Switch
            label={t("includeDisabled")}
            checked={includeDisabled}
            onChange={setIncludeDisabled}
          />
        }
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("supplier") }),
            icon: PlusIcon,
            variant: "primary",
            permission: GXP_PERMISSIONS.CREATE_SUPPLIERS,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: "No suppliers found" }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[900px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<Supplier, SupplierFormValues>
            ids={copyIds}
            fetchById={fetchSupplierById}
            FormComponent={SupplierForm}
            onSaveAll={handleSaveCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending}
            entityLabel={t("supplier")}
          />
        ) : viewIds ? (
          <ViewStepper<Supplier>
            ids={viewIds}
            fetchById={fetchSupplierById}
            FormComponent={SupplierForm}
            onClose={handleCloseForm}
            entityLabel={t("supplier")}
          />
        ) : editIds ? (
          <EditStepper<Supplier, SupplierFormValues>
            ids={editIds}
            fetchById={fetchSupplierById}
            FormComponent={SupplierForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("supplier")}
          />
        ) : (
          <SupplierForm
            mode={formMode}
            initialData={active}
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createSupplier.isPending || updateSupplier.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        loading={bulkDelete.isPending}
        items={deleteNames}
        description={
          deleteCount > 1
            ? `Are you sure you want to delete these ${deleteCount} suppliers?`
            : "Are you sure you want to delete this supplier?"
        }
        onConfirm={async () => {
          if (pendingDelete) {
            await bulkDelete.mutateAsync(pendingDelete);
            table.clearSelection();
          }
          setPendingDelete(null);
        }}
      />

      <ConfirmDialog
        isOpen={pendingRestore !== null}
        onClose={() => setPendingRestore(null)}
        loading={bulkRestore.isPending}
        items={restoreNames}
        description={
          restoreNames.length > 1
            ? `Are you sure you want to restore these ${restoreNames.length} suppliers?`
            : "Are you sure you want to restore this supplier?"
        }
        onConfirm={async () => {
          if (pendingRestore) {
            await bulkRestore.mutateAsync(pendingRestore);
            table.clearSelection();
          }
          setPendingRestore(null);
        }}
      />
    </div>
  );
};

export default SupplierList;
