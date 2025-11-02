import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateGxpRoleModal from "./CreateGxpRoleModal";
import {
  getGxpRoles,
  createGxpRole,
  updateGxpRole,
  deleteGxpRole,
  getGxpPermissions,
} from "@/services/gxp.service";
import { GxpRole, GxpPermission } from "@/types/common.types";
import { useGlobalContext } from "@/context";

const Roles = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const [roles, setRoles] = useState<GxpRole[]>([]);
  const [permissions, setPermissions] = useState<GxpPermission[]>([]);

  const [activeRole, setActiveRole] = useState<GxpRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<GxpRole | null>(null);

  const [confirmationModal, setConfirmationModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [{ roles }, { permissions }] = await Promise.all([
        getGxpRoles(),
        getGxpPermissions(),
      ]);
      setRoles(roles);
      setPermissions(permissions);
    };

    fetchInitialData();
  }, [reFetch]);

  // Create or Update
  const handleSave = async (data: Partial<GxpRole>) => {
    if (activeRole) {
      const updated = await updateGxpRole(activeRole._id, data);
      setRoles((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
    } else {
      const created = await createGxpRole(data);
      setRoles((prev) => [created, ...prev]);
    }
    setReFetch(!reFetch);
    closeModal();
    setActiveRole(null);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!roleToDelete) return;

    await deleteGxpRole(roleToDelete._id);
    setRoles((prev) => prev.filter((r) => r._id !== roleToDelete._id));

    setConfirmationModal(false);
    setRoleToDelete(null);
  };

  const openEditModal = (role: GxpRole) => {
    setActiveRole(role);
    openModal();
  };

  return (
    <>
      {/* Header and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("gxpRoles")}
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

      {/* Role List */}
      <ul className="space-y-2">
        {roles.map((r) => (
          <li
            key={r._id}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex justify-between items-start gap-4"
          >
            <div className="flex-1">
              <div className="font-semibold text-lg text-gray-900 dark:text-white">
                {r.roleName}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Permissions: {r.permissions.length}
              </div>
              {r.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {r.description}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                // permission="UPDATE:GXP_ROLE"
                onClick={() => openEditModal(r)}
                variant="outline"
              >
                {t("edit")}
              </Button>
              <Button
                // permission="DELETE:GXP_ROLE"
                onClick={() => {
                  setRoleToDelete(r);
                  setConfirmationModal(true);
                }}
                variant="destructive"
              >
                {t("delete")}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {/* Create/Edit Role Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[100rem]  m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >

        <CreateGxpRoleModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeRole || undefined}
          permissions={permissions}
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
              entityName: roleToDelete?.roleName,
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
