import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import Checkbox from "@/components/common/form/input/Checkbox";
import TextArea from "@/components/common/form/input/TextArea";
import MultiSelect from "@/components/common/form/MultiSelect";
import { getUserAdminSchema } from "@/lib/schema";
import { zodResolver } from '@hookform/resolvers/zod';
import Switch from "@/components/common/form/switch/Switch";

interface Role {
  _id: string;
  name: string;
  type: string;
}

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
  roles: Role[];
  locations: Location[];
  departments: Department[];
  designations: Designation[];
  onSubmit: (data: any) => Promise<void>;
  activeUser: any | null;
}

const CreateUserModal = ({ onClose, roles, locations, departments, designations, onSubmit, activeUser }: CreateUserModalProps) => {
  const { t } = useTranslation();
  const [showSignature, setShowSignature] = useState(false);
  const signatureRef = useRef<any>(null);
  const builtInRoles = useMemo(() => roles.filter(role => role.type === "Built_In" && role.name !== "Super Admin"), [roles]);
  const customRoles = useMemo(() => roles.filter(role => role.type !== "Built_In"), [roles]);

  const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(getUserAdminSchema(!!activeUser)),
    defaultValues: {
      fullName: activeUser?.name || '',
      email: activeUser?.email || '',
      mobileNumber: activeUser?.phone || '',
      locationGroup: activeUser?.location[0]?._id || '',
      designation: activeUser?.designation?._id || '',
      department: activeUser?.department?._id || '',
      userType: activeUser?.roles?.find((role: Role) => role.name === "Admin" || role.name === "User")?._id || builtInRoles[0]?._id,
      assignRole: activeUser?.roles?.filter((role: Role) => role.name !== "Admin" && role.name !== "User").map((role: Role) => role._id) || [],
      description: activeUser?.description || '',
      status: activeUser?.status === 'active' ? true : false,
      password: '',
      confirmPassword: '',
      modifiable: activeUser?.modifiable ?? false,
      trainingCompleted: activeUser?.trainingCompleted ?? false,
      signature: activeUser?.signature || '',
    }
  });

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setValue('signature', '');
    }
  };

  const handleSaveSignature = () => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      const trimmedDataURL = signatureRef.current.getTrimmedCanvas().toDataURL("image/png");
      setValue('signature', trimmedDataURL);
    }
  };

  // Watch for role changes to determine if user is admin
  const userType = watch("userType") as string;
  const isAdmin = useMemo(() => {
    if (activeUser) {
      return activeUser.roles?.some((role: Role) => role.name === 'Admin') || false;
    }
    return userType === builtInRoles.find(role => role.name === "Admin")?._id;
  }, [userType, builtInRoles, activeUser]);

  const handleFormSubmit = (data: any) => {
    const roles = [data.userType, ...(data.assignRole || [])];

    const payload: any = {
      username: data.fullName,
      name: data.fullName,
      email: data.email,
      roles,
      status: data.status ? "active" : "disabled",
    };

    if (!activeUser && (data.password || data.confirmPassword)) {
      payload.password = data.password;
    }

    if (!isAdmin) {
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

    onSubmit(payload);
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">{activeUser ? t("update", { entity: t("user") }) : t("create", { entity: t("user") })}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label required>{t("fullName")}</Label>
            <Input
              {...register("fullName")}
              error={!!errors.fullName}
              hint={errors.fullName?.message as string}
              maxLength={30}
            />
          </div>

          <div>
            <Label htmlFor="email" required>{t("email")}</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              disabled={!!activeUser}
              error={!!errors.email}
              hint={errors.email?.message as string}
              maxLength={30}
            />
          </div>

          <div>
            <Label htmlFor="assignRole">{t("assignRoles")}</Label>
            <Controller
              name="assignRole"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={customRoles.map(role => ({ text: role.name, value: role._id }))}
                  label={t("selectRoles")}
                  onChange={field.onChange}
                  defaultSelected={field.value}
                />
              )}
            />
            {errors.assignRole && <p className="text-red-500 text-xs mt-1">{errors.assignRole.message as string}</p>}
          </div>


          {/* Password Fields */}
          <div>
            <Label htmlFor="password" required>{t("password")}</Label>
            <Input
              id="password"
              type="password"
              disabled={!!activeUser}
              {...register("password")}
              error={!!errors.password}
              hint={errors.password?.message as string}
              maxLength={20}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" required>{t("confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              disabled={!!activeUser}
              {...register("confirmPassword")}
              error={!!errors.confirmPassword}
              hint={errors.confirmPassword?.message as string}
              maxLength={20}
            />
          </div>


          <div>
            <Label htmlFor="userType" required>{t("userType")}</Label>
            <Controller
              name="userType"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="input w-full"
                >
                  {builtInRoles?.map(role => (
                    <option key={role._id} value={role._id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.userType && <p className="text-red-500 text-xs mt-1">{errors.userType.message as string}</p>}
          </div>

          <div>
            <Label htmlFor="status" className="whitespace-nowrap">Status</Label>
            <Controller
              name="status"
              control={control}
              defaultValue={true}
              render={({ field: { value, onChange } }) => (
                <Switch
                  label=""
                  checked={value ?? false}
                  onChange={onChange}
                />
              )}
            />
          </div>
          {/* User Specific Fields */}
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
                        onChange={onChange}
                        label={t("yes")}
                      />
                    )}
                  />
                  {errors.modifiable && <p className="text-red-500 text-xs mt-1">{errors.modifiable.message as string}</p>}
                </div>
                <div>
                  <Label>{t("trainingCompleted")}</Label>
                  <Controller
                    name="trainingCompleted"
                    control={control}
                    render={({ field: { value, onChange } }) => (
                      <Checkbox
                        checked={value ?? false}
                        onChange={onChange}
                        label={t("yes")}
                      />
                    )}
                  />
                  {errors.trainingCompleted && <p className="text-red-500 text-xs mt-1">{errors.trainingCompleted.message as string}</p>}
                </div>
              </div>

              <div>
                <Label>{t("mobileNumber")}</Label>
                <Input
                  {...register("mobileNumber")}
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
                    <select
                      {...field}
                      className="input w-full"
                    >
                      <option value="">{t("select", { entity: t("location") })}</option>
                      {locations.map(loc => (
                        <option key={loc._id} value={loc._id}>
                          {loc.locationName}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.locationGroup && <p className="text-red-500 text-xs mt-1">{errors.locationGroup.message as string}</p>}
              </div>

              <div>
                <Label required>{t("designation")}</Label>
                <Controller
                  name="designation"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="input w-full"
                    >
                      <option value="">{t("select", { entity: t("designation") })}</option>
                      {designations.map(des => (
                        <option key={des._id} value={des._id}>
                          {des.designationName}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation.message as string}</p>}
              </div>

              <div>
                <Label required>{t("department")}</Label>
                <Controller
                  name="department"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      className="input w-full"
                    >
                      <option value="">{t("select", { entity: t("department") })}</option>
                      {departments.map(dept => (
                        <option key={dept._id} value={dept._id}>
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message as string}</p>}
              </div>

              <div className="md:col-span-2">
                <Label>{t("description")}</Label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextArea
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message as string}</p>}
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    checked={showSignature}
                    onChange={(e) => setShowSignature(e)}
                    label="Add Signature"
                  />
                </div>

                {showSignature && (
                  <div className="mt-4">
                    <Label required>Signature</Label>
                    <div className="rounded-xl border shadow-sm p-4 bg-white">
                      <div className="w-full h-[200px] border rounded-lg">
                        <SignatureCanvas
                          ref={signatureRef}
                         
                          penColor="black"
                        />
                      </div>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleClearSignature}
                        >
                          Clear
                        </Button>
                        <Button
                          type="button"
                          onClick={handleSaveSignature}
                        >
                          Save Signature
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

export default CreateUserModal;
