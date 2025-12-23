import { useEffect, useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Label from "@/components/common/form/Label";
import Input from "@/components/common/form/input/InputField";
import TextArea from "@/components/common/form/input/TextArea";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/common/form/switch/Switch";
import {
  getServiceRequestSchema,
  ServiceRequestFormInput,
  ServiceRequestFormOutput
} from "@/lib/schema";
import { applicationServiceRequestTypeOptions } from "@/types/common.types";
import type { ServiceRequest } from "@/types/gxp-service.types";
import { useGlobalContext } from "@/context";
import FileUpload from "@/components/common/form/input/FileUpload";
import { getGxpImageUrl } from "@/services/utils.service";

type DropdownOption = { label: string; value: string };

interface CreateServiceRequestModalProps {
  onClose: () => void;
  onSubmit: (
    data: ServiceRequestFormOutput,
    attachments: File[],
    existingAttachments: string[]
  ) => void | Promise<void>;
  initialData?: ServiceRequest | ServiceRequest[] | null;
  optionSets: {
    applications: any[];
    environments: any[];
    assignmentGroups: any[];
    appModules: any[];
    workflows: any[];
    roles: any[];
    requestTypes: DropdownOption[];
    locations: any[];
  };
}

const normalizeId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id ?? value?.value ?? value?.name ?? value?.moduleName ?? "";
};

const normalizeInitialValues = (
  data?: ServiceRequest | null
): ServiceRequestFormInput => ({
  group: normalizeId(data?.group),
  priority: data?.priority ?? "Medium",
  application: normalizeId(data?.application),
  environment: normalizeId(data?.environment),
  module: normalizeId(data?.module),
  requestRole: normalizeId(data?.requestRole),
  esignCheck: data?.esignCheck ?? "No",
  trainingDone: data?.trainingDone ?? true,
  description: data?.description ?? "",
  shortDescription: data?.shortDescription ?? "",
  note: data?.note ?? "",
  location: normalizeId(data?.location),
  workflow: normalizeId(data?.workflow),
  requestType: data?.requestType ?? "Applications",
  status: data?.status ?? "New",
  attachments: data?.attachments ?? [],
  comments: data?.comments ?? []
});

const isImageName = (name: string) => /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name || "");

const CreateServiceRequestModal = ({
  onClose,
  onSubmit,
  initialData,
  optionSets
}: CreateServiceRequestModalProps) => {
  const resolvedInitial = Array.isArray(initialData) ? initialData[0] : initialData;
  const normalizedDefaults = useMemo(
    () => normalizeInitialValues(resolvedInitial),
    [resolvedInitial]
  );
  const { toggleLoading, loading } = useGlobalContext();
  const { t } = useTranslation();
  const {
    applications,
    environments,
    assignmentGroups,
    appModules,
    workflows,
    roles,
    requestTypes,
    locations
  } = optionSets;
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<string[]>([]);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ServiceRequestFormInput>({
    resolver: zodResolver(getServiceRequestSchema),
    defaultValues: normalizedDefaults
  });

  useEffect(() => {
    reset(normalizedDefaults);
    setAttachments([]);
    setExistingAttachments(normalizedDefaults.attachments || []);
  }, [normalizedDefaults, reset]);

  const toDropdown = (item: any, labelKey: string, valueKey: string = "_id"): DropdownOption => ({
    label: item?.[labelKey] ?? item?.name ?? String(item?.[valueKey] ?? ""),
    value: item?.[valueKey] ?? item?._id ?? item?.value ?? ""
  });

  const statusOptions: DropdownOption[] = [
    { label: "New", value: "New" },
    { label: "In Progress", value: "In Progress" },
    { label: "Hold", value: "Hold" },
    { label: "Closed - Incomplete", value: "Closed - Incomplete" },
    { label: "Closed - Complete", value: "Closed - Complete" },
    { label: "Closed - Skipped", value: "Closed - Skipped" }
  ];

  const priorityOptions: DropdownOption[] = [
    { label: "Very High", value: "Very High" },
    { label: "High", value: "High" },
    { label: "Medium", value: "Medium" },
    { label: "Low", value: "Low" }
  ];

  const esignOptions: DropdownOption[] = [
    { label: t("yes") ?? "Yes", value: "Yes" },
    { label: t("no") ?? "No", value: "No" }
  ];

  const requestTypeOptions: DropdownOption[] = useMemo(() => {
    const merged = [
      { label: t("gxpApplications"), value: "Applications" },
      ...requestTypes,
      ...applicationServiceRequestTypeOptions.map((opt) => ({
        label: opt.label,
        value: opt.value
      }))
    ];
    const seen = new Set<string>();
    return merged.filter((opt) => {
      if (!opt?.value || seen.has(opt.value)) return false;
      seen.add(opt.value);
      return true;
    });
  }, [requestTypes, t]);

  const onFormSubmit: SubmitHandler<ServiceRequestFormInput> = async (data) => {
    const parsed: ServiceRequestFormOutput = getServiceRequestSchema.parse(data);
    try {
      toggleLoading(true);
      await onSubmit(parsed, attachments, existingAttachments);
    } finally {
      toggleLoading(false);
    }
  };

  const renderError = (message?: string) =>
    message ? <p className="text-red-500 text-xs mt-1">{message}</p> : null;

  return (
    <div className="p-6 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {resolvedInitial ? t("edit") : t("gxpCreateNewServiceRequest")}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="shortDescription" required>
              {t("shortDescription")}
            </Label>
            <Controller
              name="shortDescription"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                  error={!!errors.shortDescription}
                  hint={errors.shortDescription?.message}
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="application" required>
              {t("application")}
            </Label>
            <Controller
              name="application"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  options={applications?.map((app) =>
                    toDropdown(app, "applicationName", "_id")
                  )}
                  placeholder={t("select", { entity: t("application") })}
                />
              )}
            />
            {renderError(errors.application?.message)}
          </div>

          <div>
            <Label htmlFor="module" required>
              {t("module")}
            </Label>
            <Controller
              name="module"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => {
                    if (typeof val === "string") {
                      field.onChange(val);
                    }
                  }}
                  options={appModules?.map((mod) => toDropdown(mod, "moduleName", "_id"))}
                  placeholder={t("select", { entity: t("module") })}
                />
              )}
            />
            {renderError(errors.module?.message)}
          </div>

          <div>
            <Label htmlFor="requestType">{t("requestType")}</Label>
            <Controller
              name="requestType"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  options={requestTypeOptions}
                  placeholder={t("select", { entity: t("requestType") })}
                />
              )}
            />
            {renderError(errors.requestType?.message)}
          </div>

          <div>
            <Label htmlFor="priority" required>
              {t("priority")}
            </Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  options={priorityOptions}
                  placeholder={t("select", { entity: t("priority") })}
                />
              )}
            />
            {renderError(errors.priority?.message)}
          </div>

          <div>
            <Label htmlFor="environment" required>
              {t("environment")}
            </Label>
            <Controller
              name="environment"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  options={environments?.map((env) => toDropdown(env, "environmentName", "_id"))}
                  placeholder={t("select", { entity: t("environment") })}
                />
              )}
            />
            {renderError(errors.environment?.message)}
          </div>

          <div>
            <Label htmlFor="location" required>
              {t("location")}
            </Label>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  options={locations?.map((loc) => toDropdown(loc, "locationName", "_id"))}
                  placeholder={t("select", { entity: t("location") })}
                />
              )}
            />
            {renderError(errors.location?.message)}
          </div>

          <div>
            <Label htmlFor="group" required>
              {t("group")}
            </Label>
            <Controller
              name="group"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  options={assignmentGroups?.map((group) =>
                    toDropdown(group, "groupName", "_id")
                  )}
                  placeholder={t("select", { entity: t("group") })}
                />
              )}
            />
            {renderError(errors.group?.message)}
          </div>

          <div>
            <Label htmlFor="requestRole">{t("requestRole")}</Label>
            <Controller
              name="requestRole"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  options={roles?.map((role) => toDropdown(role, "roleName", "_id"))}
                  placeholder={t("select", { entity: t("requestRole") })}
                />
              )}
            />
            {renderError(errors.requestRole?.message as string)}
          </div>

          <div>
            <Label htmlFor="workflow" required>{t("workflow")}</Label>
            <Controller
              name="workflow"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  options={workflows?.map((wf) => toDropdown(wf, "workflowName", "_id"))}
                  placeholder={t("select", { entity: t("workflow") })}
                />
              )}
            />
            {renderError(errors.workflow?.message as string)}
          </div>

          <div>
            <Label htmlFor="esignCheck">{t("esignCheck")}</Label>
            <Controller
              name="esignCheck"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  options={esignOptions}
                  placeholder={t("select", { entity: t("esignCheck") })}
                />
              )}
            />
            {renderError(errors.esignCheck?.message)}
          </div>

          <div>
            <Label htmlFor="trainingDone">{t("trainingDone")}</Label>
            <Controller
              name="trainingDone"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3 py-2">
                  <Switch
                    checked={!!field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      setValue("trainingDone", val);
                    }}
                    label={field.value ? t("yes") ?? "Yes" : t("no") ?? "No"}
                  />
                </div>
              )}
            />
            {renderError(errors.trainingDone?.message)}
          </div>

          <div >
            <Label htmlFor="status">{t("status")}</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? "New"}
                  onChange={(val) => field.onChange(val)}
                  options={statusOptions}
                  placeholder={t("select", { entity: t("status") })}
                />
              )}
            />
            {renderError(errors.status?.message)}
          </div>

          <div>
            <Label htmlFor="description" required>
              {t("description")}
            </Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  error={!!errors.description}
                  hint={errors.description?.message}
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="note" required> {t("notes")}</Label>
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextArea
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  error={!!errors.note}
                  hint={errors.note?.message}
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              )}
            />
          </div>

          <div>
            <Label htmlFor="comments" required>
              {t("comments")}
            </Label>
            <Controller
              name="comments"
              control={control}
              render={({ field }) => (
                <TextArea
                  value={(field.value || []).join("\n")}
                  onChange={(val) => {
                    const lines = (val || "")
                      .split("\n")
                      .map((line) => line.trim())
                      .filter(Boolean);
                    field.onChange(lines);
                  }}
                  error={!!errors.comments}
                  hint={
                    (errors.comments as any)?.message ||
                    (errors.comments as any)?._errors?.[0]
                  }
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              )}
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="attachments">
              {t("attachments", { defaultValue: t("trainingEvidence") ?? "Attachments" })}
            </Label>
            {existingAttachments?.length ? (
              <div className="mb-3 space-y-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {t("previousUploads", { defaultValue: "Previously uploaded" })} (
                  {existingAttachments.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {existingAttachments.map((name, idx) => (
                    <div
                      key={`${name}-${idx}`}
                      className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2"
                      title={name}
                    >
                      {isImageName(name) ? (
                        <img
                          src={getGxpImageUrl(name)}
                          alt={name}
                          className="h-10 w-10 rounded border border-gray-200 dark:border-gray-700 object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-800 dark:text-gray-100">
                          {(name?.split(".").pop() || "file").toUpperCase().slice(0, 4)}
                        </div>
                      )}
                      <span className="text-xs text-gray-800 dark:text-gray-100 max-w-[220px] truncate">
                        {name}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExistingAttachments((prev) =>
                            prev.filter((_, removeIdx) => removeIdx !== idx)
                          )
                        }
                        className="text-[11px] font-semibold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        {t("remove", { defaultValue: "Remove" })}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <FileUpload
              value={attachments}
              onChange={(files) => setAttachments(files)}
              multiple={true}
              maxFiles={10}
              maxSizeMB={10}
              blockAudioVideo={true}
              // accept not set => allow all (except audio/video via custom rule)
              title="Upload Training Evidence"
              description="Upload documents/images. Audio/video not allowed."
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateServiceRequestModal;
