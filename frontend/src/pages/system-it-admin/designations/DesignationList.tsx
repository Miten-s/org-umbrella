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
  designationKeys,
  useBulkCloneDesignation,
  useBulkDeleteDesignation,
  useCreateDesignation,
  useUpdateDesignation
} from "./Designation.queries";
import { fetchDesignationList } from "./Designation.api";
import { getDesignationColumns } from "./Designation.columns";
import DesignationForm, { type DesignationFormMode } from "./DesignationForm";
import type { DesignationFormValues } from "./Designation.schema";
import type { Designation } from "./Designation.types";
import type { BulkSelection } from "@/lib/query/listTypes";

/**
 * Designation module — gold reference (STANDARDS.md §12 step 3b).
 * Server-driven table + async mutations; no local `refresh`/global `reFetch`
 * flags — React Query invalidation keeps lists correct (STANDARDS.md §9).
 */
const DesignationList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<Designation | null>(null);
  const [formMode, setFormMode] = useState<DesignationFormMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);

  const table = useServerTable<Designation>({
    entity: "designation",
    queryKey: designationKeys.all,
    fetchList: fetchDesignationList
  });

  const createDesignation = useCreateDesignation();
  const updateDesignation = useUpdateDesignation();
  const bulkClone = useBulkCloneDesignation();
  const bulkDelete = useBulkDeleteDesignation();
  const busy =
    createDesignation.isPending ||
    updateDesignation.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending;

  const columnDefs = useMemo(() => getDesignationColumns({ t }), [t]);

  const openForm = (mode: DesignationFormMode, designation: Designation | null) => {
    setFormMode(mode);
    setActive(designation);
    openModal();
  };

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (values: DesignationFormValues) => {
    if (active) {
      await updateDesignation.mutateAsync({ id: active.id, payload: values });
    } else {
      await createDesignation.mutateAsync(values);
    }
    handleCloseForm();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy designations" : "Copy designation"),
        icon: CopyIcon,
        variant: "outline",
        permission: "CREATE:DESIGNATION",
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete designations" : "Delete designation"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: "DELETE:DESIGNATION",
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
        }
      }
    ],
    [bulkClone, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<Designation>[]>(
    () => [
      {
        key: "view",
        label: "View designation",
        icon: EyeIcon,
        placement: "inline",
        permission: "VIEW:DESIGNATION",
        onClick: (designation) => openForm("view", designation)
      },
      {
        key: "edit",
        label: "Edit designation",
        icon: PencilIcon,
        placement: "inline",
        permission: "UPDATE:DESIGNATION",
        onClick: (designation) => openForm("edit", designation)
      },
      {
        key: "clone",
        label: "Copy designation",
        icon: CopyIcon,
        placement: "menu",
        permission: "CREATE:DESIGNATION",
        onClick: (designation) => bulkClone.mutate({ mode: "ids", ids: [designation.id] })
      },
      {
        key: "delete",
        label: "Delete designation",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: "DELETE:DESIGNATION",
        onClick: (designation) => {
          setPendingDelete({ mode: "ids", ids: [designation.id] });
          setDeleteCount(1);
        }
      }
    ],
    [bulkClone, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<Designation>
        table={table}
        columnDefs={columnDefs}
        tableName={t("designations")}
        searchPlaceholder="Search designations…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("designation") }),
            icon: PlusIcon,
            variant: "primary",
            permission: "CREATE:DESIGNATION",
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{
          title: "No designations found",
          action: { label: t("create", { entity: t("designation") }), onClick: () => openForm("create", null) }
        }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-h-[90vh] max-w-[900px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <DesignationForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createDesignation.isPending || updateDesignation.isPending}
        />
      </Modal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        loading={bulkDelete.isPending}
        description={
          deleteCount > 1
            ? `Are you sure you want to delete these ${deleteCount} designations?`
            : "Are you sure you want to delete this designation?"
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

export default DesignationList;
