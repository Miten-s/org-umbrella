import { useMemo, useState } from "react";
import { Controller, useForm, useWatch, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import DateField from "@/components/common/form/input/DateField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import type { AsyncOption } from "@/lib/query/listTypes";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { useLimsProjectOptions } from "@/pages/lims/projects/LimsProject.queries";
import { useSampleTypeOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsSpecificationOptions } from "@/pages/lims/specifications/LimsSpecification.queries";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import SampleTestsPicker, {
  type PendingTemplate
} from "@/pages/lims/samples/SampleTestsPicker";
import {
  limsSampleTemplateSchema,
  limsSampleTemplateCopySchema,
  type LimsSampleTemplateFormValues
} from "./LimsSampleTemplate.schema";
import type {
  LimsRef,
  LimsSampleTemplate,
  LimsSampleTemplatePayload
} from "./LimsSampleTemplate.types";

export type LimsSampleTemplateFormMode =
  "create" | "edit" | "view" | "copy" | "bulk-edit";

interface LimsSampleTemplateFormProps {
  mode?: LimsSampleTemplateFormMode;
  initialData?: LimsSampleTemplate | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: LimsSampleTemplatePayload) => Promise<void> | void;
  submitting?: boolean;
  /** Overrides the submit label — CopyStepper says "Next" until the last step. */
  submitLabel?: string;
  disabled?: boolean;
  /** Lets an outside button (the steppers' header) submit this form. */
  formId?: string;
  /** " (2 of 5)" when stepping through several records. */
  stepLabel?: string;
}

const seedOne = (ref: LimsRef | null | undefined): AsyncOption[] | undefined =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

/** Setup form for a Sample Template: the defaults new Sample forms start from. */
const LimsSampleTemplateForm = ({
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
}: LimsSampleTemplateFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const initialTests = useMemo<PendingTemplate[]>(
    () =>
      [...(initialData?.tests ?? [])]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((row) => ({
          id: String(row.analysisId ?? row.analysis?.id ?? ""),
          name: String(row.analysis?.name ?? "")
        }))
        .filter((row) => row.id),
    [initialData]
  );
  const [tests, setTests] = useState<PendingTemplate[]>(initialTests);

  const initialValues = useMemo<LimsSampleTemplateFormValues>(
    () => ({
      sampleTemplateId:
        mode === "copy" ? "" : (initialData?.sampleTemplateId ?? ""),
      name: initialData?.name ?? "",
      sampleType: initialData?.sampleType?.id ?? "",
      project: initialData?.project?.id ?? "",
      specification: initialData?.specification?.id ?? "",
      location: initialData?.location?.id ?? "",
      group: initialData?.group?.id ?? "",
      lotNumber: initialData?.lotNumber ?? "",
      serialNumber: initialData?.serialNumber ?? "",
      loginDate: initialData?.loginDate ?? "",
      loginBy: initialData?.loginBy ?? "",
      sampleStartDate: initialData?.sampleStartDate ?? "",
      sampleStartBy: initialData?.sampleStartBy ?? "",
      description: initialData?.description ?? "",
      comments: initialData?.comments ?? ""
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsSampleTemplateFormValues>({
    resolver: zodResolver(
      mode === "copy" ? limsSampleTemplateCopySchema : limsSampleTemplateSchema
    ),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const comments = useWatch({ control, name: "comments" });
  const busy = submitting || isSubmitting;

  const field = (
    name: Path<LimsSampleTemplateFormValues>,
    label: string,
    type: "text" | "date" = "text",
    required = false
  ) => (
    <div className="min-w-0">
      <Label required={required}>{label}</Label>
      {type === "date" ? (
        <Controller
          name={name}
          control={control}
          render={({ field: f }) => (
            <DateField
              mode="date"
              value={f.value as string}
              onChange={f.onChange}
              onBlur={f.onBlur}
              disabled={isReadOnly}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          )}
        />
      ) : (
        <Input
          {...register(name)}
          disabled={
            isReadOnly || (name === "sampleTemplateId" && mode === "copy")
          }
          error={!!errors[name]}
          hint={errors[name]?.message as string}
          className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      )}
    </div>
  );

  const select = (
    name: Path<LimsSampleTemplateFormValues>,
    label: string,
    useOptions: Parameters<typeof AsyncSelect>[0]["useOptions"],
    seed: AsyncOption[] | undefined
  ) => (
    <div className="min-w-0">
      <Label>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field: f }) => (
          <AsyncSelect
            useOptions={useOptions}
            value={f.value as string}
            onChange={f.onChange}
            disabled={isReadOnly}
            placeholder={t("select", { entity: label })}
            initialSelectedOptions={seed}
          />
        )}
      />
    </div>
  );

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        id={formId}
        onSubmit={handleSubmit((values) => {
          if (
            (mode === "edit" || mode === "bulk-edit") &&
            isPayloadEqual(values, initialValues) &&
            isPayloadEqual(tests, initialTests)
          ) {
            (onUnchanged ?? onClose)();
            return;
          }
          onSubmit({
            ...values,
            tests: tests.map((row, index) => ({
              analysisId: row.id,
              sortOrder: index
            }))
          });
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsSampleTemplate") })
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsSampleTemplate") })}${stepLabel ?? ""}`
              : initialData
                ? `${t("update", { entity: t("limsSampleTemplate") })}${stepLabel ?? ""}`
                : t("create", { entity: t("limsSampleTemplate") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {field("sampleTemplateId", t("limsSampleTemplateId"), "text", true)}
          {field("name", t("name"), "text", true)}
          {select(
            "sampleType",
            t("limsSampleType"),
            useSampleTypeOptions,
            seedOne(initialData?.sampleType)
          )}
          {select(
            "project",
            t("limsProject"),
            useLimsProjectOptions,
            seedOne(initialData?.project)
          )}
          {select(
            "specification",
            t("limsSpecification"),
            useLimsSpecificationOptions,
            seedOne(initialData?.specification)
          )}
          {select(
            "location",
            t("limsLocation"),
            useLimsLocationOptions,
            seedOne(initialData?.location)
          )}
          {select(
            "group",
            t("limsGroup"),
            useLimsGroupOptions,
            seedOne(initialData?.group)
          )}
          {field("lotNumber", t("limsLotNumber"))}
          {field("serialNumber", t("limsSerialNumber"))}
          {field("loginDate", t("limsLoginDate"), "date")}
          {field("loginBy", t("limsLoginBy"))}
          {field("sampleStartDate", t("limsSampleStartDate"), "date")}
          {field("sampleStartBy", t("limsSampleStartBy"))}
          <div className="col-span-full min-w-0">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val)}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="col-span-full min-w-0">
            <Label>{t("comments")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={comments || ""}
              onChange={(val) => setValue("comments", val)}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="col-span-full min-w-0">
            <SampleTestsPicker
              existing={[]}
              pending={tests}
              onChange={setTests}
              disabled={isReadOnly}
              markNew={false}
            />
          </div>
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
            <Button
              type="submit"
              variant="primary"
              loading={busy}
              disabled={busy || disabled}
            >
              {submitLabel ?? t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default LimsSampleTemplateForm;
