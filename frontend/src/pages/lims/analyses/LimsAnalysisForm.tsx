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

import { useAnalysisTypeOptions, useApprovalStatusOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsInspectionPlanOptions } from "@/pages/lims/inspection-plans/LimsInspectionPlan.queries";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import {
  limsAnalysisSchema,
  limsAnalysisCopySchema,
  type LimsAnalysisFormValues
} from "./LimsAnalysis.schema";
import type { LimsAnalysis, LimsAnalysisPayload, LimsRef, LimsComponentRow } from "./LimsAnalysis.types";

/**
 * "copy" renders exactly like "create" (fully editable, no diff-against-
 * baseline skip) except the business ID starts blank instead of pre-filled
 * with the source's — stays EDITABLE, not disabled: `applyBusinessId`
 * mints a fresh one only when the field is empty, and otherwise honors
 * whatever the user typed (subject to the usual uniqueness check), so
 * there's no reason to lock it out. Used by CopyStepper.
 *
 * "bulk-edit" renders exactly like "edit" (real data, real ID, no schema
 * change) — the only difference is what fires when nothing changed: "edit"
 * closes the whole modal, "bulk-edit" calls `onUnchanged` instead so
 * EditStepper can just skip this record and move on. Used by EditStepper.
 */
export type LimsAnalysisFormMode = "create" | "edit" | "view" | "copy" | "bulk-edit";

interface LimsAnalysisFormProps {
  mode?: LimsAnalysisFormMode;
  initialData?: LimsAnalysis | null;
  onClose: () => void;
  /** Fires instead of `onClose` when "edit"/"bulk-edit" finds nothing changed — EditStepper uses this to skip the record instead of closing the whole review. */
  onUnchanged?: () => void;
  onSubmit: (payload: LimsAnalysisPayload) => Promise<void> | void;
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

const LimsAnalysisForm = ({
  mode = "create",
  initialData,
  onClose,
  onUnchanged,
  onSubmit,
  submitting = false,
  submitLabel,
  formId,
  stepLabel
}: LimsAnalysisFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const initialComponentsRef = useRef(initialData?.components ?? []);
  const [components, setComponents] = useState<LimsComponentRow[]>(initialComponentsRef.current);

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsAnalysisFormValues>(
    () => ({
      analysisId: mode === "copy" ? "" : (initialData?.analysisId ?? ""),
      name: initialData?.name ?? "",
      analysisType: initialData?.analysisType?.id ?? "",
      approvalStatus: initialData?.approvalStatus?.id ?? "",
      group: initialData?.group?.id ?? "",
      inspectionPlan: initialData?.inspectionPlan?.id ?? "",
      sopReference: initialData?.sopReference ?? "",
      description: initialData?.description ?? "",
      details: initialData?.details ?? "",
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsAnalysisFormValues>({
    resolver: zodResolver(mode === "copy" ? limsAnalysisCopySchema : limsAnalysisSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const details = useWatch({ control, name: "details" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsAnalysisFormValues,
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
          // Edit + nothing actually changed: skip the reason modal, update
          // call, and audit entry entirely — a no-op Save just closes. Copy
          // always submits, even when the user left every field untouched —
          // that untouched-name case is exactly what the batched Save is for.
          if (
            (mode === "edit" || mode === "bulk-edit") &&
            isPayloadEqual(values, initialValues) &&
            isPayloadEqual(components, initialComponentsRef.current)
          ) {
            (onUnchanged ?? onClose)();
            return;
          }
          onSubmit({ ...values, components });
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? `${t("view", { entity: t("limsAnalysis") })}${stepLabel ?? ""}`
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsAnalysis") })}${stepLabel ?? ""}`
              : initialData
                ? `${t("update", { entity: t("limsAnalysis") })}${stepLabel ?? ""}`
                : t("create", { entity: t("limsAnalysis") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("analysisId", t("limsAnalysisId"), true, "text")}
          {text("name", t("name"), true, "text")}
          <div className="min-w-0">
            <Label required={false}>{t("limsAnalysisType")}</Label>
            <Controller
              name="analysisType"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useAnalysisTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsAnalysisType") })}
                  initialSelectedOptions={seedOne(initialData?.analysisType)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsApprovalStatus")}</Label>
            <Controller
              name="approvalStatus"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useApprovalStatusOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsApprovalStatus") })}
                  initialSelectedOptions={seedOne(initialData?.approvalStatus)}
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
            <Label required={false}>{t("limsInspectionPlan")}</Label>
            <Controller
              name="inspectionPlan"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsInspectionPlanOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsInspectionPlan") })}
                  initialSelectedOptions={seedOne(initialData?.inspectionPlan)}
                />
              )}
            />
          </div>
          {text("sopReference", t("limsSopReference"), false, "text")}
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
            <SubFormGrid<LimsComponentRow>
              label={t("limsComponents")}
              rows={components}
              onChange={setComponents}
              disabled={isReadOnly}
              columns={[
                { key: "componentId", header: t("limsComponentId") },
                { key: "name", header: t("name") },
                { key: "description", header: t("description") },
                { key: "type", header: t("limsType") },
                { key: "unit", header: t("limsUnit") },
                { key: "calculation", header: t("limsCalculation") },
                { key: "formula", header: t("limsFormula") },
                { key: "option", header: t("limsOption") },
                { key: "list", header: t("limsList") },
                { key: "entity", header: t("limsEntity") },
                { key: "entityCriteria", header: t("limsEntityCriteria") },
                { key: "min", header: t("limsMin"), type: "numeric-text" },
                { key: "max", header: t("limsMax"), type: "numeric-text" }
              ]}
            />
          </div>
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

export default LimsAnalysisForm;
