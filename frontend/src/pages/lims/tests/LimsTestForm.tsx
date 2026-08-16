import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { seedRefOption } from "@/utils/refLabel";
import SubFormGrid from "@/components/data/SubFormGrid";
import LimsAttachmentsField from "@/components/lims/LimsAttachmentsField";
import { useAttachments } from "@/hooks/useAttachments";
import { useLimsSampleOptions } from "@/pages/lims/samples/LimsSample.queries";
import { useLimsAnalysisOptions } from "@/pages/lims/analyses/LimsAnalysis.queries";
import { useLimsInstrumentOptions } from "@/pages/lims/instruments/LimsInstrument.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { limsTestSchema, type LimsTestFormValues } from "./LimsTest.schema";
import type { LimsTest, LimsTestPayload, LimsRef, LimsResultRow } from "./LimsTest.types";

export type LimsTestFormMode = "create" | "edit" | "view";

interface LimsTestFormProps {
  mode?: LimsTestFormMode;
  initialData?: LimsTest | null;
  onClose: () => void;
  onSubmit: (payload: LimsTestPayload, files: File[]) => Promise<void> | void;
  submitting?: boolean;
}

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsTestForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsTestFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);
  const [components, setComponents] = useState<LimsResultRow[]>(initialData?.components ?? []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsTestFormValues>({
    resolver: zodResolver(limsTestSchema),
    defaultValues: {
      testName: initialData?.testName ?? "",
      sample: initialData?.sample?.id ?? "",
      analysis: initialData?.analysis?.id ?? "",
      instrument: initialData?.instrument?.id ?? "",
      group: initialData?.group?.id ?? "",
      replicateCount: initialData?.replicateCount ?? "",
      loginDate: initialData?.loginDate ?? "",
      loginBy: initialData?.loginBy ?? "",
      description: initialData?.description ?? "",
    }
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
    <div className="modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        onSubmit={handleSubmit((values) => onSubmit({ ...values, components, keptAttachmentIds: attachments.keptIds }, attachments.newFiles))}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsTest") })
            : initialData
              ? t("update", { entity: t("limsTest") })
              : t("create", { entity: t("limsTest") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            {/* testId is server-locked (crud-factory drops any client value on
                write) — shown read-only, never collected as input. */}
            <Label>{t("limsTestId")}</Label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {initialData?.testId ?? "—"}
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

export default LimsTestForm;
