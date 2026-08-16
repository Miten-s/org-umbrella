import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import PermissionPicker from "@/components/data/PermissionPicker";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsRolePermissions } from "./LimsRole.queries";
import { limsRoleSchema, type LimsRoleFormValues } from "./LimsRole.schema";
import {
  getLimsRolePermissionNames,
  type LimsRole,
  type LimsRolePayload,
  type LimsRef
} from "./LimsRole.types";

export type LimsRoleFormMode = "create" | "edit" | "view";

interface LimsRoleFormProps {
  mode?: LimsRoleFormMode;
  initialData?: LimsRole | null;
  onClose: () => void;
  onSubmit: (payload: LimsRolePayload) => Promise<void> | void;
  submitting?: boolean;
}

const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsRoleForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsRoleFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const identityLocked = isReadOnly;

  // Permissions are assigned from the seeded catalog below — never typed in free-form.
  const { data: rolePermissions = [] } = useLimsRolePermissions();
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    initialData ? getLimsRolePermissionNames(initialData) : []
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsRoleFormValues>({
    resolver: zodResolver(limsRoleSchema),
    defaultValues: {
      roleId: initialData?.roleId ?? "",
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      group: initialData?.group?.id ?? ""
    }
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  // selectedPermissions already holds catalogue codes ("LIMS:CREATE:SAMPLE") —
  // that IS the wire format the backend's permissions[] expects (it parses the
  // code into entity+action itself). No id lookup needed; there was one here
  // sending catalog row ids instead, which the backend can't parse, so every
  // save silently landed as an empty permission set.
  const handleFormSubmit = (values: LimsRoleFormValues) =>
    onSubmit({ ...values, permissions: selectedPermissions });

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsRole") })
            : initialData
              ? t("update", { entity: t("limsRole") })
              : t("create", { entity: t("limsRole") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <Label required>{t("limsRoleId")}</Label>
            <Input
              {...register("roleId")}
              disabled={identityLocked}
              error={!!errors.roleId}
              hint={errors.roleId?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label required>{t("name")}</Label>
            <Input
              {...register("name")}
              disabled={identityLocked}
              error={!!errors.name}
              hint={errors.name?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label>{t("limsGroup")}</Label>
            <Controller
              name="group"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsGroupOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.group}
                  placeholder={t("select", { entity: t("limsGroup") })}
                  initialSelectedOptions={seedOne(initialData?.group)}
                />
              )}
            />
            {errors.group ? (
              <p className="mt-1 text-xs text-red-500">{errors.group.message}</p>
            ) : null}
          </div>

          <div className="min-w-0 md:col-span-2">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val, { shouldValidate: true })}
              error={!!errors.description}
              hint={errors.description?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Permissions — assigned from the seeded catalog, never created here. */}
          <div className="min-w-0 md:col-span-2">
            <PermissionPicker
              allPermissions={rolePermissions.map((p) => p.name)}
              selected={selectedPermissions}
              onChange={setSelectedPermissions}
              disabled={isReadOnly}
              label={t("permissions")}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>
            {t("cancel")}
          </Button>
          {!isReadOnly ? (
            <Button type="submit" variant="primary" loading={busy}>
              {t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default LimsRoleForm;
