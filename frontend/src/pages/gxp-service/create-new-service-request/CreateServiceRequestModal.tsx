import { useEffect, useMemo, useState } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
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
import type { Application, ServiceRequest } from "@/types/gxp-service.types";
import { useGlobalContext } from "@/context";
import { getApplicationById } from "@/services/gxp.service";
import { getGxpImageUrl } from "@/services/utils.service";
import { ChipList } from "@/components/common/form/chipList";

type DropdownOption = { label: string; value: string };
type ApplicationDetails = {
  environmentId: string;
  environmentName: string;
  groupId: string;
  locationId: string;
  locationName: string;
  workflowId: string;
  workflowName: string;
  moduleIds: string[];
  moduleNames: string[];
  serviceTypeIds: string[];
  serviceTypeNames: string[];
  roleIds: string[];
  roleNames: string[];
  notes: string;
  attachments: string[];
};

interface CreateServiceRequestModalProps {
  onClose: () => void;
  onSubmit: (data: ServiceRequestFormOutput) => void | Promise<void>;
  initialData?: ServiceRequest | ServiceRequest[] | null;
  optionSets: {
    applications: any[];
    requestTypes?: DropdownOption[];
  };
}

const normalizeId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id ?? value?.value ?? "";
};

const normalizeInitialValues = (
  data?: ServiceRequest | null
): ServiceRequestFormInput => ({
  priority: data?.priority ?? "Medium",
  application: normalizeId(data?.application),
  esignCheck: data?.esignCheck ?? "No",
  trainingDone: data?.trainingDone ?? true,
  description: data?.description ?? "",
  shortDescription: data?.shortDescription ?? "",
  requestType: data?.requestType ?? "Applications",
  status: data?.status ?? "New",
  comments: data?.comments ?? []
});

const isImageName = (name: string) => /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name || "");
const prettifyAttachmentName = (path: string) => {
  if (!path) return "";
  const withoutLeadingSlash = path.replace(/^[/\\]+/, "");
  const parts = withoutLeadingSlash.split("-");
  if (parts.length > 1 && /^\d+$/.test(parts[0])) {
    return parts.slice(1).join("-");
  }
  return withoutLeadingSlash;
};

const getId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id ?? "";
};

const getText = (value: any, preferredKey?: string): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (preferredKey && typeof value?.[preferredKey] === "string") return value[preferredKey];
  return "";
};

const mapApplicationToDetails = (app: Application): ApplicationDetails => {
  const environmentId = getId(app?.applicationEnvironment);
  const environmentName = getText(app?.applicationEnvironment, "environmentName");

  const groupId = getId(app?.group);
  const locationId = groupId;
  const locationName = getText(app?.group, "locationName") || getText(app?.group, "groupName");

  const workflowId = getId(app?.applicationWorkflow);
  const workflowName = getText(app?.applicationWorkflow, "workflowName");

  const moduleIds =
    app?.applicationModules
      ?.map((m: any) => getId(m) || getText(m, "moduleName"))
      .filter(Boolean) ?? [];
  const moduleNames =
    app?.applicationModules
      ?.map((m: any) => getText(m, "moduleName") || getId(m))
      .filter(Boolean) ?? [];

  const serviceTypeIds =
    app?.applicationServiceRequestTypes?.map((s: any) => getId(s)).filter(Boolean) ?? [];
  const serviceTypeNames =
    app?.applicationServiceRequestTypes
      ?.map((s: any) => getText(s, "service") || getId(s))
      .filter(Boolean) ?? [];

  const roleIds = app?.applicationRoles?.map((r: any) => getId(r)).filter(Boolean) ?? [];
  const roleNames =
    app?.applicationRoles
      ?.map((r: any) => getText(r, "role") || getText(r, "name") || getId(r))
      .filter(Boolean) ?? [];

  const attachments =
    (app?.attachments || [])
      .map((att: any) =>
        typeof att === "string"
          ? att
          : att?.attachment ?? att?.filename ?? att?.attachmentLink ?? ""
      )
      .filter(Boolean) ?? [];

  return {
    environmentId,
    environmentName,
    groupId,
    locationId,
    locationName,
    workflowId,
    workflowName,
    moduleIds,
    moduleNames,
    serviceTypeIds,
    serviceTypeNames,
    roleIds,
    roleNames,
    notes: app?.notes ?? "",
    attachments
  };
};

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
  const { applications } = optionSets;
  const [appDetails, setAppDetails] = useState<ApplicationDetails | null>(null);
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

  const selectedApplication = useWatch({ control, name: "application" });
  const showAppFields = !!selectedApplication;
  useEffect(() => {
    reset(normalizedDefaults);
    setAppDetails(null);
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
  const onFormSubmit: SubmitHandler<ServiceRequestFormInput> = async (data) => {
    const parsed: ServiceRequestFormOutput = getServiceRequestSchema.parse(data);
    try {
      toggleLoading(true);
      await onSubmit(parsed);
    } finally {
      toggleLoading(false);
    }
  };

  const renderError = (message?: string) =>
    message ? <p className="text-red-500 text-xs mt-1">{message}</p> : null;

  useEffect(() => {
    const appId = normalizeId(selectedApplication);
    if (!appId) {
      setAppDetails(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        toggleLoading(true);
        const app = (await getApplicationById(appId)) as Application;
        const details = mapApplicationToDetails(app);

        if (cancelled) return;

        setValue("requestType", details.serviceTypeNames[0] ?? "Applications");
        setAppDetails(details);
      } catch (err) {
        console.error("Failed to load application details", err);
        if (!cancelled) setAppDetails(null);
      } finally {
        toggleLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedApplication, setValue, toggleLoading]);

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
            <Label htmlFor="comments" required>
              {t("comments")}
            </Label>
            <Controller
              name="comments"
              control={control}
              render={({ field }) => (
                <TextArea
                  value={(field.value).join("\n")}
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
      <div className="mt-4">
        {!showAppFields && (
          <div className="text-sm text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-3">
            {t("select", { entity: t("application") })}{" "}
            {t("toContinue", { defaultValue: "to load application details." })}
          </div>
        )}

        {showAppFields && appDetails && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 space-y-3 max-h-[26rem] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t("applicationDetails", { defaultValue: "Application Details" })}
              </p>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t("loadedFromApplication", { defaultValue: "Loaded from application" })}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t("environment")}</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {appDetails.environmentName || appDetails.environmentId || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t("location")}</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {appDetails.locationName || appDetails.locationId || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t("workflow")}</p>
                <p className="text-gray-900 dark:text-gray-100">
                  {appDetails.workflowName || appDetails.workflowId || "-"}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">{t("module")}</p>
                <div className="mt-1">
                  <ChipList items={appDetails.moduleNames} variant="grid"
                    columns={3} />
                </div>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">{t("requestType")}</p>
                <div className="mt-1">
                  <ChipList items={appDetails.serviceTypeNames} variant="grid"
                    columns={3} />
                </div>
              </div>

              <div>
                <p className="text-gray-500 dark:text-gray-400">{t("requestRole")}</p>
                <div className="mt-1">
                  <ChipList items={appDetails.roleNames} variant="grid"
                    columns={3} />
                </div>
              </div>

              <div className="md:col-span-2">
                <p className="text-gray-500 dark:text-gray-400">{t("notes")}</p>
                <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                  {appDetails.notes || "-"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-gray-500 dark:text-gray-400">{t("attachments")}</p>
                {appDetails.attachments?.length ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {appDetails.attachments.map((path: string, idx: number) => {
                      const name = prettifyAttachmentName(path);
                      return (
                        <div
                          key={`${path}-${idx}`}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2"
                          title={name}
                        >
                          {isImageName(path) ? (
                            <img
                              src={getGxpImageUrl(path)}
                              alt={name}
                              className="h-10 w-10 rounded border border-gray-200 dark:border-gray-700 object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-800 dark:text-gray-100">
                              {(path?.split(".").pop() || "file").toUpperCase().slice(0, 4)}
                            </div>
                          )}
                          <span className="text-xs text-gray-800 dark:text-gray-100 max-w-[220px] truncate">
                            {name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t("noRecordsFound")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateServiceRequestModal;
