import Button from "@/components/ui/button/Button";
import CreateAdminModal from "./CreateAdminModal";
import { useModal } from "../../../hooks/useModal";
import { Modal } from "@/components/ui/modal";
import { useEffect, useState } from "react";
import {
  createUser,
  deleteUser,
  getRoles,
  getUsers,
  updateUser
} from "@/services/admin.service";
import { useGlobalContext } from "@/context";

const AllAdmins = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { reFetch, setReFetch } = useGlobalContext();
  const [confirmationModal, setConfirmationModal] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);

  const handleCreateAdmin = async (data: any) => {
    let formattedPayload;
    if (activeUser) {
      formattedPayload = {
        username: data.name.split(" ")[0],
        name: data.name,
        roles: data.assignRole
      };
      await updateUser(activeUser._id, formattedPayload);
    } else {
      formattedPayload = {
        username: data.name.split(" ")[0],
        name: data.name,
        email: data.email,
        password: data.password,
        roles: data.assignRole
      };
      await createUser(formattedPayload);
    }
    setActiveUser(null);
    setReFetch(!reFetch);
    closeModal();
  };

  const handleCloseAddUpdateModal = () => {
    setActiveUser(null);
    closeModal();
  };

  const [users, setUsers] = useState<any>([]);
  const [roles, setRoles] = useState<any>([]);
  const fetchDetails = async () => {
    const { users: fetchedUsers } = await getUsers();
    const { roles: fetchedRoles } = await getRoles();
    setUsers(fetchedUsers);
    setRoles(
      fetchedRoles.map((role: any) => ({ text: role.name, value: role._id }))
    );
  };

  useEffect(() => {
    fetchDetails();
  }, [reFetch]);

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">All Admins</h1>
          <Button
            onClick={openModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Admin
          </Button>
        </div>

        {/* Roles Table */}
        <div className="bg-white rounded-lg shadow overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Name
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CreatedBy
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((usr: any, index: number) => (
                <tr key={index + 1}>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900">
                    {usr.username}
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

                  <td className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {usr?.createdBy?.username ?? "-"}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                    <button
                      onClick={() => {
                        setActiveUser(usr);
                        openModal();
                      }}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => {
                        setActiveUser(usr);
                        setConfirmationModal(true);
                      }}
                    >
                      Delete
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
                    No roles found. Create a new role to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Update Admin Modal */}

      <Modal
        isOpen={isOpen}
        onClose={handleCloseAddUpdateModal}
        className="max-w-[1000px] max-h-[50rem]  m-4"
      >
        <CreateAdminModal
          activeUser={activeUser}
          roles={roles}
          onClose={handleCloseAddUpdateModal}
          onSubmit={handleCreateAdmin}
        />
      </Modal>

      {/* Confirmation Popup Modal */}

      <Modal
        isOpen={confirmationModal}
        onClose={() => setConfirmationModal(!confirmationModal)}
        className="max-w-[600px] min-h-[150px] m-4"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2">Are you want to delete this admin ?</div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setConfirmationModal(!confirmationModal)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                await deleteUser(activeUser?._id);
                setReFetch(!reFetch);
                setConfirmationModal(!confirmationModal);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AllAdmins;
