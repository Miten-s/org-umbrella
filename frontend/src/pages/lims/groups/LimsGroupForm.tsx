import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { useLimsUserOptions } from "@/pages/lims/users/LimsUser.options";

import { isPayloadEqual } from "@/lib/formChangeDetection";
import { limsGroupSchema, type LimsGroupFormValues } from "./LimsGroup.schema";
import type { LimsGroup, LimsGroupPayload, LimsGroupRef } from "./LimsGroup.types";

/**
 * "copy" renders like "create" (fully editable) except `groupId` starts
 * blank instead of pre-filled with the source's id — Group has no
 * server-minted business id (unlike Analysis), and the field is required
 * server-side (`CreateGroupDto`), so it stays EDITABLE (not disabled) —
 * the user must type a new unique one before Save will succeed. Used by
 * CopyStepper.
 */
export type LimsGroupFormMode = "create" | "edit" | "view" | "copy";

interface LimsGroupFormProps {
  mode?: LimsGroupFormMode;
  initialData?: LimsGroup | null;
  onClose: () => void;
  onSubmit: (payload: LimsGroupPayload) => Promise<void> | void;
  submitting?: boolean;
  /** Overrides the submit button's label — CopyStepper uses this to say
   * "Next" on every step but the last, where the batch actually saves. */
  submitLabel?: string;
  /** Set on the `<form>` element so an outside button (CopyStepper's
   * header Next/Save) can submit it via `<Button form={formId}>`. */
  formId?: string;
  /** " (2 of 5)" appended after the title when Copy is reviewing more
   * than one record — undefined otherwise. */
  stepLabel?: string;
}

/** Seeds the dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsGroupRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsGroupForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel,
  formId,
  stepLabel
}: LimsGroupFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsGroupFormValues>(
    () => ({
      // The spec prefixes LIMS group ids with `LIMS_`; Copy leaves it blank
      // instead (see LimsGroupFormMode above).
      groupId: mode === "copy" ? "" : (initialData?.groupId ?? "LIMS_"),
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      ownedBy: initialData?.ownedBy?.id ?? ""
      // parentGroup intentionally not collected here — see the commented-out
      // field below.
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsGroupFormValues>({
    // "copy" reuses the plain create/edit schema unchanged — the blank
    // groupId being required is exactly what we want here (see
    // LimsGroupFormMode's doc comment above): there's no server-minted id
    // to fall back on, so the user must type a real new one before Save.
    resolver: zodResolver(limsGroupSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  const err = (field: keyof LimsGroupFormValues) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-500">{errors[field]?.message as string}</p>
    ) : null;

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        id={formId}
        onSubmit={handleSubmit((values) => {
          // Edit + nothing actually changed: skip the reason modal, update
          // call, and audit entry entirely — a no-op Save just closes.
          if (mode === "edit" && isPayloadEqual(values, initialValues)) {
            onClose();
            return;
          }
          onSubmit(values);
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsGroup") })
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsGroup") })}${stepLabel ?? ""}`
              : initialData
                ? t("update", { entity: t("limsGroup") })
                : t("create", { entity: t("limsGroup") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <Label required>{t("limsGroupId")}</Label>
            <Input
              {...register("groupId")}
              disabled={isReadOnly}
              error={!!errors.groupId}
              hint={errors.groupId?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label required>{t("name")}</Label>
            <Input
              {...register("name")}
              disabled={isReadOnly}
              error={!!errors.name}
              hint={errors.name?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label>{t("limsOwnedBy")}</Label>
            <Controller
              name="ownedBy"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsUserOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.ownedBy}
                  placeholder={t("select", { entity: t("limsOwnedBy") })}
                  initialSelectedOptions={seedOne(initialData?.ownedBy)}
                />
              )}
            />
            {err("ownedBy")}
          </div>

          {/*
            Parent Group — commented out: we don't have a clear, agreed
            answer for what a lab admin is supposed to do with this field
            when creating a group, so we're not asking them to fill in
            something we can't explain yet. Not collected in defaultValues
            above either, so saving an existing group leaves its current
            parentGroup untouched rather than clearing it.
          <div className="min-w-0">
            <Label>{t("limsParentGroup")}</Label>
            <Controller
              name="parentGroup"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsGroupOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.parentGroup}
                  placeholder={t("select", { entity: t("limsParentGroup") })}
                  initialSelectedOptions={seedOne(initialData?.parentGroup)}
                />
              )}
            />
            {err("parentGroup")}
          </div>
          */}

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
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>
            {t("cancel")}
          </Button>
          {!isReadOnly ? (
            <Button type="submit" variant="primary" loading={busy}>
              {submitLabel ?? t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default LimsGroupForm;
