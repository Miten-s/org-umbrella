import { useEffect } from "react";
import { useForm } from "react-hook-form";
import Label from "../../../components/common/form/Label";
import Input from "../../../components/common/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import Checkbox from "../../../components/common/form/input/Checkbox";
import { useTranslation } from "react-i18next";
import { PermissionType } from "@/utils/common.constants";

interface CreateRoleModalProps {
  onClose: () => void;
  onSubmit: (data: { name: string; permissions: string[] }) => void;
  permissions: string[];
  permissionType?: PermissionType;
  onPermissionTypeChange?: (type: "default" | "gxp_service") => void;
  mode?: "create" | "edit" | "view";
  activeRole?: {
    name: string;
    permissions: { name: string }[];
  } | null;
}

type GroupedPermission = { action: string; key: string };

const groupPermissions = (
  permissions: string[]
): Record<string, GroupedPermission[]> => {
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

const CreateRoleModal = ({
  onClose,
  onSubmit,
  permissions: allPermissions,
  permissionType,
  onPermissionTypeChange,
  mode = "create",
  activeRole
}: CreateRoleModalProps) => {
  const isFixedType = !onPermissionTypeChange;
  const isReadOnly = mode === "view";
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm<{
    name: string;

    permissions: string[];
  }>({
    defaultValues: {
      name: activeRole?.name || "",
      permissions: activeRole?.permissions.map((p) => p.name) || []
    }
  });

  const selectedPermissions = watch("permissions");
  const groupedPermissions = groupPermissions(allPermissions);
  const { t } = useTranslation();

  useEffect(() => {
    const filtered = selectedPermissions.filter((perm) =>
      allPermissions.includes(perm)
    );
    if (filtered.length === selectedPermissions.length) return;
    setValue("permissions", filtered);
  }, [allPermissions, selectedPermissions, setValue]);

  useEffect(() => {
    if (selectedPermissions.length > 0) {
      clearErrors("permissions");
    }
  }, [clearErrors, selectedPermissions.length]);

  const togglePermission = (permission: string) => {
    const updated = selectedPermissions.includes(permission)
      ? selectedPermissions.filter((p) => p !== permission)
      : [...selectedPermissions, permission];
    setValue("permissions", updated);
  };

  const toggleAllForGroup = (entity: string) => {
    const perms = groupedPermissions[entity].map((item) => item.key);
    const hasAll = perms.every((p) => selectedPermissions.includes(p));
    const updated = hasAll
      ? selectedPermissions.filter((p) => !perms.includes(p))
      : [
        ...selectedPermissions,
        ...perms.filter((p) => !selectedPermissions.includes(p))
      ];
    setValue("permissions", updated);
  };

  const toggleAllPermissions = () => {
    const hasAll = allPermissions.every((p) => selectedPermissions.includes(p));
    const updated = hasAll
      ? selectedPermissions.filter((p) => !allPermissions.includes(p))
      : [
        ...selectedPermissions,
        ...allPermissions.filter((p) => !selectedPermissions.includes(p))
      ];
    setValue("permissions", updated);
  };

  const onFormSubmit = (data: { name: string; permissions: string[] }) => {
    if (!data.permissions?.length) {
      setError("permissions", {
        type: "manual",
        message: t("selectAtLeastOnePermission", {
          defaultValue: "Select at least one permission."
        })
      });
      return;
    }
    return onSubmit({ ...data, name: data.name.trim() });
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <h2 className="text-xl font-semibold">
        {isReadOnly
          ? t("view", { entity: t("role") })
          : t(activeRole ? "edit" : "create", { entity: t("role") })}
      </h2>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="space-y-6">
          {/* Role Name */}
          <div>
            <Label htmlFor="name">{t("roleName")}</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g. Admin, Manager"
              disabled={isReadOnly}
              {...register("name", { required: true })}
              className="mt-1 w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md px-3 py-2 text-sm"
            />
          </div>
          {errors.permissions?.message && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">
              {errors.permissions.message}
            </p>
          )}
          {!isFixedType && (
            <div className="flex items-center gap-2">
              {[
                {
                  label: t("adminPermissions", {
                    defaultValue: "Admin Permissions"
                  }),
                  value: "default"
                },
                {
                  label: t("gxpServicePermissions", {
                    defaultValue: "GXP Services Permissions"
                  }),
                  value: "gxp_service"
                }
              ].map((tab) => {
                const isActive = permissionType === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    disabled={isReadOnly}
                    onClick={() =>
                      onPermissionTypeChange?.(
                        tab.value as "default" | "gxp_service"
                      )
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition ${isActive
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
                      }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Permissions */}
          <div>
            <Label className="block">{t("permissions")}</Label>

            {/* Select All */}
            <Checkbox
              label="Select All Permissions"
              checked={allPermissions.every((perm) =>
                selectedPermissions.includes(perm)
              )}
              disabled={isReadOnly}
              onChange={toggleAllPermissions}
              className="flex"
            />

            {/* Grouped Permissions */}
            {/* Grouped Permissions */}
            <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-6">
              {Object.entries(groupedPermissions).map(([entity, items]) => {
                const groupPerms = items.map((item) => item.key);
                const allSelected = groupPerms.every((p) =>
                  selectedPermissions.includes(p)
                );

                return (
                  <div
                    key={entity}
                    className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900"
                  >
                    <Checkbox
                      label={`All ${entity}`}
                      checked={allSelected}
                      disabled={isReadOnly}
                      onChange={() => toggleAllForGroup(entity)}
                      className="mb-3 font-medium"
                      labelClassName="min-w-0 whitespace-normal break-words leading-5"
                    />

                    <div className="mt-2 space-y-2 pl-2">
                      {items.map((item) => (
                        <Checkbox
                          key={item.key}
                          label={
                            item.action.charAt(0).toUpperCase() +
                            item.action.slice(1).toLowerCase()
                          }
                          checked={selectedPermissions.includes(item.key)}
                          disabled={isReadOnly}
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
        </div>

        {/* Footer Buttons */}
        <div className="mt-6 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            type="button"
            disabled={isSubmitting}
            className="border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {t("cancel")}
          </Button>
          {!isReadOnly ? (
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white transition"
            >
              {t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default CreateRoleModal;
