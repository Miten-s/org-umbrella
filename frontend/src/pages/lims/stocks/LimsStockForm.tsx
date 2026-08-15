import { useState } from "react";
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
import { useStockTypeOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsUserOptions } from "@/pages/lims/users/LimsUser.options";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsSupplierOptions } from "@/pages/lims/suppliers/LimsSupplier.queries";
import { limsStockSchema, type LimsStockFormValues } from "./LimsStock.schema";
import type { LimsStock, LimsStockPayload, LimsRef, LimsParameterValue } from "./LimsStock.types";

export type LimsStockFormMode = "create" | "edit" | "view";

interface LimsStockFormProps {
  mode?: LimsStockFormMode;
  initialData?: LimsStock | null;
  onClose: () => void;
  onSubmit: (payload: LimsStockPayload, files: File[]) => Promise<void> | void;
  submitting?: boolean;
}

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const seedMany = (refs: LimsRef[] | undefined) =>
  (refs ?? [])
    .filter((ref) => ref?.id && ref.name)
    .map((ref) => ({ value: ref.id, label: String(ref.name) }));

const LimsStockForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsStockFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);
  const [parameters, setParameters] = useState<LimsParameterValue[]>(initialData?.parameters ?? []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsStockFormValues>({
    resolver: zodResolver(limsStockSchema),
    defaultValues: {
      stockId: initialData?.stockId ?? "",
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
    }
  });

  const description = useWatch({ control, name: "description" });
  const details = useWatch({ control, name: "details" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsStockFormValues,
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
        onSubmit={handleSubmit((values) => onSubmit({ ...values, parameters, keptAttachmentIds: attachments.keptIds }, attachments.newFiles))}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsStock") })
            : initialData
              ? t("update", { entity: t("limsStock") })
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

export default LimsStockForm;
