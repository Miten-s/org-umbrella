import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { seedRefOption } from "@/utils/refLabel";
import LimsAttachmentsField from "@/components/lims/LimsAttachmentsField";
import { useAttachments } from "@/hooks/useAttachments";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsProjectOptions } from "@/pages/lims/projects/LimsProject.queries";
import { useLimsUserOptions } from "@/pages/lims/users/LimsUser.options";
import { limsStudySchema, type LimsStudyFormValues } from "./LimsStudy.schema";
import type { LimsStudy, LimsStudyPayload, LimsRef } from "./LimsStudy.types";

export type LimsStudyFormMode = "create" | "edit" | "view";

interface LimsStudyFormProps {
  mode?: LimsStudyFormMode;
  initialData?: LimsStudy | null;
  onClose: () => void;
  onSubmit: (payload: LimsStudyPayload, files: File[]) => Promise<void> | void;
  submitting?: boolean;
}

const seedOne = (ref: LimsRef | null | undefined) => {
  const label = ref?.name;
  return ref?.id && label ? [{ value: ref.id, label }] : undefined;
};

const LimsStudyForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsStudyFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsStudyFormValues>({
    resolver: zodResolver(limsStudySchema),
    defaultValues: {
      studyId: initialData?.studyId ?? "",
      name: initialData?.name ?? "",
      studyCode: initialData?.studyCode ?? "",
      details: initialData?.details ?? "",
      group: initialData?.group?.id ?? "",
      project: initialData?.project?.id ?? "",
      projectDetails: initialData?.projectDetails ?? "",
      supervisor: initialData?.supervisor?.id ?? ""
    }
  });

  const details = useWatch({ control, name: "details" });
  const projectDetails = useWatch({ control, name: "projectDetails" });
  const busy = submitting || isSubmitting;

  const text = (name: keyof LimsStudyFormValues, label: string, required = false) => (
    <div className="min-w-0">
      <Label required={required}>{label}</Label>
      <Input
        {...register(name)}
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
        onSubmit={handleSubmit((values) =>
          onSubmit({ ...values, keptAttachmentIds: attachments.keptIds }, attachments.newFiles)
        )}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsStudy") })
            : initialData
              ? t("update", { entity: t("limsStudy") })
              : t("create", { entity: t("limsStudy") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("studyId", t("limsStudyId"), true)}
          {text("name", t("name"), true)}
          {text("studyCode", t("limsStudyCode"))}

          <div className="min-w-0">
            <Label>{t("limsGroup")}</Label>
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
            <Label>{t("limsProject")}</Label>
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
            <Label>{t("limsSupervisor")}</Label>
            <Controller
              name="supervisor"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsUserOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsSupervisor") })}
                  initialSelectedOptions={seedRefOption(initialData?.supervisor)}
                />
              )}
            />
          </div>

          <div className="col-span-full min-w-0">
            <Label>{t("limsProjectDetails")}</Label>
            <TextArea
              disabled
              value={projectDetails || ""}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="col-span-full min-w-0">
            <Label>{t("limsDetails")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={details || ""}
              onChange={(val) => setValue("details", val, { shouldValidate: true })}
              error={!!errors.details}
              hint={errors.details?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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

export default LimsStudyForm;
