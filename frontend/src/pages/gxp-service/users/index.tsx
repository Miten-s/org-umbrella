import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useGlobalContext } from "@/context";

import CreateGxpUserModal, { GxpUserEntity } from "./CreateGxpUserModal";
import { getRoles, getUsers } from "@/services/admin.service";
import { RoleType } from "@/utils/common.constants";
import {
  getGxpUsers, createGxpUser,
  deleteGxpUser,
  updateGxpUser,
  enableGxpUser,
  disableGxpUser,
} from "@/services/gxp.service";
import Switch from "@/components/common/form/switch/Switch";

type Role = { _id: string; name: string };
type BareUser = { _id: string; fullName?: string; name?: string };
type RoleRef = string | { _id?: string; name?: string };

const extractList = (v: any, keyCandidates: string[]) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  for (const k of keyCandidates) {
    if (Array.isArray(v?.[k])) return v[k];
  }
  if (Array.isArray(v?.data)) return v.data;
  const first = Object.values(v).find(Array.isArray);
  return Array.isArray(first) ? first : [];
};

const normalizeRoles = (roles: RoleRef[] | RoleRef | undefined): string[] => {
  if (!roles) return [];
  if (Array.isArray(roles)) {
    return roles
      .map((r) => (typeof r === "string" ? r : r?._id ?? ""))
      .filter(Boolean);
  }
  return [typeof roles === "string" ? roles : roles?._id ?? ""].filter(Boolean);
};

const normalizeGxpUser = (user: any): GxpUserEntity => ({
  _id: user?._id ?? "",
  user: {
    id: user?.user?.id ?? "",
    name: user?.user?.name ?? ""
  },
  userType: user?.userType ?? "User",
  roles: normalizeRoles(user?.roles),
  description: user?.description,
  status: user?.status ?? "enabled"
});

const GXPUsersPage = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();
  const { reFetch, setReFetch } = useGlobalContext();

  const [gxpUsers, setGxpUsers] = useState<GxpUserEntity[]>([]);
  const [activeUser, setActiveUser] = useState<GxpUserEntity | null>(null);

  const [selectableUsers, setSelectableUsers] = useState<BareUser[]>([]);
  const [selectableRoles, setSelectableRoles] = useState<Role[]>([]);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState<GxpUserEntity | null>(null);

  useEffect(() => {
    (async () => {
      const [usersRes, rolesRes, gxpUsersRes] = await Promise.all([
        getUsers(),
        getRoles(RoleType.GXP_SERVICE),
        getGxpUsers(),
      ]);

      setSelectableUsers(extractList(usersRes, ["users"]).map((u: any) => ({
        _id: u._id,
        fullName: u.fullName ?? u.name,
        name: u.fullName ?? u.name,
      })));

      setSelectableRoles(extractList(rolesRes, ["roles"]).map((r: any) => ({
        _id: r._id,
        name: r.name,
      })));

      setGxpUsers(extractList(gxpUsersRes, ["gxpUsers", "items"]).map(normalizeGxpUser));
    })();
  }, [reFetch]);

  const openEditModal = (u: GxpUserEntity) => {
    setActiveUser(u);
    openModal();
  };

  const handleSave = async (payload: Partial<GxpUserEntity>) => {
    if (activeUser) {
      const updated = await updateGxpUser(activeUser._id, payload);
      const normalized = normalizeGxpUser(updated);
      setGxpUsers((prev) => prev.map((x) => (x._id === normalized._id ? normalized : x)));
    } else {
      const created = await createGxpUser(payload);
      const normalized = normalizeGxpUser(created);
      setGxpUsers((prev) => [normalized, ...prev]);
    }
    setActiveUser(null);
    setReFetch(!reFetch);
    closeModal();
  };

  const confirmDelete = async () => {
    if (!entityToDelete) return;
    await deleteGxpUser(entityToDelete._id);
    setGxpUsers((prev) => prev.filter((x) => x._id !== entityToDelete._id));
    setEntityToDelete(null);
    setConfirmationModal(false);
  };
  const handleStatusChange = async (user: GxpUserEntity) => {
    const newStatus = user.status === "enabled" ? "disabled" : "enabled";

    // optimistic UI
    setGxpUsers((prev) =>
      prev.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u))
    );

    try {
      if (newStatus === "enabled") {
        await enableGxpUser(user._id);
      } else {
        await disableGxpUser(user._id);
      }
    } catch (err) {
      console.error("Failed to update status", err);
      // rollback
      setGxpUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: user.status } : u))
      );
    }
  };
  return (
    <>
      {/* Header & Create */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          {t("gxpUsers")}
        </h1>
        <Button
          onClick={() => {
            setActiveUser(null);
            openModal();
          }}
        >
          {t("create", { entity: t("gxpUsers") })}
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead>
            <tr>
              {["userName", "userType", "gxpAppRoles", "description", "status", "actions"].map((key) => (
                <th
                  key={key}
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {t(key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {gxpUsers?.map((u) => (
              <tr key={u._id}>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {u.user?.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {u.userType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {Array.isArray(u.roles)
                    ? u.roles
                        .map((roleId) => selectableRoles.find((r) => r._id === roleId)?.name)
                        .filter(Boolean)
                        .join(", ") || "-"
                        //@ts-ignore
                    : selectableRoles.find((r) => r._id === u.roles)?.name ?? "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                  {u.description ?? "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <Switch
                    label={u.status === "enabled" ? t("enabled") : t("disabled")}
                    checked={u.status === "enabled"}
                    onChange={() => handleStatusChange(u)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-300">
                  <Button
                    onClick={() => openEditModal(u)}
                    variant="outline"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    {t("edit")}
                  </Button>
                  <Button
                    onClick={() => {
                      setEntityToDelete(u);
                      setConfirmationModal(true);
                    }}
                    variant="destructive"
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {t("delete")}
                  </Button>
                </td>
              </tr>
            ))}

            {gxpUsers?.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                >
                  {t("noRecordsFound")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[720px] max-h-[100rem] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateGxpUserModal
          onClose={closeModal}
          onSubmit={handleSave}
          initialData={activeUser || undefined}
          selectableUsers={selectableUsers}
          selectableRoles={selectableRoles}
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
            {t("deleteEntityPrompt", { entityName: entityToDelete?.user?.name })}
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

export default GXPUsersPage;
