import { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import DateField from "@/components/common/form/input/DateField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { seedRefOption } from "@/utils/refLabel";
import SubFormGrid from "@/components/data/SubFormGrid";
import LimsAttachmentsField from "@/components/lims/LimsAttachmentsField";
import { useAttachments } from "@/hooks/useAttachments";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { useLimsStockOptions } from "@/pages/lims/stocks/LimsStock.queries";
import { useStockBatchStatusOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsProjectOptions } from "@/pages/lims/projects/LimsProject.queries";
import { useLimsSupplierOptions } from "@/pages/lims/suppliers/LimsSupplier.queries";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { limsStockBatchSchema, type LimsStockBatchFormValues } from "./LimsStockBatch.schema";
import type { LimsStockBatch, LimsStockBatchPayload, LimsRef, LimsConsumptionRow, LimsParameterValue } from "./LimsStockBatch.types";

/**
 * "copy" renders like "create" (fully editable) — stockBatchId is
 * server-derived either way (see the read-only display below). Attachments
 * are hidden in this mode: the Copy flow's batch save is JSON-only and
 * can't carry file uploads. Used by CopyStepper.
 */
export type LimsStockBatchFormMode = "create" | "edit" | "view" | "copy";

interface LimsStockBatchFormProps {
  mode?: LimsStockBatchFormMode;
  initialData?: LimsStockBatch | null;
  onClose: () => void;
  onSubmit: (payload: LimsStockBatchPayload, files: File[]) => Promise<void> | void;
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

const LimsStockBatchForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel,
  formId,
  stepLabel
}: LimsStockBatchFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);
  const initialConsumptionsRef = useRef(initialData?.consumptions ?? []);
  const [consumptions, setConsumptions] = useState<LimsConsumptionRow[]>(initialConsumptionsRef.current);
  const initialParametersRef = useRef(initialData?.parameters ?? []);
  const [parameters, setParameters] = useState<LimsParameterValue[]>(initialParametersRef.current);

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsStockBatchFormValues>(
    () => ({
      stock: initialData?.stock?.id ?? "",
      status: initialData?.status?.id ?? "",
      project: initialData?.project?.id ?? "",
      supplier: initialData?.supplier?.id ?? "",
      location: initialData?.location?.id ?? "",
      manufacturingDate: initialData?.manufacturingDate ?? "",
      expiryDate: initialData?.expiryDate ?? "",
      supplierBatchNumber: initialData?.supplierBatchNumber ?? "",
      sapBatchId: initialData?.sapBatchId ?? "",
      internalBatchId: initialData?.internalBatchId ?? "",
      initialAmount: initialData?.initialAmount ?? "",
      currentAmount: initialData?.currentAmount ?? "",
      unit: initialData?.unit ?? "",
      description: initialData?.description ?? "",
    }),
    [initialData]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsStockBatchFormValues>({
    resolver: zodResolver(limsStockBatchSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsStockBatchFormValues,
    label: string,
    required = false,
    type = "text"
  ) => (
    <div className="min-w-0">
      <Label required={required}>{label}</Label>
      {type === "date" || type === "time" ? (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <DateField
              mode={type}
              value={field.value as string}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={isReadOnly}
              error={!!errors[name]}
              hint={errors[name]?.message as string}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          )}
        />
      ) : (
        <Input
          {...register(name)}
          type={type}
          disabled={isReadOnly}
          error={!!errors[name]}
          hint={errors[name]?.message as string}
          className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      )}
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
            mode === "edit" &&
            !attachments.isDirty &&
            isPayloadEqual(values, initialValues) &&
            isPayloadEqual(consumptions, initialConsumptionsRef.current) &&
            isPayloadEqual(parameters, initialParametersRef.current)
          ) {
            onClose();
            return;
          }
          onSubmit(
            { ...values, consumptions, parameters, keptAttachmentIds: attachments.keptIds },
            attachments.newFiles
          );
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsStockBatch") })
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsStockBatch") })}${stepLabel ?? ""}`
              : initialData
                ? t("update", { entity: t("limsStockBatch") })
                : t("create", { entity: t("limsStockBatch") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <Label required={true}>{t("limsStock")}</Label>
            <Controller
              name="stock"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsStockOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsStock") })}
                  initialSelectedOptions={seedRefOption(initialData?.stock)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label>{t("limsStockBatchId")}</Label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {mode === "copy" ? "—" : String(initialData?.stockBatchId ?? "—")}
            </p>
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("status")}</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useStockBatchStatusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("status") })}
                  initialSelectedOptions={seedOne(initialData?.status)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsProject")}</Label>
            <Controller
              name="project"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsProjectOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsProject") })}
                  initialSelectedOptions={seedOne(initialData?.project)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsSupplier")}</Label>
            <Controller
              name="supplier"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsSupplierOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsSupplier") })}
                  initialSelectedOptions={seedRefOption(initialData?.supplier)}
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
          {text("manufacturingDate", t("limsManufacturingDate"), false, "date")}
          {text("expiryDate", t("limsExpiryDate"), false, "date")}
          {text("supplierBatchNumber", t("limsSupplierBatchNumber"), false, "text")}
          {text("sapBatchId", t("limsSapBatchId"), false, "text")}
          {text("internalBatchId", t("limsInternalBatchId"), false, "text")}
          {text("initialAmount", t("limsInitialAmount"), false, "number")}
          {text("currentAmount", t("limsCurrentAmount"), false, "number")}
          {text("unit", t("limsUnit"), false, "text")}
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
            <SubFormGrid<LimsConsumptionRow>
              label={t("limsConsumptionRecords")}
              rows={consumptions}
              onChange={setConsumptions}
              disabled={isReadOnly}
              columns={[
                { key: "consumedOn", header: t("limsConsumedOn"), type: "date" },
                { key: "consumedBy", header: t("limsConsumedBy") },
                { key: "amount", header: t("limsAmount"), type: "number" },
                { key: "unit", header: t("limsUnit") },
                { key: "remarks", header: t("limsRemarks") }
              ]}
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

export default LimsStockBatchForm;
