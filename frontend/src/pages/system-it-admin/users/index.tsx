import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";
import { useModal } from "@/hooks/useModal";
import { useTranslation } from "react-i18next";
import CreateUserModal from "./CreateUserModal";
import { getRoles, getLocations, getDepartments, getDesignations, createUser, updateUser, getUsers, deleteUser } from "@/services/admin.service";
import { useEffect, useState } from "react";
import { useGlobalContext } from "@/context";

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

  // const handleOpenEditModal = (user: any) => {
  //   setActiveUser(user);
  //   openModal();
  // };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t("users")}</h1>
        <Button onClick={handleOpenCreateModal}>{t("create", { entity: t("user") })}</Button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('userName')}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('name')}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('email')}
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('role')}
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('status')}
              </th>

              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((usr: any, index: number) => (
              <tr key={index + 1}>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                  {usr.fullName}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                  {usr.name}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                  {usr.email}
                </td>

                <td className="px-6 py-4 whitespace-nowrap mx-auto text-sm text-gray-500">
                  <div className="flex flex-wrap justify-center gap-2">
                    {usr.roles.slice(0, 2).map((role: any, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                      >
                        {role.name}
                      </span>
                    ))}
                    {usr.roles.length > 2 && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs">
                        + {usr.roles.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${usr.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}
                  >
                    {usr.status?.toUpperCase() ?? '-'}
                  </span>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  <button
                    onClick={() => {
                      setActiveUser(usr);
                      openModal();
                    }}
                    className="text-blue-600 hover:text-blue-800 mr-3"
                  >
                    {t('edit')}
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800"
                    onClick={() => {
                      setActiveUser(usr);
                      setConfirmationModal(true);
                    }}
                  >
                    {t('delete')}

                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-4 text-center text-sm text-gray-500"
                >
                  {t('noAdminsFound')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
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


      <Modal
        isOpen={confirmationModal}
        onClose={() => setConfirmationModal(!confirmationModal)}
        className="max-w-[600px] min-h-[150px] m-4"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2">{`${t('deleteEntityPrompt', { entityName: activeUser?.name })} ?`} </div>
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
