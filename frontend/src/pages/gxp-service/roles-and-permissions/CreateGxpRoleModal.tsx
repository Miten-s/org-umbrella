import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";
import Checkbox from "@/components/common/form/input/Checkbox";

import { getGxpRoleSchema } from "@/lib/schema";
import type { GxpPermission } from "@/types/common.types";

interface CreateGxpRoleModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  permissions?: Array<
    GxpPermission | { _id: string; name?: string; description?: string }
  >;
}

type CreateGxpRoleForm = z.infer<typeof getGxpRoleSchema>;

type GroupedPermission = { id: string; action: string };

const parsePermissionName = (name: string) => {
  const parts = (name || "").split(":").filter(Boolean);
  if (parts.length >= 3) return { action: parts[1], entity: parts[2] };
  if (parts.length === 2) return { action: parts[0], entity: parts[1] };
  return { action: name || "Permission", entity: "Other" };
};

const groupPermissions = (
  permissions: Array<GxpPermission | { _id: string; name?: string }>
): Record<string, GroupedPermission[]> => {
  const grouped: Record<string, GroupedPermission[]> = {};
  permissions.forEach((perm) => {
    const label =
      "permissionName" in perm ? perm.permissionName : (perm.name ?? "");
    const { action, entity } = parsePermissionName(label);
    if (!entity || !action) return;
    if (!grouped[entity]) grouped[entity] = [];
    if (!grouped[entity].some((item) => item.id === perm._id)) {
      grouped[entity].push({ id: perm._id, action });
    }
  });
  return grouped;
};

const CreateGxpRoleModal = ({
  onClose,
  onSubmit,
  initialData,
  permissions = []
}: CreateGxpRoleModalProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors }
  } = useForm<CreateGxpRoleForm>({
    resolver: zodResolver(getGxpRoleSchema),
    defaultValues: {
      roleName: initialData?.roleName ?? initialData?.name ?? "",
      permissions: initialData?.permissions || [],
      description: initialData?.description || ""
    }
  });

  const description = useWatch({ control, name: "description" });
  const selectedPermissionIds = useWatch({ control, name: "permissions" });
  const allPermissionIds = useMemo(
    () => permissions.map((perm) => perm._id),
    [permissions]
  );
  const groupedPermissions = useMemo(
    () => groupPermissions(permissions),
    [permissions]
  );

  const handlePermissionSelect = (id: string) => {
    const currentPermissions = selectedPermissionIds || [];
    const newPermissions = currentPermissions.includes(id)
      ? currentPermissions.filter((permissionId) => permissionId !== id)
      : [...currentPermissions, id];
    setValue("permissions", newPermissions, { shouldValidate: true });
  };

  const toggleAllPermissions = () => {
    const hasAll = allPermissionIds.every((id) =>
      (selectedPermissionIds || []).includes(id)
    );
    const updated = hasAll
      ? (selectedPermissionIds || []).filter(
          (id) => !allPermissionIds.includes(id)
        )
      : [...new Set([...(selectedPermissionIds || []), ...allPermissionIds])];
    setValue("permissions", updated, { shouldValidate: true });
  };

  const toggleAllForGroup = (entity: string) => {
    const perms = groupedPermissions[entity]?.map((item) => item.id) ?? [];
    const hasAll = perms.every((id) =>
      (selectedPermissionIds || []).includes(id)
    );
    const updated = hasAll
      ? (selectedPermissionIds || []).filter((id) => !perms.includes(id))
      : [...new Set([...(selectedPermissionIds || []), ...perms])];
    setValue("permissions", updated, { shouldValidate: true });
  };

  return (
    <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t(initialData ? "edit" : "create", {
            entity: t("gxpRolesAndPermissions")
          })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Role Name */}
          <div>
            <Label htmlFor="roleName" required>
              {t("gxpRoleName")}
            </Label>
            <Input
              {...register("roleName")}
              error={!!errors.roleName}
              hint={errors.roleName?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Permissions */}
          <div className="relative col-span-2">
            <Label required>{t("gxpPermissions")}</Label>
            <input type="hidden" {...register("permissions")} />
            <Checkbox
              label={t("selectAllPermissions", {
                defaultValue: "Select All Permissions"
              })}
              checked={allPermissionIds.every((id) =>
                (selectedPermissionIds || []).includes(id)
              )}
              onChange={toggleAllPermissions}
              className="flex"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
              {Object.entries(groupedPermissions).map(([entity, items]) => {
                const groupPerms = items.map((item) => item.id);
                const allSelected = groupPerms.every((id) =>
                  (selectedPermissionIds || []).includes(id)
                );

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
                      {items.map((item) => (
                        <Checkbox
                          key={item.id}
                          label={
                            item.action.charAt(0).toUpperCase() +
                            item.action.slice(1).toLowerCase()
                          }
                          checked={(selectedPermissionIds || []).includes(
                            item.id
                          )}
                          onChange={() => handlePermissionSelect(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {errors.permissions && (
              <p className="text-xs text-error-500 mt-1">
                {errors.permissions.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="col-span-2">
            <Label>{t("description")}</Label>
            <TextArea
              value={description || ""}
              onChange={(val) => setValue("description", val)}
              error={!!errors.description}
              hint={errors.description?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" variant="primary">
            {t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateGxpRoleModal;
