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
import { useInstrumentStatusOptions, useInstrumentTypeOptions, useMeasurementTypeOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsSupplierOptions } from "@/pages/lims/suppliers/LimsSupplier.queries";
import { limsInstrumentSchema, type LimsInstrumentFormValues } from "./LimsInstrument.schema";
import type { LimsInstrument, LimsInstrumentPayload, LimsRef, LimsMaintenanceRow, LimsParameterValue } from "./LimsInstrument.types";

export type LimsInstrumentFormMode = "create" | "edit" | "view";

interface LimsInstrumentFormProps {
  mode?: LimsInstrumentFormMode;
  initialData?: LimsInstrument | null;
  onClose: () => void;
  onSubmit: (payload: LimsInstrumentPayload, files: File[]) => Promise<void> | void;
  submitting?: boolean;
}

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsInstrumentForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsInstrumentFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);
  const [parameters, setParameters] = useState<LimsParameterValue[]>(initialData?.parameters ?? []);
  const [maintenance, setMaintenance] = useState<LimsMaintenanceRow[]>(initialData?.maintenance ?? []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsInstrumentFormValues>({
    resolver: zodResolver(limsInstrumentSchema),
    defaultValues: {
      instrumentId: initialData?.instrumentId ?? "",
      name: initialData?.name ?? "",
      type: initialData?.type?.id ?? "",
      measurementType: initialData?.measurementType?.id ?? "",
      status: initialData?.status?.id ?? "",
      group: initialData?.group?.id ?? "",
      location: initialData?.location?.id ?? "",
      supplier: initialData?.supplier?.id ?? "",
      dateInstalled: initialData?.dateInstalled ?? "",
      lastMsaDate: initialData?.lastMsaDate ?? "",
      sopReference: initialData?.sopReference ?? "",
      manufacturer: initialData?.manufacturer ?? "",
      serialNumber: initialData?.serialNumber ?? "",
      modelNumber: initialData?.modelNumber ?? "",
      measuringInformation: initialData?.measuringInformation ?? "",
      msaInformation: initialData?.msaInformation ?? "",
      details: initialData?.details ?? "",
    }
  });

  const measuringInformation = useWatch({ control, name: "measuringInformation" });
  const msaInformation = useWatch({ control, name: "msaInformation" });
  const details = useWatch({ control, name: "details" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsInstrumentFormValues,
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
        onSubmit={handleSubmit((values) => onSubmit({ ...values, parameters, maintenance, keptAttachmentIds: attachments.keptIds }, attachments.newFiles))}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsInstrument") })
            : initialData
              ? t("update", { entity: t("limsInstrument") })
              : t("create", { entity: t("limsInstrument") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("instrumentId", t("limsInstrumentId"), true, "text")}
          {text("name", t("name"), true, "text")}
          <div className="min-w-0">
            <Label required={false}>{t("limsType")}</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useInstrumentTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsType") })}
                  initialSelectedOptions={seedOne(initialData?.type)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsMeasurementType")}</Label>
            <Controller
              name="measurementType"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useMeasurementTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsMeasurementType") })}
                  initialSelectedOptions={seedOne(initialData?.measurementType)}
                />
              )}
            />
          </div>
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
          {text("lastMsaDate", t("limsLastMsaDate"), false, "date")}
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
            <Label>{t("limsMsaInformation")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={msaInformation || ""}
              onChange={(val) => setValue("msaInformation", val, { shouldValidate: true })}
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

export default LimsInstrumentForm;
