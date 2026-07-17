import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  departmentKeys,
  useBulkCloneDepartment,
  useBulkDeleteDepartment,
  useCreateDepartment,
  useUpdateDepartment
} from "./Department.queries";
import { fetchDepartmentList } from "./Department.api";
import { getDepartmentColumns } from "./Department.columns";
import DepartmentForm, { type DepartmentFormMode } from "./DepartmentForm";
import type { DepartmentFormValues } from "./Department.schema";
import type { Department } from "./Department.types";
import type { BulkSelection } from "@/lib/query/listTypes";

/** Department module — migrated via MIGRATION.md checklist (validation run). */
const DepartmentList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<Department | null>(null);
  const [formMode, setFormMode] = useState<DepartmentFormMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);

  const table = useServerTable<Department>({
    entity: "department",
    queryKey: departmentKeys.all,
    fetchList: fetchDepartmentList
  });

  const createDepartment = useCreateDepartment();
  const updateDepartment = useUpdateDepartment();
  const bulkClone = useBulkCloneDepartment();
  const bulkDelete = useBulkDeleteDepartment();
  const busy =
    createDepartment.isPending ||
    updateDepartment.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending;

  const columnDefs = useMemo(() => getDepartmentColumns({ t }), [t]);

  const openForm = (mode: DepartmentFormMode, department: Department | null) => {
    setFormMode(mode);
    setActive(department);
    openModal();
  };

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (values: DepartmentFormValues) => {
    if (active) {
      await updateDepartment.mutateAsync({ id: active.id, payload: values });
    } else {
      await createDepartment.mutateAsync(values);
    }
    handleCloseForm();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy departments" : "Copy department"),
        icon: CopyIcon,
        variant: "outline",
        permission: "CREATE:DEPARTMENT",
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete departments" : "Delete department"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: "DELETE:DEPARTMENT",
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(
            selection.mode === "ids"
              ? table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.departmentName)
              : []
          );
        }
      }
    ],
    [bulkClone, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<Department>[]>(
    () => [
      {
        key: "view",
        label: "View department",
        icon: EyeIcon,
        placement: "inline",
        permission: "VIEW:DEPARTMENT",
        onClick: (department) => openForm("view", department)
      },
      {
        key: "edit",
        label: "Edit department",
        icon: PencilIcon,
        placement: "inline",
        permission: "UPDATE:DEPARTMENT",
        onClick: (department) => openForm("edit", department)
      },
      {
        key: "clone",
        label: "Copy department",
        icon: CopyIcon,
        placement: "menu",
        permission: "CREATE:DEPARTMENT",
        onClick: (department) => bulkClone.mutate({ mode: "ids", ids: [department.id] })
      },
      {
        key: "delete",
        label: "Delete department",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: "DELETE:DEPARTMENT",
        onClick: (department) => {
          setPendingDelete({ mode: "ids", ids: [department.id] });
          setDeleteCount(1);
          setDeleteNames([department.departmentName]);
        }
      }
    ],
    [bulkClone]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<Department>
        table={table}
        columnDefs={columnDefs}
        tableName={t("departments")}
        searchPlaceholder="Search departments…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("department") }),
            icon: PlusIcon,
            variant: "primary",
            permission: "CREATE:DEPARTMENT",
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: "No departments found" }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-h-[90vh] max-w-[900px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <DepartmentForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createDepartment.isPending || updateDepartment.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        loading={bulkDelete.isPending}
        items={deleteNames}
        description={
          deleteCount > 1
            ? `Are you sure you want to delete these ${deleteCount} departments?`
            : "Are you sure you want to delete this department?"
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

export default DepartmentList;
