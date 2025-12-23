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
import {
    ApplicationFormInput,
    ApplicationFormOutput,
    getApplicationSchema,
} from "@/lib/schema";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import {
    applicationRoleOptions,
    applicationServiceRequestTypeOptions,
    applicationTypeOptions,
} from "@/types/common.types";
import { useGlobalContext } from "@/context";
import type {
    Application,
    ApplicationGroup,
    ApplicationSoftwareModule,
    AssignmentGroup,
    Department,
    Environment,
    Supplier,
    User,
    Workflow,
} from "@/types/gxp-service.types";

interface CreateApplicationModalProps {
    onClose: () => void;
    onSubmit: (data: ApplicationFormOutput) => void | Promise<void>;
    initialData?: Application | Application[] | null;
    optionSets: {
        environments: Environment[];
        assignmentGroups: AssignmentGroup[];
        applicationGroups: ApplicationGroup[];
        appModules: ApplicationSoftwareModule[];
        workflows: Workflow[];
        users: User[]; // owners
        suppliers: Supplier[];
        departments: Department[];
    };
}

type MultiSelectOption = { text: string; value: string };

const DEFAULT_FORM_VALUES: ApplicationFormInput = {
    applicationName: "",
    applicationType: "GxP",
    applicationEnvironment: "",
    group: "",
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
    status: "enabled",
};

const normalizeId = (value: string | { _id: string } | null | undefined): string => {
    if (!value) return "";
    return typeof value === "string" ? value : value._id;
};

const normalizeInitialValues = (data?: Application | null): ApplicationFormInput => ({
    ...DEFAULT_FORM_VALUES,
    applicationName: data?.applicationName ?? DEFAULT_FORM_VALUES.applicationName,
    applicationType: data?.applicationType ?? DEFAULT_FORM_VALUES.applicationType,
    applicationEnvironment: normalizeId(data?.applicationEnvironment),
    group: normalizeId(data?.group),
    applicationRoles: data?.applicationRoles?.map((r) => r.role).filter(Boolean) ?? [],
    applicationGroups: data?.applicationGroups?.map((g) => g.appGroup).filter(Boolean) ?? [],
    applicationServiceRequestTypes:
        data?.applicationServiceRequestTypes?.map((s) => s.service).filter(Boolean) ?? [],
    applicationModules:
        data?.applicationModules?.map((m) => m.moduleName).filter(Boolean) ?? [],
    applicationWorkflow: normalizeId(data?.applicationWorkflow),
    applicationSystemOwner: normalizeId(data?.applicationSystemOwner),
    applicationProcessOwner: normalizeId(data?.applicationProcessOwner),
    supplier: normalizeId(data?.supplier),
    departments: data?.departments?.map((d) => d.departmentName).filter(Boolean) ?? [],
    notes: data?.notes ?? DEFAULT_FORM_VALUES.notes,
    attachments: data?.attachments ?? DEFAULT_FORM_VALUES.attachments,
    status: data?.status ?? DEFAULT_FORM_VALUES.status,
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
        applicationGroups,
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

    const notes = useWatch({ control, name: "notes" });
    const [appGroupOptions, setAppGroupOptions] = useState<MultiSelectOption[]>([]);
    const [appModuleOptions, setAppModuleOptions] = useState<MultiSelectOption[]>([]);

    useEffect(() => {
        reset(normalizedDefaults);
    }, [normalizedDefaults, reset]);

    useEffect(() => {
        const baseOptions =
            applicationGroups?.map((g) => ({
                text: g.appGroup,
                value: g.appGroup,
            })) || [];

        const mergedOptions = [...baseOptions];
        normalizedDefaults.applicationGroups?.forEach((val) => {
            if (val && !mergedOptions.find((opt) => opt.value === val)) {
                mergedOptions.push({ text: val, value: val });
            }
        });

        setAppGroupOptions(mergedOptions.filter((opt) => opt.value));
    }, [applicationGroups, normalizedDefaults.applicationGroups]);

    useEffect(() => {
        const baseOptions =
            appModules?.map((m) => ({
                text: m.moduleName,
                value: m.moduleName,
            })) || [];

        const mergedOptions = [...baseOptions];
        normalizedDefaults.applicationModules?.forEach((val) => {
            if (val && !mergedOptions.find((opt) => opt.value === val)) {
                mergedOptions.push({ text: val, value: val });
            }
        });

        setAppModuleOptions(mergedOptions.filter((opt) => opt.value));
    }, [appModules, normalizedDefaults.applicationModules]);

    const onFormSubmit: SubmitHandler<ApplicationFormInput> = async (data) => {
        const parsed: ApplicationFormOutput = getApplicationSchema.parse(data);
        const payload: ApplicationFormOutput = {
            ...parsed,
            notes: parsed.notes ?? "",
        };

        try {
            toggleLoading(true);
            await onSubmit(payload);
        } finally {
            toggleLoading(false);
        }
    };




    const appendUnique = (current: string[] | undefined, next: string) =>
        current?.includes(next) ? current : [...(current || []), next];

    const toSingleValue = (vals: string[]) => vals[0] ?? "";

    return (
        //Remove max-h-screen to allow full height scrolling when validation errors occur
        <div className="p-6  overflow-y-auto no-scrollbar bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
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
                        <Label htmlFor="applicationEnvironment" required>{t("applicationEnvironment")}</Label>
                        <Controller
                            name="applicationEnvironment"
                            control={control}
                            render={({ field }) => (
                                <SelectDropdown
                                    value={field.value ?? ""}
                                    onChange={(val) => field.onChange(val)}
                                    options={environments.map((e) => ({
                                        label: e.environmentName,
                                        value: e._id,
                                    }))}
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
                        <Label htmlFor="group" required>{t("group")}</Label>
                        <Controller
                            name="group"
                            control={control}
                                    render={({ field }) => (
                                        <SelectDropdown
                                            value={field.value ?? ""}
                                            onChange={(val) => field.onChange(val)}
                                            options={assignmentGroups.map((g) => ({
                                                label: g.groupName,
                                                value: g._id,
                                            }))}
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
                                    error={errors.applicationRoles?.message as string}
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
                        <Label htmlFor="applicationServiceRequestTypes" required>{t("gxpAppServiceRequestTypes")}</Label>
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
                                    error={errors.applicationServiceRequestTypes?.message as string}
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
                        <Label htmlFor="applicationWorkflow" required>{t("applicationWorkflow")}</Label>
                        <Controller
                            name="applicationWorkflow"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    key={`workflow-${initialKey}`}
                                    options={workflows.map((w) => ({
                                        text: w.workflowName,
                                        value: w._id,
                                    }))}
                                    label={t("select", { entity: t("gxpWorkflows") })}
                                    onChange={(val) => field.onChange(toSingleValue(val))}
                                    defaultSelected={field.value ? [field.value] : []}
                                    error={errors.applicationWorkflow?.message as string}
                                />
                            )}
                        />
                    </div>

                    {/* System Owner (single) */}
                    <div>
                        <Label htmlFor="applicationSystemOwner" required>{t("gxpSystemOwner")}</Label>
                        <Controller
                            name="applicationSystemOwner"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    key={`systemOwner-${initialKey}`}
                                    options={users.map((u) => ({
                                        text: u.fullName,
                                        value: u._id,
                                    }))}
                                    label={t("select", { entity: t("gxpSystemOwner") })}
                                    onChange={(val) => field.onChange(toSingleValue(val))}
                                    defaultSelected={field.value ? [field.value] : []}
                                    error={errors.applicationSystemOwner?.message as string}
                                />
                            )}
                        />
                    </div>

                    {/* Process Owner (single) */}
                    <div>
                        <Label htmlFor="applicationProcessOwner" required>{t("gxpProcessOwner")}</Label>
                        <Controller
                            name="applicationProcessOwner"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    key={`processOwner-${initialKey}`}
                                    options={users.map((u) => ({
                                        text: u.fullName,
                                        value: u._id,
                                    }))}
                                    label={t("select", { entity: t("gxpProcessOwner") })}
                                    onChange={(val) => field.onChange(toSingleValue(val))}
                                    defaultSelected={field.value ? [field.value] : []}
                                    error={errors.applicationProcessOwner?.message as string}
                                />
                            )}
                        />
                    </div>

                    {/* Supplier (single) */}
                    <div>
                        <Label htmlFor="supplier" required>{t("supplier")}</Label>
                        <Controller
                            name="supplier"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    key={`supplier-${initialKey}`}
                                    options={suppliers.map((s) => ({
                                        text: s.supplierName,
                                        value: s._id,
                                    }))}
                                    label={t("select", { entity: t("gxpSuppliers") })}
                                    onChange={(val) => field.onChange(toSingleValue(val))}
                                    defaultSelected={field.value ? [field.value] : []}
                                    error={errors.supplier?.message as string}
                                />
                            )}
                        />
                    </div>

                    {/* Departments (multi) */}
                    <div>
                        <Label htmlFor="departments" required>{t("departments")}</Label>
                        <Controller
                            name="departments"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    key={`departments-${initialKey}`}
                                    options={departments.map((d) => ({
                                        text: d.departmentName,
                                        value: d._id,
                                    }))}
                                    label={t("select", { entity: t("gxpDepartments") })}
                                    onChange={field.onChange}
                                    defaultSelected={field.value}
                                    error={errors.departments?.message as string}
                                />
                            )}
                        />
                    </div>

                    {/* Notes */}
                    <div className="col-span-2">
                        <Label htmlFor="notes" required>{t("notes")}</Label>
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
