import { useForm } from 'react-hook-form';
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
  const { register, handleSubmit, watch, setValue } = useForm<{
    name: string;
    permissions: string[];
  }>({
    defaultValues: {
      name: '',
      permissions: [],
    },
  });

  const permissions = watch('permissions');

  const togglePermission = (permission: string) => {
    const newPermissions = permissions.includes(permission)
      ? permissions.filter((p) => p !== permission)
      : [...permissions, permission];
    setValue('permissions', newPermissions);
  };

  const toggleAllForGroup = (group: string) => {
    const groupPermissions = permissionGroups[group].map(
      (action) => `${group.toLowerCase()}:${action}`
    );
    const hasAll = groupPermissions.every((p) => permissions.includes(p));

    const updatedPermissions = hasAll
      ? permissions.filter((p) => !groupPermissions.includes(p))
      : [...permissions, ...groupPermissions.filter((p) => !permissions.includes(p))];

    setValue('permissions', updatedPermissions);
  };

  const toggleAllPermissions = () => {
    const allPermissions = Object.entries(permissionGroups).flatMap(([group, actions]) =>
      actions.map((action) => `${group.toLowerCase()}:${action}`)
    );
    const hasAll = allPermissions.every((p) => permissions.includes(p));

    const updated = hasAll
      ? permissions.filter((p) => !allPermissions.includes(p))
      : [...permissions, ...allPermissions.filter((p) => !permissions.includes(p))];

    setValue('permissions', updated);
  };

  const onFormSubmit = (data: { name: string; permissions: string[] }) => {
    onSubmit(data);
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4">Create New Role</h2>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="space-y-6">
          <div>
            <Label htmlFor="name">Role Name</Label>
            <Input id="name" type="text" {...register('name', { required: true })} />
          </div>

          <div>
            <Label>Permissions</Label>
            <Checkbox
              label="Select All Permissions"
              checked={Object.entries(permissionGroups)
                .flatMap(([group, actions]) => actions.map((action) => `${group.toLowerCase()}:${action}`))
                .every((perm) => permissions.includes(perm))}
              onChange={toggleAllPermissions}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-2">
              {Object.entries(permissionGroups).map(([group, actions]) => {
                const groupPermissions = actions.map((a) => `${group.toLowerCase()}:${a}`);
                const allSelected = groupPermissions.every((p) => permissions.includes(p));

                return (
                  <div key={group} className="border rounded-md p-4 shadow-sm bg-gray-50 dark:bg-gray-900">
                    <Checkbox
                      label={`All ${group}`}
                      checked={allSelected}
                      onChange={() => toggleAllForGroup(group)}
                    />
                    <div className="mt-2 space-y-2 ml-2">
                      {actions.map((action) => {
                        const key = `${group.toLowerCase()}:${action}`;
                        return (
                          <Checkbox
                            key={key}
                            label={action.charAt(0).toUpperCase() + action.slice(1)}
                            checked={permissions.includes(key)}
                            onChange={() => togglePermission(key)}
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
          <Button type="submit" variant="primary">
            Create Role
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateRoleModal;
