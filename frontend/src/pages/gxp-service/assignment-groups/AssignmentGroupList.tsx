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
  assignmentGroupKeys,
  useBulkCloneAssignmentGroup,
  useBulkCopyAssignmentGroup,
  useBulkDeleteAssignmentGroup,
  useBulkRestoreAssignmentGroup,
  useBulkUpdateAssignmentGroup,
  useCreateAssignmentGroup,
  useToggleAssignmentGroupStatus,
  useUpdateAssignmentGroup
} from "./AssignmentGroup.queries";
import { fetchAssignmentGroupById, fetchAssignmentGroupList } from "./AssignmentGroup.api";
import { getAssignmentGroupColumns } from "./AssignmentGroup.columns";
import AssignmentGroupForm, { type AssignmentGroupFormMode } from "./AssignmentGroupForm";
import type { AssignmentGroupFormValues } from "./AssignmentGroup.schema";
import type { AssignmentGroup } from "./AssignmentGroup.types";
import type { BulkSelection } from "@/lib/query/listTypes";

/** Assignment Group (GXP) — careful migration (shared AsyncSelect enhancement). */
const AssignmentGroupList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<AssignmentGroup | null>(null);
  const [formMode, setFormMode] = useState<AssignmentGroupFormMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  // Set instead of active/formMode while the Copy/View/Edit review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [viewIds, setViewIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);
  const [pendingRestore, setPendingRestore] = useState<BulkSelection | null>(null);
  const [restoreNames, setRestoreNames] = useState<string[]>([]);

  const table = useServerTable<AssignmentGroup>({
    entity: "assignmentGroup",
    queryKey: [...assignmentGroupKeys.all, { includeInactive }],
    fetchList: useCallback(
      (params, signal) => fetchAssignmentGroupList(includeInactive, params, signal),
      [includeInactive]
    )
  });

  const createGroup = useCreateAssignmentGroup();
  const updateGroup = useUpdateAssignmentGroup();
  const bulkClone = useBulkCloneAssignmentGroup();
  const bulkCopy = useBulkCopyAssignmentGroup();
  const bulkDelete = useBulkDeleteAssignmentGroup();
  const bulkUpdate = useBulkUpdateAssignmentGroup();
  const bulkRestore = useBulkRestoreAssignmentGroup();
  const toggleStatus = useToggleAssignmentGroupStatus();
  const busy =
    createGroup.isPending ||
    updateGroup.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    bulkRestore.isPending ||
    toggleStatus.isPending;

  // Stable across renders — the toggle's live pending state goes through
  // gridContext instead, so a status click doesn't give ag-grid a new
  // cellRenderer identity (which would force a destroy/recreate of the cell
  // and kill the Switch's transition — see AssignmentGroup.columns.tsx).
  const columnDefs = useMemo(() => getAssignmentGroupColumns({ t }), [t]);

  const gridContext = useMemo(
    () => ({
      toggleDisabled: toggleStatus.isPending,
      togglingId: toggleStatus.isPending ? toggleStatus.variables?.id : undefined,
      onToggleStatus: (group: AssignmentGroup) => {
        if (toggleStatus.isPending) return;
        toggleStatus.mutate(group);
      }
    }),
    [toggleStatus]
  );

  const openForm = (mode: AssignmentGroupFormMode, group: AssignmentGroup | null) => {
    setFormMode(mode);
    setActive(group);
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

  const handleSave = async (values: AssignmentGroupFormValues) => {
    const payload = { ...values, members: values.members ?? [] };
    if (active) {
      await updateGroup.mutateAsync({ id: active.id, payload });
    } else {
      await createGroup.mutateAsync(payload);
    }
    handleCloseForm();
  };

  const handleSaveCopies = async (payloads: AssignmentGroupFormValues[]) => {
    await bulkCopy.mutateAsync(payloads.map((values) => ({ ...values, members: values.members ?? [] })));
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = async (updates: { id: string; payload: AssignmentGroupFormValues }[]) => {
    await bulkUpdate.mutateAsync(
      updates.map(({ id, payload }) => ({ id, payload: { ...payload, members: payload.members ?? [] } }))
    );
    handleCloseForm();
    table.clearSelection();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: (count) => (count > 1 ? "View assignment groups" : "View assignment group"),
        icon: EyeIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.VIEW_ASSIGNMENT_GROUP,
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
        label: (count) => (count > 1 ? "Copy assignment groups" : "Copy assignment group"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.CREATE_ASSIGNMENT_GROUP,
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
        label: (count) => (count > 1 ? "Edit assignment groups" : "Edit assignment group"),
        icon: PencilIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.UPDATE_ASSIGNMENT_GROUP,
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
        label: (count) => (count > 1 ? "Restore" : "Restore"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.UPDATE_ASSIGNMENT_GROUP,
        hidden: (rows) => !(rows as AssignmentGroup[]).some((row) => !row.isActive),
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast("Select individual rows to restore.", "error");
            return;
          }
          setPendingRestore(selection);
          setRestoreNames(table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.groupName));
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete" : "Delete"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: GXP_PERMISSIONS.DELETE_ASSIGNMENT_GROUP,
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(
            selection.mode === "ids"
              ? table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.groupName)
              : []
          );
        }
      }
    ],
    [bulkClone, openCopy, openEdit, openView, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<AssignmentGroup>[]>(
    () => [
      {
        key: "view",
        label: "View assignment group",
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_ASSIGNMENT_GROUP,
        onClick: (group) => openForm("view", group)
      },
      {
        key: "edit",
        label: "Edit assignment group",
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_ASSIGNMENT_GROUP,
        onClick: (group) => openForm("edit", group)
      },
      {
        key: "clone",
        label: "Copy assignment group",
        icon: CopyIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.CREATE_ASSIGNMENT_GROUP,
        onClick: (group) => openCopy([group.id])
      },
      {
        key: "restore",
        label: "Restore assignment group",
        icon: CopyIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.UPDATE_ASSIGNMENT_GROUP,
        hidden: (group) => Boolean(group.isActive),
        onClick: (group) => {
          setPendingRestore({ mode: "ids", ids: [group.id] });
          setRestoreNames([group.groupName]);
        }
      },
      {
        key: "delete",
        label: "Delete assignment group",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: GXP_PERMISSIONS.DELETE_ASSIGNMENT_GROUP,
        onClick: (group) => {
          setPendingDelete({ mode: "ids", ids: [group.id] });
          setDeleteCount(1);
          setDeleteNames([group.groupName]);
        }
      }
    ],
    [openCopy, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<AssignmentGroup>
        table={table}
        columnDefs={columnDefs}
        gridContext={gridContext}
        tableName={t("gxpAssignmentGroups")}
        searchPlaceholder="Search assignment groups…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        titleExtra={
          <Switch label={t("includeInactive")} checked={includeInactive} onChange={setIncludeInactive} />
        }
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("assignmentGroup") }),
            icon: PlusIcon,
            variant: "primary",
            permission: GXP_PERMISSIONS.CREATE_ASSIGNMENT_GROUP,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: "No assignment groups found" }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[900px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<AssignmentGroup, AssignmentGroupFormValues>
            ids={copyIds}
            fetchById={fetchAssignmentGroupById}
            FormComponent={AssignmentGroupForm}
            onSaveAll={handleSaveCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending}
            entityLabel={t("assignmentGroup")}
          />
        ) : viewIds ? (
          <ViewStepper<AssignmentGroup>
            ids={viewIds}
            fetchById={fetchAssignmentGroupById}
            FormComponent={AssignmentGroupForm}
            onClose={handleCloseForm}
            entityLabel={t("assignmentGroup")}
          />
        ) : editIds ? (
          <EditStepper<AssignmentGroup, AssignmentGroupFormValues>
            ids={editIds}
            fetchById={fetchAssignmentGroupById}
            FormComponent={AssignmentGroupForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("assignmentGroup")}
          />
        ) : (
          <AssignmentGroupForm
            mode={formMode}
            initialData={active}
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createGroup.isPending || updateGroup.isPending}
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
            ? `Are you sure you want to delete these ${deleteCount} assignment groups?`
            : "Are you sure you want to delete this assignment group?"
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
            ? `Are you sure you want to restore these ${restoreNames.length} assignment groups?`
            : "Are you sure you want to restore this assignment group?"
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

export default AssignmentGroupList;
