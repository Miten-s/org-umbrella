import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import SubFormGrid from "@/components/data/SubFormGrid";

import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { limsInspectionPlanSchema, type LimsInspectionPlanFormValues } from "./LimsInspectionPlan.schema";
import type { LimsInspectionPlan, LimsInspectionPlanPayload, LimsRef, LimsPersonnelRow } from "./LimsInspectionPlan.types";

export type LimsInspectionPlanFormMode = "create" | "edit" | "view";

interface LimsInspectionPlanFormProps {
  mode?: LimsInspectionPlanFormMode;
  initialData?: LimsInspectionPlan | null;
  onClose: () => void;
  onSubmit: (payload: LimsInspectionPlanPayload) => Promise<void> | void;
  submitting?: boolean;
}

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsInspectionPlanForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsInspectionPlanFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const [personnel, setPersonnel] = useState<LimsPersonnelRow[]>(initialData?.personnel ?? []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsInspectionPlanFormValues>({
    resolver: zodResolver(limsInspectionPlanSchema),
    defaultValues: {
      inspectionId: initialData?.inspectionId ?? "",
      name: initialData?.name ?? "",
      inspectionType: initialData?.inspectionType ?? "",
      group: initialData?.group?.id ?? "",
      description: initialData?.description ?? "",
      details: initialData?.details ?? "",
    }
  });

  const description = useWatch({ control, name: "description" });
  const details = useWatch({ control, name: "details" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsInspectionPlanFormValues,
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
        onSubmit={handleSubmit((values) => onSubmit({ ...values, personnel }))}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsInspectionPlan") })
            : initialData
              ? t("update", { entity: t("limsInspectionPlan") })
              : t("create", { entity: t("limsInspectionPlan") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("inspectionId", t("limsInspectionId"), true, "text")}
          {text("name", t("name"), true, "text")}
          <div className="min-w-0">
            <Label>{t("limsInspectionType")}</Label>
            <Controller
              name="inspectionType"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  options={[{ label: "Round robin", value: "Round robin" }, { label: "Linear", value: "Linear" }]}
                  placeholder={t("select", { entity: t("limsInspectionType") })}
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
            <SubFormGrid<LimsPersonnelRow>
              label={t("limsPersonnel")}
              rows={personnel}
              onChange={setPersonnel}
              disabled={isReadOnly}
              columns={[
                { key: "inspectionType", header: t("limsInspectionEntryType") },
                { key: "person", header: t("limsPerson") },
                { key: "role", header: t("limsRole") }
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

export default LimsInspectionPlanForm;
