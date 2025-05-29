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
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4"> {t('createNewRole')}</h2>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="space-y-6">
          <div>
            <Label htmlFor="name">{t('roleName')}</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Admin, Manager"
              {...register('name', { required: true })}
            />
          </div>

          <div>
            <Label> {t('permissions')}</Label>
            <Checkbox
              label="Select All Permissions"
              checked={allPermissions.every((perm) => selectedPermissions.includes(perm))}
              onChange={toggleAllPermissions}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
              {Object.entries(groupedPermissions).map(([entity, actions]) => {
                const groupPerms = actions.map((action) => `${action}:${entity}`);
                const allSelected = groupPerms.every((p) => selectedPermissions.includes(p));

                return (
                  <div key={entity} className="border rounded-md p-4 shadow-sm bg-gray-50 dark:bg-gray-900">
                    <Checkbox
                      label={`All ${entity}`}
                      checked={allSelected}
                      onChange={() => toggleAllForGroup(entity)}
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

        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} type="button">
            {t('cancel')}
          </Button>
           <Button type="submit" variant="primary">
            {t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateRoleModal;
