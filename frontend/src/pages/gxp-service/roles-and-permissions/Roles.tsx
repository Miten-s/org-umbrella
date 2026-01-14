import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateRoleModal from "@/pages/access-management/roles-and-permissions/CreateRoleModal";
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions
} from "@/services/admin.service";
import { useGlobalContext } from "@/context";
import { PermissionType, RoleType } from "@/utils/common.constants";
import CountWithTooltip from "@/components/common/CountWithTooltip";

const Roles = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Array<{ _id: string; name: string }>>([]);

  const [activeRole, setActiveRole] = useState<any | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<any | null>(null);

  const [confirmationModal, setConfirmationModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [{ roles }, { permissions }] = await Promise.all([
        getRoles(RoleType.GXP_SERVICE),
        getPermissions(PermissionType.GXP_SERVICE),
      ]);
      setRoles(roles);
      setPermissions(permissions);
    };

    fetchInitialData();
  }, [reFetch]);

  // Create or Update
  const handleSave = async (data: { roleName: string; permissions: string[]; description?: string }) => {
    const permissionIds = data.permissions
      .map((permName) => permissions.find((perm) => perm.name === permName))
      .filter((perm): perm is { _id: string; name: string } => perm !== undefined)
      .map((perm) => perm._id);

    const payload = {
      name: data.roleName,
      permissions: permissionIds,
      type: RoleType.GXP_SERVICE,
    };
    if (activeRole) {
      const updated = await updateRole(activeRole._id, payload);
      setRoles((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
    } else {
      const created = await createRole(payload);
      setRoles((prev) => [created, ...prev]);
    }
    setReFetch(!reFetch);
    closeModal();
    setActiveRole(null);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!roleToDelete) return;

    await deleteRole(roleToDelete._id);
    setRoles((prev) => prev.filter((r) => r._id !== roleToDelete._id));

    setConfirmationModal(false);
    setRoleToDelete(null);
  };

  const openEditModal = (role: any) => {
    setActiveRole(role);
    openModal();
  };

  return (
    <>
      {/* Header and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("rolesAndPermissions")}
        </h1>
        <Button
          // permission="CREATE:GXP_ROLE"
          tooltipPosition="left"
          onClick={() => {
            setActiveRole(null);
            openModal();
          }}
        >
          {t("create", { entity: t("gxpRoles") })}
        </Button>
      </div>

      {/* Roles Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t("roleName")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t("permissions")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {roles.length > 0 ? (
              roles.map((role) => (
                <tr key={role._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {role.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <div className="flex flex-wrap gap-2">
                      {(role.permissions || [])
                        .slice(0, 2)
                        .map((perm: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 rounded-full text-xs"
                          >
                            {perm?.name ?? perm}
                          </span>
                        ))}
                      {(role.permissions || []).length > 2 && (
                        <CountWithTooltip
                          count={(role.permissions || []).length - 2}
                          items={(role.permissions || []).slice(2).map((perm: any) => perm?.name ?? String(perm))}
                          headerLabel={`Permissions (${(role.permissions || []).length - 2} more)`}
                          buttonLabel={`+ ${(role.permissions || []).length - 2}`}
                          className="self-center"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    <Button
                      // permission="UPDATE:GXP_ROLE"
                      onClick={() => openEditModal(role)}
                      variant="outline"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                    >
                      {t("edit")}
                    </Button>
                    <Button
                      // permission="DELETE:GXP_ROLE"
                      onClick={() => {
                        setRoleToDelete(role);
                        setConfirmationModal(true);
                      }}
                      variant="outline"
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {t("delete")}
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                >
                  {t("noRolesFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Role Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[100rem]  m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >

        <CreateRoleModal
          onClose={closeModal}
          onSubmit={({ name, permissions: permissionNames }) =>
            handleSave({
              roleName: name,
              permissions: permissionNames
            })
          }
          activeRole={
            activeRole
              ? {
                  name: activeRole?.name,
                  permissions: activeRole?.permissions?.map((perm: any) => ({
                    name: perm?.name ?? ""
                  })) ?? []
                }
              : undefined
          }
          permissions={permissions.map((perm) => perm.name ?? "")}
          permissionType={PermissionType.GXP_SERVICE}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmationModal}
        onClose={() => setConfirmationModal(false)}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {t("deleteEntityPrompt", {
              entityName: roleToDelete?.name,
            })}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setConfirmationModal(false)}>
              {t("cancel")}
            </Button>
            <Button onClick={confirmDelete} variant="destructive">
              {t("confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>

  );
};

export default Roles;
