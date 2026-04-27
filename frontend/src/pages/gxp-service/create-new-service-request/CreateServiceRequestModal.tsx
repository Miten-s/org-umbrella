import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Label from "@/components/common/form/Label";
import Input from "@/components/common/form/input/InputField";
import TextArea from "@/components/common/form/input/TextArea";
import MultiSelect from "@/components/common/form/MultiSelect";
import FileUpload from "@/components/common/form/input/FileUpload";
import Radio from "@/components/common/form/input/Radio";
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
import { getLocations } from "@/services/admin.service";
import {
  getApplicationById,
  getApplicationRoles,
  getApplicationSoftware,
  getAssignmentGroups,
  getEnvironments,
  getWorkflows
} from "@/services/gxp.service";
import { getGxpImageUrl } from "@/services/utils.service";
import {
  appendUniqueString,
  normalizeMixedId,
  normalizeMixedIdArray
} from "@/utils/mixed-value";

type DropdownOption = { label: string; value: string };
type MultiSelectOption = { text: string; value: string };
type ExistingAttachment = { id?: string; path: string; name: string };
type RoleOption = { _id?: string; role?: string; name?: string; roleName?: string; active?: boolean };
type ApplicationDetails = {
  environmentId: string;
  assignmentGroupId: string;
  groupLocationId: string;
  groupLocationName: string;
  workflowId: string;
  moduleIds: string[];
  moduleNames: string[];
  serviceTypeIds: string[];
  serviceTypeNames: string[];
  roleIds: string[];
  roleNames: string[];
  notes: string;
};

interface CreateServiceRequestModalProps {
  onClose: () => void;
  onSubmit: (
    data: ServiceRequestFormOutput,
    attachments: File[],
    existingAttachments: string[]
  ) => void | Promise<void>;
  initialData?: ServiceRequest | ServiceRequest[] | null;
  mode?: "create" | "edit" | "view";
  optionSets: {
    applications: any[];
    requestTypes?: DropdownOption[];
  };
}

const normalizeInitialValues = (
  data?: ServiceRequest | null
): ServiceRequestFormInput => ({
  priority: data?.priority ?? "Medium",
  application: normalizeMixedId(data?.application),
  esignCheck: data?.esignCheck ?? "No",
  trainingDone: data?.trainingDone ?? true,
  description: data?.description ?? "",
  shortDescription: data?.shortDescription ?? "",
  requestType: data?.requestType ?? "Applications",
  applicationEnvironment: normalizeMixedId(
    (data as any)?.applicationEnvironment ?? (data as any)?.environment
  ),
  assignmentGroup: normalizeMixedId((data as any)?.assignmentGroup ?? (data as any)?.group),
  groupLocation: ((data as any)?.groupLocation ?? (data as any)?.location ?? "") as string,
  applicationWorkflow: normalizeMixedId(
    (data as any)?.applicationWorkflow ?? (data as any)?.workflow
  ),
  applicationModules: normalizeMixedIdArray(
    (data as any)?.applicationModules ?? (data as any)?.modules
  ),
  applicationServiceRequestTypes: (() => {
    const serviceValue =
      (data as any)?.applicationServiceRequestTypes ??
      (data as any)?.requestTypes ??
      (data as any)?.requestType;
    if (Array.isArray(serviceValue)) {
      const first = serviceValue[0];
      if (!first) return "";
      if (typeof first === "string") return first;
      return normalizeMixedId(first) || first?.service || first?.name || "";
    }
    if (typeof serviceValue === "string") return serviceValue;
    return normalizeMixedId(serviceValue) || serviceValue?.service || serviceValue?.name || "";
  })(),
  applicationRoles: normalizeMixedIdArray(
    (data as any)?.applicationRoles ?? (data as any)?.roles
  ),
  notes: Array.isArray((data as any)?.notes)
    ? ((data as any)?.notes || []).join("\n")
    : ((data as any)?.notes ?? ""),
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
  if (typeof value === "string") return preferredKey ? "" : value;
  if (preferredKey && typeof value?.[preferredKey] === "string") return value[preferredKey];
  return "";
};

const mapApplicationToDetails = (app: Application): ApplicationDetails => {
  const environmentId = getId(app?.applicationEnvironment);

  const assignmentGroupId = getId(app?.assignmentGroup);

  const groupLocationId = getId((app as any)?.group);
  const groupLocationName =
    getText((app as any)?.group, "locationName") ||
    getText((app as any)?.group, "name") ||
    "";

  const workflowId = getId(app?.applicationWorkflow);

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

  return {
    environmentId,
    assignmentGroupId,
    groupLocationId,
    groupLocationName,
    workflowId,
    moduleIds,
    moduleNames,
    serviceTypeIds,
    serviceTypeNames,
    roleIds,
    roleNames,
    notes: app?.notes ?? ""
  };
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

const mergeUniqueDropdownOptions = (
  base: DropdownOption[],
  extra: DropdownOption[]
): DropdownOption[] => {
  const map = new Map(base.map((opt) => [opt.value, opt]));
  extra.forEach((opt) => {
    if (!opt.value || !opt.label) return;
    const existing = map.get(opt.value);
    if (!existing) {
      map.set(opt.value, opt);
      return;
    }
    // Prefer human-friendly label over raw id label.
    if (existing.label === existing.value && opt.label !== opt.value) {
      map.set(opt.value, opt);
    }
  });
  return Array.from(map.values());
};

const buildOptionsFromPairs = (ids: string[], names: string[]): MultiSelectOption[] => {
  const results: MultiSelectOption[] = [];
  const count = Math.max(ids.length, names.length);
  for (let i = 0; i < count; i += 1) {
    const value = ids[i] ?? names[i] ?? "";
    const text = names[i] ?? ids[i] ?? "";
    if (!value) continue;
    results.push({ value, text: text || value });
  }
  return results;
};

const buildRoleOptionsFromValues = (values: any): MultiSelectOption[] => {
  if (!Array.isArray(values)) return [];
  return values
    .map((r: any) => {
      const value = normalizeMixedId(r);
      const text =
        (typeof r === "object" &&
          (r?.role || r?.name || r?.roleName || r?.label || r?.value)) ||
        value;
      if (!value) return null;
      return { value, text } as MultiSelectOption;
    })
    .filter(Boolean) as MultiSelectOption[];
};

const CreateServiceRequestModal = ({
  onClose,
  onSubmit,
  initialData,
  mode = "create",
  optionSets
}: CreateServiceRequestModalProps) => {
  const resolvedInitial = Array.isArray(initialData) ? initialData[0] : initialData;
  const serviceRequestIdentity = String(resolvedInitial?.serviceRequestId ?? "").trim();
  const normalizedDefaults = useMemo(
    () => normalizeInitialValues(resolvedInitial),
    [resolvedInitial]
  );
  const { toggleLoading, loading } = useGlobalContext();
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const { applications } = optionSets;
  const initialApplicationIdRef = useRef<string>(normalizedDefaults.application ?? "");
  const hasUserChangedApplicationRef = useRef(false);
  const [appDetails, setAppDetails] = useState<ApplicationDetails | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
  const [environmentOptions, setEnvironmentOptions] = useState<DropdownOption[]>([]);
  const [assignmentGroupOptions, setAssignmentGroupOptions] = useState<DropdownOption[]>([]);
  const [workflowOptions, setWorkflowOptions] = useState<DropdownOption[]>([]);
  const [moduleBaseOptions, setModuleBaseOptions] = useState<MultiSelectOption[]>([]);
  const [moduleOptions, setModuleOptions] = useState<MultiSelectOption[]>([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<DropdownOption[]>([]);
  const [roleBaseOptions, setRoleBaseOptions] = useState<MultiSelectOption[]>([]);
  const [roleOptions, setRoleOptions] = useState<MultiSelectOption[]>([]);
  const [locationNameById, setLocationNameById] = useState<Record<string, string>>({});
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
  const selectedServiceRequestTypes = useWatch({
    control,
    name: "applicationServiceRequestTypes"
  });
  const selectedGroupLocation = useWatch({ control, name: "groupLocation" });

  const selectedServiceTypeLabel = useMemo(() => {
    const selectedValue = (selectedServiceRequestTypes || "").trim();
    if (!selectedValue) return "";
    const exact = serviceTypeOptions.find((opt) => opt.value === selectedValue);
    if (exact?.label) return exact.label;
    const byLabel = serviceTypeOptions.find(
      (opt) => opt.label.toLowerCase() === selectedValue.toLowerCase()
    );
    return byLabel?.label || selectedValue;
  }, [selectedServiceRequestTypes, serviceTypeOptions]);

  const selectedServiceTypeName = selectedServiceTypeLabel.toLowerCase();
  const isProvideAccessRequest = selectedServiceTypeName === "provide access";
  const isModifyAccessRequest = selectedServiceTypeName === "modify access";

  const selectedApplicationLocationLabel = useMemo(() => {
    const selectedAppId = normalizeMixedId(selectedApplication);
    if (!selectedAppId) return "";
    const selectedApp = applications?.find((app: any) => app?._id === selectedAppId);
    const selectedAppGroupId = normalizeMixedId((selectedApp as any)?.group);
    return (
      getText((selectedApp as any)?.group, "locationName") ||
      getText((selectedApp as any)?.group, "name") ||
      (selectedAppGroupId ? locationNameById[selectedAppGroupId] ?? "" : "")
    );
  }, [applications, locationNameById, selectedApplication]);

  useEffect(() => {
    const raw = (selectedGroupLocation || "").trim();
    if (!raw) return;
    const mapped = locationNameById[raw];
    if (mapped && mapped !== raw) {
      setValue("groupLocation", mapped);
    }
  }, [locationNameById, selectedGroupLocation, setValue]);

  useEffect(() => {
    if (isProvideAccessRequest || isModifyAccessRequest) return;
    setValue("applicationRoles", []);
  }, [isProvideAccessRequest, isModifyAccessRequest, setValue]);
  useEffect(() => {
    reset(normalizedDefaults);
    initialApplicationIdRef.current = normalizedDefaults.application ?? "";
    hasUserChangedApplicationRef.current = false;
    setAppDetails(null);
    setAttachments([]);
    setExistingAttachments(
      ((resolvedInitial as any)?.attachments || [])
        .map((att: any) => {
          const path =
            typeof att === "string"
              ? att
              : att?.attachment ?? att?.filename ?? att?.path ?? "";
          if (!path) return null;
          return { id: att?._id, path, name: prettifyAttachmentName(path) };
        })
        .filter(Boolean) as ExistingAttachment[]
    );
  }, [normalizedDefaults, reset, resolvedInitial]);

  const toDropdown = (item: any, labelKey: string, valueKey: string = "_id"): DropdownOption => ({
    label: item?.[labelKey] ?? item?.name ?? String(item?.[valueKey] ?? ""),
    value: item?.[valueKey] ?? item?._id ?? item?.value ?? ""
  });

  const extractList = <T,>(val: any, preferredKeys: string[] = []): T[] => {
    if (Array.isArray(val)) return val as T[];
    if (!val || typeof val !== "object") return [];
    if (Array.isArray(val.data)) return val.data as T[];
    for (const key of preferredKeys) {
      const candidate = (val as any)[key];
      if (Array.isArray(candidate)) return candidate as T[];
    }
    const firstArray = Object.values(val).find(Array.isArray);
    return Array.isArray(firstArray) ? (firstArray as T[]) : [];
  };

  const getServiceTypeOptionsFromApplication = (app: any): DropdownOption[] => {
    const appServiceTypes = Array.isArray(app?.applicationServiceRequestTypes)
      ? app.applicationServiceRequestTypes
      : [];

    return appServiceTypes
      .map((serviceType: any) => {
        const value = normalizeMixedId(serviceType);
        const label =
          (typeof serviceType === "object" &&
            (serviceType?.service || serviceType?.name || serviceType?.value)) ||
          value;
        if (!value) return null;
        return { value, label: String(label || value) } as DropdownOption;
      })
      .filter(Boolean) as DropdownOption[];
  };

  const priorityOptions: DropdownOption[] = [
    { label: "Very High", value: "Very High" },
    { label: "High", value: "High" },
    { label: "Medium", value: "Medium" },
    { label: "Low", value: "Low" }
  ];

  const statusOptions: DropdownOption[] = [
    { label: "New", value: "New" },
    { label: "In Progress", value: "In Progress" },
    { label: "Hold", value: "Hold" },
    { label: "Closed - Incomplete", value: "Closed - Incomplete" },
    { label: "Closed - Complete", value: "Closed - Complete" },
    { label: "Closed - Skipped", value: "Closed - Skipped" }
  ];

  const onFormSubmit: SubmitHandler<ServiceRequestFormInput> = async (data) => {
    const parsed: ServiceRequestFormOutput = getServiceRequestSchema.parse(data);
    const payload: ServiceRequestFormOutput = {
      ...parsed,
      status: resolvedInitial ? parsed.status : "New"
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

  const renderError = (message?: string) =>
    message ? <p className="text-red-500 text-xs mt-1">{message}</p> : null;

  const removeExistingAttachment = (idx: number) => {
    setExistingAttachments((prev) => prev.filter((_, removeIdx) => removeIdx !== idx));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [envs, groups, wfs, modules, appRoles, locs] = await Promise.all([
          getEnvironments(false, { limit: 100 }),
          getAssignmentGroups(false, { limit: 100 }),
          getWorkflows({ limit: 100 }),
          getApplicationSoftware(false, { limit: 100 }),
          getApplicationRoles({ limit: 100 }),
          getLocations({ limit: 100 })
        ]);

        if (cancelled) return;

        const locationList = extractList<any>(locs, ["locations", "data"]);
        const nextLocationNameById = locationList.reduce<Record<string, string>>((acc, loc: any) => {
          const id = normalizeMixedId(loc);
          const name = loc?.locationName ?? loc?.name ?? "";
          if (id && name) acc[id] = String(name);
          return acc;
        }, {});
        setLocationNameById(nextLocationNameById);

        const baseEnvironmentOptions = extractList<any>(envs, ["environments", "data"]).map(
          (env) => toDropdown(env, "environmentName")
        );
        const baseAssignmentGroupOptions = extractList<any>(groups, [
          "assignmentGroups",
          "data"
        ]).map((group) => toDropdown(group, "groupName"));
        const baseWorkflowOptions = extractList<any>(wfs, ["workflows", "data"]).map((wf) =>
          toDropdown(wf, "workflowName")
        );

        const initialEnvironment = (resolvedInitial as any)?.environment ??
          (resolvedInitial as any)?.applicationEnvironment;
        const initialAssignmentGroup = (resolvedInitial as any)?.assignmentGroup ??
          (resolvedInitial as any)?.group;
        const initialWorkflow = (resolvedInitial as any)?.workflow ??
          (resolvedInitial as any)?.applicationWorkflow;

        const extraEnvironmentOptions: DropdownOption[] = [];
        const initialEnvironmentId = normalizeMixedId(initialEnvironment);
        const initialEnvironmentLabel =
          (initialEnvironment && typeof initialEnvironment === "object"
            ? (initialEnvironment.environmentName ?? initialEnvironment.name)
            : "") || initialEnvironmentId;
        if (initialEnvironmentId) {
          extraEnvironmentOptions.push({
            value: initialEnvironmentId,
            label: String(initialEnvironmentLabel)
          });
        }

        const extraAssignmentGroupOptions: DropdownOption[] = [];
        const initialAssignmentGroupId = normalizeMixedId(initialAssignmentGroup);
        const initialAssignmentGroupLabel =
          (initialAssignmentGroup && typeof initialAssignmentGroup === "object"
            ? (initialAssignmentGroup.groupName ?? initialAssignmentGroup.name)
            : "") || initialAssignmentGroupId;
        if (initialAssignmentGroupId) {
          extraAssignmentGroupOptions.push({
            value: initialAssignmentGroupId,
            label: String(initialAssignmentGroupLabel)
          });
        }

        const extraWorkflowOptions: DropdownOption[] = [];
        const initialWorkflowId = normalizeMixedId(initialWorkflow);
        const initialWorkflowLabel =
          (initialWorkflow && typeof initialWorkflow === "object"
            ? (initialWorkflow.workflowName ?? initialWorkflow.name)
            : "") || initialWorkflowId;
        if (initialWorkflowId) {
          extraWorkflowOptions.push({
            value: initialWorkflowId,
            label: String(initialWorkflowLabel)
          });
        }

        setEnvironmentOptions(
          mergeUniqueDropdownOptions(baseEnvironmentOptions, extraEnvironmentOptions)
        );
        setAssignmentGroupOptions(
          mergeUniqueDropdownOptions(baseAssignmentGroupOptions, extraAssignmentGroupOptions)
        );
        setWorkflowOptions(
          mergeUniqueDropdownOptions(baseWorkflowOptions, extraWorkflowOptions)
        );
        const moduleOptionsList = extractList<any>(modules, ["modules", "software", "data"]).map(
          (mod) => ({
            text: mod?.moduleName ?? "",
            value: mod?._id ?? ""
          })
        );
        setModuleBaseOptions(moduleOptionsList.filter((opt) => opt.value && opt.text));
        setRoleBaseOptions(
          extractList<RoleOption>(appRoles, ["applicationRoles", "roles", "data"])
            .filter((r) => (r?.active ?? true) && r?._id && (r?.role || r?.name || r?.roleName))
            .map((r) => ({
              text: (r.role ?? r.name ?? r.roleName) as string,
              value: r._id as string
            }))
        );
      } catch (err) {
        console.error("Failed to load service request options", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedInitial]);

  useEffect(() => {
    if (!appDetails) {
      setModuleOptions(moduleBaseOptions);
      const initialRoleOptions = buildRoleOptionsFromValues(
        (resolvedInitial as any)?.application?.applicationRoles ??
          (resolvedInitial as any)?.roles ??
          (resolvedInitial as any)?.applicationRoles
      );
      setRoleOptions(mergeUniqueOptions(roleBaseOptions, initialRoleOptions));
      return;
    }
    const initialModules = buildOptionsFromPairs(
      appDetails.moduleIds,
      appDetails.moduleNames
    );
    const initialRoles = buildOptionsFromPairs(appDetails.roleIds, appDetails.roleNames);
    const initialServiceTypes = buildOptionsFromPairs(
      appDetails.serviceTypeIds,
      appDetails.serviceTypeNames
    );

    setModuleOptions(mergeUniqueOptions(moduleBaseOptions, initialModules));
    setServiceTypeOptions(
      initialServiceTypes.map((serviceType) => ({
        value: serviceType.value,
        label: serviceType.text
      }))
    );
    setRoleOptions(mergeUniqueOptions(roleBaseOptions, initialRoles));
  }, [
    appDetails,
    moduleBaseOptions,
    resolvedInitial,
    roleBaseOptions
  ]);

  useEffect(() => {
    const selectedAppId = normalizeMixedId(selectedApplication);
    const selectedApp = applications?.find((app: any) => app?._id === selectedAppId);
    const initialApp =
      resolvedInitial && typeof (resolvedInitial as any)?.application === "object"
        ? (resolvedInitial as any).application
        : null;
    const initialAppMatchesSelection =
      initialApp && normalizeMixedId(initialApp) === selectedAppId;

    const fromSelectedApp = getServiceTypeOptionsFromApplication(selectedApp);
    const fromInitialApp = initialAppMatchesSelection
      ? getServiceTypeOptionsFromApplication(initialApp)
      : [];

    setServiceTypeOptions(mergeUniqueDropdownOptions(fromSelectedApp, fromInitialApp));
  }, [applications, resolvedInitial, selectedApplication]);

  useEffect(() => {
    const currentValue = (selectedServiceRequestTypes || "").trim();
    if (!currentValue || !serviceTypeOptions.length) return;
    if (serviceTypeOptions.some((opt) => opt.value === currentValue)) return;

    const matchedByLabel = serviceTypeOptions.find(
      (opt) => opt.label.toLowerCase() === currentValue.toLowerCase()
    );
    if (matchedByLabel) {
      setValue("applicationServiceRequestTypes", matchedByLabel.value);
    }
  }, [selectedServiceRequestTypes, serviceTypeOptions, setValue]);


  useEffect(() => {
    const appId = normalizeMixedId(selectedApplication);
    if (!appId) {
      setAppDetails(null);
      setValue("applicationEnvironment", "");
      setValue("assignmentGroup", "");
      setValue("groupLocation", "");
      setValue("applicationWorkflow", "");
      setValue("applicationModules", []);
      setValue("applicationServiceRequestTypes", "");
      setValue("applicationRoles", []);
      setValue("notes", "");
      return;
    }

    const isEditMode = Boolean((resolvedInitial as any)?._id);
    const initialApplicationId = initialApplicationIdRef.current;
    if (
      isEditMode &&
      !hasUserChangedApplicationRef.current &&
      appId === initialApplicationId
    ) {
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

        setValue("requestType", details.serviceTypeIds[0] ?? "Applications");
        setValue("applicationEnvironment", details.environmentId);
        setValue("assignmentGroup", details.assignmentGroupId);
        // Intentionally store location NAME (not ID) for service requests to match business expectation.
        setValue(
          "groupLocation",
          details.groupLocationName ||
            (details.groupLocationId ? locationNameById[details.groupLocationId] ?? "" : "")
        );
        setValue("applicationWorkflow", details.workflowId);
        setValue("applicationModules", details.moduleIds);
        setValue("applicationServiceRequestTypes", details.serviceTypeIds[0] ?? "");
        setValue("applicationRoles", details.roleIds);
        setValue("notes", details.notes ?? "");
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
  }, [locationNameById, resolvedInitial, selectedApplication, setValue, toggleLoading]);

  return (
    <div className="p-6 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("serviceRequests") })
            : resolvedInitial
              ? t("edit")
              : t("gxpCreateNewServiceRequest")}
        </h2>

        <div className={isReadOnly ? "pointer-events-none opacity-80" : ""}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="identity">{t("identity", { defaultValue: "Identity" })}</Label>
            <Input
              id="identity"
              value={serviceRequestIdentity || "-"}
              readOnly
              disabled
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
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
                  onChange={(val) => {
                    if (val !== initialApplicationIdRef.current) {
                      hasUserChangedApplicationRef.current = true;
                    }
                    field.onChange(val);
                  }}
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
            <Label htmlFor="applicationEnvironment">{t("environment")}</Label>
            <Controller
              name="applicationEnvironment"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  options={environmentOptions}
                  disabled
                  placeholder={t("select", { entity: t("environment") })}
                />
              )}
            />
            {renderError(errors.applicationEnvironment?.message as string)}
          </div>

          <div>
            <Label htmlFor="assignmentGroup">
              {t("assignmentGroup", { defaultValue: "Assignment Group" })}
            </Label>
            <Controller
              name="assignmentGroup"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  options={assignmentGroupOptions}
                  disabled
                  placeholder={t("select", { entity: t("group") })}
                />
              )}
            />
            {renderError(errors.assignmentGroup?.message as string)}
          </div>

          <div>
            <Label htmlFor="groupLocation">
              {t("groupLocation", { defaultValue: "Group/Location" })}
            </Label>
            <Controller
              name="groupLocation"
              control={control}
              render={({ field }) => (
                <Input
                  value={appDetails?.groupLocationName || selectedApplicationLocationLabel || locationNameById[field.value ?? ""] || (typeof field.value === "string" && field.value.length === 24 ? "" : (field.value ?? ""))}
                  onChange={field.onChange}
                  readOnly
                  disabled
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              )}
            />
            {renderError(errors.groupLocation?.message as string)}
          </div>

          <div>
            <Label htmlFor="applicationWorkflow">{t("workflow")}</Label>
            <Controller
              name="applicationWorkflow"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  options={workflowOptions}
                  disabled
                  placeholder={t("select", { entity: t("workflow") })}
                />
              )}
            />
            {renderError(errors.applicationWorkflow?.message as string)}
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

          {resolvedInitial && (
            <div>
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
          )}

          <div>
            <Label htmlFor="applicationModules">{t("gxpAppModules")}</Label>
            <Controller
              name="applicationModules"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={moduleOptions}
                  label={t("select", { entity: t("gxpAppModules") })}
                  onChange={field.onChange}
                  defaultSelected={field.value}
                  error={errors.applicationModules?.message as string}
                  disabled
                  countTooltipPlacement="right"
                  showAddButton
                  onAdd={(newOption) => {
                    const optionToAdd = { text: newOption.text, value: newOption.text };
                    setModuleOptions((prev) =>
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

          <div>
            <Label htmlFor="applicationServiceRequestTypes">
              {t("gxpAppServiceRequestTypes")}
            </Label>
            <Controller
              name="applicationServiceRequestTypes"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val ?? "")}
                  options={serviceTypeOptions}
                  placeholder={t("select", { entity: t("gxpAppServiceRequestTypes") })}
                />
              )}
            />
            {renderError(errors.applicationServiceRequestTypes?.message as string)}
          </div>

          {(isProvideAccessRequest || isModifyAccessRequest) && roleOptions.length > 0 && (
            <div>
              <Label htmlFor="applicationRoles">{t("gxpAppRoles")}</Label>
              <Controller
                name="applicationRoles"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={roleOptions}
                    label={t("select", { entity: t("gxpAppRoles") })}
                    onChange={field.onChange}
                    defaultSelected={field.value}
                    error={errors.applicationRoles?.message as string}
                    countTooltipPlacement="right"
                    showAddButton
                    onAdd={(newOption) => {
                      const optionToAdd = { text: newOption.text, value: newOption.text };
                      setRoleOptions((prev) =>
                        prev.find((opt) => opt.value === optionToAdd.value)
                          ? prev
                          : [...prev, optionToAdd]
                      );
                      field.onChange(appendUniqueString(field.value, optionToAdd.value));
                    }}
                  />
                )}
              />
            </div>
          )}

          <div>
            <Label htmlFor="esignCheck">{t("esignCheck")}</Label>
            <Controller
              name="esignCheck"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-6 py-2">
                  <Radio
                    id="esignCheckYes"
                    name="esignCheck"
                    value="Yes"
                    label={t("yes") ?? "Yes"}
                    checked={field.value === "Yes"}
                    onChange={(val) => field.onChange(val)}
                  />
                  <Radio
                    id="esignCheckNo"
                    name="esignCheck"
                    value="No"
                    label={t("no") ?? "No"}
                    checked={field.value === "No"}
                    onChange={(val) => field.onChange(val)}
                  />
                </div>
              )}
            />
            {renderError(errors.esignCheck?.message)}
          </div>
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

          <div className="md:col-span-2">
            <Label htmlFor="notes">{t("notes")}</Label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextArea
                  value={field.value ?? ""}
                  onChange={(val) => field.onChange(val)}
                  error={!!errors.notes}
                  hint={errors.notes?.message}
                  className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              )}
            />
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
                      <span className="text-xs text-gray-800 dark:text-gray-100 truncate">
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
                defaultValue: "Upload documents/images. Audio/video not allowed."
              })}
            />
          </div>


          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" type="button" onClick={onClose}>
            {t("cancel")}
          </Button>
          {!isReadOnly ? (
            <Button type="submit" variant="primary" disabled={loading}>
              {t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default CreateServiceRequestModal;
