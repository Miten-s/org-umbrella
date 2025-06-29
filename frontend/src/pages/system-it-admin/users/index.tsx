import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateUserModal from "./CreateUserModal";
import { getRoles, getLocations, getDepartments, getDesignations, createUser, updateUser, getUsers, deleteUser } from "@/services/admin.service";
import { useEffect, useState } from "react";
import { useGlobalContext } from "@/context";
import { LockIcon } from "@/public/icons";

const Users = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const [roles, setRoles] = useState<any>([]);
  const [locations, setLocations] = useState<any>([]);
  const [departments, setDepartments] = useState<any>([]);
  const [designations, setDesignations] = useState<any>([]);
  const [users, setUsers] = useState<any>([]);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [confirmationModal, setConfirmationModal] = useState(false);
  const { reFetch, setReFetch, } = useGlobalContext();

  const fetchDetails = async () => {
    try {
      const [
        { roles: fetchedRoles },
        { locations: fetchedLocations },
        { departments: fetchedDepartments },
        { designations: fetchedDesignations },
        { users: fetchedUsers }
      ] = await Promise.all([
        getRoles(),
        getLocations(),
        getDepartments(),
        getDesignations(),
        getUsers()
      ]);
      setRoles(fetchedRoles);
      setLocations(fetchedLocations);
      setDepartments(fetchedDepartments);
      setDesignations(fetchedDesignations);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [reFetch]);

  const handleCreateUpdateUser = async (data: any) => {
    try {
      if (activeUser) {
        const payload = {
          ...data,
        };
        await updateUser(activeUser._id, payload);
      } else {
        const payload = {
          ...data,
        };
        await createUser(payload);
      }
      fetchDetails();
      closeModal();
      setActiveUser(null);
      setReFetch(!reFetch);

    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleOpenCreateModal = () => {
    setActiveUser(null);
    openModal();
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t("users")}</h1>
        <Button
          permission="CREATE:USER"
          tooltipPosition="left"
          onClick={handleOpenCreateModal}
        >
          {t("create", { entity: t("user") })}
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {['userName', 'name', 'email', 'role', 'status', 'actions'].map((key) => (
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
            {users.map((usr: any, index: number) => (
              <tr key={index + 1}>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {usr.fullName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {usr.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                  {usr.email}
                </td>

                {/* Roles */}
                <td className="px-6 py-4 whitespace-nowrap mx-auto text-sm text-gray-500 dark:text-gray-300">
                  <div className="flex flex-wrap justify-center gap-2">
                    {usr.roles.slice(0, 2).map((role: any, idx: number) => {
                      const isDefault = role.type === 'Built_In';
                      return (
                        <span
                          key={idx}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${isDefault
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                            }`}
                          title={isDefault ? 'Default System Role' : 'Custom Role'}
                        >
                          {isDefault && <LockIcon className="w-3 h-3" />}
                          {isDefault ? `Default - ${role.name}` : role.name}
                        </span>
                      );
                    })}
                    {usr.roles.length > 2 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs">
                        + {usr.roles.length - 2}
                      </span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${usr.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      }`}
                  >
                    {usr.status?.toUpperCase() ?? '-'}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-300">
                  <Button
                    permission="UPDATE:USER"
                    onClick={() => {
                      setActiveUser(usr);
                      openModal();
                    }}
                    variant="outline"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                  >
                    {t('edit')}
                  </Button>
                  <Button
                    permission="DELETE:USER"
                    onClick={() => {
                      setActiveUser(usr);
                      setConfirmationModal(true);
                    }}
                    variant="outline"
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    {t('delete')}
                  </Button>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300"
                >
                  {t('noAdminsFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[1000px] max-h-[50rem] m-4">
        <CreateUserModal
          onClose={closeModal}
          roles={roles}
          locations={locations}
          departments={departments}
          designations={designations}
          onSubmit={handleCreateUpdateUser}
          activeUser={activeUser}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmationModal}
        onClose={() => setConfirmationModal(!confirmationModal)}
        className="max-w-[600px] min-h-[150px] m-4"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between dark:text-white">
          <div className="py-2">{`${t('deleteEntityPrompt', { entityName: activeUser?.name })} ?`}</div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setConfirmationModal(!confirmationModal)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={async () => {
                await deleteUser(activeUser?._id);
                setReFetch(!reFetch);
                setConfirmationModal(!confirmationModal);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </>

  );
};

export default Users;
