import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import SubFormGrid from "@/components/data/SubFormGrid";
import LimsAttachmentsField from "@/components/lims/LimsAttachmentsField";
import { useAttachments } from "@/hooks/useAttachments";
import { useInstrumentStatusOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsInstrumentOptions } from "@/pages/lims/instruments/LimsInstrument.queries";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsSupplierOptions } from "@/pages/lims/suppliers/LimsSupplier.queries";
import { limsInstrumentPartSchema, type LimsInstrumentPartFormValues } from "./LimsInstrumentPart.schema";
import type { LimsInstrumentPart, LimsInstrumentPartPayload, LimsRef, LimsMaintenanceRow } from "./LimsInstrumentPart.types";

export type LimsInstrumentPartFormMode = "create" | "edit" | "view";

interface LimsInstrumentPartFormProps {
  mode?: LimsInstrumentPartFormMode;
  initialData?: LimsInstrumentPart | null;
  onClose: () => void;
  onSubmit: (payload: LimsInstrumentPartPayload, files: File[]) => Promise<void> | void;
  submitting?: boolean;
}

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsInstrumentPartForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsInstrumentPartFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);
  const [maintenance, setMaintenance] = useState<LimsMaintenanceRow[]>(initialData?.maintenance ?? []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsInstrumentPartFormValues>({
    resolver: zodResolver(limsInstrumentPartSchema),
    defaultValues: {
      partId: initialData?.partId ?? "",
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
    }
  });

  const measuringInformation = useWatch({ control, name: "measuringInformation" });
  const details = useWatch({ control, name: "details" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsInstrumentPartFormValues,
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
        onSubmit={handleSubmit((values) => onSubmit({ ...values, maintenance, keptAttachmentIds: attachments.keptIds }, attachments.newFiles))}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsInstrumentPart") })
            : initialData
              ? t("update", { entity: t("limsInstrumentPart") })
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
            <Label required={false}>{t("limsInstrument")}</Label>
            <Controller
              name="instrument"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsInstrumentOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsInstrument") })}
                  initialSelectedOptions={seedOne(initialData?.instrument)}
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
          <LimsAttachmentsField attachments={attachments} disabled={isReadOnly} />
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

export default LimsInstrumentPartForm;
