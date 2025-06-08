import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useMemo, useState, useEffect } from "react";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import Checkbox from "@/components/common/form/input/Checkbox";
import SignatureCanvas from "@/components/common/Signature";
import TextArea from "@/components/common/form/input/TextArea";
import MultiSelect from "@/components/common/form/MultiSelect";
import { ChevronDownIcon } from "@/public/icons";
import { getUserAdminSchema } from "@/lib/schema";
import { zodResolver } from '@hookform/resolvers/zod';
import Switch from "@/components/common/form/switch/Switch";

interface Option {
  value: string;
  text: string;
  type?: string;
  name?: string;
}

interface CreateUserModalProps {
  onClose: () => void;
  roles: Option[];
  locations: Option[];
  departments: Option[];
  designations: Option[];
  onSubmit: (data: any) => Promise<void>;
  activeUser: any | null;
}

const CreateUserModal = ({ onClose, roles, locations, departments, designations, onSubmit, activeUser }: CreateUserModalProps) => {
  const { t } = useTranslation();
  const builtInRoles = useMemo(() => roles.filter(role => role.type === "Built_In" && role.text !== "Super Admin"), [roles]);
  const customRoles = useMemo(() => roles.filter(role => role.type !== "Built_In"), [roles]);
  console.log("CreateUserModal rendered with activeUser:", activeUser);
  console.log("builtInRoles:", builtInRoles);
  // State for dropdowns
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Option | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Option | null>(null);
  const [selectedDesignation, setSelectedDesignation] = useState<Option | null>(null);
  const [modifiable, setModifiable] = useState(false);
  const [trainingCompleted, setTrainingCompleted] = useState(false);

  // Initialize form values when activeUser changes
  useEffect(() => {
    if (activeUser) {
      // Set other dropdown values
      setSelectedLocation(locations.find(loc => loc.value === activeUser.location) || null);
      setSelectedDepartment(departments.find(dept => dept.value === activeUser.department) || null);
      setSelectedDesignation(designations.find(desig => desig.value === activeUser.designation) || null);

      // Set checkbox values
      setModifiable(activeUser.modifiable ?? false);
      setTrainingCompleted(activeUser.trainingCompleted ?? false);
    } else {
      // Reset all values for new user
      setSelectedLocation(null);
      setSelectedDepartment(null);
      setSelectedDesignation(null);
      setModifiable(false);
      setTrainingCompleted(false);
    }
  }, [activeUser, locations, departments, designations]);

  const { register, handleSubmit, setValue, control, watch, formState: { errors } } = useForm({
    resolver: zodResolver(getUserAdminSchema(!!activeUser)),
    defaultValues: {
      fullName: activeUser?.name || '',
      email: activeUser?.email || '',
      mobileNumber: activeUser?.phone || '',
      locationGroup: activeUser?.location || '',
      designation: activeUser?.designation || '',
      department: activeUser?.department || '',
      userType: activeUser?.roles?.find((role: any) => role.type === "Built_In")?._id || builtInRoles[0]?.value,
      assignRole: activeUser?.roles?.filter((role: any) => role.type !== "Built_In").map((role: any) => role._id) || [],
      description: activeUser?.description || '',
      status: activeUser?.status === 'active' ? true : false,
      password: '',
      confirmPassword: '',
      modifiable: activeUser?.modifiable ?? false,
      trainingCompleted: activeUser?.trainingCompleted ?? false,
    }
  });

  // Watch for role changes to determine if user is admin
  const userType = watch("userType") as string;
  const isAdmin = useMemo(() => {
    if (activeUser) {
      return activeUser.roles?.some((role: any) => role.name === 'Admin') || false;
    }
    return userType === builtInRoles.find(role => role.text === "Admin")?.value;
  }, [userType, builtInRoles, activeUser]);

  const handleFormSubmit = (data: any) => {
    // Always include the user type role in the roles array
    const roles = [data.userType, ...(data.assignRole || [])];

    const payload: any = {
      username: data.fullName,
      name: data.fullName,
      email: data.email,
      roles: roles,
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
      payload.modifiable = modifiable;
      payload.trainingCompleted = trainingCompleted;
    }

    onSubmit(payload);
  };

  // Unified dropdown handler
  const handleDropdown = (type: string, value?: any) => {
    if (value) {
      switch (type) {
        case 'location':
          setSelectedLocation(value);
          setValue("locationGroup", value.value, { shouldValidate: true });
          break;
        case 'department':
          setSelectedDepartment(value);
          setValue("department", value.value, { shouldValidate: true });
          break;
        case 'designation':
          setSelectedDesignation(value);
          setValue("designation", value.value, { shouldValidate: true });
          break;
      }
    }
    setOpenDropdown(openDropdown === type ? null : type);
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
            <Label htmlFor="userType" required>{t("userType")}</Label>
            <Controller
              name="userType"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="input w-full"
                >
                  {builtInRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.text}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.userType && <p className="text-red-500 text-xs mt-1">{errors.userType.message as string}</p>}
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
            <Label htmlFor="assignRole">{t("assignRoles")}</Label>
            <Controller
              name="assignRole"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={customRoles}
                  label={t("selectRoles")}
                  onChange={field.onChange}
                  defaultSelected={field.value}
                />
              )}
            />
            {errors.assignRole && <p className="text-red-500 text-xs mt-1">{errors.assignRole.message as string}</p>}
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
                  checked={value}
                  onChange={onChange}
                />
              )}
            />
          </div>
          {/* User Specific Fields */}
          {!isAdmin && (
            <>
              <div>
                <Label>{t("mobileNumber")}</Label>
                <Input
                  {...register("mobileNumber")}
                  error={!!errors.mobileNumber}
                  hint={errors.mobileNumber?.message as string}
                  maxLength={12}
                />
              </div>

              <div className="relative md:col-span-1">
                <Label required>{t("locationGroup")}</Label>
                <button
                  type="button"
                  onClick={() => handleDropdown('location')}
                  className={`input w-full flex justify-between items-center ${!selectedLocation && errors.locationGroup ? 'border-red-500' : ''}`}
                >
                  <span className="text-theme-sm dark:text-gray-400">
                    {selectedLocation ? selectedLocation.text : t("select", { entity: t("location") })}
                  </span>
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </button>
                <Dropdown
                  isOpen={openDropdown === 'location'}
                  onClose={() => setOpenDropdown(null)}
                  className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900"
                >
                  {locations.map(loc => (
                    <DropdownItem key={loc.value} onItemClick={() => handleDropdown('location', loc)}>
                      {loc.text}
                    </DropdownItem>
                  ))}
                  {locations.length === 0 && (
                    <DropdownItem onItemClick={() => { }}>
                      {t('noLocationsAvailable')}
                    </DropdownItem>
                  )}
                </Dropdown>
                {errors.locationGroup && <p className="text-red-500 text-xs mt-1">{errors.locationGroup.message as string}</p>}
              </div>

              <div className="relative md:col-span-1">
                <Label required>{t("designation")} </Label>
                <button
                  type="button"
                  onClick={() => handleDropdown('designation')}
                  className={`input w-full flex justify-between items-center ${!selectedDesignation && errors.designation ? 'border-red-500' : ''}`}
                >
                  <span className="text-theme-sm dark:text-gray-400">
                    {selectedDesignation ? selectedDesignation.text : t("select", { entity: t("designation") })}
                  </span>
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </button>
                <Dropdown
                  isOpen={openDropdown === 'designation'}
                  onClose={() => setOpenDropdown(null)}
                  className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900"
                >
                  {designations.map(des => (
                    <DropdownItem key={des.value} onItemClick={() => handleDropdown('designation', des)}>
                      {des.text}
                    </DropdownItem>
                  ))}
                  {designations.length === 0 && (
                    <DropdownItem onItemClick={() => { }}>
                      {t('noDesignationsAvailable')}
                    </DropdownItem>
                  )}
                </Dropdown>
                {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation.message as string}</p>}
              </div>

              <div className="relative md:col-span-1">
                <Label htmlFor="department" required>{t("department")}</Label>
                <button
                  type="button"
                  onClick={() => handleDropdown('department')}
                  className={`input w-full flex justify-between items-center ${!selectedDepartment && errors.department ? 'border-red-500' : ''}`}
                >
                  <span className="text-theme-sm dark:text-gray-400">
                    {selectedDepartment ? selectedDepartment.text : t("select", { entity: t("department") })}
                  </span>
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </button>
                <Dropdown
                  isOpen={openDropdown === 'department'}
                  onClose={() => setOpenDropdown(null)}
                  className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900"
                >
                  {departments.map(dept => (
                    <DropdownItem key={dept.value} onItemClick={() => handleDropdown('department', dept)}>
                      {dept.text}
                    </DropdownItem>
                  ))}
                  {departments.length === 0 && (
                    <DropdownItem onItemClick={() => { }}>
                      {t('noDepartmentsAvailable')}
                    </DropdownItem>
                  )}
                </Dropdown>
                {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message as string}</p>}
              </div>

              <div className="md:col-span-2">
                <Label>{t("description")}</Label>
                <TextArea
                  value={watch("description")}
                  onChange={(event) => setValue("description", event)}
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message as string}</p>}
              </div>

              <div className="flex gap-10">
                <div>
                  <Label>{t("modifiable")}</Label>
                  <Checkbox
                    checked={modifiable}
                    onChange={(checked) => {
                      setModifiable(checked);
                      setValue("modifiable", checked);
                    }}
                    label={t("yes")}
                  />
                  {errors.modifiable && <p className="text-red-500 text-xs mt-1">{errors.modifiable.message as string}</p>}
                </div>
                <div>
                  <Label>{t("trainingCompleted")}</Label>
                  <Checkbox
                    checked={trainingCompleted}
                    onChange={(checked) => {
                      setTrainingCompleted(checked);
                      setValue("trainingCompleted", checked);
                    }}
                    label={t("yes")}
                  />
                  {errors.trainingCompleted && <p className="text-red-500 text-xs mt-1">{errors.trainingCompleted.message as string}</p>}
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>{t("signature")}</Label>
                <SignatureCanvas />
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
