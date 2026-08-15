import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Switch from "@/components/common/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { seedRefOption } from "@/utils/refLabel";

import { useLimsTestOptions } from "@/pages/lims/tests/LimsTest.queries";
import { useLimsSampleOptions } from "@/pages/lims/samples/LimsSample.queries";
import { useLimsAnalysisOptions } from "@/pages/lims/analyses/LimsAnalysis.queries";
import { useLimsInstrumentOptions } from "@/pages/lims/instruments/LimsInstrument.queries";
import { useLimsStockOptions } from "@/pages/lims/stocks/LimsStock.queries";
import { limsResultSchema, type LimsResultFormValues } from "./LimsResult.schema";
import type { LimsResult, LimsResultPayload, LimsRef } from "./LimsResult.types";

export type LimsResultFormMode = "create" | "edit" | "view";

interface LimsResultFormProps {
  mode?: LimsResultFormMode;
  initialData?: LimsResult | null;
  onClose: () => void;
  onSubmit: (payload: LimsResultPayload) => Promise<void> | void;
  submitting?: boolean;
}

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsResultForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsResultFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LimsResultFormValues>({
    resolver: zodResolver(limsResultSchema),
    defaultValues: {
      test: initialData?.test?.id ?? "",
      sample: initialData?.sample?.id ?? "",
      analysis: initialData?.analysis?.id ?? "",
      componentId: initialData?.componentId ?? "",
      componentName: initialData?.componentName ?? "",
      value: initialData?.value ?? "",
      unit: initialData?.unit ?? "",
      instrument: initialData?.instrument?.id ?? "",
      stock: initialData?.stock?.id ?? "",
      enteredOn: initialData?.enteredOn ?? "",
      enteredBy: initialData?.enteredBy ?? "",
      outOfRange: initialData?.outOfRange ?? false,
    }
  });

  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsResultFormValues,
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
        onSubmit={handleSubmit((values) => onSubmit({ ...values }))}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsResult") })
            : initialData
              ? t("update", { entity: t("limsResult") })
              : t("create", { entity: t("limsResult") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            {/* resultId is server-locked (crud-factory drops any client value on
                write) — shown read-only, never collected as input. */}
            <Label>{t("limsResultId")}</Label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {initialData?.resultId ?? "—"}
            </p>
          </div>
          <div className="min-w-0">
            <Label required>{t("limsTest")}</Label>
            <Controller
              name="test"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsTestOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.test}
                  placeholder={t("select", { entity: t("limsTest") })}
                  initialSelectedOptions={seedRefOption(initialData?.test)}
                />
              )}
            />
            {errors.test ? (
              <p className="mt-1 text-xs text-red-500">{errors.test.message}</p>
            ) : null}
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsSample")}</Label>
            <Controller
              name="sample"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsSampleOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsSample") })}
                  initialSelectedOptions={seedOne(initialData?.sample)}
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
          {text("componentId", t("limsComponentId"), false, "text")}
          {text("componentName", t("limsComponentName"), false, "text")}
          {text("value", t("limsValue"), false, "text")}
          {text("unit", t("limsUnit"), false, "text")}
          <div className="min-w-0">
            <Label>{t("limsVersion")}</Label>
            <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              {String(initialData?.version ?? "—")}
            </p>
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
            <Label required={false}>{t("limsStock")}</Label>
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
                  initialSelectedOptions={seedOne(initialData?.stock)}
                />
              )}
            />
          </div>
          {text("enteredOn", t("limsEnteredOn"), false, "date")}
          {text("enteredBy", t("limsEnteredBy"), false, "text")}
          <div className="min-w-0">
            <Label>{t("limsOutOfRange")}</Label>
            <Controller
              name="outOfRange"
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
            <Button type="submit" variant="primary" loading={busy}>
              {t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default LimsResultForm;
