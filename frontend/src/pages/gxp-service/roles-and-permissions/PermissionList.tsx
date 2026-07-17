import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import ConfirmDialog from "@/components/data/ConfirmDialog";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { PermissionType } from "@/utils/common.constants";
import { ADMIN_PERMISSIONS } from "@/utils/permissions";
import { EyeIcon, PencilIcon, PlusIcon, TrashBinIcon } from "@/public/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateGxpPermissionModal from "./CreateGxpPermissionModal";
import {
  permissionKeys,
  useBulkDeletePermission,
  useCreatePermission,
  useUpdatePermission
} from "./Permission.queries";
import { fetchPermissionList } from "./Permission.api";
import { getPermissionColumns } from "./Permission.columns";
import type { GxpPermission } from "./Permission.types";
import type { BulkSelection } from "@/lib/query/listTypes";

type PermissionModalMode = "create" | "edit" | "view";

/** GXP Permissions list — migrated structure-only (admin services + ADMIN_PERMISSIONS gating, as-is). */
const PermissionList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<GxpPermission | null>(null);
  const [mode, setMode] = useState<PermissionModalMode>("create");
  const [pendingDelete, setPendingDelete] = useState<BulkSelection | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [deleteNames, setDeleteNames] = useState<string[]>([]);

  const table = useServerTable<GxpPermission>({
    entity: "gxpPermission",
    queryKey: permissionKeys.all,
    fetchList: fetchPermissionList
  });

  const createPermission = useCreatePermission();
  const updatePermission = useUpdatePermission();
  const bulkDelete = useBulkDeletePermission();
  const busy = createPermission.isPending || updatePermission.isPending || bulkDelete.isPending;

  const columnDefs = useMemo(() => getPermissionColumns({ t }), [t]);

  const openForm = (m: PermissionModalMode, permission: GxpPermission | null) => {
    setMode(m);
    setActive(permission);
    openModal();
  };
  const handleClose = () => {
    closeModal();
    setActive(null);
    setMode("create");
  };

  const handleSave = async (data: Partial<GxpPermission>) => {
    const payload = {
      name: data.permissionName?.trim() ?? "",
      description: data.description,
      type: PermissionType.GXP_SERVICE
    };
    if (active) {
      await updatePermission.mutateAsync({ id: active.id, payload });
    } else {
      await createPermission.mutateAsync(payload);
    }
    handleClose();
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "delete",
        label: (count) => (count > 1 ? "Delete permissions" : "Delete permission"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: ADMIN_PERMISSIONS.DELETE_PERMISSION,
        onClick: (selection, count) => {
          setPendingDelete(selection);
          setDeleteCount(count);
          setDeleteNames(
            selection.mode === "ids"
              ? table.rows.filter((r) => selection.ids.includes(r.id)).map((r) => r.permissionName)
              : []
          );
        }
      }
    ],
    [table]
  );

  const rowActions = useMemo<AppDataTableRowAction<GxpPermission>[]>(
    () => [
      { key: "view", label: "View permission", icon: EyeIcon, placement: "inline", permission: ADMIN_PERMISSIONS.VIEW_PERMISSION, onClick: (p) => openForm("view", p) },
      { key: "edit", label: "Edit permission", icon: PencilIcon, placement: "inline", permission: ADMIN_PERMISSIONS.UPDATE_PERMISSION, onClick: (p) => openForm("edit", p) },
      {
        key: "delete",
        label: "Delete permission",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: ADMIN_PERMISSIONS.DELETE_PERMISSION,
        onClick: (p) => {
          setPendingDelete({ mode: "ids", ids: [p.id] });
          setDeleteCount(1);
          setDeleteNames([p.permissionName]);
        }
      }
    ],
    []
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DataTable<GxpPermission>
        table={table}
        columnDefs={columnDefs}
        tableName={t("gxpPermissions")}
        searchPlaceholder="Search permissions…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("gxpPermissions") }),
            icon: PlusIcon,
            variant: "primary",
            permission: ADMIN_PERMISSIONS.CREATE_PERMISSION,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: "No permissions found" }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="m-4 max-h-[100rem] max-w-[900px] overflow-y-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
      >
        <CreateGxpPermissionModal
          onClose={handleClose}
          onSubmit={handleSave}
          initialData={active || undefined}
          mode={mode}
        />
      </Modal>

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        loading={bulkDelete.isPending}
        items={deleteNames}
        description={deleteCount > 1 ? `Are you sure you want to delete these ${deleteCount} permissions?` : "Are you sure you want to delete this permission?"}
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

export default PermissionList;
