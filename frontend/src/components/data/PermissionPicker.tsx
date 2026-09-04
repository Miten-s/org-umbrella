import Checkbox from "@/components/common/form/input/Checkbox";
import Label from "@/components/common/form/Label";

/** Shared "pick from the seeded catalog" permission checklist, grouped by entity — assigns a
 * subset of the backend-seeded catalog to a role, never creates permissions itself. */

type GroupedPermission = { action: string; key: string };

/** Parses "ACTION:ENTITY" or "<PREFIX>:ACTION:ENTITY" (e.g. "LIMS:CREATE:ROLE"). */
const groupPermissions = (permissions: string[]): Record<string, GroupedPermission[]> => {
  const grouped: Record<string, GroupedPermission[]> = {};
  permissions.forEach((perm) => {
    const parts = perm.split(":");
    let action = "";
    let entity = "";
    if (parts.length >= 3) {
      action = parts[1];
      entity = parts[2];
    } else if (parts.length === 2) {
      action = parts[0];
      entity = parts[1];
    }
    if (!entity || !action) return;
    if (!grouped[entity]) grouped[entity] = [];
    if (!grouped[entity].some((item) => item.key === perm)) {
      grouped[entity].push({ action, key: perm });
    }
  });
  return grouped;
};

interface PermissionPickerProps {
  /** Full seeded catalog (permission strings), e.g. from LIMS_PERMISSIONS / GXP_PERMISSIONS. */
  allPermissions: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  label?: string;
  error?: string;
}

const PermissionPicker = ({
  allPermissions,
  selected,
  onChange,
  disabled = false,
  label = "Permissions",
  error
}: PermissionPickerProps) => {
  const groupedPermissions = groupPermissions(allPermissions);

  const togglePermission = (permission: string) => {
    onChange(
      selected.includes(permission)
        ? selected.filter((p) => p !== permission)
        : [...selected, permission]
    );
  };

  const toggleAllForGroup = (entity: string) => {
    const perms = groupedPermissions[entity].map((item) => item.key);
    const hasAll = perms.every((p) => selected.includes(p));
    onChange(
      hasAll
        ? selected.filter((p) => !perms.includes(p))
        : [...selected, ...perms.filter((p) => !selected.includes(p))]
    );
  };

  const toggleAllPermissions = () => {
    const hasAll = allPermissions.every((p) => selected.includes(p));
    onChange(
      hasAll
        ? selected.filter((p) => !allPermissions.includes(p))
        : [...selected, ...allPermissions.filter((p) => !selected.includes(p))]
    );
  };

  return (
    <div>
      <Label className="block">{label}</Label>

      <Checkbox
        label="Select All Permissions"
        checked={allPermissions.length > 0 && allPermissions.every((p) => selected.includes(p))}
        disabled={disabled || allPermissions.length === 0}
        onChange={toggleAllPermissions}
        className="flex"
      />

      {error ? <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p> : null}

      <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
        {Object.entries(groupedPermissions).map(([entity, items]) => {
          const groupPerms = items.map((item) => item.key);
          const allSelected = groupPerms.every((p) => selected.includes(p));

          return (
            <div
              key={entity}
              className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <Checkbox
                label={`All ${entity}`}
                checked={allSelected}
                disabled={disabled}
                onChange={() => toggleAllForGroup(entity)}
                className="mb-3 font-medium"
                labelClassName="min-w-0 whitespace-normal break-words leading-5"
              />

              <div className="mt-2 space-y-2 pl-2">
                {items.map((item) => (
                  <Checkbox
                    key={item.key}
                    label={item.action.charAt(0).toUpperCase() + item.action.slice(1).toLowerCase()}
                    checked={selected.includes(item.key)}
                    disabled={disabled}
                    onChange={() => togglePermission(item.key)}
                    labelClassName="whitespace-normal break-words leading-5"
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionPicker;
