import DataTable from "@/components/data/DataTable";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useModal } from "@/hooks/useModal";
import { ADMIN_PERMISSIONS } from "@/utils/permissions";
import { EyeIcon } from "@/public/icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateGxpPermissionModal from "./CreateGxpPermissionModal";
import { permissionKeys } from "./Permission.queries";
import { fetchPermissionList } from "./Permission.api";
import { getPermissionColumns } from "./Permission.columns";
import type { GxpPermission } from "./Permission.types";

/**
 * GXP Permissions — read-only reference view. The catalog is seeded by the backend
 * (migration), not authored here; Roles assign a subset of it via PermissionPicker.
 * Only "view" survives so admins can still check a permission's description while
 * building a role.
 */
const PermissionList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const [active, setActive] = useState<GxpPermission | null>(null);

  const table = useServerTable<GxpPermission>({
    entity: "gxpPermission",
    queryKey: permissionKeys.all,
    fetchList: fetchPermissionList
  });

  const columnDefs = useMemo(() => getPermissionColumns({ t }), [t]);

  const handleClose = () => {
    closeModal();
    setActive(null);
  };

  const rowActions = useMemo<AppDataTableRowAction<GxpPermission>[]>(
    () => [
      {
        key: "view",
        label: "View permission",
        icon: EyeIcon,
        placement: "inline",
        permission: ADMIN_PERMISSIONS.VIEW_PERMISSION,
        onClick: (p) => {
          setActive(p);
          openModal();
        }
      }
    ],
    [openModal]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <DataTable<GxpPermission>
        table={table}
        columnDefs={columnDefs}
        tableName={t("gxpPermissions")}
        searchPlaceholder="Search permissions…"
        rowActions={rowActions}
        fillAvailableHeight
        emptyState={{ title: "No permissions found" }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        className="m-4 max-h-[100rem] max-w-[900px] overflow-y-auto bg-white text-gray-900 dark:bg-gray-900 dark:text-white"
      >
        <CreateGxpPermissionModal
          onClose={handleClose}
          onSubmit={() => {}}
          initialData={active || undefined}
          mode="view"
        />
      </Modal>
    </div>
  );
};

export default PermissionList;
