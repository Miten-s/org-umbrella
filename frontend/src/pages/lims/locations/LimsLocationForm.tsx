import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import FileUpload from "@/components/common/form/input/FileUpload";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { useAttachments } from "@/hooks/useAttachments";
import { isImageName } from "@/lib/attachments";
import { getGxpImageUrl } from "@/services/utils.service";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLocationTypeOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsLocationOptions } from "./LimsLocation.queries";
import { limsLocationSchema, type LimsLocationFormValues } from "./LimsLocation.schema";
import type { LimsLocation, LimsLocationPayload, LimsRef } from "./LimsLocation.types";

export type LimsLocationFormMode = "create" | "edit" | "view";

interface LimsLocationFormProps {
  mode?: LimsLocationFormMode;
  initialData?: LimsLocation | null;
  onClose: () => void;
  onSubmit: (payload: LimsLocationPayload, files: File[]) => Promise<void> | void;
  submitting?: boolean;
}

/**
 * Seeds an AsyncSelect's label from the record's nested relation, so editing
 * shows the real name instead of a UUID without any extra fetch
 * (MIGRATION.md §4, the preferred "already nested" path).
 */
const seedOne = (ref: LimsRef | string | null | undefined, label: (r: LimsRef) => string) => {
  if (!ref || typeof ref === "string") return undefined;
  const text = label(ref);
  return text ? [{ value: ref.id, label: text }] : undefined;
};

const seedMany = (refs: LimsRef[] | undefined, label: (r: LimsRef) => string) =>
  (refs ?? [])
    .filter((ref) => ref?.id)
    .map((ref) => ({ value: ref.id, label: label(ref) }))
    .filter((option) => option.label);

const refId = (ref: LimsRef | string | null | undefined): string => {
  if (!ref) return "";
  return typeof ref === "string" ? ref : ref.id;
};

const LimsLocationForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsLocationFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsLocationFormValues>({
    resolver: zodResolver(limsLocationSchema),
    defaultValues: {
      locationId: initialData?.locationId ?? "",
      locationName: initialData?.locationName ?? "",
      description: initialData?.description ?? "",
      locationType: refId(initialData?.locationType),
      group: refId(initialData?.group),
      parentLocation: refId(initialData?.parentLocation),
      subLocations: (initialData?.subLocations ?? []).map((ref) => ref.id),
      otherInformation: initialData?.otherInformation ?? ""
    }
  });

  const description = useWatch({ control, name: "description" });
  const otherInformation = useWatch({ control, name: "otherInformation" });
  const busy = submitting || isSubmitting;

  const err = (field: keyof LimsLocationFormValues) =>
    errors[field] ? (
      <p className="mt-1 text-xs text-red-500">{errors[field]?.message as string}</p>
    ) : null;

  const submit = handleSubmit((values) =>
    onSubmit(
      { ...values, keptAttachmentIds: attachments.keptIds },
      attachments.newFiles
    )
  );

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={submit} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsLocation") })
            : initialData
              ? t("update", { entity: t("limsLocation") })
              : t("create", { entity: t("limsLocation") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <Label required>{t("limsLocationId")}</Label>
            <Input
              {...register("locationId")}
              disabled={isReadOnly}
              error={!!errors.locationId}
              hint={errors.locationId?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label required>{t("name")}</Label>
            <Input
              {...register("locationName")}
              disabled={isReadOnly}
              error={!!errors.locationName}
              hint={errors.locationName?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label>{t("limsLocationType")}</Label>
            <Controller
              name="locationType"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLocationTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.locationType}
                  placeholder={t("select", { entity: t("limsLocationType") })}
                  initialSelectedOptions={seedOne(
                    initialData?.locationType,
                    (r) => String(r.name ?? "")
                  )}
                />
              )}
            />
            {err("locationType")}
          </div>

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
                  error={!!errors.group}
                  placeholder={t("select", { entity: t("limsGroup") })}
                  initialSelectedOptions={seedOne(
                    initialData?.group,
                    (r) => String(r.name ?? "")
                  )}
                />
              )}
            />
            {err("group")}
          </div>

          <div className="min-w-0">
            <Label>{t("limsParentLocation")}</Label>
            <Controller
              name="parentLocation"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsLocationOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.parentLocation}
                  placeholder={t("select", { entity: t("limsParentLocation") })}
                  initialSelectedOptions={seedOne(
                    initialData?.parentLocation,
                    (r) => String(r.locationName ?? r.name ?? "")
                  )}
                />
              )}
            />
            {err("parentLocation")}
          </div>

          <div className="min-w-0">
            <Label>{t("limsSubLocations")}</Label>
            <Controller
              name="subLocations"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  multi
                  useOptions={useLimsLocationOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsSubLocations") })}
                  initialSelectedOptions={seedMany(initialData?.subLocations, (r) =>
                    String(r.locationName ?? r.name ?? "")
                  )}
                />
              )}
            />
            {err("subLocations")}
          </div>

          <div className="min-w-0 md:col-span-2">
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

          <div className="min-w-0 md:col-span-2">
            <Label>{t("limsOtherInformation")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={otherInformation || ""}
              onChange={(val) => setValue("otherInformation", val, { shouldValidate: true })}
              error={!!errors.otherInformation}
              hint={errors.otherInformation?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0 md:col-span-2">
            <Label>{t("limsAttachments")}</Label>

            {attachments.existing.length ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.existing.map((file) => (
                  <div
                    key={file.id}
                    title={file.name}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  >
                    {isImageName(file.path) ? (
                      <img
                        src={getGxpImageUrl(file.path)}
                        alt={file.name}
                        className="h-10 w-10 rounded border border-gray-200 object-cover dark:border-gray-700"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-[10px] font-semibold text-gray-800 dark:bg-gray-700 dark:text-gray-100">
                        {(file.path.split(".").pop() || "file").toUpperCase().slice(0, 4)}
                      </div>
                    )}
                    <span className="max-w-[220px] truncate text-xs text-gray-800 dark:text-gray-100">
                      {file.name}
                    </span>
                    {!isReadOnly ? (
                      <button
                        type="button"
                        onClick={() => attachments.removeExisting(file.id)}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-700 dark:text-red-400"
                      >
                        {t("delete")}
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {!isReadOnly ? (
              <FileUpload
                value={attachments.newFiles}
                onChange={attachments.setNewFiles}
                multiple
                maxFiles={10}
                maxSizeMB={10}
                blockAudioVideo
                title={t("limsAttachments")}
              />
            ) : null}
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

export default LimsLocationForm;
