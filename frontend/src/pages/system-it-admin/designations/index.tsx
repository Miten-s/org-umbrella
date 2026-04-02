import AppDataTable, {
  AppDataTableBulkAction,
  AppDataTableRowAction,
  AppDataTableToolbarAction
} from "@/components/common/table/AppDataTable";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import { toast } from "@/lib/ToastProvider";
import {
  CheckLineIcon,
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon
} from "@/public/icons";
import {
  createDesignation,
  deleteDesignation,
  getDesignations,
  updateDesignation
} from "@/services/admin.service";
import { Designation as DesignationObj } from "@/types/common.types";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateDesignationModal from "./CreateDesignationModal";

type DesignationModalMode = "create" | "edit" | "view";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "D";

const copyDesignationsToClipboard = async (rows: DesignationObj[]) => {
  if (!rows.length) {
    return;
  }

  const content = [
    "Name\tDescription",
    ...rows.map(
      (designation) =>
        `${designation.designationName}\t${designation.description ?? ""}`
    )
  ].join("\n");

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
    } else if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } else {
      throw new Error("Clipboard unavailable");
    }

    toast(
      rows.length > 1
        ? `${rows.length} designations copied to clipboard.`
        : "Designation copied to clipboard.",
      "success"
    );
  } catch (error) {
    console.error("Error copying designations:", error);
    toast("Failed to copy designation details. Please try again.", "error");
  }
};

const Designation = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();

  const [designations, setDesignations] = useState<DesignationObj[]>([]);
  const [activeDesignation, setActiveDesignation] =
    useState<DesignationObj | null>(null);
  const [designationModalMode, setDesignationModalMode] =
    useState<DesignationModalMode>("create");
  const [refresh, setRefresh] = useState(false);
  const [pendingDeleteDesignations, setPendingDeleteDesignations] = useState<
    DesignationObj[]
  >([]);
  const [isTableLoading, setIsTableLoading] = useState(true);
  const [tableError, setTableError] = useState<string | null>(null);

  const handleCloseModal = () => {
    closeModal();
    setActiveDesignation(null);
    setDesignationModalMode("create");
  };

  const fetchDesignations = async () => {
    try {
      setIsTableLoading(true);
      setTableError(null);

      const { designations: fetchedDesignations } = await getDesignations();
      setDesignations(fetchedDesignations ?? []);
    } catch (error) {
      console.error("Error fetching designations:", error);
      setTableError("Failed to load designations. Please try again.");
    } finally {
      setIsTableLoading(false);
    }
  };

  useEffect(() => {
    void fetchDesignations();
  }, [refresh]);

  const handleSave = async (data: Partial<DesignationObj>) => {
    try {
      if (activeDesignation) {
        await updateDesignation(activeDesignation._id, data);
      } else {
        await createDesignation(data);
      }

      handleCloseModal();
      setRefresh((prev) => !prev);
    } catch (error) {
      console.error("Error saving designation:", error);
      toast("Failed to save designation. Please try again.", "error");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteDesignations.length) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        pendingDeleteDesignations.map((designation) =>
          deleteDesignation(designation._id, { silent: true })
        )
      );
      const failedDeletes = results.filter(
        (result) => result.status === "rejected"
      ).length;
      const successfulDeletes = pendingDeleteDesignations.length - failedDeletes;

      if (successfulDeletes > 0 && failedDeletes === 0) {
        toast(
          successfulDeletes > 1
            ? `${successfulDeletes} designations deleted successfully.`
            : "Designation deleted successfully.",
          "success"
        );
      } else if (successfulDeletes > 0) {
        toast(
          `${successfulDeletes} designations deleted, ${failedDeletes} failed.`,
          "error"
        );
      } else {
        toast("Failed to delete selected designations. Please try again.", "error");
      }

      setPendingDeleteDesignations([]);
      setRefresh((prev) => !prev);
    } catch (error) {
      console.error("Error deleting designation:", error);
      toast("Failed to delete selected designations. Please try again.", "error");
    }
  };

  const toolbarActions = useMemo<AppDataTableToolbarAction<DesignationObj>[]>(
    () => [
      {
        key: "create-designation",
        label: t("create", { entity: t("designation") }),
        className: "whitespace-nowrap",
        icon: PlusIcon,
        onClick: () => {
          setActiveDesignation(null);
          setDesignationModalMode("create");
          openModal();
        },
        permission: "CREATE:DESIGNATION",
        variant: "primary"
      }
    ],
    [openModal, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<DesignationObj>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Copy designations" : "Copy designation",
        icon: CopyIcon,
        variant: "outline",
        onClick: (selectedRows) => copyDesignationsToClipboard(selectedRows)
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1
            ? "Delete designations"
            : "Delete designation",
        icon: TrashBinIcon,
        permission: "DELETE:DESIGNATION",
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeleteDesignations(selectedRows)
      }
    ],
    []
  );

  const rowActions = useMemo<AppDataTableRowAction<DesignationObj>[]>(
    () => [
      {
        key: "view",
        label: "View designation",
        tooltip: "View designation",
        icon: EyeIcon,
        placement: "inline",
        permission: "VIEW:DESIGNATION",
        onClick: (designation) => {
          setActiveDesignation(designation);
          setDesignationModalMode("view");
          openModal();
        }
      },
      {
        key: "edit",
        label: "Edit designation",
        tooltip: "Edit designation",
        icon: PencilIcon,
        placement: "inline",
        permission: "UPDATE:DESIGNATION",
        onClick: (designation) => {
          setActiveDesignation(designation);
          setDesignationModalMode("edit");
          openModal();
        }
      },
      {
        key: "copy",
        label: "Copy designation",
        tooltip: "Copy designation",
        icon: CopyIcon,
        placement: "menu",
        onClick: async (designation) => copyDesignationsToClipboard([designation])
      },
      {
        key: "delete",
        label: "Delete designation",
        tooltip: "Delete designation",
        icon: TrashBinIcon,
        placement: "menu",
        permission: "DELETE:DESIGNATION",
        tone: "danger",
        onClick: (designation) => setPendingDeleteDesignations([designation])
      }
    ],
    [openModal]
  );

  const columnDefs = useMemo<ColDef<DesignationObj>[]>(
    () => [
      {
        field: "designationName",
        flex: 1,
        headerName: t("designationName"),
        minWidth: 260,
        cellRenderer: (params: ICellRendererParams<DesignationObj>) => {
          const data = params.data;

          if (!data) {
            return null;
          }

          const initials = getInitials(data.designationName);

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {initials}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {data.designationName}
              </div>
            </div>
          );
        }
      },
      {
        field: "description",
        flex: 1.2,
        headerName: t("description"),
        minWidth: 280,
        cellRenderer: (params: ICellRendererParams<DesignationObj>) => (
          <div className="truncate py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.value || "-"}
          </div>
        )
      }
    ],
    [t]
  );

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
        <AppDataTable<DesignationObj>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No designations found"
          enableSelection
          errorMessage={tableError}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(designation) => designation._id}
          headerHeight={46}
          loading={isTableLoading}
          maxInlineRowActions={2}
          pageSize={20}
          pageSizeOptions={[20, 50, 100]}
          rowActions={rowActions}
          rowData={designations}
          rowHeight={64}
          searchAccessor={(designation) =>
            [
              designation.designationName,
              designation.description,
              designation.createdBy?.name
            ]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search designations..."
          tableName={t("designations")}
          toolbarActions={toolbarActions}
          totalLabel={`${designations.length} total`}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="m-4 max-h-[90vh] max-w-[900px] overflow-y-auto dark:bg-gray-900"
      >
        <CreateDesignationModal
          onClose={handleCloseModal}
          onSubmit={handleSave}
          initialData={activeDesignation || undefined}
          mode={designationModalMode}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteDesignations.length > 0}
        onClose={() => setPendingDeleteDesignations([])}
        className="m-4 min-h-[150px] max-w-[600px] dark:bg-gray-900"
        showCloseButton={false}
      >
        <div className="flex h-full flex-col justify-between p-5 dark:text-white">
          <div className="py-2">
            {pendingDeleteDesignations.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteDesignations.length} designations?`
              : `${t("deleteEntityPrompt", {
                  entityName: pendingDeleteDesignations[0]?.designationName
                })} ?`}
          </div>

          {pendingDeleteDesignations.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteDesignations.slice(0, 5).map((designation) => (
                <div
                  key={designation._id}
                  className="truncate py-0.5"
                >
                  {designation.designationName}
                </div>
              ))}
              {pendingDeleteDesignations.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeleteDesignations.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeleteDesignations([])}
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

export default Designation;
