import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/common/form/switch/Switch";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import AsyncSelect from "@/components/data/AsyncSelect";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { useAvailablePlatformUserOptions } from "./GxpUser.queries";
import { useGxpRoleOptions } from "@/pages/gxp-service/roles-and-permissions/Role.queries";
import { gxpUserSchema, type GxpUserFormValues } from "./GxpUser.schema";
import type { GxpUser, GxpUserPayload } from "./GxpUser.types";
import type { AsyncOption } from "@/lib/query/listTypes";

/** "copy" renders like "create" — the platform user picker (locked on Edit) is unlocked and
 * blanked instead, since Copy's point is assigning the same roles to a DIFFERENT person. */
export type GxpUserFormMode = "create" | "edit" | "view" | "copy" | "bulk-edit";

interface GxpUserFormProps {
  mode?: GxpUserFormMode;
  initialData?: GxpUser | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: GxpUserPayload) => Promise<void> | void;
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
  /** " (2 of 5)" appended after the title when Copy/Edit are reviewing
   * more than one record — undefined otherwise. */
  stepLabel?: string;
}

const GxpUserForm = ({
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
}: GxpUserFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  // The selected user's display name — captured from AsyncSelect (onChangeOption)
  // and sent in the payload's user:{ id, name } shape. Blank on Copy.
  const [selectedUserName, setSelectedUserName] = useState(
    mode === "copy" ? "" : (initialData?.user?.name ?? "")
  );

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<GxpUserFormValues>(
    () => ({
      userId: mode === "copy" ? "" : (initialData?.user?.id ?? ""),
      userType: initialData?.userType ?? "User",
      roleId: initialData?.roles?.map((r) => r.id) ?? [],
      description: initialData?.description ?? "",
      status: initialData?.status ?? "enabled"
    }),
    [initialData, mode]
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<GxpUserFormValues>({
    resolver: zodResolver(gxpUserSchema),
    defaultValues: initialValues
  });

  const busy = submitting || isSubmitting;

  const userSeed: AsyncOption[] | undefined =
    mode !== "copy" && initialData?.user?.id
      ? [{ value: initialData.user.id, label: initialData.user.name }]
      : undefined;
  const roleSeed: AsyncOption[] | undefined = initialData?.roles?.length
    ? initialData.roles.map((r) => ({ value: r.id, label: r.name }))
    : undefined;

  // Copy's picker only offers platform users with no GXP user record yet.
  const availableUsers = useAvailablePlatformUserOptions({ search: "", enabled: mode === "copy" });
  const noUsersAvailable =
    mode === "copy" && !availableUsers.isLoading && availableUsers.options.length === 0;

  const submit = (values: GxpUserFormValues) => {
    const payload: GxpUserPayload = {
      user: { id: values.userId, name: selectedUserName },
      userType: values.userType,
      roles: values.roleId,
      description: values.description,
      status: values.status
    };
    if ((mode === "edit" || mode === "bulk-edit") && isPayloadEqual(values, initialValues)) {
      (onUnchanged ?? onClose)();
      return;
    }
    onSubmit(payload);
  };

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form id={formId} onSubmit={handleSubmit(submit)} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("gxpUsers") })
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("gxpUsers") })}${stepLabel ?? ""}`
              : initialData
                ? `${t("update", { entity: t("gxpUsers") })}${stepLabel ?? ""}`
                : t("create", { entity: t("gxpUsers") })}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
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
                  // user — Copy is the one exception, see GxpUserFormMode.
                  disabled={isReadOnly || (Boolean(initialData) && mode !== "copy")}
                  error={!!errors.userId}
                  placeholder={t("select", { entity: t("user") })}
                  initialSelectedOptions={userSeed}
                />
              )}
            />
            {errors.userId && <p className="mt-1 text-xs text-red-500">{errors.userId.message}</p>}
            {noUsersAvailable && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {t("gxpNoAvailablePlatformUsers", { defaultValue: "No unassigned users available." })}
              </p>
            )}
          </div>

          <div>
            <Label required>{t("userType")}</Label>
            <Controller
              name="userType"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  disabled={isReadOnly}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { label: "User", value: "User" },
                    { label: "Resolver", value: "Resolver" }
                  ]}
                  placeholder={t("select", { entity: t("userType") })}
                />
              )}
            />
            {errors.userType && <p className="mt-1 text-xs text-red-500">{errors.userType.message as string}</p>}
          </div>

          <div className="md:col-span-2">
            <Label required>{t("assignRoles")}</Label>
            <Controller
              name="roleId"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  multi
                  useOptions={useGxpRoleOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("selectRoles")}
                  initialSelectedOptions={roleSeed}
                />
              )}
            />
            {errors.roleId && <p className="mt-1 text-xs text-red-500">{errors.roleId.message as string}</p>}
          </div>

          <div className="md:col-span-2">
            <Label>{t("description")}</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea
                  disabled={isReadOnly}
                  value={field.value}
                  onChange={field.onChange}
                  className="border border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              )}
            />
          </div>

          <div className="md:col-span-2">
            <Label>{t("status")}</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => {
                const on = field.value === "enabled";
                return (
                  <div className="flex items-center gap-3 py-2">
                    <Switch
                      checked={on}
                      disabled={isReadOnly}
                      onChange={(val: boolean) => field.onChange(val ? "enabled" : "disabled")}
                      label={on ? t("enabled") : t("disabled")}
                    />
                  </div>
                );
              }}
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

export default GxpUserForm;
