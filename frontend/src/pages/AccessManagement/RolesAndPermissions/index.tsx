import { useEffect, useState } from "react";
import CreateRoleModal from "./CreateRoleModal";
import { Modal } from "../../../components/ui/modal";
import { useModal } from "../../../hooks/useModal";
import Button from "../../../components/ui/button/Button";
import {
  createRole,
  deleteRole,
  getPermissions,
  getRoles,
  updateRole
} from "@/services/admin.service";
import { toast } from "@/lib/ToastProvider";
import { MESSAGES } from "@/utils/common.constants";
import { useGlobalContext } from "@/context";

interface Role {
  _id: string;
  name: string;
  permissions: { _id: string; name: string }[];
}

interface Permission {
  _id: string;
  name: string;
}

const RolesAndPermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const { isOpen, openModal, closeModal } = useModal();
  const [activeRole, setActiveRole] = useState<Role | null>(null);
  const { reFetch, setReFetch } = useGlobalContext();
  const [confirmationModal, setConfirmationModal] = useState(false);

  const handleCreateRole = async (data: {
    name: string;
    permissions: string[];
  }) => {
    const permissionIds = data.permissions
      .map((permName) => permissions.find((perm) => perm.name === permName))
      .filter((perm): perm is Permission => perm !== undefined)
      .map((perm) => perm._id);

    const payload = {
      name: data.name,
      permissions: permissionIds
    };

    try {
      if (activeRole) {
        await updateRole(activeRole._id, payload);
        toast(
          MESSAGES.SUCCESS.ENTITY_UPDATED.replace("{{ entity }}", "Role"),
          "success"
        );
      } else {
        await createRole(payload);
        toast(
          MESSAGES.SUCCESS.ENTITY_ADDED.replace("{{ entity }}", "Role"),
          "success"
        );
      }

      setActiveRole(null);
      setReFetch(!reFetch);
      closeModal();
    } catch {
      toast("Failed to save role. Please try again.", "error");
    }
  };

  const fetchData = async () => {
    const { roles: fetchedRoles } = await getRoles();
    const { permissions: fetchedPermissions } = await getPermissions();

    setRoles(fetchedRoles);
    setPermissions(fetchedPermissions);
  };

  useEffect(() => {
    fetchData();
  }, [reFetch]);

  const handleEdit = (role: Role) => {
    setActiveRole(role);
    openModal();
  };

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Roles & Permissions
        </h1>
        <Button
          onClick={() => {
            setActiveRole(null);
            openModal();
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Role
        </Button>
      </div>

      {/* Create Role Modal */}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        className="max-w-[1000px] max-h-[50rem]  m-4"
      >
        <CreateRoleModal
          onClose={closeModal}
          onSubmit={handleCreateRole}
          permissions={permissions.map((p) => p.name)}
          activeRole={activeRole}
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
                Permissions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.length > 0 ? (
              roles.map((role) => (
                <tr key={role._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {role.name}
                  </td>
                  {/* Permissions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex flex-wrap gap-2">
                      {role.permissions
                        .slice(0, 2)
                        .map((role: any, idx: number) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                          >
                            {role.name}
                          </span>
                        ))}
                      {role.permissions.length > 2 && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded-full text-xs">
                          + {role.permissions.length - 2}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleEdit(role)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setActiveRole(role);
                        setConfirmationModal(true);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
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

      <Modal
        isOpen={confirmationModal}
        onClose={() => setConfirmationModal(false)}
        className="max-w-[600px] min-h-[150px] m-4"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2">
            Are you sure you want to delete the role{" "}
            <strong>{activeRole?.name}</strong>?
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setConfirmationModal(false)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!activeRole) return;
                try {
                  await deleteRole(activeRole._id);
                  toast(
                    MESSAGES.SUCCESS.ENTITY_DELETED.replace(
                      "{{ entity }}",
                      "Role"
                    ),
                    "success"
                  );
                  setReFetch(!reFetch);
                } catch {
                  toast("Failed to delete role. Please try again.", "error");
                } finally {
                  setConfirmationModal(false);
                  setActiveRole(null);
                }
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

export default RolesAndPermissions;
