// src/pages/gxp/CreateApplicationModal.tsx
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import Label from "@/components/common/form/Label";
import Input from "@/components/common/form/input/InputField";
import TextArea from "@/components/common/form/input/TextArea";
import MultiSelect from "@/components/common/form/MultiSelect";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/common/form/switch/Switch";
import { getApplicationSchema } from "@/lib/schema";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { applicationTypeOptions } from "@/types/common.types";

interface CreateApplicationModalProps {
    onClose: () => void;
    onSubmit: (data: any) => void;
    initialData?: any;
    optionSets: {
        environments: any[];
        assignmentGroups: any[];
        appRoles: any[];
        appGroups: any[];
        serviceTypes: any[];
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

const CreateApplicationModal = ({
    onClose,
    onSubmit,
    initialData,
    optionSets,
}: CreateApplicationModalProps) => {
    const { t } = useTranslation();
    const {
        environments,
        assignmentGroups,
        appRoles,
        appGroups,
        serviceTypes,
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
        formState: { errors },
    } = useForm<ApplicationFormInput>({
        resolver: zodResolver(getApplicationSchema),
        defaultValues: {
            applicationName: initialData?.applicationName ?? "",
            applicationType: initialData?.applicationType ?? "GxP",
            applicationEnvironment: initialData?.applicationEnvironment ?? "",
            group: initialData?.group ?? "",
            applicationRoles: initialData?.applicationRoles ?? [],
            applicationGroups: initialData?.applicationGroups ?? [],
            applicationServiceRequestTypes: initialData?.applicationServiceRequestTypes ?? [],
            applicationModules: initialData?.applicationModules ?? [],
            applicationWorkflow: initialData?.applicationWorkflow ?? "",
            applicationSystemOwner: initialData?.applicationSystemOwner ?? "",
            applicationProcessOwner: initialData?.applicationProcessOwner ?? "",
            supplier: initialData?.supplier ?? "",
            departments: initialData?.departments ?? [],
            notes: initialData?.notes ?? "",
            attachments: initialData?.attachments ?? [],
            status: initialData?.status ?? "enabled", // <-- add ?.
        } satisfies ApplicationFormInput, // helps TS ensure correct shape
    });

    const notes = useWatch({ control, name: "notes" });

    const onFormSubmit: SubmitHandler<ApplicationFormInput> = (data) => {
        // Ensure defaults are applied & types are output-safe
        const parsed: ApplicationFormOutput = getApplicationSchema.parse(data);

        // normalize single-selects if needed, example:
        const normalizeSingle = (val: any) => (Array.isArray(val) ? (val[0] ?? "") : val);

        const payload = {
            ...parsed,
            applicationEnvironment: normalizeSingle(parsed.applicationEnvironment),
            group: normalizeSingle(parsed.group),
            applicationWorkflow: normalizeSingle(parsed.applicationWorkflow),
            applicationSystemOwner: normalizeSingle(parsed.applicationSystemOwner),
            applicationProcessOwner: normalizeSingle(parsed.applicationProcessOwner),
            supplier: normalizeSingle(parsed.supplier),
        };

        onSubmit(payload);
    };


    // helper to map option to MultiSelect’s shape
    const toOption = (item: any, textKey: string = "name", valueKey: string = "_id") => ({
        text: item?.[textKey] ?? item?.name ?? item?.title ?? item?.applicationName ?? String(item),
        value: item?.[valueKey] ?? item?.name ?? String(item),
    });

    return (
        <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <h2 className="text-xl font-semibold">
                    {t(initialData ? "edit" : "create", { entity: t("gxpApplications") })}
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
                                <MultiSelect
                                    options={environments?.map((e) => toOption(e, "environmentName", "_id"))}
                                    label={t("select", { entity: t("gxpEnvironments") })}
                                    onChange={field.onChange}
                                    defaultSelected={field.value ? [field.value] : []}
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
                                <MultiSelect
                                    options={assignmentGroups?.map((g) => toOption(g, "groupName", "groupName"))}
                                    label={t("select", { entity: t("gxpAssignmentGroups") })}
                                    onChange={field.onChange}
                                    defaultSelected={field.value ? [field.value] : []}
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
                                    options={appRoles?.map((r) => toOption(r))}
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
                                    options={appGroups?.map((g) => toOption(g))}
                                    label={t("select", { entity: t("gxpAppGroups") })}
                                    onChange={field.onChange}
                                    defaultSelected={field.value}
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
                                    options={serviceTypes?.map((s) => toOption(s))}
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
                                    options={appModules?.map((m) => toOption(m))}
                                    label={t("select", { entity: t("gxpAppModules") })}
                                    onChange={field.onChange}
                                    defaultSelected={field.value}
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
                                    options={workflows?.map((w) => toOption(w, "workflowName", "_id"))}
                                    label={t("select", { entity: t("gxpWorkflows") })}
                                    onChange={field.onChange}
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
                                    options={users?.map((u) => toOption(u, "fullName", "_id"))}
                                    label={t("select", { entity: t("gxpSystemOwner") })}
                                    onChange={field.onChange}
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
                                    options={users?.map((u) => toOption(u, "fullName", "_id"))}
                                    label={t("select", { entity: t("gxpProcessOwner") })}
                                    onChange={field.onChange}
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
                                    options={suppliers?.map((s) => toOption(s, "supplierName", "_id"))}
                                    label={t("select", { entity: t("gxpSuppliers") })}
                                    onChange={field.onChange}
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
                                    options={departments?.map((d) => toOption(d,'departmentName', '_id'))}
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
                    <Button type="submit" variant="primary">
                        {t("save")}
                    </Button>
                </div>
            </form>
        </div>

    );
};

export default CreateApplicationModal;
