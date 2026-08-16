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
import LimsAttachmentsField from "@/components/lims/LimsAttachmentsField";
import { useAttachments } from "@/hooks/useAttachments";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { limsSpecificationSchema, type LimsSpecificationFormValues } from "./LimsSpecification.schema";
import type { LimsSpecification, LimsSpecificationPayload, LimsRef, LimsLimitRow } from "./LimsSpecification.types";

export type LimsSpecificationFormMode = "create" | "edit" | "view";

interface LimsSpecificationFormProps {
  mode?: LimsSpecificationFormMode;
  initialData?: LimsSpecification | null;
  onClose: () => void;
  onSubmit: (payload: LimsSpecificationPayload, files: File[]) => Promise<void> | void;
  submitting?: boolean;
}

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsSpecificationForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsSpecificationFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);
  const [limits, setLimits] = useState<LimsLimitRow[]>(initialData?.limits ?? []);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsSpecificationFormValues>({
    resolver: zodResolver(limsSpecificationSchema),
    defaultValues: {
      specId: initialData?.specId ?? "",
      name: initialData?.name ?? "",
      group: initialData?.group?.id ?? "",
      description: initialData?.description ?? "",
    }
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsSpecificationFormValues,
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
        onSubmit={handleSubmit((values) => onSubmit({ ...values, limits, keptAttachmentIds: attachments.keptIds }, attachments.newFiles))}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsSpecification") })
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
              columns={[
                { key: "analysisName", header: t("limsAnalysisName") },
                { key: "componentName", header: t("limsComponentName") },
                { key: "min", header: t("limsMin") },
                { key: "max", header: t("limsMax") },
                { key: "text", header: t("limsText") },
                { key: "phrase", header: t("limsPhrase") },
                { key: "boolean", header: t("limsBoolean") },
                { key: "calculation", header: t("limsCalculation") }
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

export default LimsSpecificationForm;
