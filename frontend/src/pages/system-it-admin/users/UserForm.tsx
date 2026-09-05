import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/common/form/input/Checkbox";
import TextArea from "@/components/common/form/input/TextArea";
import Switch from "@/components/common/form/switch/Switch";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import AsyncSelect from "@/components/data/AsyncSelect";
import { CheckCircleIcon, CloseIcon } from "@/public/icons";
import { UserTypes } from "@/utils/common.constants";
import { getImageUrl } from "@/services/utils.service";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { getUserSchema, type UserFormValues } from "./User.schema";
import type { User } from "./User.types";
import { useLocationOptions } from "@/pages/system-it-admin/locations/Location.queries";
import { useDepartmentOptions } from "@/pages/system-it-admin/departments/Department.queries";
import { useDesignationOptions } from "@/pages/system-it-admin/designations/Designation.queries";
import type { AsyncOption } from "@/lib/query/listTypes";

export type UserFormMode = "create" | "edit" | "view" | "bulk-edit";

interface UserFormProps {
  mode?: UserFormMode;
  initialData: User | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: Record<string, unknown>) => void | Promise<void>;
  submitting?: boolean;
  /** Overrides the submit button's label — EditStepper uses this to say
   * "Next" on every step but the last, where the batch actually saves. */
  submitLabel?: string;
  /** Grays out the submit button without a spinner — EditStepper uses
   * this on the last step now that its own Save button lives outside it. */
  disabled?: boolean;
  /** Set on the `<form>` element so an outside button (EditStepper's
   * header Next/Save) can submit it via `<Button form={formId}>`. */
  formId?: string;
  /** " (2 of 5)" appended after the title when Bulk Edit is reviewing
   * more than one record — undefined otherwise. */
  stepLabel?: string;
}

/** Seed AsyncSelect with the label already present on the edited record. */
const seedOption = (ref?: { id: string } & Record<string, unknown>, labelKey?: string): AsyncOption[] | undefined =>
  ref && labelKey && typeof ref[labelKey] === "string"
    ? [{ value: ref.id, label: ref[labelKey] as string }]
    : undefined;

/**
 * User create/edit/view form (STANDARDS.md §1). Reference dropdowns use
 * AsyncSelect (never load-all); selected values are seeded from the user record
 * so labels show correctly when editing values deep in the dataset.
 */
const UserForm = ({
  mode = "create",
  initialData,
  onClose,
  onUnchanged,
  onSubmit,
  submitting = false,
  submitLabel,
  disabled = false,
  formId,
  stepLabel
}: UserFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const [showSignature, setShowSignature] = useState(false);
  const signatureRef = useRef<SignatureCanvas | null>(null);

  const initialValues: UserFormValues = {
    fullName: initialData?.fullName || initialData?.name || "",
    email: initialData?.email || "",
    mobileNumber: initialData?.phone || "",
    locationGroup: initialData?.location?.id || "",
    designation: initialData?.designation?.id || "",
    department: initialData?.department?.id || "",
    description: initialData?.description || "",
    status: initialData?.status === "active",
    password: "",
    confirmPassword: "",
    modifiable: initialData?.modifiable ?? false,
    trainingCompleted: initialData?.trainingCompleted ?? false,
    signature: initialData?.signature || "",
    userType: initialData?.userType || UserTypes.ADMIN
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<UserFormValues>({
    resolver: zodResolver(getUserSchema(!!initialData)),
    defaultValues: initialValues
  });

  const isAdmin = watch("userType") === UserTypes.ADMIN;
  const busy = submitting || isSubmitting;
  const passwordValue = watch("password") ?? "";
  const passwordChecks = [
    { label: "Uppercase letters (A-Z)", ok: /[A-Z]/.test(passwordValue) },
    { label: "Lowercase letters (a-z)", ok: /[a-z]/.test(passwordValue) },
    { label: "Numbers (0-9)", ok: /[0-9]/.test(passwordValue) },
    { label: "Symbols (!@#$%^&*)", ok: /[!@#$%^&*]/.test(passwordValue) },
    { label: "Minimum 8 characters", ok: passwordValue.length >= 8 }
  ];
  const signatureUrl = getImageUrl(initialData?.signature);

  const handleClearSignature = () => {
    signatureRef.current?.clear();
    setValue("signature", "");
  };

  const handleFormSubmit = async (data: UserFormValues) => {
    // Edit + nothing actually changed: skip the update call entirely — a no-op Save just closes.
    if ((mode === "edit" || mode === "bulk-edit") && isPayloadEqual(data, initialValues)) {
      (onUnchanged ?? onClose)();
      return;
    }

    let signature = "";
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      signature = signatureRef.current.toDataURL("image/png");
    }

    const payload: Record<string, unknown> = {
      fullName: data.fullName,
      name: data.fullName,
      email: data.email,
      userType: data.userType,
      status: data.status ? "active" : "disabled"
    };

    if (!initialData && data.password) payload.password = data.password;

    if (data.userType !== UserTypes.ADMIN) {
      payload.phone = data.mobileNumber;
      payload.location = data.locationGroup;
      payload.designation = data.designation;
      payload.department = data.department;
      payload.description = data.description;
      payload.modifiable = data.modifiable;
      payload.trainingCompleted = data.trainingCompleted;
      if (signature) payload.signature = signature;
    }

    await onSubmit(payload);
  };

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form id={formId} onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("user") })
            : initialData
              ? `${t("update", { entity: t("user") })}${stepLabel ?? ""}`
              : t("create", { entity: t("user") })}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label required>{t("fullName")}</Label>
            <Input
              {...register("fullName")}
              disabled={isReadOnly}
              error={!!errors.fullName}
              hint={errors.fullName?.message as string}
              maxLength={30}
            />
          </div>

          <div className="relative">
            <Label required>{t("userType")}</Label>
            <Controller
              name="userType"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  disabled={isReadOnly}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("selectEntity", { entity: t("userType") })}
                  options={Object.entries(UserTypes).map(([key, value]) => ({ label: key, value }))}
                />
              )}
            />
            {errors.userType && <p className="mt-1 text-xs text-red-500">{errors.userType.message as string}</p>}
          </div>

          <div>
            <Label required>{t("email")}</Label>
            <Input
              type="email"
              // Force lowercase: `lowercase` shows it lowercased as they type
              // (no cursor jump); setValueAs stores the lowercased value.
              className="lowercase"
              autoComplete="off"
              {...register("email", {
                setValueAs: (v) =>
                  typeof v === "string" ? v.toLowerCase() : v
              })}
              disabled={isReadOnly || !!initialData}
              error={!!errors.email}
              hint={errors.email?.message as string}
              maxLength={30}
            />
          </div>

          <div>
            <Label required={!initialData}>{t("password")}</Label>
            <Input
              type="password"
              autoComplete="new-password"
              disabled={isReadOnly || !!initialData}
              {...register("password")}
              error={!!errors.password}
              hint={errors.password?.message as string}
              maxLength={20}
            />
            {!initialData && !isReadOnly && (
              <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-300">
                {passwordChecks.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    {item.ok ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <CloseIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    )}
                    <span className={item.ok ? "text-gray-800 dark:text-gray-100" : ""}>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label required={!initialData}>{t("confirmPassword")}</Label>
            <Input
              type="password"
              autoComplete="new-password"
              disabled={isReadOnly || !!initialData}
              {...register("confirmPassword")}
              error={!!errors.confirmPassword}
              hint={errors.confirmPassword?.message as string}
              maxLength={20}
            />
          </div>

          <div>
            <Label className="whitespace-nowrap">Status</Label>
            <Controller
              name="status"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Switch label="" checked={value ?? false} disabled={isReadOnly} onChange={onChange} />
              )}
            />
          </div>

          {!isAdmin && (
            <>
              <div className="flex gap-10">
                <div>
                  <Label>{t("modifiable")}</Label>
                  <Controller
                    name="modifiable"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Checkbox checked={value ?? false} disabled={isReadOnly} onChange={onChange} label={t("yes")} />
                    )}
                  />
                </div>
                <div>
                  <Label>{t("trainingCompleted")}</Label>
                  <Controller
                    name="trainingCompleted"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Checkbox checked={value ?? false} disabled={isReadOnly} onChange={onChange} label={t("yes")} />
                    )}
                  />
                </div>
              </div>

              <div>
                <Label>{t("mobileNumber")}</Label>
                <Input
                  {...register("mobileNumber")}
                  disabled={isReadOnly}
                  error={!!errors.mobileNumber}
                  hint={errors.mobileNumber?.message as string}
                  maxLength={12}
                />
              </div>

              <div>
                <Label required>{t("locationGroup")}</Label>
                <Controller
                  name="locationGroup"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      useOptions={useLocationOptions}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isReadOnly}
                      error={!!errors.locationGroup}
                      placeholder={t("select", { entity: t("location") })}
                      initialSelectedOptions={seedOption(initialData?.location, "locationName")}
                    />
                  )}
                />
                {errors.locationGroup && (
                  <p className="mt-1 text-xs text-red-500">{errors.locationGroup.message as string}</p>
                )}
              </div>

              <div>
                <Label required>{t("designation")}</Label>
                <Controller
                  name="designation"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      useOptions={useDesignationOptions}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isReadOnly}
                      error={!!errors.designation}
                      placeholder={t("select", { entity: t("designation") })}
                      initialSelectedOptions={seedOption(initialData?.designation, "designationName")}
                    />
                  )}
                />
                {errors.designation && (
                  <p className="mt-1 text-xs text-red-500">{errors.designation.message as string}</p>
                )}
              </div>

              <div>
                <Label required>{t("department")}</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <AsyncSelect
                      useOptions={useDepartmentOptions}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isReadOnly}
                      error={!!errors.department}
                      placeholder={t("select", { entity: t("department") })}
                      initialSelectedOptions={seedOption(initialData?.department, "departmentName")}
                    />
                  )}
                />
                {errors.department && (
                  <p className="mt-1 text-xs text-red-500">{errors.department.message as string}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label>{t("description")}</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      disabled={isReadOnly}
                      value={field.value}
                      onChange={field.onChange}
                      className="border border-gray-300 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    />
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <div className="mb-2 flex items-center gap-2">
                  <Checkbox
                    checked={showSignature}
                    disabled={isReadOnly}
                    onChange={(value) => setShowSignature(value)}
                    label={signatureUrl ? "Replace Signature" : "Add Signature"}
                  />
                </div>

                {signatureUrl && (
                  <div className="mb-4">
                    <Label>Signature</Label>
                    <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                      <img
                        src={signatureUrl}
                        alt="Signature"
                        className="h-[120px] w-full max-w-[520px] object-contain"
                      />
                    </div>
                  </div>
                )}

                {showSignature && (
                  <div className="mt-4">
                    <Label required>Signature</Label>
                    <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                      <div className="h-[200px] w-full rounded-lg bg-gray-100 dark:bg-gray-700">
                        <SignatureCanvas
                          ref={signatureRef}
                          canvasProps={{ className: "w-full h-full" }}
                          penColor="black"
                        />
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button type="button" variant="outline" disabled={isReadOnly} onClick={handleClearSignature}>
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>
            {t("cancel")}
          </Button>
          {!isReadOnly ? (
            <Button type="submit" variant="primary" loading={busy} disabled={busy || disabled}>
              {submitLabel ?? t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default UserForm;
