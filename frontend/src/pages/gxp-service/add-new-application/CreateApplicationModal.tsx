// src/pages/gxp/CreateApplicationModal.tsx
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";

import Label from "@/components/common/form/Label";
import Input from "@/components/common/form/input/InputField";
import TextArea from "@/components/common/form/input/TextArea";
import MultiSelect from "@/components/common/form/MultiSelect";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/common/form/switch/Switch";
import { getApplicationSchema } from "@/lib/schema";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import {
    applicationRoleOptions,
    applicationServiceRequestTypeOptions,
    applicationTypeOptions,
} from "@/types/common.types";
import { useGlobalContext } from "@/context";

interface CreateApplicationModalProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    optionSets: {
        environments: any[];
        assignmentGroups: any[];
        appRoles: any[];
        appModules: any[];
        workflows: any[];
        users: any[];     // owners
        suppliers: any[];
        departments: any[];
    };
}

// types derived from zod
type ApplicationFormInput = z.input<typeof getApplicationSchema>;   // input, status optional
type ApplicationFormOutput = z.output<typeof getApplicationSchema>; // output, status required
type MultiSelectOption = { text: string; value: string };

const normalizeId = (value: any, keys: string[] = []): string => {
    if (!value) return "";
    if (typeof value === "string") return value;
    const orderedKeys = [...keys, "_id", "value"];
    for (const key of orderedKeys) {
        const candidate = value?.[key];
        if (candidate && typeof candidate === "string") {
            return candidate;
        }
    }
    return "";
};

const mapArrayToIds = (items: any[] | undefined, keys: string[] = []): string[] =>
    (items ?? [])
        .map((item) => normalizeId(item, keys))
        .filter((val): val is string => Boolean(val));

const normalizeInitialValues = (data?: any): ApplicationFormInput => ({
    applicationName: data?.applicationName ?? "",
    applicationType: data?.applicationType ?? "GxP",
    applicationEnvironment: normalizeId(data?.applicationEnvironment),
    group: normalizeId(data?.group, ["appGroup"]),
    applicationRoles: mapArrayToIds(data?.applicationRoles, ["role"]),
    applicationGroups: mapArrayToIds(data?.applicationGroups, ["appGroup"]),
    applicationServiceRequestTypes: mapArrayToIds(data?.applicationServiceRequestTypes, ["service"]),
    applicationModules: mapArrayToIds(data?.applicationModules, ["moduleName"]),
    applicationWorkflow: normalizeId(data?.applicationWorkflow),
    applicationSystemOwner: normalizeId(data?.applicationSystemOwner),
    applicationProcessOwner: normalizeId(data?.applicationProcessOwner),
    supplier: normalizeId(data?.supplier),
    departments: mapArrayToIds(data?.departments, ["departmentName", "departmentId", "value"]),
    notes: data?.notes ?? "",
    attachments: data?.attachments ?? [],
    status: data?.status ?? "enabled",
});

const CreateApplicationModal = ({
    onClose,
    onSubmit,
    initialData,
    optionSets,
}: CreateApplicationModalProps) => {
    const resolvedInitial = Array.isArray(initialData) ? initialData[0] : initialData;
    const { t } = useTranslation();
    const { toggleLoading, loading } = useGlobalContext();
    const normalizedDefaults = useMemo<ApplicationFormInput>(
        () => normalizeInitialValues(resolvedInitial),
        [resolvedInitial]
    );
    const initialKey = resolvedInitial?._id ?? "new";
    const {
        environments,
        assignmentGroups,
        appRoles,
        appModules,
        workflows,
        users,
        suppliers,
        departments,
    } = optionSets;
    const {
        register,
        control,
        handleSubmit,
        setValue,
        reset,
        formState: { errors },
    } = useForm<ApplicationFormInput>({
        resolver: zodResolver(getApplicationSchema),
        defaultValues: normalizedDefaults,
    });

    // helper to map option to MultiSelect’s shape
    const toOption = (item: any, textKey: string = "name", valueKey: string = "_id") => ({
        text:
            item?.[textKey] ??
            item?.moduleName ??
            item?.name ??
            item?.title ??
            item?.applicationName ??
            String(item),
        value:
            item?.[valueKey] ??
            (textKey === "moduleName" ? item?.moduleName : undefined) ??
            item?._id ??
            item?.value ??
            item?.name ??
            String(item),
    });
    const notes = useWatch({ control, name: "notes" });
    const [appGroupOptions, setAppGroupOptions] = useState<MultiSelectOption[]>([]);
    const [appModuleOptions, setAppModuleOptions] = useState<MultiSelectOption[]>([]);

    useEffect(() => {
        reset(normalizedDefaults);
    }, [normalizedDefaults, reset]);

    useEffect(() => {
        const baseOptions =
            (normalizedDefaults.applicationGroups ?? []).map((val) => ({
                text: val,
                value: val,
            })) || [];

        setAppGroupOptions(baseOptions.filter((opt) => opt.value));
    }, [normalizedDefaults.applicationGroups]);

    useEffect(() => {
        const baseOptions =
            appModules?.map((m) => ({
                text: m?.moduleName ?? m?.name ?? String(m?._id ?? ""),
                value: m?.moduleName ?? "",
            })) || [];

        const mergedOptions = [...baseOptions];
        normalizedDefaults.applicationModules?.forEach((val) => {
            if (val && !mergedOptions.find((opt) => opt.value === val)) {
                mergedOptions.push({ text: val, value: val });
            }
        });

        setAppModuleOptions(mergedOptions.filter((opt) => opt.value));
    }, [appModules, normalizedDefaults.applicationModules]);

    // If the stored values are ids, map them to module names when possible so we submit names
    useEffect(() => {
        if (!appModules?.length) return;
        const current = normalizedDefaults.applicationModules ?? [];
        const mapped = current.map((val) => {
            const match = appModules.find((m) => m?._id === val);
            return match?.moduleName ?? val;
        });
        // only update if changed to avoid unnecessary re-renders
        const hasDiff =
            mapped.length !== current.length ||
            mapped.some((v, idx) => v !== current[idx]);
        if (hasDiff) {
            setValue("applicationModules", mapped);
        }
    }, [appModules, normalizedDefaults.applicationModules, setValue]);

    const onFormSubmit: SubmitHandler<ApplicationFormInput> = async (data) => {
        // Ensure defaults are applied & types are output-safe
        const parsed: ApplicationFormOutput = getApplicationSchema.parse(data);

        // normalize single-selects if needed, example:
        const normalizeSingle = (val: any) => {
            const v = Array.isArray(val) ? val[0] : val;
            return v ? v : undefined;
        };
        const normalizeMany = (vals: any[] | undefined, preferNameKey?: string) =>
            (vals ?? [])
                .map((v) => {
                    if (typeof v === "string") return v || undefined;
                    if (typeof v === "object" && v !== null) {
                        if (preferNameKey && v[preferNameKey]) return v[preferNameKey];
                        return v.value ?? v._id ?? v.appGroup ?? v.name ?? v.label ?? undefined;
                    }
                    return undefined;
                })
                .filter((v): v is string => Boolean(v));

        const toModuleName = (val: string | undefined) => {
            if (!val) return val;
            const match = appModules?.find((m) => m?._id === val);
            return match?.moduleName ?? val;
        };

        const payload = {
            applicationName: parsed.applicationName,
            applicationType: parsed.applicationType,
            applicationEnvironment: normalizeSingle(parsed.applicationEnvironment),
            group: normalizeSingle(parsed.group),
            applicationRoles: normalizeMany(parsed.applicationRoles),
            applicationGroups: normalizeMany(parsed.applicationGroups),
            applicationServiceRequestTypes: normalizeMany(parsed.applicationServiceRequestTypes),
            applicationModules: normalizeMany(parsed.applicationModules, "moduleName").map(toModuleName),
            applicationWorkflow: normalizeSingle(parsed.applicationWorkflow),
            applicationSystemOwner: normalizeSingle(parsed.applicationSystemOwner),
            applicationProcessOwner: normalizeSingle(parsed.applicationProcessOwner),
            supplier: normalizeSingle(parsed.supplier),
            departments: normalizeMany(parsed.departments),
            notes: parsed.notes ?? "",
            status: parsed.status ?? "enabled",
        };

        try {
            toggleLoading(true);
            await onSubmit(payload);
        } finally {
            toggleLoading(false);
        }
    };




    const toSingleValue = (val: any) => (Array.isArray(val) ? val[0] ?? "" : val);

    const appendUnique = (current: string[] | undefined, next: string) =>
        current?.includes(next) ? current : [...(current || []), next];

    return (
        <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <h2 className="text-xl font-semibold">
                    {t(resolvedInitial ? "edit" : "create", { entity: t("gxpApplications") })}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Application Name */}
                    <div>
                        <Label htmlFor="applicationName" required>{t("applicationName")}</Label>
                        <Input
                            {...register("applicationName")}
                            error={!!errors.applicationName}
                            hint={errors.applicationName?.message}
                            className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                    </div>

                    {/* Application Type (SelectDropdown) */}
                    <div>
                        <Label htmlFor="applicationType" required>{t("applicationType")}</Label>
                        <Controller
                            name="applicationType"
                            control={control}
                            render={({ field }) => (
                                <SelectDropdown
                                    value={field.value}
                                    onChange={(val) => field.onChange(val)}
                                    options={applicationTypeOptions}
                                    placeholder={t("select", { entity: t("applicationType") })}
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
                        <Label htmlFor="applicationEnvironment">{t("applicationEnvironment")}</Label>
                        <Controller
                            name="applicationEnvironment"
                            control={control}
                            render={({ field }) => (
                                <SelectDropdown
                                    value={field.value ?? ""}
                                    onChange={(val) => field.onChange(val)}
                                    options={environments?.map((e) => {
                                        const opt = toOption(e, "environmentName", "_id");
                                        return { label: opt.text, value: opt.value };
                                    })}
                                    placeholder={t("select", { entity: t("gxpEnvironments") })}
                                />
                            )}
                        />
                        {errors.applicationEnvironment && (
                            <p className="text-red-500 text-xs mt-1">
                                {errors.applicationEnvironment.message as string}
                            </p>
                        )}
                    </div>

                    {/* Assignment Group (single) */}
                    <div>
                        <Label htmlFor="group">{t("group")}</Label>
                        <Controller
                            name="group"
                            control={control}
                                    render={({ field }) => (
                                        <SelectDropdown
                                            value={field.value ?? ""}
                                            onChange={(val) => field.onChange(val)}
                                            options={assignmentGroups?.map((g) => {
                                                const opt = toOption(g, "groupName", "_id");
                                                return { label: opt.text, value: opt.value };
                                            })}
                                            placeholder={t("select", { entity: t("gxpAssignmentGroups") })}
                                        />
                                    )}
                                />
                                {errors.group && (
                            <p className="text-red-500 text-xs mt-1">{errors.group.message as string}</p>
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
                                    options={applicationRoleOptions.map((opt) => ({
                                        text: opt.label,
                                        value: opt.value,
                                    }))}
                                    label={t("select", { entity: t("gxpAppRoles") })}
                                    onChange={field.onChange}
                                    defaultSelected={field.value}
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
                                    showAddButton
                                    onAdd={(newOption) => {
                                        setAppGroupOptions((prev) =>
                                            prev.find((opt) => opt.value === newOption.value)
                                                ? prev
                                                : [...prev, newOption]
                                        );
                                        field.onChange(appendUnique(field.value, newOption.value));
                                    }}
                                />
                            )}
                        />
                    </div>

                    {/* Service Request Types (multi) */}
                    <div>
                        <Label htmlFor="applicationServiceRequestTypes">{t("gxpAppServiceRequestTypes")}</Label>
                        <Controller
                            name="applicationServiceRequestTypes"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    key={`services-${initialKey}`}
                                    options={applicationServiceRequestTypeOptions.map((o) => ({
                                        text: o.label,
                                        value: o.value,
                                    }))}
                                    label={t("select", { entity: t("gxpAppServiceRequestTypes") })}
                                    onChange={field.onChange}
                                    defaultSelected={field.value}
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
                                    showAddButton
                                    onAdd={(newOption) => {
                                        setAppModuleOptions((prev) =>
                                            prev.find((opt) => opt.value === newOption.value)
                                                ? prev
                                                : [...prev, newOption]
                                        );
                                        field.onChange(appendUnique(field.value, newOption.value));
                                    }}
                                />
                            )}
                        />
                    </div>

                    {/* Workflow (single) */}
                    <div>
                        <Label htmlFor="applicationWorkflow">{t("applicationWorkflow")}</Label>
                        <Controller
                            name="applicationWorkflow"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    key={`workflow-${initialKey}`}
                                    options={workflows?.map((w) => toOption(w, "workflowName", "_id"))}
                                    label={t("select", { entity: t("gxpWorkflows") })}
                                    onChange={(val) => field.onChange(toSingleValue(val))}
                                    defaultSelected={field.value ? [field.value] : []}
                                />
                            )}
                        />
                    </div>

                    {/* System Owner (single) */}
                    <div>
                        <Label htmlFor="applicationSystemOwner">{t("gxpSystemOwner")}</Label>
                        <Controller
                            name="applicationSystemOwner"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    key={`systemOwner-${initialKey}`}
                                    options={users?.map((u) => toOption(u, "fullName", "_id"))}
                                    label={t("select", { entity: t("gxpSystemOwner") })}
                                    onChange={(val) => field.onChange(toSingleValue(val))}
                                    defaultSelected={field.value ? [field.value] : []}
                                />
                            )}
                        />
                    </div>

                    {/* Process Owner (single) */}
                    <div>
                        <Label htmlFor="applicationProcessOwner">{t("gxpProcessOwner")}</Label>
                        <Controller
                            name="applicationProcessOwner"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    key={`processOwner-${initialKey}`}
                                    options={users?.map((u) => toOption(u, "fullName", "_id"))}
                                    label={t("select", { entity: t("gxpProcessOwner") })}
                                    onChange={(val) => field.onChange(toSingleValue(val))}
                                    defaultSelected={field.value ? [field.value] : []}
                                />
                            )}
                        />
                    </div>

                    {/* Supplier (single) */}
                    <div>
                        <Label htmlFor="supplier">{t("supplier")}</Label>
                        <Controller
                            name="supplier"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    key={`supplier-${initialKey}`}
                                    options={suppliers?.map((s) => toOption(s, "supplierName", "_id"))}
                                    label={t("select", { entity: t("gxpSuppliers") })}
                                    onChange={(val) => field.onChange(toSingleValue(val))}
                                    defaultSelected={field.value ? [field.value] : []}
                                />
                            )}
                        />
                    </div>

                    {/* Departments (multi) */}
                    <div>
                        <Label htmlFor="departments">{t("departments")}</Label>
                        <Controller
                            name="departments"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    key={`departments-${initialKey}`}
                                    options={departments?.map((d) => toOption(d, 'departmentName', '_id'))}
                                    label={t("select", { entity: t("gxpDepartments") })}
                                    onChange={field.onChange}
                                    defaultSelected={field.value}
                                />
                            )}
                        />
                    </div>

                    {/* Notes */}
                    <div className="col-span-2">
                        <Label htmlFor="notes">{t("notes")}</Label>
                        <TextArea
                            value={notes ?? ""}
                            onChange={(val) => setValue("notes", val)}
                            error={!!errors.notes}
                            hint={errors.notes?.message}
                            className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
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
                                            onChange={(val) => field.onChange(val ? "enabled" : "disabled")}
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

export default CreateApplicationModal;
