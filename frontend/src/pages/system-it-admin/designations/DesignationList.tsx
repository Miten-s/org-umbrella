import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import CopyStepper from "@/components/data/CopyStepper";
import ViewStepper from "@/components/data/ViewStepper";
import EditStepper from "@/components/data/EditStepper";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { toast } from "@/lib/toast";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  designationKeys,
  useBulkCloneDesignation,
  useBulkCopyDesignation,
  useBulkDeleteDesignation,
  useBulkUpdateDesignation,
  useCreateDesignation,
  useUpdateDesignation
} from "./Designation.queries";
import { fetchDesignationById, fetchDesignationList } from "./Designation.api";
import { getDesignationColumns } from "./Designation.columns";
import DesignationForm, { type DesignationFormMode } from "./DesignationForm";
import type { DesignationFormValues } from "./Designation.schema";
import type { Designation } from "./Designation.types";
import type { BulkSelection } from "@/lib/query/listTypes";
import { idsSelection } from "@/lib/query/listTypes";

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
  // Set instead of active/formMode while the multi-record Copy/View/Edit steppers are open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const table = useServerTable<Designation>({
    entity: "designation",
    queryKey: designationKeys.all,
    fetchList: fetchDesignationList
  });

  const createDesignation = useCreateDesignation();
  const updateDesignation = useUpdateDesignation();
  const bulkClone = useBulkCloneDesignation();
  const bulkCopy = useBulkCopyDesignation();
  const bulkDelete = useBulkDeleteDesignation();
  const bulkUpdate = useBulkUpdateDesignation();
  const busy =
    createDesignation.isPending ||
    updateDesignation.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending;

  const columnDefs = useMemo(() => getDesignationColumns({ t }), [t]);

  const openForm = (mode: DesignationFormMode, designation: Designation | null) => {
    setFormMode(mode);
    setActive(designation);
    openModal();
  };

  const openCopy = (ids: string[]) => {
    setCopyIds(ids);
    openModal();
  };

  const openView = (ids: string[]) => {
    setViewIds(ids);
    openModal();
  };

  const openEdit = (ids: string[]) => {
    setEditIds(ids);
    openModal();
  };

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
    setCopyIds(null);
    setViewIds(null);
    setEditIds(null);
  };

  const handleSave = async (values: DesignationFormValues) => {
    if (active) {
      await updateDesignation.mutateAsync({ id: active.id, payload: values });
    } else {
      await createDesignation.mutateAsync(values);
    }
    handleCloseForm();
  };

  const handleSaveCopies = async (payloads: DesignationFormValues[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = async (updates: { id: string; payload: DesignationFormValues }[]) => {
    await bulkUpdate.mutateAsync(updates);
    handleCloseForm();
    table.clearSelection();
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: (count) => (count > 1 ? "View designations" : "View designation"),
        icon: EyeIcon,
        variant: "outline",
        permission: "VIEW:DESIGNATION",
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select checkboxes to view multiple records.", "error");
            return;
          }
          openView(selection.ids);
        }
      },
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy designations" : "Copy designation"),
        icon: CopyIcon,
        variant: "outline",
        permission: "CREATE:DESIGNATION",
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
        label: (count) => (count > 1 ? "Edit designations" : "Edit designation"),
        icon: PencilIcon,
        variant: "outline",
        permission: "UPDATE:DESIGNATION",
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select checkboxes to edit multiple records.", "error");
            return;
          }
          openEdit(selection.ids);
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
        onClick: (designation) => openCopy([designation.id])
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
    []
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
          title: "No designations found"
        }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[900px] overflow-x-hidden dark:bg-gray-900"
      >
        {copyIds ? (
          <CopyStepper<Designation, DesignationFormValues>
            ids={copyIds}
            fetchById={fetchDesignationById}
            FormComponent={DesignationForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("designation")}
          />
        ) : viewIds ? (
          <ViewStepper<Designation>
            ids={viewIds}
            fetchById={fetchDesignationById}
            FormComponent={DesignationForm}
            onClose={handleCloseForm}
            entityLabel={t("designation")}
          />
        ) : editIds ? (
          <EditStepper<Designation, DesignationFormValues>
            ids={editIds}
            fetchById={fetchDesignationById}
            FormComponent={DesignationForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("designation")}
          />
        ) : (
          <DesignationForm
            mode={formMode}
            initialData={active}
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createDesignation.isPending || updateDesignation.isPending}
          />
        )}
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
