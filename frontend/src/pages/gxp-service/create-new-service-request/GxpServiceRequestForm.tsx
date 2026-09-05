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
  getApplicationRoles
} from "@/services/gxp.service";
import AsyncSelect from "@/components/data/AsyncSelect";
import { useApplicationOptions } from "@/pages/gxp-service/add-new-application/Application.options";
import { useEnvironmentOptions } from "@/pages/gxp-service/environments/Environment.queries";
import { useAssignmentGroupOptions } from "@/pages/gxp-service/assignment-groups/AssignmentGroup.queries";
import { useWorkflowOptions } from "@/pages/gxp-service/workflows/Workflow.queries";
import { useModuleOptions } from "@/pages/gxp-service/application-software-module/Module.queries";
import type { AsyncOption } from "@/lib/query/listTypes";
import { getGxpImageUrl } from "@/services/utils.service";
import {
  appendUniqueString,
  normalizeMixedId,
  normalizeMixedIdArray
} from "@/utils/mixed-value";

type DropdownOption = { label: string; value: string };
type MultiSelectOption = { text: string; value: string };
type ExistingAttachment = { id?: string; path: string; name: string };
type RoleOption = {
  _id?: string;
  role?: string;
  name?: string;
  roleName?: string;
  active?: boolean;
};
type ApplicationDetails = {
  environmentId: string;
  environmentName: string;
  assignmentGroupId: string;
  assignmentGroupName: string;
  groupLocationId: string;
  groupLocationName: string;
  workflowId: string;
  workflowName: string;
  moduleIds: string[];
  moduleNames: string[];
  serviceTypeIds: string[];
  serviceTypeNames: string[];
  roleIds: string[];
  roleNames: string[];
  notes: string;
};

interface GxpServiceRequestFormProps {
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
  assignmentGroup: normalizeMixedId(
    (data as any)?.assignmentGroup ?? (data as any)?.group
  ),
  groupLocation: ((data as any)?.groupLocation ??
    (data as any)?.location ??
    "") as string,
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
    return (
      normalizeMixedId(serviceValue) ||
      serviceValue?.service ||
      serviceValue?.name ||
      ""
    );
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

/** Normalize a raw attachments array (SR or application) into display entries. */
const mapAttachments = (raw: unknown): { id?: string; path: string; name: string }[] =>
  (Array.isArray(raw) ? raw : [])
    .map((att: any) => {
      const path =
        typeof att === "string"
          ? att
          : (att?.attachment ?? att?.filename ?? att?.path ?? "");
      if (!path) return null;
      return { id: att?._id ?? att?.id, path, name: prettifyAttachmentName(path) };
    })
    .filter(Boolean) as { id?: string; path: string; name: string }[];

const getId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value?._id ?? "";
};

const getText = (value: any, preferredKey?: string): string => {
  if (!value) return "";
  if (typeof value === "string") return preferredKey ? "" : value;
  if (preferredKey && typeof value?.[preferredKey] === "string")
    return value[preferredKey];
  return "";
};

const mapApplicationToDetails = (app: Application): ApplicationDetails => {
  const environmentId = getId(app?.applicationEnvironment);
  const environmentName =
    getText(app?.applicationEnvironment, "environmentName") ||
    getText(app?.applicationEnvironment, "name") ||
    "";

  const assignmentGroupId = getId(app?.assignmentGroup);
  const assignmentGroupName =
    getText(app?.assignmentGroup, "groupName") ||
    getText(app?.assignmentGroup, "name") ||
    "";

  const groupLocationId = getId((app as any)?.group);
  const groupLocationName =
    getText((app as any)?.group, "locationName") ||
    getText((app as any)?.group, "name") ||
    "";

  const workflowId = getId(app?.applicationWorkflow);
  const workflowName =
    getText(app?.applicationWorkflow, "workflowName") ||
    getText(app?.applicationWorkflow, "name") ||
    "";

  const moduleIds =
    app?.applicationModules
      ?.map((m: any) => getId(m) || getText(m, "moduleName"))
      .filter(Boolean) ?? [];
  const moduleNames =
    app?.applicationModules
      ?.map((m: any) => getText(m, "moduleName") || getId(m))
      .filter(Boolean) ?? [];

  const serviceTypeIds =
    app?.applicationServiceRequestTypes
      ?.map((s: any) => getId(s))
      .filter(Boolean) ?? [];
  const serviceTypeNames =
    app?.applicationServiceRequestTypes
      ?.map((s: any) => getText(s, "service") || getId(s))
      .filter(Boolean) ?? [];
  const roleIds =
    app?.applicationRoles?.map((r: any) => getId(r)).filter(Boolean) ?? [];
  const roleNames =
    app?.applicationRoles
      ?.map((r: any) => getText(r, "role") || getText(r, "name") || getId(r))
      .filter(Boolean) ?? [];

  return {
    environmentId,
    environmentName,
    assignmentGroupId,
    assignmentGroupName,
    groupLocationId,
    groupLocationName,
    workflowId,
    workflowName,
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

const buildOptionsFromPairs = (
  ids: string[],
  names: string[]
): MultiSelectOption[] => {
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

const GxpServiceRequestForm = ({
  onClose,
  onSubmit,
  initialData,
  mode = "create",
  optionSets
}: GxpServiceRequestFormProps) => {
  const resolvedInitial = Array.isArray(initialData)
    ? initialData[0]
    : initialData;
  const serviceRequestIdentity = String(
    resolvedInitial?.serviceRequestId ?? ""
  ).trim();
  const normalizedDefaults = useMemo(
    () => normalizeInitialValues(resolvedInitial),
    [resolvedInitial]
  );
  const { toggleLoading, loading } = useGlobalContext();
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const { applications } = optionSets;
  const initialApplicationIdRef = useRef<string>(
    normalizedDefaults.application ?? ""
  );
  const hasUserChangedApplicationRef = useRef(false);
  const [appDetails, setAppDetails] = useState<ApplicationDetails | null>(null);
  // Visible indicator while the selected application's details are fetched + autofilled.
  const [autofilling, setAutofilling] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<
    ExistingAttachment[]
  >([]);
  // Read-only reference: the SELECTED application's own attachments.
  const [applicationAttachments, setApplicationAttachments] = useState<
    ExistingAttachment[]
  >([]);
  const [serviceTypeOptions, setServiceTypeOptions] = useState<
    DropdownOption[]
  >([]);
  const [roleBaseOptions, setRoleBaseOptions] = useState<MultiSelectOption[]>(
    []
  );
  const [roleOptions, setRoleOptions] = useState<MultiSelectOption[]>([]);
  const [locationNameById, setLocationNameById] = useState<
    Record<string, string>
  >({});
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting, isSubmitted }
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
  const selectedRoles = useWatch({ control, name: "applicationRoles" });

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
  // Application Role is mandatory (>=1) only for Provide/Modify Access requests.
  const isRolesRequired = isProvideAccessRequest || isModifyAccessRequest;
  const isRolesInvalid =
    isRolesRequired && roleOptions.length > 0 && (selectedRoles?.length ?? 0) === 0;

  // After the first submit attempt, keep the roles requirement in sync live:
  // show the message while empty, clear it the moment a role is added or the
  // type changes. (Manual setError inside onSubmit alone is fragile with a zod
  // resolver, which re-validates and can wipe it — this effect is the source of truth.)
  useEffect(() => {
    if (!isSubmitted) return;
    if (isRolesInvalid) {
      setError("applicationRoles", {
        type: "manual",
        message: "Please select at least one application role."
      });
    } else {
      clearErrors("applicationRoles");
    }
  }, [isSubmitted, isRolesInvalid, setError, clearErrors]);

  const selectedApplicationLocationLabel = useMemo(() => {
    const selectedAppId = normalizeMixedId(selectedApplication);
    if (!selectedAppId) return "";
    const selectedApp = applications?.find(
      (app: any) => app?._id === selectedAppId
    );
    const selectedAppGroupId = normalizeMixedId((selectedApp as any)?.group);
    return (
      getText((selectedApp as any)?.group, "locationName") ||
      getText((selectedApp as any)?.group, "name") ||
      (selectedAppGroupId ? (locationNameById[selectedAppGroupId] ?? "") : "")
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
  // Reset/seed the form ONLY when a genuinely different record loads (identity
  // change), not on every reference change of resolvedInitial. Otherwise a
  // background refetch (e.g. React Query refetchOnWindowFocus, triggered when the
  // OS file dialog blurs/refocuses the window) re-runs this and wipes the files
  // the user just picked (setAttachments([])) plus any in-progress edits.
  const recordKey =
    (resolvedInitial as any)?._id ??
    (resolvedInitial as any)?.id ??
    (mode === "create" ? "__create__" : "__none__");
  useEffect(() => {
    reset(normalizedDefaults);
    initialApplicationIdRef.current = normalizedDefaults.application ?? "";
    hasUserChangedApplicationRef.current = false;
    setAppDetails(null);
    setAttachments([]);
    setExistingAttachments(
      mapAttachments((resolvedInitial as any)?.attachments) as ExistingAttachment[]
    );
    // Seed the selected application's own attachments (read-only reference) from
    // the SR detail's nested application; a later app change refreshes these.
    setApplicationAttachments(
      mapAttachments(
        (resolvedInitial as any)?.application?.attachments
      ) as ExistingAttachment[]
    );
    // Intentionally keyed on record identity only — see comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordKey]);

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
            (serviceType?.service ||
              serviceType?.name ||
              serviceType?.value)) ||
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
    // Block submission when a Provide/Modify Access request has no role selected
    // (the effect above renders the message; this stops the actual save).
    if (isRolesInvalid) {
      setError("applicationRoles", {
        type: "manual",
        message: "Please select at least one application role."
      });
      return;
    }
    clearErrors("applicationRoles");

    // Sanitize comments here (not on keystroke) so spaces/blank lines are preserved while typing.
    const sanitized = {
      ...data,
      comments: (data.comments || []).map((c) => c.trim()).filter(Boolean)
    };
    const parsed: ServiceRequestFormOutput =
      getServiceRequestSchema.parse(sanitized);
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
    setExistingAttachments((prev) =>
      prev.filter((_, removeIdx) => removeIdx !== idx)
    );
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Only application-roles (editable field) and locations (name lookup)
        // are eager-loaded now. The disabled env / assignment-group / workflow /
        // module selects are display-only and get their labels from the SR
        // detail's nested objects (resolvedInitial) and the fetched application
        // (appDetails) — see the *Seed builders below. This removes 4 redundant
        // list calls that fired on every form open.
        const [appRoles, locs] = await Promise.all([
          getApplicationRoles({ limit: 100 }),
          getLocations({ limit: 100 })
        ]);

        if (cancelled) return;

        const locationList = extractList<any>(locs, ["locations", "data"]);
        const nextLocationNameById = locationList.reduce<
          Record<string, string>
        >((acc, loc: any) => {
          const id = normalizeMixedId(loc);
          const name = loc?.locationName ?? loc?.name ?? "";
          if (id && name) acc[id] = String(name);
          return acc;
        }, {});
        setLocationNameById(nextLocationNameById);

        setRoleBaseOptions(
          extractList<RoleOption>(appRoles, [
            "applicationRoles",
            "roles",
            "data"
          ])
            .filter(
              (r) =>
                (r?.active ?? true) &&
                r?._id &&
                (r?.role || r?.name || r?.roleName)
            )
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
      const initialRoleOptions = buildRoleOptionsFromValues(
        (resolvedInitial as any)?.application?.applicationRoles ??
        (resolvedInitial as any)?.roles ??
        (resolvedInitial as any)?.applicationRoles
      );
      setRoleOptions(mergeUniqueOptions(roleBaseOptions, initialRoleOptions));
      return;
    }
    const initialRoles = buildOptionsFromPairs(
      appDetails.roleIds,
      appDetails.roleNames
    );
    const initialServiceTypes = buildOptionsFromPairs(
      appDetails.serviceTypeIds,
      appDetails.serviceTypeNames
    );

    setServiceTypeOptions(
      initialServiceTypes.map((serviceType) => ({
        value: serviceType.value,
        label: serviceType.text
      }))
    );
    setRoleOptions(mergeUniqueOptions(roleBaseOptions, initialRoles));
  }, [appDetails, resolvedInitial, roleBaseOptions]);

  useEffect(() => {
    const selectedAppId = normalizeMixedId(selectedApplication);
    const selectedApp = applications?.find(
      (app: any) => app?._id === selectedAppId
    );
    const initialApp =
      resolvedInitial &&
        typeof (resolvedInitial as any)?.application === "object"
        ? (resolvedInitial as any).application
        : null;
    const initialAppMatchesSelection =
      initialApp && normalizeMixedId(initialApp) === selectedAppId;

    const fromSelectedApp = getServiceTypeOptionsFromApplication(selectedApp);
    const fromInitialApp = initialAppMatchesSelection
      ? getServiceTypeOptionsFromApplication(initialApp)
      : [];

    setServiceTypeOptions(
      mergeUniqueDropdownOptions(fromSelectedApp, fromInitialApp)
    );
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
      setApplicationAttachments([]);
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
        setAutofilling(true);
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
          (details.groupLocationId
            ? (locationNameById[details.groupLocationId] ?? "")
            : "")
        );
        setValue("applicationWorkflow", details.workflowId);
        setValue("applicationModules", details.moduleIds);
        setValue(
          "applicationServiceRequestTypes",
          details.serviceTypeIds[0] ?? ""
        );
        setValue("applicationRoles", details.roleIds);
        setValue("notes", details.notes ?? "");
        setAppDetails(details);
        // Show the freshly-selected application's own attachments (read-only).
        setApplicationAttachments(
          mapAttachments((app as any)?.attachments) as ExistingAttachment[]
        );
        // Repopulate the app-scoped Service Request Types from the freshly
        // fetched application. optionSets.applications is intentionally empty
        // (no load-all), so this is the only source for the new app's types.
        setServiceTypeOptions((prev) =>
          mergeUniqueDropdownOptions(
            getServiceTypeOptionsFromApplication(app),
            prev
          )
        );
      } catch (err) {
        console.error("Failed to load application details", err);
        if (!cancelled) setAppDetails(null);
      } finally {
        toggleLoading(false);
        if (!cancelled) setAutofilling(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    locationNameById,
    resolvedInitial,
    selectedApplication,
    setValue,
    toggleLoading
  ]);

  // AsyncSelect seed options. The disabled fields (env/assignmentGroup/workflow/
  // modules) are display-only; we seed their labels from the SR detail's nested
  // objects (resolvedInitial) and the fetched application (appDetails) — no
  // eager list load needed.
  const applicationSeed: AsyncOption[] | undefined = (() => {
    // Seed ONLY the initial application's own id→label. Using selectedApplication's
    // id here would pair a newly-picked id with the OLD app's label (labelFor checks
    // initialSelectedOptions first), making the dropdown show the previous name.
    const app = (resolvedInitial as any)?.application;
    const id = getId(app) || normalizeMixedId(app);
    const label =
      getText(app, "applicationName") ||
      (app && typeof app === "object" ? (app.applicationName ?? app.name) : "");
    return id && label ? [{ value: id, label: String(label) }] : undefined;
  })();
  // Seed the disabled (display-only) selects. These never open, so their labels
  // resolve purely from these seeds. We prepend the CURRENTLY selected application's
  // own id→name pairs (already present in the fetched app payload) so the shown value
  // always reflects the latest selected application — even if it isn't in the loaded
  // options page. (Fixes "UI doesn't reflect after changing application".)
  const dedupeById = (opts: AsyncOption[]): AsyncOption[] => {
    const seen = new Set<string>();
    return opts.filter((o) => {
      if (!o.value || seen.has(o.value)) return false;
      seen.add(o.value);
      return true;
    });
  };
  // Single-relation seed from an SR-detail nested object (has the name post
  // backend fix; may be a bare id for older records).
  const nestedSeed = (nested: any, nameKey: string): AsyncOption[] => {
    if (!nested) return [];
    const value = normalizeMixedId(nested);
    if (!value) return [];
    const label =
      (typeof nested === "object" && (nested[nameKey] ?? nested.name)) || value;
    return [{ value, label: String(label) }];
  };
  const ri = resolvedInitial as any;
  // Order: SR-detail's own value first, then the fetched application's value.
  const environmentSeed = dedupeById([
    ...nestedSeed(ri?.environment ?? ri?.applicationEnvironment, "environmentName"),
    ...(appDetails?.environmentId
      ? [{ value: appDetails.environmentId, label: appDetails.environmentName || appDetails.environmentId }]
      : [])
  ]);
  const assignmentGroupSeed = dedupeById([
    ...nestedSeed(ri?.assignmentGroup ?? ri?.group, "groupName"),
    ...(appDetails?.assignmentGroupId
      ? [{ value: appDetails.assignmentGroupId, label: appDetails.assignmentGroupName || appDetails.assignmentGroupId }]
      : [])
  ]);
  const workflowSeed = dedupeById([
    ...nestedSeed(ri?.workflow ?? ri?.applicationWorkflow, "workflowName"),
    ...(appDetails?.workflowId
      ? [{ value: appDetails.workflowId, label: appDetails.workflowName || appDetails.workflowId }]
      : [])
  ]);
  const initialModuleSeed: AsyncOption[] = Array.isArray(ri?.modules)
    ? ri.modules
        .map((m: any) => ({
          value: normalizeMixedId(m),
          label: (typeof m === "object" && (m?.moduleName ?? m?.name)) || normalizeMixedId(m)
        }))
        .filter((o: AsyncOption) => o.value)
    : [];
  const moduleSeed: AsyncOption[] = dedupeById([
    ...initialModuleSeed,
    ...(appDetails?.moduleIds ?? []).map((id, i) => ({
      value: id,
      label: appDetails?.moduleNames?.[i] || id
    }))
  ]);

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("serviceRequest") })
            : resolvedInitial
              ? t("update", { entity: t("serviceRequest") })
              : t("gxpCreateNewServiceRequest")}
        </h2>

        <div className={isReadOnly ? "pointer-events-none opacity-80" : ""}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="identity">
                {t("identity", { defaultValue: "Identity" })}
              </Label>
              <Input
                id="identity"
                value={serviceRequestIdentity || "-"}
                readOnly
                disabled
                className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="application" required>
                  {t("application")}
                </Label>
                {autofilling && (
                  <span className="mb-1.5 inline-flex items-center gap-1 text-xs text-brand-500">
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    {t("loading", { defaultValue: "Loading details…" })}
                  </span>
                )}
              </div>
              <Controller
                name="application"
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    useOptions={useApplicationOptions}
                    value={field.value ?? ""}
                    onChange={(val) => {
                      // Preserve the edit-guard flag exactly (see M:718-727).
                      if (val !== initialApplicationIdRef.current) {
                        hasUserChangedApplicationRef.current = true;
                      }
                      field.onChange(val);
                    }}
                    disabled={isReadOnly}
                    error={!!errors.application}
                    placeholder={t("select", { entity: t("application") })}
                    initialSelectedOptions={applicationSeed}
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
                  <AsyncSelect
                    useOptions={useEnvironmentOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled
                    placeholder={t("select", { entity: t("environment") })}
                    initialSelectedOptions={environmentSeed}
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
                  <AsyncSelect
                    useOptions={useAssignmentGroupOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled
                    placeholder={t("select", { entity: t("group") })}
                    initialSelectedOptions={assignmentGroupSeed}
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
                    value={
                      appDetails?.groupLocationName ||
                      selectedApplicationLocationLabel ||
                      locationNameById[field.value ?? ""] ||
                      (typeof field.value === "string" &&
                        field.value.length === 24
                        ? ""
                        : (field.value ?? ""))
                    }
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
                  <AsyncSelect
                    useOptions={useWorkflowOptions}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    disabled
                    placeholder={t("select", { entity: t("workflow") })}
                    initialSelectedOptions={workflowSeed}
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
                  <AsyncSelect
                    multi
                    useOptions={useModuleOptions}
                    value={field.value}
                    onChange={field.onChange}
                    disabled
                    placeholder={t("select", { entity: t("gxpAppModules") })}
                    initialSelectedOptions={moduleSeed}
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
                    placeholder={t("select", {
                      entity: t("gxpAppServiceRequestTypes")
                    })}
                  />
                )}
              />
              {renderError(
                errors.applicationServiceRequestTypes?.message as string
              )}
            </div>

            {(isProvideAccessRequest || isModifyAccessRequest) &&
              roleOptions.length > 0 && (
                <div>
                  <Label htmlFor="applicationRoles" required={isRolesRequired}>
                    {t("gxpAppRoles")}
                  </Label>
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
                          const optionToAdd = {
                            text: newOption.text,
                            value: newOption.text
                          };
                          setRoleOptions((prev) =>
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
                      label={
                        field.value ? (t("yes") ?? "Yes") : (t("no") ?? "No")
                      }
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
                    value={field.value.join("\n")}
                    onChange={(val) => {
                      // Keep raw input (preserve spaces + blank lines while typing);
                      // trim/filter happens only on submit (see onFormSubmit).
                      field.onChange((val ?? "").split("\n"));
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
                {t("attachments", {
                  defaultValue: t("trainingEvidence") ?? "Attachments"
                })}
              </Label>
              {applicationAttachments.length ? (
                <div className="mb-3 space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {t("applicationAttachments", {
                      defaultValue: "Application attachments"
                    })}{" "}
                    ({applicationAttachments.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {applicationAttachments.map((attachment, idx) => (
                      <a
                        key={`app-att-${attachment.path}-${idx}`}
                        href={getGxpImageUrl(attachment.path)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                        <span className="text-xs text-gray-800 dark:text-gray-100 truncate max-w-[160px]">
                          {attachment.name}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
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
                  defaultValue:
                    "Upload documents/images. Audio/video not allowed."
                })}
              />
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
  );
};

export default GxpServiceRequestForm;
