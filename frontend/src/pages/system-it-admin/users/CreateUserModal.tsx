import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
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

interface Option {
  value: string;
  text: string;
  type?: string; 
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
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(getUserAdminSchema(!!activeUser)), // Apply schema validation
    defaultValues: {
      fullName: activeUser?.name || '',
      email: activeUser?.email || '',
      mobileNumber: activeUser?.mobileNumber || '',
      locationGroup: activeUser?.locationGroup || '',
      designation: activeUser?.designation || '',
      department: activeUser?.department || '',
      assignRole: activeUser?.roles?.map((role: any) => role._id) || [],
      description: activeUser?.description || '',
      password: '', 
      confirmPassword: '',
      passwordExpiry: activeUser?.passwordExpiry ? dayjs(activeUser.passwordExpiry).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"),
    }
  });
  const { t } = useTranslation();

  // Filter for built-in roles
  const builtInRoles = useMemo(() => roles.filter(role => role.type === "Built_In"), [roles]);
  const [isUserTypeDropdownOpen, setIsUserTypeDropdownOpen] = useState(false);
  // Use the ID of the selected built-in role
  const [selectedBuiltInRoleId, setSelectedBuiltInRoleId] = useState<string | null>(
    activeUser?.roles?.find((role: any) => role.builtIn)?._id || (builtInRoles.length > 0 ? builtInRoles[0].value : null) // Default to first built-in role if creating and available
  );

  const [modifiable, setModifiable] = useState(activeUser?.modifiable ?? false);
  const [trainingCompleted, setTrainingCompleted] = useState(activeUser?.trainingCompleted ?? false);

  // State for single select dropdowns
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Option | null>(
    locations.find(loc => loc.value === activeUser?.locationGroup) || null
  );
  const [isDepartmentDropdownOpen, setIsDepartmentDropdownOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Option | null>(
    departments.find(dept => dept.value === activeUser?.department) || null
  );
  const [isDesignationDropdownOpen, setIsDesignationDropdownOpen] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<Option | null>(
    designations.find(desig => desig.value === activeUser?.designation) || null
  );

  const toggleUserTypeDropdown = () => setIsUserTypeDropdownOpen(prev => !prev);
  const closeUserTypeDropdown = () => setIsUserTypeDropdownOpen(false);

  const toggleLocationDropdown = () => setIsLocationDropdownOpen(prev => !prev);
  const closeLocationDropdown = () => setIsLocationDropdownOpen(false);

  const toggleDepartmentDropdown = () => setIsDepartmentDropdownOpen(prev => !prev);
  const closeDepartmentDropdown = () => setIsDepartmentDropdownOpen(false);

  const toggleDesignationDropdown = () => setIsDesignationDropdownOpen(prev => !prev);
  const closeDesignationDropdown = () => setIsDesignationDropdownOpen(false);


  const handleBuiltInRoleSelect = (roleId: string) => {
    setSelectedBuiltInRoleId(roleId);
    closeUserTypeDropdown();
  };

  const handleLocationSelect = (location: Option) => {
    setSelectedLocation(location);
    setValue("locationGroup", location.value);
    closeLocationDropdown();
  };

  const handleDepartmentSelect = (department: Option) => {
    setSelectedDepartment(department);
    setValue("department", department.value);
    closeDepartmentDropdown();
  };

  const handleDesignationSelect = (designation: Option) => {
    setSelectedDesignation(designation);
    setValue("designation", designation.value);
    closeDesignationDropdown();
  };

  const handleFormSubmit = (data: any) => {
    // Combine selected built-in role ID with multi-select roles
    const finalAssignRoles = selectedBuiltInRoleId
      ? [...(data.assignRole || []), selectedBuiltInRoleId]
      : (data.assignRole || []);

    // Remove duplicate role IDs
    const uniqueAssignRoles = Array.from(new Set(finalAssignRoles));

    const payload: any = {
      // Map frontend fields to backend schema field names
      username: data.fullName, // Assuming username is derived from fullName or a separate field
      name: data.fullName,
      email: data.email,
      roles: uniqueAssignRoles,
      passwordExpiryTime: data.passwordExpiry || undefined, // Map passwordExpiry to passwordExpiryTime, use undefined if empty
    };

    // Include password fields only during creation if provided
    if (!activeUser && (data.password || data.confirmPassword)) {
        payload.password = data.password;
        // confirmPassword is for frontend validation only, not sent to backend
    }

    // Include user-specific fields only if userType is 'user'
    if (!isAdmin) { // isAdmin is derived from selectedBuiltInRoleId
      payload.phone = data.mobileNumber;
      payload.location = data.locationGroup; // Single ID for location
      payload.designation = data.designation; // Single ID for designation
      payload.department = data.department; // Single ID for department
      payload.description = data.description;
      payload.modifiable = data.modifiable;
      payload.trainingCompleted = data.trainingCompleted;
      // Signature handling might require more complex logic
      // payload.signature = data.signature; // Assuming signature is captured and needs to be sent
    }

    onSubmit(payload);
  };

  // Infer userType for toggling fields based on selected built-in role
  const isAdmin = builtInRoles.find(role => role.value === selectedBuiltInRoleId)?.text.toLowerCase().includes('admin') || false;

  // Effect to set initial selected built-in role based on activeUser
  useEffect(() => {
    if (activeUser) {
      const userBuiltInRole = activeUser.roles?.find((role: any) => role.type === 'Built_In'); // Check for type Built_In
      if (userBuiltInRole) {
        setSelectedBuiltInRoleId(userBuiltInRole._id);
      } else if (builtInRoles.length > 0) {
         // If editing a user without a built-in role, default to the first built-in role option
         setSelectedBuiltInRoleId(builtInRoles[0].value);
      } else {
         setSelectedBuiltInRoleId(null);
      }

       // Update other state values based on activeUser
       setModifiable(activeUser.modifiable ?? false);
       setTrainingCompleted(activeUser.trainingCompleted ?? false);
       setSelectedLocation(locations.find(loc => loc.value === activeUser.locationGroup) || null);
       setSelectedDepartment(departments.find(dept => dept.value === activeUser.department) || null);
       setSelectedDesignation(designations.find(desig => desig.value === activeUser.designation) || null);

       // Set initial value for assignRole MultiSelect, excluding the built-in role
       const otherRoles = activeUser.roles?.filter((role: any) => role.type !== 'Built_In').map((role: any) => role._id) || [];
       setValue("assignRole", otherRoles);

       // Set initial values for other fields using setValue (some are handled by defaultValues)
       setValue("fullName", activeUser.name);
       setValue("email", activeUser.email);
       setValue("mobileNumber", activeUser.phone); // Map activeUser.phone to mobileNumber
       setValue("passwordExpiry", activeUser.passwordExpiryTime ? dayjs(activeUser.passwordExpiryTime).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD")); // Map passwordExpiryTime
       setValue("description", activeUser.description);
       setValue("modifiable", activeUser.modifiable ?? false);
       setValue("trainingCompleted", activeUser.trainingCompleted ?? false);

    } else {
       // Reset state values and form for creating a new user
       setSelectedBuiltInRoleId(builtInRoles.length > 0 ? builtInRoles[0].value : null);
       setModifiable(false);
       setTrainingCompleted(false);
       setSelectedLocation(null);
       setSelectedDepartment(null);
       setSelectedDesignation(null);
       // Reset form values using setValue or reset (defaultValues handles initial empty state)
       setValue("fullName", '');
       setValue("email", '');
       setValue("mobileNumber", '');
       setValue("locationGroup", '');
       setValue("designation", '');
       setValue("department", '');
       setValue("assignRole", []);
       setValue("description", '');
       setValue("password", '');
       setValue("confirmPassword", '');
       setValue("passwordExpiry", dayjs().format("YYYY-MM-DD"));

    }

  }, [activeUser, builtInRoles, locations, departments, designations, setValue]);

  // Effect to update form values when activeUser changes (handled by defaultValues and the effect above)
  // No need for a separate effect here for setValue based on activeUser.


  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">{t(activeUser ? "editUser" : "createUser")}</h2>

        <div className="relative">
          <Label>{t("userType")}</Label>
          <button
            type="button"
            onClick={toggleUserTypeDropdown}
            className="input flex justify-between items-center"
            disabled={!!activeUser} // Disable user type change when editing
          >
            <span className="text-theme-sm dark:text-gray-400">
              {selectedBuiltInRoleId ? builtInRoles.find(role => role.value === selectedBuiltInRoleId)?.text : t("selectUserType")}
            </span>
            {!activeUser && <ChevronDownIcon className="ml-2 h-4 w-4" />}
          </button>
          <Dropdown
            isOpen={isUserTypeDropdownOpen && !activeUser}
            onClose={closeUserTypeDropdown}
            className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900"
          >
            {builtInRoles.map(role => (
              <DropdownItem key={role.value} onItemClick={() => handleBuiltInRoleSelect(role.value)}>
                {role.text}
              </DropdownItem>
            ))}
             {builtInRoles.length === 0 && (
              <DropdownItem onItemClick={() => {}}>
                {t('noBuiltInRolesAvailable')}
              </DropdownItem>
            )}
          </Dropdown>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t("fullName")}</Label>
            <Input {...register("fullName")} error={!!errors.fullName} hint={errors.fullName?.message as string} />
          </div>

          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              {...register("email")}
              disabled={!!activeUser}
              error={!!errors.email}
              hint={errors.email?.message as string}
            />
          </div>

          {!isAdmin && (
            <>
              <div>
                <Label>{t("mobileNumber")}</Label>
                <Input {...register("mobileNumber")} error={!!errors.mobileNumber} hint={errors.mobileNumber?.message as string} />
              </div>

              <div className="relative md:col-span-1">
                <Label>{t("locationGroup")}</Label>
                <button
                  type="button"
                  onClick={toggleLocationDropdown}
                  className="input w-full flex justify-between items-center"
                >
                  <span className="text-theme-sm dark:text-gray-400">
                    {selectedLocation ? selectedLocation.text : t("select", { entity: t("location") })}
                  </span>
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </button>
                <Dropdown
                  isOpen={isLocationDropdownOpen}
                  onClose={closeLocationDropdown}
                  className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900"
                >
                  {locations.map(loc => (
                    <DropdownItem key={loc.value} onItemClick={() => handleLocationSelect(loc)}>
                      {loc.text}
                    </DropdownItem>
                  ))}
                   {locations.length === 0 && (
                    <DropdownItem onItemClick={() => {}}>
                      {t('noLocationsAvailable')}
                    </DropdownItem>
                  )}
                </Dropdown>
                 {errors.locationGroup && <p className="text-red-500 text-xs mt-1">{errors.locationGroup.message as string}</p>}
              </div>

              <div className="relative md:col-span-1">
                <Label>{t("designation")}</Label>
                <button
                  type="button"
                  onClick={toggleDesignationDropdown}
                  className="input w-full flex justify-between items-center"
                >
                   <span className="text-theme-sm dark:text-gray-400">
                    {selectedDesignation ? selectedDesignation.text : t("select", { entity: t("designation") })}
                  </span>
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </button>
                <Dropdown
                  isOpen={isDesignationDropdownOpen}
                  onClose={closeDesignationDropdown}
                  className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900"
                >
                   {designations.map(desig => (
                    <DropdownItem key={desig.value} onItemClick={() => handleDesignationSelect(desig)}>
                      {desig.text}
                    </DropdownItem>
                  ))}
                   {designations.length === 0 && (
                    <DropdownItem onItemClick={() => {}}>
                      {t('noDesignationsAvailable')}
                    </DropdownItem>
                  )}
                </Dropdown>
                 {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation.message as string}</p>}
              </div>

              <div className="relative md:col-span-1">
                <Label htmlFor="department">{t("department")}</Label>
                <button
                  type="button"
                  onClick={toggleDepartmentDropdown}
                  className="input w-full flex justify-between items-center"
                >
                   <span className="text-theme-sm dark:text-gray-400">
                    {selectedDepartment ? selectedDepartment.text : t("select", { entity: t("department") })}
                  </span>
                  <ChevronDownIcon className="ml-2 h-4 w-4" />
                </button>
                 <Dropdown
                  isOpen={isDepartmentDropdownOpen}
                  onClose={closeDepartmentDropdown}
                  className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900"
                >
                   {departments.map(dept => (
                    <DropdownItem key={dept.value} onItemClick={() => handleDepartmentSelect(dept)}>
                      {dept.text}
                    </DropdownItem>
                  ))}
                   {departments.length === 0 && (
                    <DropdownItem onItemClick={() => {}}>
                      {t('noDepartmentsAvailable')}
                    </DropdownItem>
                  )}
                </Dropdown>
                 {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department.message as string}</p>}
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <Label htmlFor="assignRole">{t("assignRoles")}</Label>
            <MultiSelect
              options={roles} // Use all roles for multi-select
              label={t("selectRoles")}
              onChange={(selected) => setValue("assignRole", selected)}
              defaultSelected={activeUser?.roles?.map((role: any) => role._id) || []}
            />
             {errors.assignRole && <p className="text-red-500 text-xs mt-1">{errors.assignRole.message as string}</p>}
          </div>

          {!isAdmin && (
            <>
              <div>
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
                  <Checkbox checked={modifiable} onChange={setModifiable} label={t("yes")} />
                   {errors.modifiable && <p className="text-red-500 text-xs mt-1">{errors.modifiable.message as string}</p>}
                </div>
                <div>
                  <Label>{t("trainingCompleted")}</Label>
                  <Checkbox
                    checked={trainingCompleted}
                    {...register('trainingCompleted')}
                    onChange={setTrainingCompleted}
                    label={t("yes")}
                  />
                   {errors.trainingCompleted && <p className="text-red-500 text-xs mt-1">{errors.trainingCompleted.message as string}</p>}
                </div>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="password"> {t("password")}</Label>
            <Input
              id="password"
              type="password"
              disabled={!!activeUser}
              {...register("password")}
              error={!!errors.password}
              hint={errors.password?.message as string}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              type="password"
              disabled={!!activeUser}
              {...register("confirmPassword")}
              error={!!errors.confirmPassword}
              hint={errors.confirmPassword?.message as string}
            />
          </div>

          <div>
            <Label>{t("passwordExpiry")}</Label>
            <Input
              type="date"
              defaultValue={dayjs().format("YYYY-MM-DD")}
              {...register("passwordExpiry")}
              error={!!errors.passwordExpiry}
              hint={errors.passwordExpiry?.message as string}
            />
          </div>

          {!isAdmin && (
            <div className="md:col-span-2">
              <Label>{t("signature")}</Label>
              <SignatureCanvas />
              {/* Signature validation would need to be handled separately if required */}
            </div>
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
