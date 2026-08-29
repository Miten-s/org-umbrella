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
import SubFormGrid from "@/components/data/SubFormGrid";
import LimsAttachmentsField from "@/components/lims/LimsAttachmentsField";
import { useAttachments } from "@/hooks/useAttachments";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { useLimsProjectOptions } from "@/pages/lims/projects/LimsProject.queries";
import { useSampleTypeOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsSpecificationOptions } from "@/pages/lims/specifications/LimsSpecification.queries";
import { useLimsTestGroupOptions } from "@/pages/lims/test-groups/LimsTestGroup.queries";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsStockBatchOptions } from "@/pages/lims/stock-batches/LimsStockBatch.queries";
import { useLimsInstrumentOptions } from "@/pages/lims/instruments/LimsInstrument.queries";
import { useLimsStockOptions } from "@/pages/lims/stocks/LimsStock.queries";
import { refId } from "@/lib/query/normalizeId";
import {
  limsSampleSchema,
  type LimsSampleFormValues
} from "./LimsSample.schema";
import type {
  LimsSample,
  LimsSamplePayload,
  LimsRef,
  LimsTestWindowRow
} from "./LimsSample.types";

/**
 * "copy" renders like "create" (fully editable) — sampleId/idNumeric are
 * locked/server-generated either way (see the read-only display below), so
 * unlike a businessId-driven module there's no editable ID field to blank.
 * Used by CopyStepper.
 */
export type LimsSampleFormMode = "create" | "edit" | "view" | "copy";

interface LimsSampleFormProps {
  mode?: LimsSampleFormMode;
  initialData?: LimsSample | null;
  onClose: () => void;
  onSubmit: (payload: LimsSamplePayload, files: File[]) => Promise<void> | void;
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

const LimsSampleForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel,
  formId,
  stepLabel
}: LimsSampleFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);
  /**
   * `instrument` and `stock` are references: nested `{id, name}` on read, bare
   * id on write. A select cell needs the id, or the saved value renders as the
   * placeholder.
   */
  const initialTestWindowsRef = useRef(
    (initialData?.testWindows ?? []).map((row) => ({
      ...row,
      instrument: refId(
        row.instrument ?? (row as { instrumentId?: string }).instrumentId
      ),
      stock: refId(row.stock ?? (row as { stockId?: string }).stockId)
    }))
  );
  const [testWindows, setTestWindows] = useState<LimsTestWindowRow[]>(
    initialTestWindowsRef.current
  );

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsSampleFormValues>(
    () => ({
      idText: initialData?.idText ?? "",
      sampleName: initialData?.sampleName ?? "",
      project: initialData?.project?.id ?? "",
      sampleType: initialData?.sampleType?.id ?? "",
      specification: initialData?.specification?.id ?? "",
      testGroup: initialData?.testGroup?.id ?? "",
      location: initialData?.location?.id ?? "",
      group: initialData?.group?.id ?? "",
      stockBatch: initialData?.stockBatch?.id ?? "",
      lotNumber: initialData?.lotNumber ?? "",
      serialNumber: initialData?.serialNumber ?? "",
      loginDate: initialData?.loginDate ?? "",
      loginBy: initialData?.loginBy ?? "",
      sampleStartDate: initialData?.sampleStartDate ?? "",
      sampleStartBy: initialData?.sampleStartBy ?? "",
      description: initialData?.description ?? "",
      comments: initialData?.comments ?? ""
    }),
    [initialData]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsSampleFormValues>({
    resolver: zodResolver(limsSampleSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const comments = useWatch({ control, name: "comments" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsSampleFormValues,
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
            isPayloadEqual(testWindows, initialTestWindowsRef.current)
          ) {
            onClose();
            return;
          }
          onSubmit(
            { ...values, testWindows, keptAttachmentIds: attachments.keptIds },
            attachments.newFiles
          );
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsSample") })
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsSample") })}${stepLabel ?? ""}`
              : initialData
                ? t("update", { entity: t("limsSample") })
                : t("create", { entity: t("limsSample") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            {/* sampleId is server-locked (crud-factory drops any client value on
                write) — shown read-only, same as idNumeric, never collected as
                input. Blank on Copy: the source's id is not the new record's. */}
            <Label>{t("limsSampleId")}</Label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {mode === "copy" ? "—" : (initialData?.sampleId ?? "—")}
            </p>
          </div>
          <div className="min-w-0">
            <Label>{t("limsIdNumeric")}</Label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {mode === "copy" ? "—" : String(initialData?.idNumeric ?? "—")}
            </p>
          </div>
          {text("idText", t("limsIdText"), false, "text")}
          {text("sampleName", t("limsSampleName"), true, "text")}
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
            <Label required={false}>{t("limsSampleType")}</Label>
            <Controller
              name="sampleType"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useSampleTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsSampleType") })}
                  initialSelectedOptions={seedOne(initialData?.sampleType)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsSpecification")}</Label>
            <Controller
              name="specification"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsSpecificationOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsSpecification") })}
                  initialSelectedOptions={seedOne(initialData?.specification)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsTestGroup")}</Label>
            <Controller
              name="testGroup"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsTestGroupOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsTestGroup") })}
                  initialSelectedOptions={seedOne(initialData?.testGroup)}
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
            <Label required={false}>{t("limsStockBatch")}</Label>
            <Controller
              name="stockBatch"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsStockBatchOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsStockBatch") })}
                  initialSelectedOptions={seedOne(initialData?.stockBatch)}
                />
              )}
            />
          </div>
          {text("lotNumber", t("limsLotNumber"), false, "text")}
          {text("serialNumber", t("limsSerialNumber"), false, "text")}
          {text("loginDate", t("limsLoginDate"), false, "date")}
          {text("loginBy", t("limsLoginBy"), false, "text")}
          {text("sampleStartDate", t("limsSampleStartDate"), false, "date")}
          {text("sampleStartBy", t("limsSampleStartBy"), false, "text")}
          <div className="col-span-full min-w-0">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) =>
                setValue("description", val, { shouldValidate: true })
              }
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="col-span-full min-w-0">
            <Label>{t("comments")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={comments || ""}
              onChange={(val) =>
                setValue("comments", val, { shouldValidate: true })
              }
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="col-span-full min-w-0">
            <SubFormGrid<LimsTestWindowRow>
              label={t("limsTestWindows")}
              rows={testWindows}
              onChange={setTestWindows}
              disabled={isReadOnly}
              columns={[
                { key: "analysisName", header: t("limsAnalysisName") },
                { key: "componentId", header: t("limsComponentId") },
                { key: "componentName", header: t("limsComponentName") },
                { key: "description", header: t("description") },
                { key: "value", header: t("limsValue") },
                { key: "unit", header: t("limsUnit") },
                {
                  key: "outOfRange",
                  header: t("limsOutOfRange"),
                  type: "checkbox"
                },
                { key: "enteredOn", header: t("limsEnteredOn"), type: "date" },
                { key: "enteredBy", header: t("limsEnteredBy") },
                {
                  key: "instrument",
                  header: t("limsInstrument"),
                  type: "async-select",
                  useOptions: useLimsInstrumentOptions
                },
                {
                  key: "stock",
                  header: t("limsStock"),
                  type: "async-select",
                  useOptions: useLimsStockOptions
                }
              ]}
            />
          </div>
          <LimsAttachmentsField
            attachments={attachments}
            disabled={isReadOnly}
          />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
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

export default LimsSampleForm;
