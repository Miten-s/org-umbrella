import { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { isPayloadEqual } from "@/lib/formChangeDetection";

import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Switch from "@/components/common/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import SignatureField, { type SignatureFieldHandle } from "@/components/common/SignatureField";
import { getImageUrl } from "@/services/utils.service";
import { useAvailablePlatformUserOptions } from "./LimsUser.options";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsRoleOptions } from "@/pages/lims/roles/LimsRole.queries";
import { limsUserSchema, type LimsUserFormValues } from "./LimsUser.schema";
import type { LimsRef, LimsUser, LimsUserPayload } from "./LimsUser.types";
import type { AsyncOption } from "@/lib/query/listTypes";

/** "copy" renders like "create" — the platform user picker (locked on Edit) is unlocked and
 * blanked instead, since Copy's point is assigning the same roles to a DIFFERENT person.
 */
export type LimsUserFormMode = "create" | "edit" | "view" | "copy" | "bulk-edit";

interface LimsUserFormProps {
  mode?: LimsUserFormMode;
  initialData?: LimsUser | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: LimsUserPayload) => Promise<void> | void;
  submitting?: boolean;
  /** Overrides the submit button's label — CopyStepper uses this to say
   * "Next" on every step but the last, where the batch actually saves. */
  submitLabel?: string;
  /** Grays out the submit button without a spinner — EditStepper uses
   * this on the last step now that its own Save button lives outside it. */
  disabled?: boolean;
  /** Set on the `<form>` element so an outside button (CopyStepper's
   * header Next/Save) can submit it via `<Button form={formId}>`. */
  formId?: string;
  /** " (2 of 5)" appended after the title when Copy is reviewing more
   * than one record — undefined otherwise. */
  stepLabel?: string;
}

const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const seedMany = (refs: LimsRef[] | undefined) =>
  (refs ?? [])
    .filter((ref) => ref?.id && ref.name)
    .map((ref) => ({ value: ref.id, label: String(ref.name) }));

/** Grants an existing platform user access and assigns lab roles — mirrors GXP Service Users;
 * name/email/phone aren't editable here, they belong to the platform user record. */
const LimsUserForm = ({
  mode = "create",
  initialData,
  onClose,
  onUnchanged,
  onSubmit,
  submitting = false,
  submitLabel,
  disabled = false,
  formId,
  stepLabel
}: LimsUserFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  // Captured from AsyncSelect so the payload can carry `user: { id, name }`; blank on Copy.
  const [selectedUserName, setSelectedUserName] = useState(
    mode === "copy" ? "" : (initialData?.userName ?? "")
  );
  // Same draw-a-signature pattern as System IT Administration's Users form —
  // read imperatively at submit time, not through react-hook-form.
  const signatureRef = useRef<SignatureFieldHandle>(null);

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsUserFormValues>(
    () => ({
      userId: mode === "copy" ? "" : (initialData?.userId ?? ""),
      group: initialData?.group?.id ?? "",
      location: initialData?.location?.id ?? "",
      accessGroups: (initialData?.accessGroups ?? []).map((ref) => ref.id),
      roles: (initialData?.roles ?? []).map((ref) => ref.id),
      description: initialData?.description ?? "",
      trainingCompleted: initialData?.trainingCompleted ?? false
    }),
    [initialData, mode]
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsUserFormValues>({
    resolver: zodResolver(limsUserSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  const userSeed: AsyncOption[] | undefined =
    mode !== "copy" && initialData?.userId
      ? [{ value: initialData.userId, label: initialData.userName ?? "" }]
      : undefined;

  // Copy's picker only offers platform users with no Lab User record yet — when that
  // list is genuinely empty, say so instead of leaving a silent, unexplained blank dropdown.
  const availableUsers = useAvailablePlatformUserOptions({
    search: "",
    enabled: mode === "copy"
  });
  const noUsersAvailable =
    mode === "copy" && !availableUsers.isLoading && availableUsers.options.length === 0;

  const err = (field: keyof LimsUserFormValues) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-500">{errors[field]?.message as string}</p>
    ) : null;

  const submit = (values: LimsUserFormValues) => {
    // Only carry a signature when one was actually (re)drawn — an untouched
    // pad on an edit must leave the existing signature alone, not blank it.
    const signature = signatureRef.current?.getSignature();

    // Edit + nothing actually changed: skip the reason modal, update call,
    // and audit entry entirely — a no-op Save just closes.
    if ((mode === "edit" || mode === "bulk-edit") && !signature && isPayloadEqual(values, initialValues)) {
      (onUnchanged ?? onClose)();
      return;
    }

    return onSubmit({
      user: { id: values.userId, name: selectedUserName },
      group: values.group,
      location: values.location,
      accessGroups: values.accessGroups,
      roles: values.roles,
      ...(signature ? { signature } : {}),
      description: values.description,
      trainingCompleted: values.trainingCompleted
    });
  };

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form id={formId} onSubmit={handleSubmit(submit)} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsUser") })
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsUser") })}${stepLabel ?? ""}`
              : initialData
                ? `${t("update", { entity: t("limsUser") })}${stepLabel ?? ""}`
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
                  useOptions={useAvailablePlatformUserOptions}
                  value={field.value}
                  onChange={field.onChange}
                  onChangeOption={(option) => setSelectedUserName(option?.label ?? "")}
                  // Existing assignments can't be repointed at a different
                  // user — Copy is the one exception, see LimsUserFormMode.
                  disabled={isReadOnly || (Boolean(initialData) && mode !== "copy")}
                  error={!!errors.userId}
                  placeholder={t("select", { entity: t("user") })}
                  initialSelectedOptions={userSeed}
                />
              )}
            />
            {err("userId")}
            {noUsersAvailable && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("limsNoAvailablePlatformUsers")}
              </p>
            )}
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

          <div className="min-w-0 md:col-span-2">
            <Label>{t("limsSignature")}</Label>
            <SignatureField
              ref={signatureRef}
              existingUrl={getImageUrl(initialData?.signature)}
              disabled={isReadOnly}
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
            <Button type="submit" variant="primary" loading={busy} disabled={busy || disabled}>
              {submitLabel ?? t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default LimsUserForm;
