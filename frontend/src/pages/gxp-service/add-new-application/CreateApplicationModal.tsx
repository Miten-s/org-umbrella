// src/pages/gxp/CreateApplicationModal.tsx
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";

import Label from "@/components/common/form/Label";
import Input from "@/components/common/form/input/InputField";
import TextArea from "@/components/common/form/input/TextArea";
import MultiSelect from "@/components/common/form/MultiSelect";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/common/form/switch/Switch";
import FileUpload from "@/components/common/form/input/FileUpload";
import {
  ApplicationFormInput,
  ApplicationFormOutput,
  getApplicationSchema
} from "@/lib/schema";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { applicationTypeOptions } from "@/types/common.types";
import { useGlobalContext } from "@/context";
import { getGxpImageUrl } from "@/services/utils.service";
import {
  appendUniqueString,
  normalizeMixedId,
  normalizeMixedIdArray
} from "@/utils/mixed-value";
import type {
  Application,
  AssignmentGroup,
  ApplicationGroup,
  ApplicationServiceRequestType,
  ApplicationSoftwareModule,
  Department,
  Environment,
  Supplier,
  User,
  Workflow
} from "@/types/gxp-service.types";
import type { Location } from "@/types/common.types";

type MultiSelectOption = { text: string; value: string };
type RoleOption = {
  _id?: string;
  name?: string;
  role?: string;
  roleName?: string;
  active?: boolean;
};
type ExistingAttachment = { id?: string; path: string; name: string };
export type ApplicationPayload = Omit<
  ApplicationFormOutput,
  | "applicationRoles"
  | "applicationGroups"
  | "applicationServiceRequestTypes"
  | "applicationModules"
  | "departments"
> & {
  applicationRoles: string[];
  applicationGroups: string[];
  applicationServiceRequestTypes: string[];
  applicationModules: string[];
  departments: string[];
  attachments: string[];
};

interface CreateApplicationModalProps {
  onClose: () => void;
  onSubmit: (
    data: ApplicationPayload,
    attachments: File[],
    existingAttachments: string[]
  ) => void | Promise<void>;
  initialData?: Application | Application[] | null;
  mode?: "create" | "edit" | "view";
  optionSets: {
    environments: Environment[];
    locations: Location[];
    assignmentGroups: AssignmentGroup[];
    applicationGroups: ApplicationGroup[];
    appModules: ApplicationSoftwareModule[];
    workflows: Workflow[];
    users: User[];
    suppliers: Supplier[];
    departments: Department[];
    roles: RoleOption[];
    serviceRequestTypes: ApplicationServiceRequestType[];
  };
}

const DEFAULT_FORM_VALUES: ApplicationFormInput = {
  applicationName: "",
  applicationType: "GxP",
  applicationEnvironment: "",
  group: "",
  assignmentGroup: "",
  applicationRoles: [],
  applicationGroups: [],
  applicationServiceRequestTypes: [],
  applicationModules: [],
  applicationWorkflow: "",
  applicationSystemOwner: "",
  applicationProcessOwner: "",
  supplier: "",
  departments: [],
  notes: "",
  attachments: [],
  status: "enabled"
};

const normalizeAttachmentArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((v: any) => {
      if (typeof v === "string") return v;
      return (
        v?._id ??
        v?.attachment ??
        v?.filename ??
        v?.attachmentLink ??
        v?.path ??
        ""
      );
    })
    .filter(Boolean);
};

const mergeUniqueOptions = (
  base: MultiSelectOption[],
  extra: MultiSelectOption[]
): MultiSelectOption[] => {
  const map = new Map(base.map((opt) => [opt.value, opt]));
  extra.forEach((opt) => {
    if (opt.value && opt.text && !map.has(opt.value)) {
      map.set(opt.value, opt);
    }
  });
  return Array.from(map.values());
};

const isImageName = (name: string) =>
  /\.(png|jpe?g|gif|bmp|webp|svg)$/i.test(name || "");
const prettifyAttachmentName = (path: string) => {
  if (!path) return "";
  const withoutLeadingSlash = path.replace(/^[/\\]+/, "");
  const parts = withoutLeadingSlash.split("-");
  if (parts.length > 1 && /^\d+$/.test(parts[0])) {
    return parts.slice(1).join("-");
  }
  return withoutLeadingSlash;
};

const getModuleApplicationId = (
  module?: ApplicationSoftwareModule | null
): string => {
  const application = module?.application;
  if (typeof application === "string") return application;
  return application?._id ?? "";
};

const normalizeMultiSelectValues = (values: string[] | undefined): string[] => {
  if (!Array.isArray(values)) return [];

  const unique = new Set<string>();
  values.forEach((value) => {
    if (typeof value !== "string") return;
    const normalized = value.trim();
    if (normalized) unique.add(normalized);
  });

  return Array.from(unique);
};

const normalizeInitialValues = (
  data?: Application | null
): ApplicationFormInput => ({
  ...DEFAULT_FORM_VALUES,
  applicationName: data?.applicationName ?? DEFAULT_FORM_VALUES.applicationName,
  applicationType: data?.applicationType ?? DEFAULT_FORM_VALUES.applicationType,
  applicationEnvironment: normalizeMixedId(data?.applicationEnvironment),
  group: normalizeMixedId(data?.group),
  assignmentGroup: normalizeMixedId(data?.assignmentGroup),
  applicationRoles: normalizeMixedIdArray(data?.applicationRoles),
  applicationGroups: normalizeMixedIdArray(data?.applicationGroups),
  applicationServiceRequestTypes: normalizeMixedIdArray(
    data?.applicationServiceRequestTypes
  ),
  applicationModules: normalizeMixedIdArray(data?.applicationModules),
  applicationWorkflow: normalizeMixedId(data?.applicationWorkflow),
  applicationSystemOwner: normalizeMixedId(data?.applicationSystemOwner),
  applicationProcessOwner: normalizeMixedId(data?.applicationProcessOwner),
  supplier: normalizeMixedId(data?.supplier),
  departments: normalizeMixedIdArray(data?.departments),
  notes: data?.notes ?? DEFAULT_FORM_VALUES.notes,
  attachments: normalizeAttachmentArray(
    data?.attachments ?? DEFAULT_FORM_VALUES.attachments
  ),
  status: data?.status ?? DEFAULT_FORM_VALUES.status
});

const CreateApplicationModal = ({
  onClose,
  onSubmit,
  initialData,
  mode = "create",
  optionSets
}: CreateApplicationModalProps) => {
  const resolvedInitial = Array.isArray(initialData)
    ? initialData[0]
    : initialData;
  const applicationIdentity = String(
    (resolvedInitial as any)?.applicationId ?? ""
  ).trim();
  const { t } = useTranslation();
  const { toggleLoading, loading } = useGlobalContext();
  const isReadOnly = mode === "view";
  const normalizedDefaults = useMemo<ApplicationFormInput>(
    () => normalizeInitialValues(resolvedInitial),
    [resolvedInitial]
  );
  const initialKey = resolvedInitial?._id ?? "new";
  const {
    environments,
    locations,
    assignmentGroups,
    applicationGroups,
    serviceRequestTypes,
    appModules,
    workflows,
    users,
    suppliers,
    departments,
    roles
  } = optionSets;
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ApplicationFormInput>({
    resolver: zodResolver(getApplicationSchema),
    defaultValues: normalizedDefaults
  });
  const notes = useWatch({ control, name: "notes" });
  const [appGroupOptions, setAppGroupOptions] = useState<MultiSelectOption[]>(
    []
  );
  const [appModuleOptions, setAppModuleOptions] = useState<MultiSelectOption[]>(
    []
  );
  const [serviceRequestOptionsState, setServiceRequestOptionsState] = useState<
    MultiSelectOption[]
  >([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<
    ExistingAttachment[]
  >([]);
  const [roleOptionsState, setRoleOptionsState] = useState<MultiSelectOption[]>(
    []
  );

  useEffect(() => {
    const base =
      serviceRequestTypes
        ?.filter((s) => (s?.active ?? true) && s?.service && s?._id)
        .map((s) => ({ text: s.service, value: s._id })) || [];
    const initialServices =
      resolvedInitial?.applicationServiceRequestTypes
        ?.map((s: any) => ({
          text: (s?.service ?? "") as string,
          value: normalizeMixedId(s)
        }))
        .filter((opt: MultiSelectOption) => opt.value && opt.text) || [];
    setServiceRequestOptionsState(mergeUniqueOptions(base, initialServices));
  }, [serviceRequestTypes, resolvedInitial]);

  useEffect(() => {
    const base =
      roles
        ?.filter(
          (r) =>
            (r?.active ?? true) && r?._id && (r?.role || r?.name || r?.roleName)
        )
        .map((r) => ({
          text: (r.role ?? r.name ?? r.roleName) as string,
          value: r._id as string
        })) || [];
    const initialRoles =
      resolvedInitial?.applicationRoles
        ?.map((r: any) => ({
          text: (r?.role ?? r?.name ?? r?.roleName ?? "") as string,
          value: normalizeMixedId(r)
        }))
        .filter((opt: MultiSelectOption) => opt.value && opt.text) || [];
    setRoleOptionsState(mergeUniqueOptions(base, initialRoles));
  }, [roles, resolvedInitial]);

  useEffect(() => {
    reset(normalizedDefaults);
    setAttachments([]);
    setExistingAttachments(
      (resolvedInitial?.attachments || [])
        .map((att: any) => {
          const path =
            typeof att === "string"
              ? att
              : (att?.attachment ?? att?.filename ?? att?.path ?? "");
          if (!path) return null;
          return { id: att?._id, path, name: prettifyAttachmentName(path) };
        })
        .filter(Boolean) as ExistingAttachment[]
    );
  }, [normalizedDefaults, reset, resolvedInitial?.attachments]);

  useEffect(() => {
    const base =
      applicationGroups
        ?.filter((g) => g?._id && g?.appGroup)
        .map((g) => ({ text: g.appGroup, value: g._id })) || [];
    const initialGroups =
      resolvedInitial?.applicationGroups
        ?.map((g: any) => ({
          text: (g?.appGroup ?? "") as string,
          value: normalizeMixedId(g)
        }))
        .filter((opt: MultiSelectOption) => opt.value && opt.text) || [];
    setAppGroupOptions(mergeUniqueOptions(base, initialGroups));
  }, [applicationGroups, resolvedInitial]);

  useEffect(() => {
    const selectedModuleIds = new Set(
      normalizeMixedIdArray(resolvedInitial?.applicationModules).filter(Boolean)
    );
    const base =
      appModules
        ?.filter(
          (module) =>
            module?._id &&
            module?.moduleName &&
            (getModuleApplicationId(module) === "" ||
              selectedModuleIds.has(module._id))
        )
        .map((module) => ({ text: module.moduleName, value: module._id })) ||
      [];
    const initialModules =
      resolvedInitial?.applicationModules
        ?.map((m: any) => ({
          text: m?.moduleName || "",
          value: normalizeMixedId(m)
        }))
        .filter((opt: MultiSelectOption) => opt.value && opt.text) || [];
    setAppModuleOptions(mergeUniqueOptions(base, initialModules));
  }, [appModules, resolvedInitial]);

  const onFormSubmit: SubmitHandler<ApplicationFormInput> = async (data) => {
    const parsed: ApplicationFormOutput = getApplicationSchema.parse(data);

    const payload: ApplicationPayload = {
      ...parsed,
      notes: parsed.notes ?? "",
      applicationRoles: normalizeMultiSelectValues(parsed.applicationRoles),
      applicationGroups: normalizeMultiSelectValues(parsed.applicationGroups),
      applicationServiceRequestTypes: normalizeMultiSelectValues(
        parsed.applicationServiceRequestTypes
      ),
      applicationModules: normalizeMultiSelectValues(parsed.applicationModules),
      // Departments are select-only (no free text), so send pure IDs.
      departments: normalizeMultiSelectValues(parsed.departments),
      attachments: existingAttachments
        .map((att) => att.id)
        .filter((id): id is string => Boolean(id))
    };

    try {
      toggleLoading(true);
      await onSubmit(
        payload,
        attachments,
        existingAttachments.map((att) => att.id).filter(Boolean) as string[]
      );
    } finally {
      toggleLoading(false);
    }
  };

  const removeExistingAttachment = (idx: number) => {
    setExistingAttachments((prev) =>
      prev.filter((_, removeIdx) => removeIdx !== idx)
    );
  };

  return (
    <>
      {/* Remove max-h-screen to allow full height scrolling when validation errors occur */}
      <div className="p-6  overflow-y-auto no-scrollbar bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <h2 className="text-xl font-semibold">
            {isReadOnly
              ? t("view", { entity: t("gxpApplications") })
              : t(resolvedInitial ? "edit" : "create", {
                  entity: t("gxpApplications")
                })}
          </h2>

          <div className={isReadOnly ? "pointer-events-none opacity-80" : ""}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="identity">
                  {t("identity", { defaultValue: "Identity" })}
                </Label>
                <Input
                  id="identity"
                  value={applicationIdentity || "-"}
                  readOnly
                  disabled
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              </div>
              {/* Application Name */}
              <div>
                <Label htmlFor="applicationName" required>
                  {t("applicationName")}
                </Label>
                <Input
                  {...register("applicationName")}
                  error={!!errors.applicationName}
                  hint={errors.applicationName?.message}
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              </div>

              {/* Application Type (SelectDropdown) */}
              <div>
                <Label htmlFor="applicationType" required>
                  {t("applicationType")}
                </Label>
                <Controller
                  name="applicationType"
                  control={control}
                  render={({ field }) => (
                    <SelectDropdown
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      options={applicationTypeOptions}
                      placeholder={t("select", {
                        entity: t("applicationType")
                      })}
                    />
                  )}
                />
                {errors.applicationType && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.applicationType.message as string}
                  </p>
                )}
              </div>

              {/* Environment (single) */}
              <div>
                <Label htmlFor="applicationEnvironment" required>
                  {t("applicationEnvironment")}
                </Label>
                <Controller
                  name="applicationEnvironment"
                  control={control}
                  render={({ field }) => (
                    <SelectDropdown
                      value={field.value ?? ""}
                      onChange={(val) => field.onChange(val)}
                      options={environments.map((e) => ({
                        label: e.environmentName,
                        value: e._id
                      }))}
                      placeholder={t("select", {
                        entity: t("gxpEnvironments")
                      })}
                    />
                  )}
                />
                {errors.applicationEnvironment && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.applicationEnvironment.message as string}
                  </p>
                )}
              </div>

              {/* Group / Location (single) */}
              <div>
                <Label htmlFor="group" required>
                  {t("groupLocation", { defaultValue: "Group/Location" })}
                </Label>
                <Controller
                  name="group"
                  control={control}
                  render={({ field }) => (
                    <SelectDropdown
                      value={field.value ?? ""}
                      onChange={(val) => field.onChange(val)}
                      options={locations.map((loc) => ({
                        label: loc.locationName,
                        value: loc._id
                      }))}
                      placeholder={t("select", {
                        entity: t("groupLocation", {
                          defaultValue: "Group/Location"
                        })
                      })}
                    />
                  )}
                />
                {errors.group && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.group.message as string}
                  </p>
                )}
              </div>

              {/* Assignment Group (single) */}
              <div>
                <Label htmlFor="assignmentGroup" required>
                  {t("group")}
                </Label>
                <Controller
                  name="assignmentGroup"
                  control={control}
                  render={({ field }) => (
                    <SelectDropdown
                      value={field.value ?? ""}
                      onChange={(val) => field.onChange(val)}
                      options={assignmentGroups.map((assignmentGroup) => ({
                        label: assignmentGroup.groupName,
                        value: assignmentGroup._id
                      }))}
                      placeholder={t("select", { entity: t("group") })}
                    />
                  )}
                />
                {errors.assignmentGroup && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.assignmentGroup.message as string}
                  </p>
                )}
              </div>

              {/* Roles (multi) */}
              <div>
                <Label htmlFor="applicationRoles">{t("gxpAppRoles")}</Label>
                <Controller
                  name="applicationRoles"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      key={`roles-${initialKey}`}
                      options={roleOptionsState}
                      label={t("select", { entity: t("gxpAppRoles") })}
                      onChange={field.onChange}
                      defaultSelected={field.value}
                      error={errors.applicationRoles?.message as string}
                      countTooltipPlacement="right"
                      showAddButton
                      onAdd={(newOption) => {
                        const optionToAdd = {
                          text: newOption.text,
                          value: newOption.text
                        };
                        setRoleOptionsState((prev) =>
                          prev.find((opt) => opt.value === optionToAdd.value)
                            ? prev
                            : [...prev, optionToAdd]
                        );
                        field.onChange(
                          appendUniqueString(field.value, optionToAdd.value)
                        );
                      }}
                    />
                  )}
                />
              </div>

              {/* App Groups (multi) */}
              <div>
                <Label htmlFor="applicationGroups">{t("gxpAppGroups")}</Label>
                <Controller
                  name="applicationGroups"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      key={`groups-${initialKey}`}
                      options={appGroupOptions}
                      label={t("select", { entity: t("gxpAppGroups") })}
                      onChange={field.onChange}
                      defaultSelected={field.value}
                      error={errors.applicationGroups?.message as string}
                      showAddButton
                      countTooltipPlacement="left"
                      onAdd={(newOption) => {
                        const optionToAdd = {
                          text: newOption.text,
                          value: newOption.text
                        };
                        setAppGroupOptions((prev) =>
                          prev.find((opt) => opt.value === optionToAdd.value)
                            ? prev
                            : [...prev, optionToAdd]
                        );
                        field.onChange(
                          appendUniqueString(field.value, optionToAdd.value)
                        );
                      }}
                    />
                  )}
                />
              </div>

              {/* Service Request Types (multi) */}
              <div>
                <Label htmlFor="applicationServiceRequestTypes" required>
                  {t("gxpAppServiceRequestTypes")}
                </Label>
                <Controller
                  name="applicationServiceRequestTypes"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      key={`services-${initialKey}`}
                      options={serviceRequestOptionsState}
                      label={t("select", {
                        entity: t("gxpAppServiceRequestTypes")
                      })}
                      onChange={field.onChange}
                      defaultSelected={field.value}
                      error={
                        errors.applicationServiceRequestTypes?.message as string
                      }
                      countTooltipPlacement="right"
                      showAddButton
                      onAdd={(newOption) => {
                        const optionToAdd = {
                          text: newOption.text,
                          value: newOption.text
                        };
                        setServiceRequestOptionsState((prev) =>
                          prev.find((opt) => opt.value === optionToAdd.value)
                            ? prev
                            : [...prev, optionToAdd]
                        );
                        field.onChange(
                          appendUniqueString(field.value, optionToAdd.value)
                        );
                      }}
                    />
                  )}
                />
              </div>

              {/* Modules (multi) */}
              <div>
                <Label htmlFor="applicationModules">{t("gxpAppModules")}</Label>
                <Controller
                  name="applicationModules"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      key={`modules-${initialKey}`}
                      options={appModuleOptions}
                      label={t("select", { entity: t("gxpAppModules") })}
                      onChange={field.onChange}
                      defaultSelected={field.value}
                      error={errors.applicationModules?.message as string}
                      showAddButton
                      countTooltipPlacement="left"
                      onAdd={(newOption) => {
                        const optionToAdd = {
                          text: newOption.text,
                          value: newOption.text
                        };
                        setAppModuleOptions((prev) =>
                          prev.find((opt) => opt.value === optionToAdd.value)
                            ? prev
                            : [...prev, optionToAdd]
                        );
                        field.onChange(
                          appendUniqueString(field.value, optionToAdd.value)
                        );
                      }}
                    />
                  )}
                />
              </div>

              {/* Workflow (single) */}
              <div>
                <Label htmlFor="applicationWorkflow" required>
                  {t("applicationWorkflow")}
                </Label>
                <Controller
                  name="applicationWorkflow"
                  control={control}
                  render={({ field }) => (
                    <SelectDropdown
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={workflows.map((w) => ({
                        label: w.workflowName,
                        value: w._id
                      }))}
                      placeholder={t("select", { entity: t("gxpWorkflows") })}
                    />
                  )}
                />
                {errors.applicationWorkflow && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.applicationWorkflow.message as string}
                  </p>
                )}
              </div>

              {/* System Owner (single) */}
              <div>
                <Label htmlFor="applicationSystemOwner" required>
                  {t("gxpSystemOwner")}
                </Label>
                <Controller
                  name="applicationSystemOwner"
                  control={control}
                  render={({ field }) => (
                    <SelectDropdown
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={users.map((u) => ({
                        label: u.fullName,
                        value: u._id
                      }))}
                      placeholder={t("select", { entity: t("gxpSystemOwner") })}
                    />
                  )}
                />
                {errors.applicationSystemOwner && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.applicationSystemOwner.message as string}
                  </p>
                )}
              </div>

              {/* Process Owner (single) */}
              <div>
                <Label htmlFor="applicationProcessOwner" required>
                  {t("gxpProcessOwner")}
                </Label>
                <Controller
                  name="applicationProcessOwner"
                  control={control}
                  render={({ field }) => (
                    <SelectDropdown
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={users.map((u) => ({
                        label: u.fullName,
                        value: u._id
                      }))}
                      placeholder={t("select", {
                        entity: t("gxpProcessOwner")
                      })}
                    />
                  )}
                />
                {errors.applicationProcessOwner && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.applicationProcessOwner.message as string}
                  </p>
                )}
              </div>

              {/* Supplier (single) */}
              <div>
                <Label htmlFor="supplier" required>
                  {t("supplier")}
                </Label>
                <Controller
                  name="supplier"
                  control={control}
                  render={({ field }) => (
                    <SelectDropdown
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      options={suppliers.map((s) => ({
                        label: s.supplierName,
                        value: s._id
                      }))}
                      placeholder={t("select", { entity: t("gxpSuppliers") })}
                    />
                  )}
                />
                {errors.supplier && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.supplier.message as string}
                  </p>
                )}
              </div>

              {/* Departments (multi) */}
              <div>
                <Label htmlFor="departments" required>
                  {t("departments")}
                </Label>
                <Controller
                  name="departments"
                  control={control}
                  render={({ field }) => (
                    <MultiSelect
                      key={`departments-${initialKey}`}
                      options={departments.map((d) => ({
                        text: d.departmentName,
                        value: d._id
                      }))}
                      label={t("select", { entity: t("gxpDepartments") })}
                      onChange={field.onChange}
                      defaultSelected={field.value}
                      error={errors.departments?.message as string}
                      countTooltipPlacement="right"
                    />
                  )}
                />
              </div>

              {/* Notes */}
              <div className="col-span-2">
                <Label htmlFor="notes" required>
                  {t("notes")}
                </Label>
                <TextArea
                  value={notes ?? ""}
                  onChange={(val) => setValue("notes", val)}
                  error={!!errors.notes}
                  hint={errors.notes?.message}
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              </div>

              {/* Attachments */}
              <div className="col-span-2">
                <Label htmlFor="attachments">
                  {t("attachments", {
                    defaultValue: t("trainingEvidence") ?? "Attachments"
                  })}
                </Label>
                {existingAttachments?.length ? (
                  <div className="mb-3 space-y-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t("previousUploads", {
                        defaultValue: "Previously uploaded"
                      })}{" "}
                      ({existingAttachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {existingAttachments?.map((attachment, idx) => (
                        <div
                          key={`${attachment.path}-${idx}`}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2"
                          title={attachment.name}
                        >
                          {isImageName(attachment.path) ? (
                            <img
                              src={getGxpImageUrl(attachment.path)}
                              alt={attachment.name}
                              className="h-10 w-10 rounded border border-gray-200 dark:border-gray-700 object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-semibold text-gray-800 dark:text-gray-100">
                              {(attachment?.path?.split(".").pop() || "file")
                                .toUpperCase()
                                .slice(0, 4)}
                            </div>
                          )}
                          <span className="text-xs text-gray-800 dark:text-gray-100 max-w-[220px] truncate">
                            {attachment.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeExistingAttachment(idx)}
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
                  title={t("attachments", { defaultValue: "Attachments" })}
                  description={t("uploadDescription", {
                    defaultValue:
                      "Upload documents/images. Audio/video not allowed."
                  })}
                />
              </div>

              {/* Status */}
              <div className="col-span-2">
                <Label htmlFor="status">{t("status")}</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => {
                    const on = field.value === "enabled";
                    return (
                      <div className="flex items-center gap-3 py-2">
                        <Switch
                          checked={on}
                          onChange={(val) =>
                            field.onChange(val ? "enabled" : "disabled")
                          }
                          label={on ? t("enabled") : t("disabled")}
                        />
                      </div>
                    );
                  }}
                />
                {errors.status && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.status.message as string}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={loading || isSubmitting}
            >
              {t("cancel")}
            </Button>
            {!isReadOnly ? (
              <Button
                type="submit"
                variant="primary"
                loading={loading || isSubmitting}
              >
                {t("save")}
              </Button>
            ) : null}
          </div>
        </form>
      </div>
    </>
  );
};

export default CreateApplicationModal;
