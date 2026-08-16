import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import LimsAddressFields from "@/components/lims/LimsAddressFields";
import LimsAttachmentsField from "@/components/lims/LimsAttachmentsField";
import { useAttachments } from "@/hooks/useAttachments";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useRatingOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { limsSupplierSchema, type LimsSupplierFormValues } from "./LimsSupplier.schema";
import type { LimsRef, LimsSupplier, LimsSupplierPayload } from "./LimsSupplier.types";

export type LimsSupplierFormMode = "create" | "edit" | "view";

interface LimsSupplierFormProps {
  mode?: LimsSupplierFormMode;
  initialData?: LimsSupplier | null;
  onClose: () => void;
  onSubmit: (payload: LimsSupplierPayload, files: File[]) => Promise<void> | void;
  submitting?: boolean;
}

const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsSupplierForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsSupplierFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsSupplierFormValues>({
    resolver: zodResolver(limsSupplierSchema),
    defaultValues: {
      supplierId: initialData?.supplierId ?? "",
      supplierName: initialData?.supplierName ?? "",
      description: initialData?.description ?? "",
      group: initialData?.group?.id ?? "",
      rating: initialData?.rating?.id ?? "",
      website: initialData?.website ?? "",
      contactName: initialData?.contactName ?? "",
      contactPhone: initialData?.contactPhone ?? "",
      email: initialData?.email ?? "",
      address: {
        line1: initialData?.address?.line1 ?? "",
        line2: initialData?.address?.line2 ?? "",
        town: initialData?.address?.town ?? "",
        state: initialData?.address?.state ?? "",
        zipcode: initialData?.address?.zipcode ?? "",
        country: initialData?.address?.country ?? ""
      }
    }
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  const text = (name: keyof LimsSupplierFormValues, label: string, required = false) => (
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
          onSubmit(
            { ...values, keptAttachmentIds: attachments.keptIds },
            attachments.newFiles
          )
        )}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsSupplier") })
            : initialData
              ? t("update", { entity: t("limsSupplier") })
              : t("create", { entity: t("limsSupplier") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("supplierId", t("limsSupplierId"), true)}
          {text("supplierName", t("limsSupplierName"), true)}

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
            <Label>{t("limsRating")}</Label>
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useRatingOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsRating") })}
                  initialSelectedOptions={seedOne(initialData?.rating)}
                />
              )}
            />
          </div>

          {text("website", t("limsWebsite"))}
          {text("contactName", t("limsContactName"))}
          {text("contactPhone", t("limsContactPhone"))}
          {text("email", t("email"))}

          <div className="col-span-full min-w-0">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val, { shouldValidate: true })}
              error={!!errors.description}
              hint={errors.description?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <LimsAddressFields
            register={register as unknown as (name: string) => Record<string, unknown>}
            disabled={isReadOnly}
          />

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

export default LimsSupplierForm;
