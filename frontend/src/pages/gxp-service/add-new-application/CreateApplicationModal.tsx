// src/pages/gxp/CreateApplicationModal.tsx
import { Controller, SubmitHandler, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";

import { Modal } from "@/components/ui/modal";
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
    getApplicationSchema,
} from "@/lib/schema";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { applicationTypeOptions } from "@/types/common.types";
import { useGlobalContext } from "@/context";
import { getGxpImageUrl } from "@/services/utils.service";
import type {
    Application,
    ApplicationGroup,
    ApplicationServiceRequestType,
    ApplicationSoftwareModule,
    AssignmentGroup,
    Department,
    Environment,
    Supplier,
    User,
    Workflow,
} from "@/types/gxp-service.types";

type MultiSelectOption = { text: string; value: string };
type RoleOption = { _id?: string; name?: string; role?: string; roleName?: string };
type IdOrName = { _id?: string; name?: string };
type ExistingAttachment = { id?: string; path: string; name: string };
export type ApplicationPayload = Omit<
    ApplicationFormOutput,
    | "applicationRoles"
    | "applicationGroups"
    | "applicationServiceRequestTypes"
    | "applicationModules"
    | "departments"
> & {
    applicationRoles: IdOrName[];
    applicationGroups: IdOrName[];
    applicationServiceRequestTypes: string[];
    applicationModules: IdOrName[];
    departments: IdOrName[];
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
    optionSets: {
        environments: Environment[];
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

const normalizeIdArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((v: any) => (typeof v === "string" ? v : v?._id))
        .filter(Boolean);
};

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

const normalizeInitialValues = (data?: Application | null): ApplicationFormInput => ({
    ...DEFAULT_FORM_VALUES,
    applicationName: data?.applicationName ?? DEFAULT_FORM_VALUES.applicationName,
    applicationType: data?.applicationType ?? DEFAULT_FORM_VALUES.applicationType,
    applicationEnvironment: normalizeId(data?.applicationEnvironment),
    group: normalizeId(data?.group),
    applicationRoles: normalizeIdArray(data?.applicationRoles),
    applicationGroups: normalizeIdArray(data?.applicationGroups),
    applicationServiceRequestTypes: normalizeIdArray(data?.applicationServiceRequestTypes),
    applicationModules: normalizeIdArray(data?.applicationModules),
    applicationWorkflow: normalizeId(data?.applicationWorkflow),
    applicationSystemOwner: normalizeId(data?.applicationSystemOwner),
    applicationProcessOwner: normalizeId(data?.applicationProcessOwner),
    supplier: normalizeId(data?.supplier),
    departments: normalizeIdArray(data?.departments),
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
        serviceRequestTypes,
        appModules,
        workflows,
        users,
        suppliers,
        departments,
        roles,
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
    const [attachments, setAttachments] = useState<File[]>([]);
    const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);
    const [confirmRemoveIdx, setConfirmRemoveIdx] = useState<number | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const roleOptions = useMemo<MultiSelectOption[]>(
        () =>
            roles
                ?.map((role) => ({
                    text: role?.name || role?.roleName || role?.role || "",
                    value: role?._id || "",
                }))
                .filter((opt) => opt.value && opt.text) || [],
        [roles]
    );

    const serviceRequestOptions = useMemo<MultiSelectOption[]>(
        () =>
            serviceRequestTypes
                ?.filter((s) => (s?.active ?? true) && s?.service && s?._id)
                .map((s) => ({ text: s.service, value: s._id })) || [],
        [serviceRequestTypes]
    );

    useEffect(() => {
        reset(normalizedDefaults);
        setAttachments([]);
        setExistingAttachments(
            (resolvedInitial?.attachments || [])
                .map((att: any) => {
                    const path =
                        typeof att === "string"
                            ? att
                            : att?.attachment ??
                            att?.filename ??
                            att?.attachmentLink ??
                            att?.path ??
                            "";
                    if (!path) return null;
                    return { id: att?._id, path, name: prettifyAttachmentName(path) };
                })
                .filter(Boolean) as ExistingAttachment[]
        );
    }, [normalizedDefaults, reset]);

    useEffect(() => {
        setAppGroupOptions(
            applicationGroups
                ?.filter((g) => g?._id && g?.appGroup)
                .map((g) => ({ text: g.appGroup, value: g._id })) || []
        );
    }, [applicationGroups]);

    useEffect(() => {
        setAppModuleOptions(
            appModules
                ?.filter((m) => m?._id && m?.moduleName)
                .map((m) => ({ text: m.moduleName, value: m._id })) || []
        );
    }, [appModules]);

    const onFormSubmit: SubmitHandler<ApplicationFormInput> = async (data) => {
        const parsed: ApplicationFormOutput = getApplicationSchema.parse(data);
        const mapToIdObjects = (
            values: string[] | undefined,
            options: MultiSelectOption[]
        ): IdOrName[] => {
            if (!values?.length) return [];
            const optionMap = new Map(options.map((opt) => [opt.value, opt.text]));
            return values.map((val) => {
                const text = optionMap.get(val);
                if (text && text !== val) return { _id: val, name: text };
                return { name: text ?? val };
            });
        };

        const payload: ApplicationPayload = {
            ...parsed,
            notes: parsed.notes ?? "",
            applicationRoles: mapToIdObjects(parsed.applicationRoles, roleOptions),
            applicationGroups: mapToIdObjects(parsed.applicationGroups, appGroupOptions),
            applicationServiceRequestTypes: parsed.applicationServiceRequestTypes || [],
            applicationModules: mapToIdObjects(parsed.applicationModules, appModuleOptions),
            departments: mapToIdObjects(
                parsed.departments,
                departments.map((d) => ({ text: d.departmentName, value: d._id }))
            ),
            attachments: existingAttachments.map((att) => att.path),
        };

        try {
            toggleLoading(true);
            await onSubmit(payload, attachments, existingAttachments.map((att) => att.path));
        } finally {
            toggleLoading(false);
        }
    };




    const appendUnique = (current: string[] | undefined, next: string) =>
        current?.includes(next) ? current : [...(current || []), next];

    const requestRemoveExistingAttachment = (idx: number) => {
        setConfirmRemoveIdx(idx);
        setIsConfirmModalOpen(true);
    };

    const resetConfirmState = () => {
        setConfirmRemoveIdx(null);
        setIsConfirmModalOpen(false);
    };

    const confirmRemoveExistingAttachment = async () => {
        if (confirmRemoveIdx === null) return;
        setExistingAttachments((prev) => prev.filter((_, removeIdx) => removeIdx !== confirmRemoveIdx));
        resetConfirmState();
    };

    return (
        <>
            {/* Remove max-h-screen to allow full height scrolling when validation errors occur */}
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
                                        options={roleOptions}
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
                                            const optionToAdd = { text: newOption.text, value: newOption.text };
                                            setAppGroupOptions((prev) =>
                                                prev.find((opt) => opt.value === optionToAdd.value)
                                                    ? prev
                                                    : [...prev, optionToAdd]
                                            );
                                            field.onChange(appendUnique(field.value, optionToAdd.value));
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
                                        options={serviceRequestOptions}
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
                                            const optionToAdd = { text: newOption.text, value: newOption.text };
                                            setAppModuleOptions((prev) =>
                                                prev.find((opt) => opt.value === optionToAdd.value)
                                                    ? prev
                                                    : [...prev, optionToAdd]
                                            );
                                            field.onChange(appendUnique(field.value, optionToAdd.value));
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
                                    <SelectDropdown
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                        options={workflows.map((w) => ({
                                            label: w.workflowName,
                                            value: w._id,
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
                            <Label htmlFor="applicationSystemOwner" required>{t("gxpSystemOwner")}</Label>
                            <Controller
                                name="applicationSystemOwner"
                                control={control}
                                render={({ field }) => (
                                    <SelectDropdown
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                        options={users.map((u) => ({
                                            label: u.fullName,
                                            value: u._id,
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
                            <Label htmlFor="applicationProcessOwner" required>{t("gxpProcessOwner")}</Label>
                            <Controller
                                name="applicationProcessOwner"
                                control={control}
                                render={({ field }) => (
                                    <SelectDropdown
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                        options={users.map((u) => ({
                                            label: u.fullName,
                                            value: u._id,
                                        }))}
                                        placeholder={t("select", { entity: t("gxpProcessOwner") })}
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
                            <Label htmlFor="supplier" required>{t("supplier")}</Label>
                            <Controller
                                name="supplier"
                                control={control}
                                render={({ field }) => (
                                    <SelectDropdown
                                        value={field.value ?? ""}
                                        onChange={field.onChange}
                                        options={suppliers.map((s) => ({
                                            label: s.supplierName,
                                            value: s._id,
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

                        {/* Attachments */}
                        <div className="col-span-2">
                            <Label htmlFor="attachments">
                                {t("attachments", { defaultValue: t("trainingEvidence") ?? "Attachments" })}
                            </Label>
                            {existingAttachments?.length ? (
                                <div className="mb-3 space-y-2">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {t("previousUploads", { defaultValue: "Previously uploaded" })} ({existingAttachments.length})
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
                                                        {(attachment?.path?.split(".").pop() || "file").toUpperCase().slice(0, 4)}
                                                    </div>
                                                )}
                                                <span className="text-xs text-gray-800 dark:text-gray-100 max-w-[220px] truncate">
                                                    {attachment.name}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => requestRemoveExistingAttachment(idx)}
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
                                    defaultValue: "Upload documents/images. Audio/video not allowed.",
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

            <Modal
                isOpen={isConfirmModalOpen}
                onClose={resetConfirmState}
                className="max-w-md"
                showCloseButton={false}
            >
                <div className="p-5 flex flex-col gap-4">
                    <p className="text-gray-900 dark:text-gray-100 text-sm">
                        {t("deleteEntityPrompt", { entityName: "file" })}
                    </p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={resetConfirmState}>
                            {t("cancel")}
                        </Button>
                        <Button variant="destructive" onClick={confirmRemoveExistingAttachment}>
                            {t("confirm", { defaultValue: "Confirm" })}
                        </Button>
                    </div>
                </div>
            </Modal>

        </>
    );
};

export default CreateApplicationModal;
