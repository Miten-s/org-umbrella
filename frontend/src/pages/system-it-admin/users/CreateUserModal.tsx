import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/common/form/input/Checkbox";
import TextArea from "@/components/common/form/input/TextArea";
// import MultiSelect from "@/components/common/form/MultiSelect";
import { getUserAdminSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import Switch from "@/components/common/form/switch/Switch";
import { UserTypes } from "@/utils/common.constants";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { CheckCircleIcon, CloseIcon } from "@/public/icons";
import { getImageUrl } from "@/services/utils.service";

// Requirement added on 15 March 2026:
// hide role assignment from this modal, but keep the previous code here for reference.
// interface Role {
//   _id: string;
//   name: string;
//   type: string;
// }

interface Location {
  _id: string;
  locationName: string;
}

interface Department {
  _id: string;
  departmentName: string;
}

interface Designation {
  _id: string;
  designationName: string;
}

interface CreateUserModalProps {
  onClose: () => void;
  roles?: unknown[];
  locations: Location[];
  departments: Department[];
  designations: Designation[];
  onSubmit: (data: any) => Promise<void>;
  activeUser: any | null;
  mode?: "create" | "edit" | "view";
}

const CreateUserModal = ({
  onClose,
  locations,
  departments,
  designations,
  onSubmit,
  activeUser,
  mode = "create"
}: CreateUserModalProps) => {
  const { t } = useTranslation();
  const [showSignature, setShowSignature] = useState(false);
  const signatureRef = useRef<any>(null);
  const isReadOnly = mode === "view";
  // const customRoles = useMemo(
  //   () => roles.filter((role) => role.type !== "Built_In"),
  //   [roles]
  // );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(getUserAdminSchema(!!activeUser)),
    defaultValues: {
      fullName: activeUser?.fullName || activeUser?.name || "",
      email: activeUser?.email || "",
      mobileNumber: activeUser?.phone || "",
      locationGroup: activeUser?.location?._id || "",
      designation: activeUser?.designation?._id || "",
      department: activeUser?.department?._id || "",
      // assignRole:
      //   activeUser?.roles
      //     ?.filter((role: Role) => role.name !== "Admin" && role.name !== "User")
      //     .map((role: Role) => role._id) || [],
      description: activeUser?.description || "",
      status: activeUser?.status === "active" ? true : false,
      password: "",
      confirmPassword: "",
      modifiable: activeUser?.modifiable ?? false,
      trainingCompleted: activeUser?.trainingCompleted ?? false,
      signature: activeUser?.signature || "",
      userType: activeUser?.userType || UserTypes.ADMIN
    }
  });

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setValue("signature", "");
    }
  };

  // Watch for role changes to determine if user is admin
  const isAdmin = watch("userType") === UserTypes.ADMIN;
  const passwordValue = watch("password") ?? "";
  const passwordChecks = [
    { label: "Uppercase letters (A-Z)", ok: /[A-Z]/.test(passwordValue) },
    { label: "Lowercase letters (a-z)", ok: /[a-z]/.test(passwordValue) },
    { label: "Numbers (0-9)", ok: /[0-9]/.test(passwordValue) },
    { label: "Symbols (!@#$%^&*)", ok: /[!@#$%^&*]/.test(passwordValue) },
    { label: "Minimum 8 characters", ok: passwordValue.length >= 8 }
  ];
  const signatureUrl = getImageUrl(activeUser?.signature);
  const handleFormSubmit = async (data: any) => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const trimmedDataURL = signatureRef.current.toDataURL("image/png");
      data.signature = trimmedDataURL;
    } else {
      data.signature = "";
    }

    // const userTypeRole = roles.find((role: Role) => role.name === data.userType);
    // const assignRoleIds = data.assignRole || [];

    const payload: any = {
      fullName: data.fullName,
      name: data.fullName,
      email: data.email,
      userType: data.userType,
      // roles: userTypeRole ? [userTypeRole._id, ...assignRoleIds] : [...assignRoleIds],
      status: data.status ? "active" : "disabled"
    };

    if (!activeUser && (data.password || data.confirmPassword)) {
      payload.password = data.password;
    }

    if (data.userType !== UserTypes.ADMIN) {
      payload.phone = data.mobileNumber;
      payload.location = data.locationGroup;
      payload.designation = data.designation;
      payload.department = data.department;
      payload.description = data.description;
      payload.modifiable = data.modifiable;
      payload.trainingCompleted = data.trainingCompleted;
      if (data.signature) {
        payload.signature = data.signature;
      }
    }

    await onSubmit(payload);
  };

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("user") })
            : activeUser
              ? t("update", { entity: t("user") })
              : t("create", { entity: t("user") })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="userType" required>
              {t("userType")}
            </Label>

            <Controller
              name="userType"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  disabled={isReadOnly}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                  }}
                  placeholder={t("selectEntity", { entity: t("userType") })}
                  options={Object.entries(UserTypes).map(([key, value]) => ({
                    label: key,
                    value: value
                  }))}
                />
              )}
            />

            {errors.userType && (
              <p className="text-red-500 text-xs mt-1">
                {errors.userType.message as string}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="email" required>
              {t("email")}
            </Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              disabled={isReadOnly || !!activeUser}
              error={!!errors.email}
              hint={errors.email?.message as string}
              maxLength={30}
            />
          </div>

          <div>
            {/*
              Requirement added on 15 March 2026:
              hide assign role from the user modal for now.

              <Label htmlFor="assignRole">{t("assignRoles")}</Label>
              <Controller
                name="assignRole"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={customRoles.map((role) => ({ text: role.name, value: role._id }))}
                    label={t("selectRoles")}
                    onChange={field.onChange}
                    defaultSelected={field.value}
                    countTooltipPlacement="left"
                  />
                )}
              />
              {errors.assignRole && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.assignRole.message as string}
                </p>
              )}
            */}
            <Label htmlFor="password" required>
              {t("password")}
            </Label>
            <Input
              id="password"
              type="password"
              disabled={isReadOnly || !!activeUser}
              {...register("password")}
              error={!!errors.password}
              hint={errors.password?.message as string}
              maxLength={20}
            />
            {!activeUser && !isReadOnly && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                {passwordChecks.map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    {item.ok ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <CloseIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    )}
                    <span
                      className={
                        item.ok ? "text-gray-800 dark:text-gray-100" : ""
                      }
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword" required>
              {t("confirmPassword")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              disabled={isReadOnly || !!activeUser}
              {...register("confirmPassword")}
              error={!!errors.confirmPassword}
              hint={errors.confirmPassword?.message as string}
              maxLength={20}
            />
          </div>

          <div>
            <Label htmlFor="status" className="whitespace-nowrap">
              Status
            </Label>
            <Controller
              name="status"
              control={control}
              defaultValue={true}
              render={({ field: { value, onChange } }) => (
                <Switch
                  label=""
                  checked={value ?? false}
                  disabled={isReadOnly}
                  onChange={onChange}
                />
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
                      <Checkbox
                        checked={value ?? false}
                        disabled={isReadOnly}
                        onChange={onChange}
                        label={t("yes")}
                      />
                    )}
                  />
                  {errors.modifiable && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.modifiable.message as string}
                    </p>
                  )}
                </div>

                <div>
                  <Label>{t("trainingCompleted")}</Label>
                  <Controller
                    name="trainingCompleted"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Checkbox
                        checked={value ?? false}
                        disabled={isReadOnly}
                        onChange={onChange}
                        label={t("yes")}
                      />
                    )}
                  />
                  {errors.trainingCompleted && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.trainingCompleted.message as string}
                    </p>
                  )}
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
                    <SelectDropdown
                      disabled={isReadOnly}
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      placeholder={t("select", { entity: t("location") })}
                      options={locations.map((loc) => ({
                        label: loc.locationName,
                        value: loc._id
                      }))}
                    />
                  )}
                />

                {errors.locationGroup && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.locationGroup.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label required>{t("designation")}</Label>
                <Controller
                  name="designation"
                  control={control}
                  render={({ field }) => (
                    <SelectDropdown
                      disabled={isReadOnly}
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      placeholder={t("select", { entity: t("designation") })}
                      options={designations.map((des) => ({
                        label: des.designationName,
                        value: des._id
                      }))}
                    />
                  )}
                />

                {errors.designation && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.designation.message as string}
                  </p>
                )}
              </div>

              <div>
                <Label required>{t("department")}</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <SelectDropdown
                      disabled={isReadOnly}
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      placeholder={t("select", { entity: t("department") })}
                      options={departments.map((dept) => ({
                        label: dept.departmentName,
                        value: dept._id
                      }))}
                    />
                  )}
                />

                {errors.department && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.department.message as string}
                  </p>
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
                      className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
                    />
                  )}
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description.message as string}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={showSignature}
                    disabled={isReadOnly}
                    onChange={(e) => setShowSignature(e)}
                    label={signatureUrl ? "Replace Signature" : "Add Signature"}
                  />
                </div>

                {signatureUrl && (
                  <div className="mb-4">
                    <Label>Signature</Label>
                    <div className="rounded-xl border shadow-sm p-4 bg-white dark:bg-gray-800 dark:border-gray-700">
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
                    <div className="rounded-xl border shadow-sm p-4 bg-white dark:bg-gray-800 dark:border-gray-700">
                      <div className="w-full h-[200px] rounded-lg bg-gray-100 dark:bg-gray-700">
                        <SignatureCanvas
                          ref={signatureRef}
                          canvasProps={{ className: "w-full h-full" }}
                          penColor="black"
                        />
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isReadOnly}
                          onClick={handleClearSignature}
                        >
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

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          {!isReadOnly ? (
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default CreateUserModal;
