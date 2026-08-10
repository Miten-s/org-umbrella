import { useState } from "react";
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
import { limsAnalysisSchema, type LimsAnalysisFormValues } from "./LimsAnalysis.schema";
import type { LimsAnalysis, LimsAnalysisPayload, LimsRef, LimsComponentRow } from "./LimsAnalysis.types";

export type LimsAnalysisFormMode = "create" | "edit" | "view";

interface LimsAnalysisFormProps {
  mode?: LimsAnalysisFormMode;
  initialData?: LimsAnalysis | null;
  onClose: () => void;
  onSubmit: (payload: LimsAnalysisPayload) => Promise<void> | void;
  submitting?: boolean;
}

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsAnalysisForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsAnalysisFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const [components, setComponents] = useState<LimsComponentRow[]>(initialData?.components ?? []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsAnalysisFormValues>({
    resolver: zodResolver(limsAnalysisSchema),
    defaultValues: {
      analysisId: initialData?.analysisId ?? "",
      name: initialData?.name ?? "",
      analysisType: initialData?.analysisType?.id ?? "",
      approvalStatus: initialData?.approvalStatus?.id ?? "",
      group: initialData?.group?.id ?? "",
      inspectionPlan: initialData?.inspectionPlan?.id ?? "",
      sopReference: initialData?.sopReference ?? "",
      description: initialData?.description ?? "",
      details: initialData?.details ?? "",
    }
  });

  const description = useWatch({ control, name: "description" });
  const details = useWatch({ control, name: "details" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsAnalysisFormValues,
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
        onSubmit={handleSubmit((values) => onSubmit({ ...values, components }))}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsAnalysis") })
            : initialData
              ? t("update", { entity: t("limsAnalysis") })
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
                { key: "min", header: t("limsMin") },
                { key: "max", header: t("limsMax") }
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
              {t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default LimsAnalysisForm;
