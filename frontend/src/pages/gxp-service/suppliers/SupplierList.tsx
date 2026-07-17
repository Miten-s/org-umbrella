import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  supplierKeys,
  useBulkCloneSupplier,
  useBulkDeleteSupplier,
  useCreateSupplier,
  useToggleSupplierStatus,
  useUpdateSupplier
} from "./Supplier.queries";
import { fetchSupplierList } from "./Supplier.api";
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
  const bulkDelete = useBulkDeleteSupplier();
  const toggleStatus = useToggleSupplierStatus();
  const busy =
    createSupplier.isPending ||
    updateSupplier.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    toggleStatus.isPending;

  const columnDefs = useMemo(
    () =>
      getSupplierColumns({
        t,
        toggleDisabled: toggleStatus.isPending,
        togglingId: toggleStatus.isPending ? toggleStatus.variables?.id : undefined,
        onToggleStatus: (supplier) => {
          if (toggleStatus.isPending) return;
          toggleStatus.mutate(supplier);
        }
      }),
    [t, toggleStatus]
  );

  const openForm = (mode: SupplierFormMode, supplier: Supplier | null) => {
    setFormMode(mode);
    setActive(supplier);
    openModal();
  };

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
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
        key: "clone",
        label: (count) => (count > 1 ? "Copy suppliers" : "Copy supplier"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.CREATE_SUPPLIERS,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
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
              ? table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.supplierName)
              : []
          );
        }
      }
    ],
    [bulkClone, table]
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
        onClick: (supplier) => bulkClone.mutate({ mode: "ids", ids: [supplier.id] })
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
    [bulkClone]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<Supplier>
        table={table}
        columnDefs={columnDefs}
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
        className="m-4 max-h-[90vh] max-w-[900px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <SupplierForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createSupplier.isPending || updateSupplier.isPending}
        />
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
    </div>
  );
};

export default SupplierList;
