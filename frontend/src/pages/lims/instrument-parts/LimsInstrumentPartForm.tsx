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
import { useInstrumentStatusOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsInstrumentOptions } from "@/pages/lims/instruments/LimsInstrument.queries";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsSupplierOptions } from "@/pages/lims/suppliers/LimsSupplier.queries";
import { limsInstrumentPartSchema, limsInstrumentPartCopySchema, type LimsInstrumentPartFormValues } from "./LimsInstrumentPart.schema";
import type { LimsInstrumentPart, LimsInstrumentPartPayload, LimsRef, LimsMaintenanceRow } from "./LimsInstrumentPart.types";

/**
 * "copy" renders like "create" (fully editable) except the business ID
 * starts blank instead of pre-filled with the source's — stays EDITABLE,
 * not disabled: `applyBusinessId` mints a fresh one only when the field
 * is empty, and otherwise honors whatever the user typed (subject to the
 * usual uniqueness check). Attachments are hidden in this mode: the Copy
 * flow's batch save is JSON-only and can't carry file uploads. Used by
 * CopyStepper.
 */
export type LimsInstrumentPartFormMode = "create" | "edit" | "view" | "copy" | "bulk-edit";

interface LimsInstrumentPartFormProps {
  mode?: LimsInstrumentPartFormMode;
  initialData?: LimsInstrumentPart | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: LimsInstrumentPartPayload, files: File[]) => Promise<void> | void;
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

const LimsInstrumentPartForm = ({
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
}: LimsInstrumentPartFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);
  const initialMaintenanceRef = useRef(initialData?.maintenance ?? []);
  const [maintenance, setMaintenance] = useState<LimsMaintenanceRow[]>(initialMaintenanceRef.current);

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsInstrumentPartFormValues>(
    () => ({
      partId: mode === "copy" ? "" : (initialData?.partId ?? ""),
      partName: initialData?.partName ?? "",
      status: initialData?.status?.id ?? "",
      group: initialData?.group?.id ?? "",
      instrument: initialData?.instrument?.id ?? "",
      location: initialData?.location?.id ?? "",
      supplier: initialData?.supplier?.id ?? "",
      dateInstalled: initialData?.dateInstalled ?? "",
      sopReference: initialData?.sopReference ?? "",
      manufacturer: initialData?.manufacturer ?? "",
      serialNumber: initialData?.serialNumber ?? "",
      modelNumber: initialData?.modelNumber ?? "",
      measuringInformation: initialData?.measuringInformation ?? "",
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
  } = useForm<LimsInstrumentPartFormValues>({
    resolver: zodResolver(mode === "copy" ? limsInstrumentPartCopySchema : limsInstrumentPartSchema),
    defaultValues: initialValues
  });

  const measuringInformation = useWatch({ control, name: "measuringInformation" });
  const details = useWatch({ control, name: "details" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsInstrumentPartFormValues,
    label: string,
    required = false,
    type = "text",
    forceDisabled = false
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
          disabled={isReadOnly || forceDisabled}
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
            (mode === "edit" || mode === "bulk-edit") &&
            !attachments.isDirty &&
            isPayloadEqual(values, initialValues) &&
            isPayloadEqual(maintenance, initialMaintenanceRef.current)
          ) {
            (onUnchanged ?? onClose)();
            return;
          }
          onSubmit(
            { ...values, maintenance, keptAttachmentIds: attachments.keptIds },
            attachments.newFiles
          );
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsInstrumentPart") })
                        : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsInstrumentPart") })}${stepLabel ?? ""}`
              : initialData
              ? `${t("update", { entity: t("limsInstrumentPart") })}${stepLabel ?? ""}`
              : t("create", { entity: t("limsInstrumentPart") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("partId", t("limsPartId"), true, "text")}
          {text("partName", t("limsPartName"), true, "text")}
          <div className="min-w-0">
            <Label required={false}>{t("status")}</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useInstrumentStatusOptions}
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
            <Label required>{t("limsInstrument")}</Label>
            <Controller
              name="instrument"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsInstrumentOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.instrument}
                  placeholder={t("select", { entity: t("limsInstrument") })}
                  initialSelectedOptions={seedOne(initialData?.instrument)}
                />
              )}
            />
            {errors.instrument ? (
              <p className="mt-1 text-xs text-red-500">{errors.instrument.message}</p>
            ) : null}
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
                  initialSelectedOptions={seedRefOption(initialData?.location)}
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
                  initialSelectedOptions={seedOne(initialData?.supplier)}
                />
              )}
            />
          </div>
          {text("dateInstalled", t("limsDateInstalled"), false, "date")}
          {text("sopReference", t("limsSopReference"), false, "text")}
          {text("manufacturer", t("limsManufacturer"), false, "text")}
          {text("serialNumber", t("limsSerialNumber"), false, "text")}
          {text("modelNumber", t("limsModelNumber"), false, "text")}
          <div className="col-span-full min-w-0">
            <Label>{t("limsMeasuringInformation")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={measuringInformation || ""}
              onChange={(val) => setValue("measuringInformation", val, { shouldValidate: true })}
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
            <SubFormGrid<LimsMaintenanceRow>
              label={t("limsMaintenance")}
              rows={maintenance}
              onChange={setMaintenance}
              disabled={isReadOnly}
              columns={[
                { key: "maintenanceName", header: t("name") },
                { key: "performedOn", header: t("limsPerformedOn"), type: "date" },
                { key: "performedBy", header: t("limsPerformedBy") },
                { key: "remarks", header: t("limsRemarks") }
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

export default LimsInstrumentPartForm;
