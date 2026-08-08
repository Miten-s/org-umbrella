import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Switch from "@/components/common/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";

import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsRoleOptions } from "@/pages/lims/roles/LimsRole.queries";
import { limsUserSchema, type LimsUserFormValues } from "./LimsUser.schema";
import type { LimsUser, LimsUserPayload, LimsRef } from "./LimsUser.types";

export type LimsUserFormMode = "create" | "edit" | "view";

interface LimsUserFormProps {
  mode?: LimsUserFormMode;
  initialData?: LimsUser | null;
  onClose: () => void;
  onSubmit: (payload: LimsUserPayload) => Promise<void> | void;
  submitting?: boolean;
}

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const seedMany = (refs: LimsRef[] | undefined) =>
  (refs ?? [])
    .filter((ref) => ref?.id && ref.name)
    .map((ref) => ({ value: ref.id, label: String(ref.name) }));

const LimsUserForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsUserFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsUserFormValues>({
    resolver: zodResolver(limsUserSchema),
    defaultValues: {
      userId: initialData?.userId ?? "",
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      mobileNumber: initialData?.mobileNumber ?? "",
      group: initialData?.group?.id ?? "",
      location: initialData?.location?.id ?? "",
      accessGroups: (initialData?.accessGroups ?? []).map((ref) => ref.id),
      roles: (initialData?.roles ?? []).map((ref) => ref.id),
      signature: initialData?.signature ?? "",
      description: initialData?.description ?? "",
      trainingCompleted: initialData?.trainingCompleted ?? false,
    }
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsUserFormValues,
    label: string,
    required = false,
    type = "text"
  ) => (
    <div className="min-w-0">
      <Label required={required}>{label}</Label>
      <Input
        {...register(name)}
        type={type}
        disabled={isReadOnly}
        error={!!errors[name]}
        hint={errors[name]?.message as string}
        className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        onSubmit={handleSubmit((values) => onSubmit({ ...values }))}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsUser") })
            : initialData
              ? t("update", { entity: t("limsUser") })
              : t("create", { entity: t("limsUser") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("userId", t("limsUserId"), true, "text")}
          {text("name", t("name"), true, "text")}
          {text("email", t("email"), false, "text")}
          {text("mobileNumber", t("limsMobileNumber"), false, "text")}
          <div className="min-w-0">
            <Label required={false}>{t("limsGroup")}</Label>
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
            <Label required={false}>{t("limsLocation")}</Label>
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
            <Label required={false}>{t("limsAccessGroups")}</Label>
            <Controller
              name="accessGroups"
              control={control}
              render={({ field }) => (
                <AsyncSelect multi
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
            <Label required={false}>{t("limsRoles")}</Label>
            <Controller
              name="roles"
              control={control}
              render={({ field }) => (
                <AsyncSelect multi
                  useOptions={useLimsRoleOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsRoles") })}
                  initialSelectedOptions={seedMany(initialData?.roles)}
                />
              )}
            />
          </div>
          {text("signature", t("limsSignature"), false, "text")}
          <div className="col-span-full min-w-0">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val, { shouldValidate: true })}
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
