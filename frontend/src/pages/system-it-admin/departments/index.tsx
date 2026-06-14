import AppDataTable, {
  AppDataTableBulkAction,
  AppDataTableRowAction,
  AppDataTableToolbarAction
} from "@/components/common/table/AppDataTable";
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
  bulkDeleteDepartments,
  bulkDuplicateDepartments,
  createDepartment,
  getDepartments,
  getLocations,
  getUsers,
  updateDepartment
} from "@/services/admin.service";
import { Department, Location } from "@/types/common.types";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateDepartmentModal from "./CreateDepartmentModal";

interface ManagerOption {
  _id: string;
  fullName?: string;
  name?: string;
}

interface DepartmentReference {
  _id?: string;
  fullName?: string;
  locationName?: string;
  name?: string;
}

interface DepartmentRecord extends Department {
  departmentGroupLocation?: DepartmentReference | string;
  departmentManager?: DepartmentReference | string;
}

type DepartmentModalMode = "create" | "edit" | "view";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "D";

const Departments = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const [locations, setLocations] = useState<Location[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [activeDepartment, setActiveDepartment] =
    useState<DepartmentRecord | null>(null);
  const [departmentModalMode, setDepartmentModalMode] =
    useState<DepartmentModalMode>("create");
  const [pendingDeleteDepartments, setPendingDeleteDepartments] = useState<
    DepartmentRecord[]
  >([]);
  const paginatedDepartments = useServerPagination<DepartmentRecord>({
    dataKeys: ["departments"],
    dependencies: [reFetch],
    errorMessage: "Failed to load departments. Please try again.",
    fetchPage: getDepartments
  });
  const departments = paginatedDepartments.rows;

  const handleCloseModal = () => {
    closeModal();
    setActiveDepartment(null);
    setDepartmentModalMode("create");
  };

  const getManagerDisplayName = (department: DepartmentRecord) => {
    const manager =
      department.departmentManager ?? department.departmentManagerId;

    if (typeof manager === "object" && manager !== null) {
      return manager.fullName || manager.name || "";
    }

    const managerId = typeof manager === "string" ? manager : "";
    const matchedManager = managers.find((item) => item._id === managerId);

    return matchedManager?.fullName || matchedManager?.name || "";
  };

  const getLocationDisplayName = (department: DepartmentRecord) => {
    const location =
      department.departmentGroupLocation ?? department.locationId;

    if (typeof location === "object" && location !== null) {
      return location.locationName || location.name || "";
    }

    const locationId = typeof location === "string" ? location : "";
    return (
      locations.find((item) => item._id === locationId)?.locationName || ""
    );
  };

  const fetchReferences = useCallback(async () => {
    try {
      const [{ locations: fetchedLocations }, { users: fetchedUsers }] =
        await Promise.all([
          getLocations({ limit: 100 }),
          getUsers({ limit: 100 })
        ]);

      setLocations(fetchedLocations ?? []);
      setManagers(fetchedUsers ?? []);
    } catch (error) {
      console.error("Error fetching department references:", error);
    }
  }, []);

  useEffect(() => {
    void fetchReferences();
  }, [fetchReferences, reFetch]);

  const handleSave = async (data: Partial<DepartmentRecord>) => {
    try {
      if (activeDepartment) {
        await updateDepartment(activeDepartment._id, data);
      } else {
        await createDepartment(data);
      }

      handleCloseModal();
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error saving department:", error);
      toast("Failed to save department. Please try again.", "error");
    }
  };

  const handleDuplicateDepartments = useCallback(
    async (rows: DepartmentRecord[]) => {
      if (!rows.length) {
        return;
      }

      try {
        await bulkDuplicateDepartments(
          rows.map((department) => department._id),
          { silent: true }
        );
        toast(
          rows.length > 1
            ? `${rows.length} departments copied successfully.`
            : "Department copied successfully.",
          "success"
        );
        setReFetch(!reFetch);
      } catch (error) {
        console.error("Error copying departments:", error);
        toast(
          "Failed to copy selected departments. Please try again.",
          "error"
        );
      }
    },
    [reFetch, setReFetch]
  );

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteDepartments.length) {
      return;
    }

    try {
      await bulkDeleteDepartments(
        pendingDeleteDepartments.map((department) => department._id),
        { silent: true }
      );
      toast(
        pendingDeleteDepartments.length > 1
          ? `${pendingDeleteDepartments.length} departments deleted successfully.`
          : "Department deleted successfully.",
        "success"
      );

      setPendingDeleteDepartments([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting department:", error);
      toast(
        "Failed to delete selected departments. Please try again.",
        "error"
      );
    }
  };

  const toolbarActions = useMemo<AppDataTableToolbarAction<DepartmentRecord>[]>(
    () => [
      {
        key: "create-department",
        label: t("create", { entity: t("department") }),
        className: "whitespace-nowrap",
        icon: PlusIcon,
        onClick: () => {
          setActiveDepartment(null);
          setDepartmentModalMode("create");
          openModal();
        },
        permission: "CREATE:DEPARTMENT",
        variant: "primary"
      }
    ],
    [openModal, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<DepartmentRecord>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Copy departments" : "Copy department",
        icon: CopyIcon,
        permission: "CREATE:DEPARTMENT",
        variant: "outline",
        onClick: handleDuplicateDepartments
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1 ? "Delete departments" : "Delete department",
        icon: TrashBinIcon,
        permission: "DELETE:DEPARTMENT",
        variant: "destructive",
        onClick: (selectedRows) => setPendingDeleteDepartments(selectedRows)
      }
    ],
    [handleDuplicateDepartments]
  );

  const rowActions = useMemo<AppDataTableRowAction<DepartmentRecord>[]>(
    () => [
      {
        key: "view",
        label: "View department",
        tooltip: "View department",
        icon: EyeIcon,
        placement: "inline",
        permission: "VIEW:DEPARTMENT",
        onClick: (department) => {
          setActiveDepartment(department);
          setDepartmentModalMode("view");
          openModal();
        }
      },
      {
        key: "edit",
        label: "Edit department",
        tooltip: "Edit department",
        icon: PencilIcon,
        placement: "inline",
        permission: "UPDATE:DEPARTMENT",
        onClick: (department) => {
          setActiveDepartment(department);
          setDepartmentModalMode("edit");
          openModal();
        }
      },
      {
        key: "copy",
        label: "Copy department",
        tooltip: "Copy department",
        icon: CopyIcon,
        placement: "menu",
        permission: "CREATE:DEPARTMENT",
        onClick: (department) => handleDuplicateDepartments([department])
      },
      {
        key: "delete",
        label: "Delete department",
        tooltip: "Delete department",
        icon: TrashBinIcon,
        placement: "menu",
        permission: "DELETE:DEPARTMENT",
        tone: "danger",
        onClick: (department) => setPendingDeleteDepartments([department])
      }
    ],
    [handleDuplicateDepartments, openModal]
  );

  const columnDefs = useMemo<ColDef<DepartmentRecord>[]>(
    () => [
      {
        field: "departmentName",
        flex: 1,
        headerName: t("departmentName"),
        minWidth: 260,
        cellRenderer: (params: ICellRendererParams<DepartmentRecord>) => {
          const data = params.data;

          if (!data) {
            return null;
          }

          const initials = getInitials(data.departmentName);

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {initials}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {data.departmentName}
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
        cellRenderer: (params: ICellRendererParams<DepartmentRecord>) => (
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
        <AppDataTable<DepartmentRecord>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No departments found"
          enableSelection
          errorMessage={paginatedDepartments.error}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(department) => department._id}
          headerHeight={46}
          loading={paginatedDepartments.isLoading}
          maxInlineRowActions={2}
          rowActions={rowActions}
          rowData={departments}
          rowHeight={64}
          searchAccessor={(department) =>
            [
              department.departmentName,
              department.description,
              getManagerDisplayName(department),
              getLocationDisplayName(department)
            ]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search departments..."
          tableName={t("departments")}
          {...paginatedDepartments.tablePaginationProps}
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="m-4 max-h-[100rem] max-w-[900px] overflow-y-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
      >
        <CreateDepartmentModal
          initialData={activeDepartment || undefined}
          locations={locations}
          managers={managers}
          mode={departmentModalMode}
          onClose={handleCloseModal}
          onSubmit={handleSave}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteDepartments.length > 0}
        onClose={() => setPendingDeleteDepartments([])}
        className="m-4 min-h-[150px] max-w-[500px] bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="flex h-full flex-col justify-between p-5">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {pendingDeleteDepartments.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteDepartments.length} departments?`
              : `${t("deleteEntityPrompt", {
                  entityName: pendingDeleteDepartments[0]?.departmentName
                })} ?`}
          </div>

          {pendingDeleteDepartments.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteDepartments.slice(0, 5).map((department) => (
                <div key={department._id} className="truncate py-0.5">
                  {department.departmentName}
                </div>
              ))}
              {pendingDeleteDepartments.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeleteDepartments.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeleteDepartments([])}
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

export default Departments;
