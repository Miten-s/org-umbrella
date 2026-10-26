import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import ComponentRowsEditor from "./ComponentRowsEditor";
import FormHeader from "@/components/data/FormHeader";
import { validateComponentRows } from "./componentTypes";

import {
  useAnalysisTypeOptions,
  useApprovalStatusOptions
} from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsInspectionPlanOptions } from "@/pages/lims/inspection-plans/LimsInspectionPlan.queries";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import {
  limsAnalysisSchema,
  limsAnalysisCopySchema,
  type LimsAnalysisFormValues
} from "./LimsAnalysis.schema";
import type {
  LimsAnalysis,
  LimsAnalysisPayload,
  LimsRef,
  LimsComponentRow
} from "./LimsAnalysis.types";

/** "copy" renders like "create" except the business ID starts blank (stays EDITABLE — mints
 * fresh only when empty). "bulk-edit" is like "edit" but calls `onUnchanged` instead of closing. */
export type LimsAnalysisFormMode =
  "create" | "edit" | "view" | "copy" | "bulk-edit";

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
  /** Grays out the submit button without a spinner — EditStepper uses
   * this on the last step now that its own Save button lives outside it. */
  disabled?: boolean;
  /** Set on the `<form>` element so an outside button (CopyStepper's
   * header Next/Save) can submit it via `<Button form={formId}>`. */
  formId?: string;
  /** " (2 of 5)" appended after the title when Copy is reviewing more
   * than one record — undefined otherwise. */
  stepLabel?: string;
  /** Set on the Test Template page: no modal frame or buttons, and only this tab's part shows
   * (the other stays mounted, so one Save covers both). */
  pageSection?: "details" | "components";
  onDirtyChange?: (dirty: boolean) => void;
  /** Save found a problem — the page switches to the tab that holds it. */
  onInvalid?: (section: "details" | "components") => void;
  /** Number of components, for the page's tab badge. */
  onComponentCount?: (count: number) => void;
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
  disabled = false,
  formId,
  stepLabel,
  pageSection,
  onDirtyChange,
  onInvalid,
  onComponentCount
}: LimsAnalysisFormProps) => {
  const { t } = useTranslation();
  const onPage = pageSection !== undefined;
  const isReadOnly = mode === "view";
  const initialComponentsRef = useRef(initialData?.components ?? []);
  const [components, setComponents] = useState<LimsComponentRow[]>(
    initialComponentsRef.current
  );
  const [componentsError, setComponentsError] = useState<string | undefined>();

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsAnalysisFormValues>(
    () => ({
      analysisId: mode === "copy" ? "" : (initialData?.analysisId ?? ""),
      name: initialData?.name ?? "",
      analysisType: initialData?.analysisType?.id ?? "",
      // A copy is a new template, so it starts as Draft (set by the server) like a create.
      approvalStatus:
        mode === "copy" ? "" : (initialData?.approvalStatus?.id ?? ""),
      group: initialData?.group?.id ?? "",
      inspectionPlan: initialData?.inspectionPlan?.id ?? "",
      sopReference: initialData?.sopReference ?? "",
      description: initialData?.description ?? "",
      details: initialData?.details ?? ""
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
    resolver: zodResolver(
      mode === "copy" ? limsAnalysisCopySchema : limsAnalysisSchema
    ),
    defaultValues: initialValues
  });

  const watched = useWatch({ control });
  const dirty =
    !isPayloadEqual({ ...initialValues, ...watched }, initialValues) ||
    !isPayloadEqual(components, initialComponentsRef.current);
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  useEffect(
    () => onComponentCount?.(components.length),
    [components.length, onComponentCount]
  );

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
    <div
      className={
        onPage
          ? "text-gray-900 dark:text-gray-100"
          : "modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit(
          (values) => {
            // No-op Edit just closes; Copy always submits (even untouched — that's the point of batched Save).
            if (
              (mode === "edit" || mode === "bulk-edit") &&
              isPayloadEqual(values, initialValues) &&
              isPayloadEqual(components, initialComponentsRef.current)
            ) {
              (onUnchanged ?? onClose)();
              return;
            }
            const componentProblem = validateComponentRows(components);
            if (componentProblem) {
              setComponentsError(componentProblem);
              onInvalid?.("components");
              return;
            }
            setComponentsError(undefined);
            onSubmit({ ...values, components });
          },
          () => onInvalid?.("details")
        )}
        className="min-w-0 space-y-4"
      >
        {onPage ? null : (
          <FormHeader
            title={
              isReadOnly
                ? `${t("view", { entity: t("limsAnalysis") })}${stepLabel ?? ""}`
                : mode === "copy"
                  ? `${t("copyEntity", { entity: t("limsAnalysis") })}${stepLabel ?? ""}`
                  : initialData
                    ? `${t("update", { entity: t("limsAnalysis") })}${stepLabel ?? ""}`
                    : t("create", { entity: t("limsAnalysis") })
            }
          />
        )}

        <div
          className={`grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 ${onPage && pageSection !== "details" ? "hidden" : ""}`}
        >
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
                  placeholder={
                    mode === "create" || mode === "copy"
                      ? t("limsDraftByDefault")
                      : t("select", { entity: t("limsApprovalStatus") })
                  }
                  initialSelectedOptions={
                    mode === "copy"
                      ? undefined
                      : seedOne(initialData?.approvalStatus)
                  }
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
              onChange={(val) =>
                setValue("description", val, { shouldValidate: true })
              }
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="col-span-full min-w-0">
            <Label>{t("limsDetails")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={details || ""}
              onChange={(val) =>
                setValue("details", val, { shouldValidate: true })
              }
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
        <div className={onPage && pageSection !== "components" ? "hidden" : ""}>
          <div className="min-w-0">
            <ComponentRowsEditor
              rows={components}
              onChange={(next) => {
                setComponents(next);
                setComponentsError(undefined);
              }}
              disabled={isReadOnly}
              error={componentsError}
            />
          </div>
        </div>

        <div className={onPage ? "hidden" : "mt-4 flex justify-end gap-2"}>
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

export default LimsAnalysisForm;
