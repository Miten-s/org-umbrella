import { useMemo, useRef, useState } from "react";
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
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import {
  useLimsAnalysisComponentOptions,
  useLimsAnalysisOptions
} from "@/pages/lims/analyses/LimsAnalysis.queries";
import type { LimsComponentRow } from "@/pages/lims/analyses/LimsAnalysis.types";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import {
  limsSpecificationSchema,
  limsSpecificationCopySchema,
  validateLimitsRows,
  type LimsSpecificationFormValues
} from "./LimsSpecification.schema";
import type { LimsSpecification, LimsSpecificationPayload, LimsRef, LimsLimitRow } from "./LimsSpecification.types";

/**
 * "copy" renders like "create" (fully editable) except the business ID
 * starts blank instead of pre-filled with the source's — stays EDITABLE,
 * not disabled: `applyBusinessId` mints a fresh one only when the field
 * is empty, and otherwise honors whatever the user typed (subject to the
 * usual uniqueness check). Attachments are hidden in this mode: the Copy
 * flow's batch save is JSON-only and can't carry file uploads. Used by
 * CopyStepper.
 */
export type LimsSpecificationFormMode = "create" | "edit" | "view" | "copy";

interface LimsSpecificationFormProps {
  mode?: LimsSpecificationFormMode;
  initialData?: LimsSpecification | null;
  onClose: () => void;
  onSubmit: (payload: LimsSpecificationPayload, files: File[]) => Promise<void> | void;
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

const LimsSpecificationForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel,
  formId,
  stepLabel
}: LimsSpecificationFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);
  const initialLimitsRef = useRef(initialData?.limits ?? []);
  const [limits, setLimits] = useState<LimsLimitRow[]>(initialLimitsRef.current);
  // Limits live outside RHF/zod (see LimsSpecification.schema's
  // validateLimitsRows) — computed live so the grid's error banner updates
  // as the user edits, and checked again at submit to actually block it.
  const limitsError = useMemo(() => validateLimitsRows(limits), [limits]);

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsSpecificationFormValues>(
    () => ({
      specId: mode === "copy" ? "" : (initialData?.specId ?? ""),
      name: initialData?.name ?? "",
      group: initialData?.group?.id ?? "",
      description: initialData?.description ?? "",
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsSpecificationFormValues>({
    resolver: zodResolver(mode === "copy" ? limsSpecificationCopySchema : limsSpecificationSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsSpecificationFormValues,
    label: string,
    required = false,
    type = "text",
    forceDisabled = false
  ) => (
    <div className="min-w-0">
      <Label required={required}>{label}</Label>
      <Input
        {...register(name)}
        type={type}
        disabled={isReadOnly || forceDisabled}
        error={!!errors[name]}
        hint={errors[name]?.message as string}
        className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        id={formId}
        onSubmit={handleSubmit((values) => {
          // Bad Min/Max blocks Save the same way an invalid top-level field
          // would — the grid's own error banner (below) says why.
          if (limitsError) return;

          // Edit + nothing actually changed: skip the reason modal, update
          // call, and audit entry entirely — a no-op Save just closes.
          if (
            mode === "edit" &&
            !attachments.isDirty &&
            isPayloadEqual(values, initialValues) &&
            isPayloadEqual(limits, initialLimitsRef.current)
          ) {
            onClose();
            return;
          }
          onSubmit(
            { ...values, limits, keptAttachmentIds: attachments.keptIds },
            attachments.newFiles
          );
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsSpecification") })
                        : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsSpecification") })}${stepLabel ?? ""}`
              : initialData
              ? t("update", { entity: t("limsSpecification") })
              : t("create", { entity: t("limsSpecification") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("specId", t("limsSpecId"), true, "text")}
          {text("name", t("name"), true, "text")}
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
            <SubFormGrid<LimsLimitRow>
              label={t("limsLimits")}
              rows={limits}
              onChange={setLimits}
              disabled={isReadOnly}
              error={limitsError}
              columns={[
                {
                  key: "analysisId",
                  header: t("limsAnalysis"),
                  type: "async-select",
                  useOptions: useLimsAnalysisOptions,
                  // Picking a new Analysis invalidates whichever Component
                  // (and its Min/Max) had been picked for the old one.
                  onSelectOption: (_row, option) => ({
                    analysisName: option.label,
                    componentId: undefined,
                    componentName: undefined,
                    min: undefined,
                    max: undefined
                  })
                },
                {
                  key: "analysisName",
                  header: t("limsAnalysisName"),
                  readOnly: (row) => Boolean(row.analysisId)
                },
                {
                  key: "componentId",
                  header: t("limsComponent"),
                  type: "async-select",
                  // Scoped to whichever Analysis this row's `analysisId`
                  // cell holds — see useLimsAnalysisComponentOptions.
                  useOptions: useLimsAnalysisComponentOptions,
                  onSelectOption: (_row, option) => {
                    const component = option.data as LimsComponentRow | undefined;
                    return {
                      componentName: option.label,
                      // Kept as whatever string the Component itself holds
                      // (min/max are STRING columns backend-side, not real
                      // numeric ones — see SubFormColumnType's doc comment).
                      min: component?.min !== undefined ? String(component.min) : undefined,
                      max: component?.max !== undefined ? String(component.max) : undefined
                    };
                  }
                },
                {
                  key: "componentName",
                  header: t("limsComponentName"),
                  readOnly: (row) => Boolean(row.componentId)
                },
                {
                  key: "min",
                  header: t("limsMin"),
                  type: "numeric-text",
                  readOnly: (row) => Boolean(row.componentId)
                },
                {
                  key: "max",
                  header: t("limsMax"),
                  type: "numeric-text",
                  readOnly: (row) => Boolean(row.componentId)
                },
                { key: "text", header: t("limsText") },
                { key: "phrase", header: t("limsPhrase") },
                { key: "boolean", header: t("limsBoolean") },
                { key: "calculation", header: t("limsCalculation") }
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

export default LimsSpecificationForm;
