import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateGxpPermissionModal from "./CreateGxpPermissionModal";
import {
  getGxpPermissions,
  createGxpPermission,
  updateGxpPermission,
  deleteGxpPermission,
} from "@/services/gxp.service";
import { GxpPermission } from "@/types/common.types";
import { useGlobalContext } from "@/context";

const Permissions = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const [permissions, setPermissions] = useState<GxpPermission[]>([]);

  const [activePermission, setActivePermission] = useState<GxpPermission | null>(null);
  const [permissionToDelete, setPermissionToDelete] = useState<GxpPermission | null>(null);

  const [confirmationModal, setConfirmationModal] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      const { permissions } = await getGxpPermissions();
      setPermissions(permissions);
    };

    fetchInitialData();
  }, [reFetch]);

  // Create or Update
  const handleSave = async (data: Partial<GxpPermission>) => {
    if (activePermission) {
      const updated = await updateGxpPermission(activePermission._id, data);
      setPermissions((prev) =>
        prev.map((p) => (p._id === updated._id ? updated : p))
      );
    } else {
      const created = await createGxpPermission(data);
      setPermissions((prev) => [created, ...prev]);
    }
    setReFetch(!reFetch);
    closeModal();
    setActivePermission(null);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!permissionToDelete) return;

    await deleteGxpPermission(permissionToDelete._id);
    setPermissions((prev) => prev.filter((p) => p._id !== permissionToDelete._id));

    setConfirmationModal(false);
    setPermissionToDelete(null);
  };

  const openEditModal = (permission: GxpPermission) => {
    setActivePermission(permission);
    openModal();
  };

  return (
    <>
      {/* Header and Create Button */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("gxpPermissions")}
        </h1>
        <Button
          // permission="CREATE:GXP_PERMISSION"
          tooltipPosition="left"
          onClick={() => {
            setActivePermission(null);
            openModal();
          }}
        >
          {t("create", { entity: t("gxpPermissions") })}
        </Button>
      </div>

      {/* Permission List */}
      <ul className="space-y-2">
        {permissions.map((p) => (
          <li
            key={p._id}
            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm flex justify-between items-start gap-4"
          >
            <div className="flex-1">
              <div className="font-semibold text-lg text-gray-900 dark:text-white">
                {p.permissionName}
              </div>
              {p.description && (
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {p.description}
                </div>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                // permission="UPDATE:GXP_PERMISSION"
                onClick={() => openEditModal(p)}
                variant="outline"
              >
                {t("edit")}
              </Button>
              <Button
                // permission="DELETE:GXP_PERMISSION"
                onClick={() => {
                  setPermissionToDelete(p);
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

      {/* Create/Edit Permission Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[900px] max-h-[100rem]  m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >

        <CreateGxpPermissionModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activePermission || undefined}
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
              entityName: permissionToDelete?.permissionName,
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

export default Permissions;
