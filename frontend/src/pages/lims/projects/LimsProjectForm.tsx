import { useMemo } from "react";
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
import { useLimsCustomerOptions } from "@/pages/lims/customers/LimsCustomer.queries";
import { useLimsUserOptions } from "@/pages/lims/users/LimsUser.options";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { limsProjectSchema, type LimsProjectFormValues } from "./LimsProject.schema";
import type { LimsProject, LimsProjectPayload, LimsRef } from "./LimsProject.types";

export type LimsProjectFormMode = "create" | "edit" | "view";

interface LimsProjectFormProps {
  mode?: LimsProjectFormMode;
  initialData?: LimsProject | null;
  onClose: () => void;
  onSubmit: (payload: LimsProjectPayload, files: File[]) => Promise<void> | void;
  submitting?: boolean;
}

const seedOne = (ref: LimsRef | null | undefined) => {
  const label = ref?.name ?? ref?.customerName;
  return ref?.id && label ? [{ value: ref.id, label }] : undefined;
};

const LimsProjectForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsProjectFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsProjectFormValues>(
    () => ({
      projectId: initialData?.projectId ?? "",
      name: initialData?.name ?? "",
      code: initialData?.code ?? "",
      details: initialData?.details ?? "",
      group: initialData?.group?.id ?? "",
      customer: initialData?.customer?.id ?? "",
      customerContact: initialData?.customerContact ?? "",
      supervisor: initialData?.supervisor?.id ?? ""
    }),
    [initialData]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsProjectFormValues>({
    resolver: zodResolver(limsProjectSchema),
    defaultValues: initialValues
  });

  const details = useWatch({ control, name: "details" });
  const busy = submitting || isSubmitting;

  const text = (name: keyof LimsProjectFormValues, label: string, required = false) => (
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
        onSubmit={handleSubmit((values) => {
          // Edit + nothing actually changed: skip the reason modal, update
          // call, and audit entry entirely — a no-op Save just closes.
          if (mode === "edit" && !attachments.isDirty && isPayloadEqual(values, initialValues)) {
            onClose();
            return;
          }
          onSubmit({ ...values, keptAttachmentIds: attachments.keptIds }, attachments.newFiles);
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsProject") })
            : initialData
              ? t("update", { entity: t("limsProject") })
              : t("create", { entity: t("limsProject") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("projectId", t("limsProjectId"), true)}
          {text("name", t("name"), true)}
          {text("code", t("limsCode"))}

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
            <Label>{t("limsCustomer")}</Label>
            <Controller
              name="customer"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsCustomerOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsCustomer") })}
                  initialSelectedOptions={seedOne(initialData?.customer)}
                />
              )}
            />
          </div>

          {text("customerContact", t("limsCustomerContact"))}

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

export default LimsProjectForm;
