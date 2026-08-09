import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Switch from "@/components/common/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { useUserOptions } from "@/pages/system-it-admin/users/User.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsRoleOptions } from "@/pages/lims/roles/LimsRole.queries";
import { limsUserSchema, type LimsUserFormValues } from "./LimsUser.schema";
import type { LimsRef, LimsUser, LimsUserPayload } from "./LimsUser.types";
import type { AsyncOption } from "@/lib/query/listTypes";

export type LimsUserFormMode = "create" | "edit" | "view";

interface LimsUserFormProps {
  mode?: LimsUserFormMode;
  initialData?: LimsUser | null;
  onClose: () => void;
  onSubmit: (payload: LimsUserPayload) => Promise<void> | void;
  submitting?: boolean;
}

const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const seedMany = (refs: LimsRef[] | undefined) =>
  (refs ?? [])
    .filter((ref) => ref?.id && ref.name)
    .map((ref) => ({ value: ref.id, label: String(ref.name) }));

/**
 * Grants an existing platform user access to LIMS and assigns their lab roles.
 * Mirrors GXP Service Users — LIMS never creates users, so name/email/phone are
 * not editable here; they belong to the platform user record.
 */
const LimsUserForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsUserFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  // The chosen user's display name, captured from AsyncSelect so the payload can
  // carry `user: { id, name }`. Seeded on edit.
  const [selectedUserName, setSelectedUserName] = useState(initialData?.user?.name ?? "");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsUserFormValues>({
    resolver: zodResolver(limsUserSchema),
    defaultValues: {
      userId: initialData?.user?.id ?? "",
      group: initialData?.group?.id ?? "",
      location: initialData?.location?.id ?? "",
      accessGroups: (initialData?.accessGroups ?? []).map((ref) => ref.id),
      roles: (initialData?.roles ?? []).map((ref) => ref.id),
      signature: initialData?.signature ?? "",
      description: initialData?.description ?? "",
      trainingCompleted: initialData?.trainingCompleted ?? false
    }
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  const userSeed: AsyncOption[] | undefined = initialData?.user?.id
    ? [{ value: initialData.user.id, label: initialData.user.name }]
    : undefined;

  const err = (field: keyof LimsUserFormValues) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-500">{errors[field]?.message as string}</p>
    ) : null;

  const submit = (values: LimsUserFormValues) =>
    onSubmit({
      user: { id: values.userId, name: selectedUserName },
      group: values.group,
      location: values.location,
      accessGroups: values.accessGroups,
      roles: values.roles,
      signature: values.signature,
      description: values.description,
      trainingCompleted: values.trainingCompleted
    });

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(submit)} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsUser") })
            : initialData
              ? t("update", { entity: t("limsUser") })
              : t("create", { entity: t("limsUser") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <Label required>{t("user")}</Label>
            <Controller
              name="userId"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useUserOptions}
                  value={field.value}
                  onChange={field.onChange}
                  onChangeOption={(option) => setSelectedUserName(option?.label ?? "")}
                  // Existing assignments can't be repointed at a different user.
                  disabled={isReadOnly || Boolean(initialData)}
                  error={!!errors.userId}
                  placeholder={t("select", { entity: t("user") })}
                  initialSelectedOptions={userSeed}
                />
              )}
            />
            {err("userId")}
          </div>

          <div className="min-w-0">
            <Label required>{t("limsRoles")}</Label>
            <Controller
              name="roles"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  multi
                  useOptions={useLimsRoleOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.roles}
                  placeholder={t("select", { entity: t("limsRoles") })}
                  initialSelectedOptions={seedMany(initialData?.roles)}
                />
              )}
            />
            {err("roles")}
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
                  placeholder={t("select", { entity: t("limsGroup") })}
                  initialSelectedOptions={seedOne(initialData?.group)}
                />
              )}
            />
          </div>

          <div className="min-w-0">
            <Label>{t("limsLocation")}</Label>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsLocationOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsLocation") })}
                  initialSelectedOptions={seedOne(initialData?.location)}
                />
              )}
            />
          </div>

          <div className="min-w-0">
            <Label>{t("limsAccessGroups")}</Label>
            <Controller
              name="accessGroups"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  multi
                  useOptions={useLimsGroupOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsAccessGroups") })}
                  initialSelectedOptions={seedMany(initialData?.accessGroups)}
                />
              )}
            />
          </div>

          <div className="min-w-0">
            <Label>{t("limsSignature")}</Label>
            <Input
              {...register("signature")}
              disabled={isReadOnly}
              error={!!errors.signature}
              hint={errors.signature?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label>{t("limsTrainingCompleted")}</Label>
            <Controller
              name="trainingCompleted"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3 py-2">
                  <Switch
                    checked={Boolean(field.value)}
                    onChange={field.onChange}
                    label={field.value ? t("yes") : t("no")}
                  />
                </div>
              )}
            />
          </div>

          <div className="col-span-full min-w-0">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val, { shouldValidate: true })}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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

export default LimsUserForm;
