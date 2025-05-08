import { useState } from 'react';
import CreateRoleModal from './CreateRoleModal';
import { Modal } from '../../../components/ui/modal';
import { useModal } from '../../../hooks/useModal';
import Button from '../../../components/ui/button/Button';

interface Role {
  id: string;
  name: string;
  permissions: string[];
}

const RolesAndPermissions = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const { isOpen, openModal, closeModal } = useModal();

  const handleCreateRole = (roleData: { name: string;  permissions: string[] }) => {
    const newRole: Role = {
      id: Date.now().toString(),
      ...roleData
    };
    setRoles([...roles, newRole]);
    closeModal()
  };

  return (
    <>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Roles & Permissions</h1>
          <Button
            onClick={openModal}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Role
          </Button>
        </div>

        {/* Create Role Modal */}
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[1000px] max-h-[50rem]  m-4">
        <CreateRoleModal
            onClose={ closeModal}
            onSubmit={handleCreateRole}
          />
        </Modal>

        {/* Roles Table */}
        <div className="bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {role.name}
                  </td>
                 
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map((permission) => (
                        <span
                          key={permission}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          {permission}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-800 mr-3">Edit</button>
                    <button className="text-red-600 hover:text-red-800">Delete</button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No roles found. Create a new role to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
  );
};

export default RolesAndPermissions;