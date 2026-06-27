import AppDataTable, {
  AppDataTableBulkAction,
  AppDataTableRowAction,
  AppDataTableToolbarAction
} from "@/components/common/table/AppDataTable";
import Switch from "@/components/common/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useGlobalContext } from "@/context";
import { useModal } from "@/hooks/useModal";
import { useServerPagination } from "@/hooks/useServerPagination";
import { toast } from "@/lib/toast";
import {
  CheckLineIcon,
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon
} from "@/public/icons";
import {
  bulkDeleteSuppliers,
  bulkDuplicateSuppliers,
  createSupplier,
  disableSupplier,
  enableSupplier,
  getSuppliers,
  updateSupplier
} from "@/services/gxp.service";
import { Supplier } from "@/types/common.types";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateSupplierModal from "./CreateSupplierModal";

type SupplierModalMode = "create" | "edit" | "view";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "S";

const Suppliers = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const [includeDisabled, setIncludeDisabled] = useState(false);
  const paginatedSuppliers = useServerPagination<Supplier>({
    dataKeys: ["suppliers", "data"],
    dependencies: [includeDisabled, reFetch],
    errorMessage: "Failed to load suppliers. Please try again.",
    fetchPage: (params) => getSuppliers(includeDisabled, params)
  });
  const suppliers = paginatedSuppliers.rows;
  const setSuppliers = paginatedSuppliers.setRows;
  const [activeSupplier, setActiveSupplier] = useState<Supplier | null>(null);
  const [supplierModalMode, setSupplierModalMode] =
    useState<SupplierModalMode>("create");
  const [pendingDeleteSuppliers, setPendingDeleteSuppliers] = useState<
    Supplier[]
  >([]);

  const handleCloseModal = () => {
    closeModal();
    setActiveSupplier(null);
    setSupplierModalMode("create");
  };

  const handleSave = async (data: Partial<Supplier>) => {
    try {
      if (activeSupplier) {
        await updateSupplier(activeSupplier._id, data);
      } else {
        await createSupplier(data);
      }
      handleCloseModal();
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast("Failed to save supplier. Please try again.", "error");
    }
  };

  const handleDuplicateSuppliers = useCallback(
    async (rows: Supplier[]) => {
      if (!rows.length) {
        return;
      }

      try {
        await bulkDuplicateSuppliers(
          rows.map((supplier) => supplier._id),
          { silent: true }
        );
        toast(
          rows.length > 1
            ? `${rows.length} suppliers copied successfully.`
            : "Supplier copied successfully.",
          "success"
        );
        setReFetch(!reFetch);
      } catch (error) {
        console.error("Error copying suppliers:", error);
        toast("Failed to copy selected suppliers. Please try again.", "error");
      }
    },
    [reFetch, setReFetch]
  );

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteSuppliers.length) {
      return;
    }

    try {
      await bulkDeleteSuppliers(
        pendingDeleteSuppliers.map((supplier) => supplier._id),
        { silent: true }
      );
      toast(
        pendingDeleteSuppliers.length > 1
          ? `${pendingDeleteSuppliers.length} suppliers deleted successfully.`
          : "Supplier deleted successfully.",
        "success"
      );

      setPendingDeleteSuppliers([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast("Failed to delete selected suppliers. Please try again.", "error");
    }
  };

  const handleStatusChange = useCallback(
    async (supplier: Supplier) => {
      const nextStatus = supplier.status === "enabled" ? "disabled" : "enabled";

      setSuppliers((prev) =>
        prev.map((item) =>
          item._id === supplier._id ? { ...item, status: nextStatus } : item
        )
      );

      try {
        if (nextStatus === "enabled") {
          await enableSupplier(supplier._id);
        } else {
          await disableSupplier(supplier._id);
        }
      } catch (error) {
        console.error("Error updating supplier status:", error);
        setSuppliers((prev) =>
          prev.map((item) =>
            item._id === supplier._id
              ? { ...item, status: supplier.status }
              : item
          )
        );
      }
    },
    [setSuppliers]
  );

  const titleExtra = useMemo<ReactNode>(
    () => (
      <Switch
        label={t("includeDisabled")}
        checked={includeDisabled}
        onChange={() => setIncludeDisabled((prev) => !prev)}
      />
    ),
    [includeDisabled, t]
  );

  const toolbarActions = useMemo<AppDataTableToolbarAction<Supplier>[]>(
    () => [
      {
        key: "create-supplier",
        label: t("create", { entity: t("supplier") }),
        className: "whitespace-nowrap",
        icon: PlusIcon,
        onClick: () => {
          setActiveSupplier(null);
          setSupplierModalMode("create");
          openModal();
        },
        permission: GXP_PERMISSIONS.CREATE_SUPPLIERS,
        variant: "primary"
      }
    ],
    [openModal, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<Supplier>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Copy suppliers" : "Copy supplier",
        icon: CopyIcon,
        variant: "outline",
        onClick: handleDuplicateSuppliers
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Delete suppliers" : "Delete supplier",
        icon: TrashBinIcon,
        permission: GXP_PERMISSIONS.DELETE_SUPPLIERS,
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeleteSuppliers(selectedRows)
      }
    ],
    [handleDuplicateSuppliers]
  );

  const rowActions = useMemo<AppDataTableRowAction<Supplier>[]>(
    () => [
      {
        key: "view",
        label: "View supplier",
        tooltip: "View supplier",
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_SUPPLIERS,
        onClick: (supplier) => {
          setActiveSupplier(supplier);
          setSupplierModalMode("view");
          openModal();
        }
      },
      {
        key: "edit",
        label: "Edit supplier",
        tooltip: "Edit supplier",
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_SUPPLIERS,
        onClick: (supplier) => {
          setActiveSupplier(supplier);
          setSupplierModalMode("edit");
          openModal();
        }
      },
      {
        key: "copy",
        label: "Copy supplier",
        tooltip: "Copy supplier",
        icon: CopyIcon,
        placement: "menu",
        onClick: async (supplier) => handleDuplicateSuppliers([supplier])
      },
      {
        key: "delete",
        label: "Delete supplier",
        tooltip: "Delete supplier",
        icon: TrashBinIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.DELETE_SUPPLIERS,
        tone: "danger",
        onClick: (supplier) => setPendingDeleteSuppliers([supplier])
      }
    ],
    [handleDuplicateSuppliers, openModal]
  );

  const columnDefs = useMemo<ColDef<Supplier>[]>(
    () => [
      {
        field: "supplierName",
        flex: 1,
        headerName: t("supplierName"),
        minWidth: 260,
        cellRenderer: (params: ICellRendererParams<Supplier>) => {
          const data = params.data;
          if (!data) return null;

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {getInitials(data.supplierName)}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {data.supplierName}
              </div>
            </div>
          );
        }
      },
      {
        field: "product",
        flex: 1,
        headerName: t("product"),
        minWidth: 220,
        cellRenderer: (params: ICellRendererParams<Supplier>) => (
          <div className="truncate py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.value || "-"}
          </div>
        )
      },
      {
        field: "status",
        flex: 0,
        headerName: t("status"),
        minWidth: 170,
        maxWidth: 190,
        cellRenderer: (params: ICellRendererParams<Supplier>) => {
          const data = params.data;
          if (!data) return null;

          return (
            <div className="py-1.5">
              <Switch
                label={data.status === "enabled" ? t("enabled") : t("disabled")}
                checked={data.status === "enabled"}
                onChange={() => handleStatusChange(data)}
              />
            </div>
          );
        }
      }
    ],
    [handleStatusChange, t]
  );

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
        <AppDataTable<Supplier>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No suppliers found"
          enableSelection
          errorMessage={paginatedSuppliers.error}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(supplier) => supplier._id}
          headerHeight={46}
          loading={paginatedSuppliers.isLoading}
          maxInlineRowActions={2}
          rowActions={rowActions}
          rowData={suppliers}
          rowHeight={64}
          searchAccessor={(supplier) =>
            [
              supplier.supplierName,
              supplier.product,
              supplier.typeOfSupplier,
              supplier.description,
              supplier.status
            ]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search suppliers..."
          tableName={t("gxpSuppliers")}
          titleExtra={titleExtra}
          {...paginatedSuppliers.tablePaginationProps}
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[900px] max-h-[100rem]  m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateSupplierModal
          onClose={handleCloseModal}
          onSubmit={handleSave}
          initialData={activeSupplier || undefined}
          mode={supplierModalMode}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteSuppliers.length > 0}
        onClose={() => setPendingDeleteSuppliers([])}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {pendingDeleteSuppliers.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteSuppliers.length} suppliers?`
              : `${t("deleteEntityPrompt", {
                  entityName: pendingDeleteSuppliers[0]?.supplierName
                })}`}
          </div>

          {pendingDeleteSuppliers.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteSuppliers.slice(0, 5).map((supplier) => (
                <div key={supplier._id} className="truncate py-0.5">
                  {supplier.supplierName}
                </div>
              ))}
              {pendingDeleteSuppliers.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeleteSuppliers.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeleteSuppliers([])}
              className="flex items-center px-4 py-2 text-white"
            >
              {t("cancel")}
            </Button>
            <Button
              startIcon={<CheckLineIcon className="h-4 w-4" />}
              onClick={() => void handleDeleteConfirmed()}
              className="flex items-center px-4 py-2"
            >
              {t("confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default Suppliers;
