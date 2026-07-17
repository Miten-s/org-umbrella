import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";
import FileUpload from "@/components/common/form/input/FileUpload";
import Switch from "@/components/common/form/switch/Switch";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import AsyncSelect from "@/components/data/AsyncSelect";
import { useEnvironmentOptions } from "@/pages/gxp-service/environments/Environment.queries";
import { useAssignmentGroupOptions } from "@/pages/gxp-service/assignment-groups/AssignmentGroup.queries";
import { useWorkflowOptions } from "@/pages/gxp-service/workflows/Workflow.queries";
import { useSupplierOptions } from "@/pages/gxp-service/suppliers/Supplier.queries";
import { useModuleOptions } from "@/pages/gxp-service/application-software-module/Module.queries";
import { useUserOptions } from "@/pages/system-it-admin/users/User.queries";
import { useLocationOptions } from "@/pages/system-it-admin/locations/Location.queries";
import { useDepartmentOptions } from "@/pages/system-it-admin/departments/Department.queries";
import { useApplicationRoleOptions } from "./ApplicationRole.options";
import { useApplicationGroupOptions } from "./ApplicationGroup.options";
import { useServiceTypeOptions } from "./ServiceType.options";
import { applicationSchema, type ApplicationFormValues } from "./GxpApplication.schema";
import type { GxpApplication } from "./GxpApplication.types";
import type { AsyncOption } from "@/lib/query/listTypes";

export type ApplicationFormMode = "create" | "edit" | "view";

interface Props {
  mode?: ApplicationFormMode;
  initialData?: GxpApplication | null;
  onClose: () => void;
  onSubmit: (values: ApplicationFormValues, newFiles: File[], existingAttachments: string[]) => Promise<void> | void;
  submitting?: boolean;
}

// --- ref → id / seed helpers ---
const refId = (v: any): string => (!v ? "" : typeof v === "string" ? v : String(v.id ?? v._id ?? ""));
const refIds = (v: any): string[] => (Array.isArray(v) ? v.map(refId).filter(Boolean) : []);
const seedOne = (v: any, label: (x: any) => string): AsyncOption[] | undefined => {
  if (!v || typeof v !== "object") return undefined;
  const id = v.id ?? v._id;
  const l = label(v);
  return id && l ? [{ value: String(id), label: l }] : undefined;
};
const seedMany = (v: any, label: (x: any) => string): AsyncOption[] | undefined =>
  Array.isArray(v)
    ? v.map((x) => ({ value: String(x?.id ?? x?._id ?? ""), label: label(x) })).filter((o) => o.value)
    : undefined;
const ownerLabel = (u: any) => String(u?.fullName ?? u?.name ?? "");

const GxpApplicationForm = ({ mode = "create", initialData, onClose, onSubmit, submitting = false }: Props) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const initialExisting: string[] = Array.isArray(initialData?.attachments)
    ? initialData!.attachments.map((a: any) => (typeof a === "string" ? a : (a?.name ?? a?.url ?? ""))).filter(Boolean)
    : [];
  const [existingAttachments, setExistingAttachments] = useState<string[]>(initialExisting);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      applicationName: initialData?.applicationName ?? "",
      applicationType: initialData?.applicationType ?? "GxP",
      applicationEnvironment: refId(initialData?.applicationEnvironment),
      group: refId(initialData?.group),
      assignmentGroup: refId(initialData?.assignmentGroup),
      applicationRoles: refIds(initialData?.applicationRoles),
      applicationGroups: refIds(initialData?.applicationGroups),
      applicationServiceRequestTypes: refIds(initialData?.applicationServiceRequestTypes),
      applicationModules: refIds(initialData?.applicationModules),
      applicationWorkflow: refId(initialData?.applicationWorkflow),
      applicationSystemOwner: refId(initialData?.applicationSystemOwner),
      applicationProcessOwner: refId(initialData?.applicationProcessOwner),
      supplier: refId(initialData?.supplier),
      departments: refIds(initialData?.departments),
      notes: initialData?.notes ?? "",
      attachments: initialExisting,
      status: initialData?.status ?? "enabled"
    }
  });

  const busy = submitting || isSubmitting;
  const submit = (values: ApplicationFormValues) =>
    onSubmit({ ...values, attachments: existingAttachments }, newFiles, existingAttachments);

  const err = (name: keyof ApplicationFormValues) =>
    errors[name] ? <p className="mt-1 text-xs text-red-500">{errors[name]?.message as string}</p> : null;

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(submit)} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly ? t("view", { entity: t("gxpApplications") }) : initialData ? t("update", { entity: t("gxpApplications") }) : t("create", { entity: t("gxpApplications") })}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label required>{t("applicationName")}</Label>
            <Input {...register("applicationName")} disabled={isReadOnly} error={!!errors.applicationName} hint={errors.applicationName?.message} />
          </div>

          <div>
            <Label required>{t("applicationType")}</Label>
            <Controller name="applicationType" control={control} render={({ field }) => (
              <SelectDropdown disabled={isReadOnly} value={field.value} onChange={field.onChange}
                options={[{ label: "GxP", value: "GxP" }, { label: "Non-GxP", value: "Non-GxP" }]}
                placeholder={t("select", { entity: t("applicationType") })} />
            )} />
            {err("applicationType")}
          </div>

          <div>
            <Label required>{t("applicationEnvironment")}</Label>
            <Controller name="applicationEnvironment" control={control} render={({ field }) => (
              <AsyncSelect useOptions={useEnvironmentOptions} value={field.value} onChange={field.onChange} disabled={isReadOnly}
                error={!!errors.applicationEnvironment} placeholder={t("select", { entity: t("environment") })}
                initialSelectedOptions={seedOne(initialData?.applicationEnvironment, (e) => String(e.environmentName ?? ""))} />
            )} />
            {err("applicationEnvironment")}
          </div>

          <div>
            <Label required>{t("groupLocation", { defaultValue: "Group/Location" })}</Label>
            <Controller name="group" control={control} render={({ field }) => (
              <AsyncSelect useOptions={useLocationOptions} value={field.value} onChange={field.onChange} disabled={isReadOnly}
                error={!!errors.group} placeholder={t("select", { entity: t("location") })}
                initialSelectedOptions={seedOne(initialData?.group, (g) => String(g.locationName ?? g.name ?? ""))} />
            )} />
            {err("group")}
          </div>

          <div>
            <Label required>{t("gxpAssignmentGroups")}</Label>
            <Controller name="assignmentGroup" control={control} render={({ field }) => (
              <AsyncSelect useOptions={useAssignmentGroupOptions} value={field.value} onChange={field.onChange} disabled={isReadOnly}
                error={!!errors.assignmentGroup} placeholder={t("select", { entity: t("assignmentGroup") })}
                initialSelectedOptions={seedOne(initialData?.assignmentGroup, (a) => String(a.groupName ?? ""))} />
            )} />
            {err("assignmentGroup")}
          </div>

          <div>
            <Label required>{t("applicationWorkflow")}</Label>
            <Controller name="applicationWorkflow" control={control} render={({ field }) => (
              <AsyncSelect useOptions={useWorkflowOptions} value={field.value} onChange={field.onChange} disabled={isReadOnly}
                error={!!errors.applicationWorkflow} placeholder={t("select", { entity: t("workflow") })}
                initialSelectedOptions={seedOne(initialData?.applicationWorkflow, (w) => String(w.workflowName ?? ""))} />
            )} />
            {err("applicationWorkflow")}
          </div>

          <div>
            <Label required>{t("gxpSystemOwner")}</Label>
            <Controller name="applicationSystemOwner" control={control} render={({ field }) => (
              <AsyncSelect useOptions={useUserOptions} value={field.value} onChange={field.onChange} disabled={isReadOnly}
                error={!!errors.applicationSystemOwner} placeholder={t("select", { entity: t("user") })}
                initialSelectedOptions={seedOne(initialData?.applicationSystemOwner, ownerLabel)} />
            )} />
            {err("applicationSystemOwner")}
          </div>

          <div>
            <Label required>{t("gxpProcessOwner")}</Label>
            <Controller name="applicationProcessOwner" control={control} render={({ field }) => (
              <AsyncSelect useOptions={useUserOptions} value={field.value} onChange={field.onChange} disabled={isReadOnly}
                error={!!errors.applicationProcessOwner} placeholder={t("select", { entity: t("user") })}
                initialSelectedOptions={seedOne(initialData?.applicationProcessOwner, ownerLabel)} />
            )} />
            {err("applicationProcessOwner")}
          </div>

          <div>
            <Label required>{t("supplier")}</Label>
            <Controller name="supplier" control={control} render={({ field }) => (
              <AsyncSelect useOptions={useSupplierOptions} value={field.value} onChange={field.onChange} disabled={isReadOnly}
                error={!!errors.supplier} placeholder={t("select", { entity: t("supplier") })}
                initialSelectedOptions={seedOne(initialData?.supplier, (s) => String(s.supplierName ?? ""))} />
            )} />
            {err("supplier")}
          </div>

          <div>
            <Label>{t("gxpAppRoles")}</Label>
            <Controller name="applicationRoles" control={control} render={({ field }) => (
              <AsyncSelect multi allowCreate useOptions={useApplicationRoleOptions} value={field.value} onChange={field.onChange} disabled={isReadOnly}
                placeholder={t("select", { entity: t("gxpAppRoles") })}
                initialSelectedOptions={seedMany(initialData?.applicationRoles, (r) => String(r.role ?? r.name ?? r.roleName ?? ""))} />
            )} />
          </div>

          <div>
            <Label>{t("gxpAppGroups")}</Label>
            <Controller name="applicationGroups" control={control} render={({ field }) => (
              <AsyncSelect multi allowCreate useOptions={useApplicationGroupOptions} value={field.value} onChange={field.onChange} disabled={isReadOnly}
                placeholder={t("select", { entity: t("gxpAppGroups") })}
                initialSelectedOptions={seedMany(initialData?.applicationGroups, (g) => String(g.appGroup ?? ""))} />
            )} />
          </div>

          <div>
            <Label required>{t("gxpAppServiceRequestTypes")}</Label>
            <Controller name="applicationServiceRequestTypes" control={control} render={({ field }) => (
              <AsyncSelect multi allowCreate useOptions={useServiceTypeOptions} value={field.value} onChange={field.onChange} disabled={isReadOnly}
                placeholder={t("select", { entity: t("gxpAppServiceRequestTypes") })}
                initialSelectedOptions={seedMany(initialData?.applicationServiceRequestTypes, (s) => String(s.service ?? ""))} />
            )} />
            {err("applicationServiceRequestTypes")}
          </div>

          <div>
            <Label>{t("gxpAppModules")}</Label>
            <Controller name="applicationModules" control={control} render={({ field }) => (
              <AsyncSelect multi allowCreate useOptions={useModuleOptions} value={field.value} onChange={field.onChange} disabled={isReadOnly}
                placeholder={t("select", { entity: t("gxpAppModules") })}
                initialSelectedOptions={seedMany(initialData?.applicationModules, (m) => String(m.moduleName ?? ""))} />
            )} />
          </div>

          <div>
            <Label required>{t("gxpDepartments")}</Label>
            <Controller name="departments" control={control} render={({ field }) => (
              <AsyncSelect multi useOptions={useDepartmentOptions} value={field.value} onChange={field.onChange} disabled={isReadOnly}
                placeholder={t("select", { entity: t("department") })}
                initialSelectedOptions={seedMany(initialData?.departments, (d) => String(d.departmentName ?? ""))} />
            )} />
            {err("departments")}
          </div>

          <div className="md:col-span-2">
            <Label required>{t("notes")}</Label>
            <Controller name="notes" control={control} render={({ field }) => (
              <TextArea disabled={isReadOnly} value={field.value} onChange={field.onChange} error={!!errors.notes} hint={errors.notes?.message} />
            )} />
          </div>

          {/* Attachments */}
          <div className="md:col-span-2">
            <Label>{t("attachments")}</Label>
            {existingAttachments.length ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {existingAttachments.map((a) => (
                  <span key={a} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                    {a}
                    {!isReadOnly && (
                      <button type="button" className="opacity-70 hover:opacity-100" onClick={() => setExistingAttachments((prev) => prev.filter((x) => x !== a))}>×</button>
                    )}
                  </span>
                ))}
              </div>
            ) : null}
            {!isReadOnly && (
              <FileUpload
                value={newFiles}
                onChange={(files) => setNewFiles(files)}
                multiple={true}
                maxFiles={10}
                maxSizeMB={10}
                blockAudioVideo={true}
                title={t("attachments", { defaultValue: "Attachments" })}
                description={t("uploadDescription", {
                  defaultValue: "Upload documents/images. Audio/video not allowed."
                })}
              />
            )}
          </div>

          <div className="md:col-span-2">
            <Label>{t("status")}</Label>
            <Controller name="status" control={control} render={({ field }) => (
              <Switch checked={field.value === "enabled"} disabled={isReadOnly}
                onChange={(v: boolean) => field.onChange(v ? "enabled" : "disabled")}
                label={field.value === "enabled" ? t("enabled") : t("disabled")} />
            )} />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>{t("cancel")}</Button>
          {!isReadOnly ? <Button type="submit" variant="primary" loading={busy}>{t("save")}</Button> : null}
        </div>
      </form>
    </div>
  );
};

export default GxpApplicationForm;
