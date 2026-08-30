import { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { seedRefOption, seedRefOptions } from "@/utils/refLabel";
import SubFormGrid from "@/components/data/SubFormGrid";
import LimsAttachmentsField from "@/components/lims/LimsAttachmentsField";
import { useAttachments } from "@/hooks/useAttachments";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { useStockTypeOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsUserOptions } from "@/pages/lims/users/LimsUser.options";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsSupplierOptions } from "@/pages/lims/suppliers/LimsSupplier.queries";
import { limsStockSchema, limsStockCopySchema, type LimsStockFormValues } from "./LimsStock.schema";
import type { LimsStock, LimsStockPayload, LimsRef, LimsParameterValue } from "./LimsStock.types";

/**
 * "copy" renders like "create" (fully editable) except the business ID
 * starts blank instead of pre-filled with the source's — stays EDITABLE,
 * not disabled: `applyBusinessId` mints a fresh one only when the field
 * is empty, and otherwise honors whatever the user typed (subject to the
 * usual uniqueness check). Attachments are hidden in this mode: the Copy
 * flow's batch save is JSON-only and can't carry file uploads. Used by
 * CopyStepper.
 */
export type LimsStockFormMode = "create" | "edit" | "view" | "copy" | "bulk-edit";

interface LimsStockFormProps {
  mode?: LimsStockFormMode;
  initialData?: LimsStock | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: LimsStockPayload, files: File[]) => Promise<void> | void;
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

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsStockForm = ({
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
}: LimsStockFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);
  const initialParametersRef = useRef(initialData?.parameters ?? []);
  const [parameters, setParameters] = useState<LimsParameterValue[]>(initialParametersRef.current);

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsStockFormValues>(
    () => ({
      stockId: mode === "copy" ? "" : (initialData?.stockId ?? ""),
      stockName: initialData?.stockName ?? "",
      stockType: initialData?.stockType?.id ?? "",
      group: initialData?.group?.id ?? "",
      operator: initialData?.operator?.id ?? "",
      defaultLocation: initialData?.defaultLocation?.id ?? "",
      preferredSupplier: initialData?.preferredSupplier?.id ?? "",
      suppliers: (initialData?.suppliers ?? []).map((ref) => ref.id),
      unit: initialData?.unit ?? "",
      targetAmount: initialData?.targetAmount ?? "",
      lowAmount: initialData?.lowAmount ?? "",
      lowPercentage: initialData?.lowPercentage ?? "",
      description: initialData?.description ?? "",
      details: initialData?.details ?? "",
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsStockFormValues>({
    resolver: zodResolver(mode === "copy" ? limsStockCopySchema : limsStockSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const details = useWatch({ control, name: "details" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsStockFormValues,
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
          if (
            (mode === "edit" || mode === "bulk-edit") &&
            !attachments.isDirty &&
            isPayloadEqual(values, initialValues) &&
            isPayloadEqual(parameters, initialParametersRef.current)
          ) {
            (onUnchanged ?? onClose)();
            return;
          }
          onSubmit(
            { ...values, parameters, keptAttachmentIds: attachments.keptIds },
            attachments.newFiles
          );
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsStock") })
                        : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsStock") })}${stepLabel ?? ""}`
              : initialData
              ? `${t("update", { entity: t("limsStock") })}${stepLabel ?? ""}`
              : t("create", { entity: t("limsStock") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("stockId", t("limsStockId"), true, "text")}
          {text("stockName", t("limsStockName"), true, "text")}
          <div className="min-w-0">
            <Label required={false}>{t("limsStockType")}</Label>
            <Controller
              name="stockType"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useStockTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsStockType") })}
                  initialSelectedOptions={seedOne(initialData?.stockType)}
                />
              )}
            />
          </div>
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
            <Label required={false}>{t("limsOperator")}</Label>
            <Controller
              name="operator"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsUserOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsOperator") })}
                  initialSelectedOptions={seedOne(initialData?.operator)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsDefaultLocation")}</Label>
            <Controller
              name="defaultLocation"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsLocationOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsDefaultLocation") })}
                  initialSelectedOptions={seedRefOption(initialData?.defaultLocation)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsPreferredSupplier")}</Label>
            <Controller
              name="preferredSupplier"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsSupplierOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsPreferredSupplier") })}
                  initialSelectedOptions={seedRefOption(initialData?.preferredSupplier)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsSuppliers")}</Label>
            <Controller
              name="suppliers"
              control={control}
              render={({ field }) => (
                <AsyncSelect multi
                  useOptions={useLimsSupplierOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsSuppliers") })}
                  initialSelectedOptions={seedRefOptions(initialData?.suppliers)}
                />
              )}
            />
          </div>
          {text("unit", t("limsUnit"), false, "text")}
          {text("targetAmount", t("limsTargetAmount"), false, "number")}
          {text("lowAmount", t("limsLowAmount"), false, "number")}
          {text("lowPercentage", t("limsLowPercentage"), false, "number")}
          <div className="min-w-0">
            <Label>{t("limsInventory")}</Label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {String(initialData?.inventory ?? "—")}
            </p>
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
          <div className="col-span-full min-w-0">
            <Label>{t("limsDetails")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={details || ""}
              onChange={(val) => setValue("details", val, { shouldValidate: true })}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="col-span-full min-w-0">
            <SubFormGrid<LimsParameterValue>
              label={t("limsParameters")}
              rows={parameters}
              onChange={setParameters}
              disabled={isReadOnly}
              columns={[
                { key: "identity", header: t("limsIdentity") },
                { key: "value", header: t("limsValue") },
                { key: "unit", header: t("limsUnit") }
              ]}
            />
          </div>
          {mode !== "copy" && mode !== "bulk-edit" && (
            <LimsAttachmentsField attachments={attachments} disabled={isReadOnly} />
          )}
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

export default LimsStockForm;
