import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import LimsAttachmentsField from "@/components/lims/LimsAttachmentsField";
import { useAttachments } from "@/hooks/useAttachments";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsSampleOptions } from "@/pages/lims/samples/LimsSample.queries";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { limsLotSchema, limsLotCopySchema, type LimsLotFormValues } from "./LimsLot.schema";
import type { LimsLot, LimsLotPayload, LimsRef } from "./LimsLot.types";

/**
 * "copy" renders like "create" (fully editable) except the business ID
 * starts blank instead of pre-filled with the source's — stays EDITABLE,
 * not disabled: `applyBusinessId` mints a fresh one only when the field
 * is empty, and otherwise honors whatever the user typed (subject to the
 * usual uniqueness check). Attachments are hidden in this mode: the Copy
 * flow's batch save is JSON-only and can't carry file uploads. Used by
 * CopyStepper.
 */
export type LimsLotFormMode = "create" | "edit" | "view" | "copy";

interface LimsLotFormProps {
  mode?: LimsLotFormMode;
  initialData?: LimsLot | null;
  onClose: () => void;
  onSubmit: (payload: LimsLotPayload, files: File[]) => Promise<void> | void;
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

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const seedMany = (refs: LimsRef[] | undefined) =>
  (refs ?? [])
    .filter((ref) => ref?.id && ref.name)
    .map((ref) => ({ value: ref.id, label: String(ref.name) }));

const LimsLotForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel,
  formId,
  stepLabel
}: LimsLotFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsLotFormValues>(
    () => ({
      lotId: mode === "copy" ? "" : (initialData?.lotId ?? ""),
      lotName: initialData?.lotName ?? "",
      group: initialData?.group?.id ?? "",
      samples: (initialData?.samples ?? []).map((ref) => ref.id),
      description: initialData?.description ?? "",
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsLotFormValues>({
    resolver: zodResolver(mode === "copy" ? limsLotCopySchema : limsLotSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsLotFormValues,
    label: string,
    required = false,
    type = "text",
    forceDisabled = false
  ) => (
    <div className="min-w-0">
      <Label required={required}>{label}</Label>
      <Input
        {...register(name)}
        type={type}
        disabled={isReadOnly || forceDisabled}
        error={!!errors[name]}
        hint={errors[name]?.message as string}
        className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        id={formId}
        onSubmit={handleSubmit((values) => {
          // Edit + nothing actually changed: skip the reason modal, update
          // call, and audit entry entirely — a no-op Save just closes.
          if (mode === "edit" && !attachments.isDirty && isPayloadEqual(values, initialValues)) {
            onClose();
            return;
          }
          onSubmit({ ...values, keptAttachmentIds: attachments.keptIds }, attachments.newFiles);
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsLot") })
                        : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsLot") })}${stepLabel ?? ""}`
              : initialData
              ? t("update", { entity: t("limsLot") })
              : t("create", { entity: t("limsLot") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("lotId", t("limsLotId"), true, "text")}
          {text("lotName", t("limsLotName"), true, "text")}
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
            <Label required={false}>{t("limsSamples")}</Label>
            <Controller
              name="samples"
              control={control}
              render={({ field }) => (
                <AsyncSelect multi
                  useOptions={useLimsSampleOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsSamples") })}
                  initialSelectedOptions={seedMany(initialData?.samples)}
                />
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
          {mode !== "copy" && (
            <LimsAttachmentsField attachments={attachments} disabled={isReadOnly} />
          )}
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

export default LimsLotForm;
