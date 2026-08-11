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
  assignmentGroupKeys,
  useBulkCloneAssignmentGroup,
  useBulkDeleteAssignmentGroup,
  useCreateAssignmentGroup,
  useToggleAssignmentGroupStatus,
  useUpdateAssignmentGroup
} from "./AssignmentGroup.queries";
import { fetchAssignmentGroupList } from "./AssignmentGroup.api";
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
  const bulkDelete = useBulkDeleteAssignmentGroup();
  const toggleStatus = useToggleAssignmentGroupStatus();
  const busy =
    createGroup.isPending ||
    updateGroup.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    toggleStatus.isPending;

  const columnDefs = useMemo(
    () =>
      getAssignmentGroupColumns({
        t,
        toggleDisabled: toggleStatus.isPending,
        togglingId: toggleStatus.isPending ? toggleStatus.variables?.id : undefined,
        onToggleStatus: (group) => {
          if (toggleStatus.isPending) return;
          toggleStatus.mutate(group);
        }
      }),
    [t, toggleStatus]
  );

  const openForm = (mode: AssignmentGroupFormMode, group: AssignmentGroup | null) => {
    setFormMode(mode);
    setActive(group);
    openModal();
  };

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
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

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy assignment groups" : "Copy assignment group"),
        icon: CopyIcon,
        variant: "outline",
        permission: GXP_PERMISSIONS.CREATE_ASSIGNMENT_GROUP,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete assignment groups" : "Delete assignment group"),
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
    [bulkClone, table]
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
        onClick: (group) => bulkClone.mutate({ mode: "ids", ids: [group.id] })
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
    [bulkClone, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<AssignmentGroup>
        table={table}
        columnDefs={columnDefs}
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
      >
        <AssignmentGroupForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createGroup.isPending || updateGroup.isPending}
        />
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
    </div>
  );
};

export default AssignmentGroupList;
