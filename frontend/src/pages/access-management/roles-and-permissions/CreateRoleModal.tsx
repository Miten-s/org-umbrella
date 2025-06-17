import { useForm } from 'react-hook-form';
import Label from '../../../components/common/form/Label';
import Input from '../../../components/common/form/input/InputField';
import Button from '../../../components/ui/button/Button';
import Checkbox from '../../../components/common/form/input/Checkbox';
import { useTranslation } from 'react-i18next';

interface CreateRoleModalProps {
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    permissions: string[]
  }) => void;
  permissions: string[];
  activeRole?: {
    name: string;
    permissions: { name: string }[]
  } | null;
}

const groupPermissions = (permissions: string[]): Record<string, string[]> => {
  const grouped: Record<string, string[]> = {};
  permissions.forEach((perm) => {
    const [action, entity] = perm.split(':');
    if (!entity || !action) return;
    if (!grouped[entity]) grouped[entity] = [];
    if (!grouped[entity].includes(action)) grouped[entity].push(action);
  });
  return grouped;
};

const CreateRoleModal = ({ onClose, onSubmit, permissions: allPermissions, activeRole }: CreateRoleModalProps) => {
  const { register, handleSubmit, watch, setValue } = useForm<{
    name: string;

    permissions: string[];
  }>({
    defaultValues: {
      name: activeRole?.name || '',
      permissions: activeRole?.permissions.map(p => p.name) || [],
    },
  });


  const selectedPermissions = watch('permissions');
  const groupedPermissions = groupPermissions(allPermissions);
  const { t } = useTranslation()

  const togglePermission = (permission: string) => {
    const updated = selectedPermissions.includes(permission)
      ? selectedPermissions.filter((p) => p !== permission)
      : [...selectedPermissions, permission];
    setValue('permissions', updated);
  };

  const toggleAllForGroup = (entity: string) => {
    const perms = groupedPermissions[entity].map((action) => `${action}:${entity}`);
    const hasAll = perms.every((p) => selectedPermissions.includes(p));
    const updated = hasAll
      ? selectedPermissions.filter((p) => !perms.includes(p))
      : [...selectedPermissions, ...perms.filter((p) => !selectedPermissions.includes(p))];
    setValue('permissions', updated);
  };

  const toggleAllPermissions = () => {
    const hasAll = allPermissions.every((p) => selectedPermissions.includes(p));
    const updated = hasAll
      ? selectedPermissions.filter((p) => !allPermissions.includes(p))
      : [...selectedPermissions, ...allPermissions.filter((p) => !selectedPermissions.includes(p))];
    setValue('permissions', updated);
  };

  const onFormSubmit = (data: { name: string; permissions: string[] }) => {
    onSubmit({ ...data, name: data.name.trim() });
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <h2 className="text-xl font-semibold mb-4">{t('createNewRole')}</h2>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="space-y-6">
          {/* Role Name */}
          <div>
            <Label htmlFor="name">{t('roleName')}</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Admin, Manager"
              {...register('name', { required: true })}
              className="mt-1 w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* Permissions */}
          <div>
            <Label className="block">{t('permissions')}</Label>
            {/* Select All */}
            <Checkbox
              label="Select All Permissions"
              checked={allPermissions.every((perm) => selectedPermissions.includes(perm))}
              onChange={toggleAllPermissions}
              className="mt-2"
            />

            {/* Grouped Permissions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
              {Object.entries(groupedPermissions).map(([entity, actions]) => {
                const groupPerms = actions.map((action) => `${action}:${entity}`);
                const allSelected = groupPerms.every((p) => selectedPermissions.includes(p));

                return (
                  <div
                    key={entity}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 shadow-sm"
                  >
                    <Checkbox
                      label={`All ${entity}`}
                      checked={allSelected}
                      onChange={() => toggleAllForGroup(entity)}
                      className="mb-2 font-medium"
                    />
                    <div className="mt-2 space-y-2 ml-2">
                      {actions.map((action) => {
                        const key = `${action}:${entity}`;
                        return (
                          <Checkbox
                            key={key}
                            label={action.charAt(0).toUpperCase() + action.slice(1).toLowerCase()}
                            checked={selectedPermissions.includes(key)}
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

        {/* Footer Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            type="button"
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {t('cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="bg-blue-600 hover:bg-blue-700 text-white transition"
          >
            {t('save')}
          </Button>
        </div>
      </form>
    </div>

  );
};

export default CreateRoleModal;
