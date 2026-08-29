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
import { useLimsSampleOptions } from "@/pages/lims/samples/LimsSample.queries";
import { useLimsAnalysisOptions } from "@/pages/lims/analyses/LimsAnalysis.queries";
import { useLimsInstrumentOptions } from "@/pages/lims/instruments/LimsInstrument.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { limsTestSchema, type LimsTestFormValues } from "./LimsTest.schema";
import type { LimsTest, LimsTestPayload, LimsRef, LimsResultRow } from "./LimsTest.types";

/**
 * "copy" renders like "create" (fully editable) — testId is locked/
 * server-generated either way (see the read-only display below). Attachments
 * are hidden in this mode: the Copy flow's batch save is JSON-only and can't
 * carry file uploads. Used by CopyStepper.
 */
export type LimsTestFormMode = "create" | "edit" | "view" | "copy";

interface LimsTestFormProps {
  mode?: LimsTestFormMode;
  initialData?: LimsTest | null;
  onClose: () => void;
  onSubmit: (payload: LimsTestPayload, files: File[]) => Promise<void> | void;
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

const LimsTestForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel,
  formId,
  stepLabel
}: LimsTestFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);
  const initialComponentsRef = useRef(initialData?.components ?? []);
  const [components, setComponents] = useState<LimsResultRow[]>(initialComponentsRef.current);

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsTestFormValues>(
    () => ({
      testName: initialData?.testName ?? "",
      sample: initialData?.sample?.id ?? "",
      analysis: initialData?.analysis?.id ?? "",
      instrument: initialData?.instrument?.id ?? "",
      group: initialData?.group?.id ?? "",
      replicateCount: initialData?.replicateCount ?? "",
      loginDate: initialData?.loginDate ?? "",
      loginBy: initialData?.loginBy ?? "",
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
  } = useForm<LimsTestFormValues>({
    resolver: zodResolver(limsTestSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsTestFormValues,
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
            isPayloadEqual(components, initialComponentsRef.current)
          ) {
            onClose();
            return;
          }
          onSubmit(
            { ...values, components, keptAttachmentIds: attachments.keptIds },
            attachments.newFiles
          );
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsTest") })
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsTest") })}${stepLabel ?? ""}`
              : initialData
                ? t("update", { entity: t("limsTest") })
                : t("create", { entity: t("limsTest") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            {/* testId is server-locked (crud-factory drops any client value on
                write) — shown read-only, never collected as input. Blank on
                Copy: the source's id is not the new record's. */}
            <Label>{t("limsTestId")}</Label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {mode === "copy" ? "—" : (initialData?.testId ?? "—")}
            </p>
          </div>
          {text("testName", t("limsTestName"), true, "text")}
          <div className="min-w-0">
            <Label required>{t("limsSample")}</Label>
            <Controller
              name="sample"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsSampleOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.sample}
                  placeholder={t("select", { entity: t("limsSample") })}
                  initialSelectedOptions={seedRefOption(initialData?.sample)}
                />
              )}
            />
            {errors.sample ? (
              <p className="mt-1 text-xs text-red-500">{errors.sample.message}</p>
            ) : null}
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsAnalysis")}</Label>
            <Controller
              name="analysis"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsAnalysisOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsAnalysis") })}
                  initialSelectedOptions={seedOne(initialData?.analysis)}
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
          {text("replicateCount", t("limsReplicateCount"), false, "number")}
          {text("loginDate", t("limsLoginDate"), false, "date")}
          {text("loginBy", t("limsLoginBy"), false, "text")}
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
            <SubFormGrid<LimsResultRow>
              label={t("limsComponents")}
              rows={components}
              onChange={setComponents}
              disabled={isReadOnly}
              columns={[
                { key: "componentId", header: t("limsComponentId") },
                { key: "componentName", header: t("limsComponentName") },
                { key: "value", header: t("limsValue") },
                { key: "unit", header: t("limsUnit") },
                { key: "outOfRange", header: t("limsOutOfRange"), type: "checkbox" },
                { key: "enteredOn", header: t("limsEnteredOn"), type: "date" },
                { key: "enteredBy", header: t("limsEnteredBy") }
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

export default LimsTestForm;
