import { useState } from 'react';
import Label from '../../../components/common/form/Label';
import Input from '../../../components/common/form/input/InputField';
import Button from '../../../components/ui/button/Button';
import Checkbox from '../../../components/common/form/input/Checkbox';

interface CreateRoleModalProps {
  onClose: () => void;
  onSubmit: (data: { name: string; permissions: string[] }) => void;
}

const permissionGroups: Record<string, string[]> = {
  Admin: ['create', 'read', 'update', 'delete'],
  Dashboard: ['create', 'read', 'update', 'delete'],
  Blog: ['create', 'read', 'update', 'delete'],
  Profile: ['create', 'read', 'update', 'delete'],
  Roles: ['create', 'read', 'update', 'delete'],
  // Add more as needed...
};

const CreateRoleModal = ({ onClose, onSubmit }: CreateRoleModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    permissions: [] as string[],
  });

  const togglePermission = (permission: string) => {
    setFormData((prev) => {
      const permissions = prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions };
    });
  };

  const toggleAllForGroup = (group: string) => {
    const allPermissions = permissionGroups[group].map(
      (action) => `${group.toLowerCase()}:${action}`
    );
    const hasAll = allPermissions.every((perm) => formData.permissions.includes(perm));

    setFormData((prev) => {
      const updated = hasAll
        ? prev.permissions.filter((p) => !allPermissions.includes(p))
        : [...prev.permissions, ...allPermissions.filter((p) => !prev.permissions.includes(p))];
      return { ...prev, permissions: updated };
    });
  };

  const toggleAllPermissions = () => {
    const allPermissions = Object.entries(permissionGroups).flatMap(([group, actions]) =>
      actions.map((action) => `${group.toLowerCase()}:${action}`)
    );

    const hasAllPermissions = allPermissions.every((perm) => formData.permissions.includes(perm));

    setFormData((prev) => {
      const updatedPermissions = hasAllPermissions
        ? prev.permissions.filter((p) => !allPermissions.includes(p))
        : [...prev.permissions, ...allPermissions.filter((p) => !prev.permissions.includes(p))];
      return { ...prev, permissions: updatedPermissions };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Create New Role</h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Role Name</Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <Label>Permissions</Label>
            <Checkbox
              label="Select All Permissions"
              checked={Object.entries(permissionGroups).flatMap(([group, actions]) =>
                actions.map((action) => `${group.toLowerCase()}:${action}`)
              ).every((perm) => formData.permissions.includes(perm))}
              onChange={toggleAllPermissions}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-2">
              {Object.entries(permissionGroups).map(([group, actions]) => {
                const allPermissions = actions.map((a) => `${group.toLowerCase()}:${a}`);
                const allSelected = allPermissions.every((p) => formData.permissions.includes(p));

                return (
                  <div
                    key={group}
                    className="border rounded-md p-4 shadow-sm bg-gray-50 dark:bg-gray-900"
                  >
                    <Checkbox
                      label={`All ${group}`}
                      checked={allSelected}
                      onChange={() => toggleAllForGroup(group)}
                    />
                    <div className="mt-2 space-y-2 ml-2">
                      {actions.map((action) => {
                        const permissionKey = `${group.toLowerCase()}:${action}`;
                        return (
                          <Checkbox
                            key={permissionKey}
                            label={action.charAt(0).toUpperCase() + action.slice(1)}
                            checked={formData.permissions.includes(permissionKey)}
                            onChange={() => togglePermission(permissionKey)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary">
            Create Role
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateRoleModal;
