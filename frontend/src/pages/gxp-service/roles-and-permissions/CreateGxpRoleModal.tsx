import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import TextArea from "@/components/common/form/input/TextArea";

import { getGxpRoleSchema } from "@/lib/schema";
import { GxpPermission } from "@/types/common.types";

interface CreateGxpRoleModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  permissions?: GxpPermission[];
}

type CreateGxpRoleForm = z.infer<typeof getGxpRoleSchema>;

const CreateGxpRoleModal = ({
  onClose,
  onSubmit,
  initialData,
  permissions = [],
}: CreateGxpRoleModalProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateGxpRoleForm>({
    resolver: zodResolver(getGxpRoleSchema),
    defaultValues: {
      roleName: initialData?.roleName || "",
      permissions: initialData?.permissions || [],
      description: initialData?.description || "",
    },
  });

  const description = useWatch({ control, name: "description" });

  const [permissionsDropdownOpen, setPermissionsDropdownOpen] = useState(false);

  const selectedPermissionIds = useWatch({ control, name: "permissions" });

  const handlePermissionSelect = (id: string) => {
    const currentPermissions = selectedPermissionIds || [];
    const newPermissions = currentPermissions.includes(id)
      ? currentPermissions.filter((permissionId) => permissionId !== id)
      : [...currentPermissions, id];
    setValue("permissions", newPermissions, { shouldValidate: true });
  };

  return (
    <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t(initialData ? "edit" : "create", { entity: t("gxpRolesAndPermissions") })}
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

          {/* Permissions Dropdown */}
          <div className="relative col-span-2">
            <Label required>{t("gxpPermissions")}</Label>
            <input type="hidden" {...register("permissions")} />
            <button
              type="button"
              onClick={() => setPermissionsDropdownOpen((prev) => !prev)}
              className="input flex justify-between items-center dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <span className="text-theme-sm dark:text-gray-400">
                {selectedPermissionIds?.length > 0
                  ? `${selectedPermissionIds.length} permissions selected`
                  : t("select", { entity: t("gxpPermissions") })}
              </span>
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.5 7l4.5 4.5L14.5 7z" />
              </svg>
            </button>

            <Dropdown
              isOpen={permissionsDropdownOpen}
              onClose={() => setPermissionsDropdownOpen(false)}
              className="absolute z-10 mt-1 w-full rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-md text-gray-900 dark:text-gray-100"
            >
              {permissions?.map((permission) => (
                <DropdownItem
                  key={permission._id}
                  onItemClick={() => handlePermissionSelect(permission._id)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissionIds?.includes(permission._id)}
                    readOnly
                    className="mr-2"
                  />
                  {permission.permissionName}
                </DropdownItem>
              ))}
            </Dropdown>

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
