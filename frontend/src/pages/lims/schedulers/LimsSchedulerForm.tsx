import { useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import DateField from "@/components/common/form/input/DateField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Switch from "@/components/common/form/switch/Switch";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { isPayloadEqual } from "@/lib/formChangeDetection";

import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsProjectOptions } from "@/pages/lims/projects/LimsProject.queries";
import { useLimsAnalysisOptions } from "@/pages/lims/analyses/LimsAnalysis.queries";
import { useLimsTestGroupOptions } from "@/pages/lims/test-groups/LimsTestGroup.queries";
import { useLimsSpecificationOptions } from "@/pages/lims/specifications/LimsSpecification.queries";
import { useSampleTypeOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsUserOptions } from "@/pages/lims/users/LimsUser.options";
import { seedRefOption } from "@/utils/refLabel";
import { limsSchedulerSchema, limsSchedulerCopySchema, type LimsSchedulerFormValues } from "./LimsScheduler.schema";
import type { LimsScheduler, LimsSchedulerPayload, LimsRef } from "./LimsScheduler.types";

/** "copy" renders like "create" except the business ID starts blank (stays EDITABLE —
 * `applyBusinessId` only mints when empty, otherwise honors what the user typed). */
export type LimsSchedulerFormMode = "create" | "edit" | "view" | "copy" | "bulk-edit";

interface LimsSchedulerFormProps {
  mode?: LimsSchedulerFormMode;
  initialData?: LimsScheduler | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: LimsSchedulerPayload) => Promise<void> | void;
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

const LimsSchedulerForm = ({
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
}: LimsSchedulerFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsSchedulerFormValues>(
    () => ({
      schedulerId: mode === "copy" ? "" : (initialData?.schedulerId ?? ""),
      name: initialData?.name ?? "",
      scope: initialData?.scope ?? "",
      group: initialData?.group?.id ?? "",
      project: initialData?.project?.id ?? "",
      analysis: initialData?.analysis?.id ?? "",
      testGroup: initialData?.testGroup?.id ?? "",
      specification: initialData?.specification?.id ?? "",
      sampleType: initialData?.sampleType?.id ?? "",
      owner: initialData?.owner?.id ?? "",
      plan: initialData?.plan ?? "",
      planTime: initialData?.planTime ?? "",
      leadTimeValue: initialData?.leadTimeValue ?? "",
      leadTimeUnit: initialData?.leadTimeUnit ?? "",
      nextRunDate: initialData?.nextRunDate ?? "",
      description: initialData?.description ?? "",
      autoLogin: initialData?.autoLogin ?? false,
      isActive: initialData?.isActive ?? false,
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsSchedulerFormValues>({
    resolver: zodResolver(mode === "copy" ? limsSchedulerCopySchema : limsSchedulerSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsSchedulerFormValues,
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
          if ((mode === "edit" || mode === "bulk-edit") && isPayloadEqual(values, initialValues)) {
            (onUnchanged ?? onClose)();
            return;
          }
          onSubmit({ ...values });
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsScheduler") })
                        : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsScheduler") })}${stepLabel ?? ""}`
              : initialData
              ? `${t("update", { entity: t("limsScheduler") })}${stepLabel ?? ""}`
              : t("create", { entity: t("limsScheduler") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("schedulerId", t("limsSchedulerId"), true, "text")}
          {text("name", t("name"), true, "text")}
          <div className="min-w-0">
            <Label>{t("limsSchedulerScope")}</Label>
            <Controller
              name="scope"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={[{ label: "Sample", value: "Sample" }, { label: "Test", value: "Test" }, { label: "Result", value: "Result" }]}
                  placeholder={t("select", { entity: t("limsSchedulerScope") })}
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
            <Label required={false}>{t("limsOwner")}</Label>
            <Controller
              name="owner"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsUserOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsOwner") })}
                  initialSelectedOptions={seedRefOption(initialData?.owner)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label>{t("limsPlan")}</Label>
            <Controller
              name="plan"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={[{ label: "Daily", value: "Daily" }, { label: "Monthly", value: "Monthly" }, { label: "Yearly", value: "Yearly" }]}
                  placeholder={t("select", { entity: t("limsPlan") })}
                />
              )}
            />
          </div>
          {text("planTime", t("limsPlanTime"), false, "time")}
          {text("leadTimeValue", t("limsLeadTime"), false, "number")}
          <div className="min-w-0">
            <Label>{t("limsLeadTimeUnit")}</Label>
            <Controller
              name="leadTimeUnit"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={[{ label: "Day", value: "Day" }, { label: "Hours", value: "Hours" }, { label: "Min", value: "Min" }, { label: "Second", value: "Second" }]}
                  placeholder={t("select", { entity: t("limsLeadTimeUnit") })}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            {/* lastRunDate is set by the scheduler runner, never by a form
                submission — shown read-only, never collected as input. */}
            <Label>{t("limsLastRunDate")}</Label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {initialData?.lastRunDate ?? "—"}
            </p>
          </div>
          {text("nextRunDate", t("limsNextRunDate"), false, "date")}
          <div className="min-w-0">
            <Label>{t("limsGeneratedCount")}</Label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {String(initialData?.generatedCount ?? "—")}
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
          <div className="min-w-0">
            <Label>{t("limsAutoLogin")}</Label>
            <Controller
              name="autoLogin"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3 py-2">
                  <Switch
                    checked={Boolean(field.value)}
                    onChange={field.onChange}
                    label={field.value ? t("yes") : t("no")}
                  />
                </div>
              )}
            />
          </div>
          <div className="min-w-0">
            <Label>{t("limsSchedulerActive")}</Label>
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3 py-2">
                  <Switch
                    checked={Boolean(field.value)}
                    onChange={field.onChange}
                    label={field.value ? t("yes") : t("no")}
                  />
                </div>
              )}
            />
          </div>
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

export default LimsSchedulerForm;
