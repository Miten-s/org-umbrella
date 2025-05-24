import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
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


interface Option {
  value: string;
  text: string;
}
interface CreateUserModalProps {
  onClose: () => void;
  roles: Option[];
}

const CreateUserModal = ({ onClose, roles }: CreateUserModalProps) => {
  const { register, handleSubmit, setValue, watch } = useForm();
  const { t } = useTranslation();

  const [isUserTypeDropdownOpen, setIsUserTypeDropdownOpen] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState("normal");
  const [modifiable, setModifiable] = useState(false);
  const [trainingCompleted, setTrainingCompleted] = useState(false);

  const toggleDropdown = () => setIsUserTypeDropdownOpen(prev => !prev);
  const closeDropdown = () => setIsUserTypeDropdownOpen(false);

  const handleUserTypeSelect = (type: string) => {
    setSelectedUserType(type);
    setValue("userType", type);
    closeDropdown();
  };

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      modifiable,
      trainingCompleted,
      createdOn: dayjs().toISOString(),
      createdBy: "currentUserId", // Replace with actual user ID
      modifiedOn: dayjs().toISOString(),
      modifiedBy: "currentUserId", // Replace with actual user ID
    };
    console.log(payload);
    onClose();
  };

  useEffect(() => {
    setValue("userType", selectedUserType);
  }, [selectedUserType, setValue]);

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">{t("create", { entity: t("user") })}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>{t("fullName")}</Label>
            <Input {...register("fullName", { maxLength: 30 })} />
          </div>

          <div>
            <Label>{t("description")}</Label>
            <TextArea
              value={watch("description")}
              onChange={(event) => setValue("description", event)}
            />
          </div>

          <div className="relative">
            <Label>{t("userType")}</Label>
            <button
              type="button"
              onClick={toggleDropdown}
              className="input flex justify-between items-center"
            >
              <span className="text-theme-sm dark:text-gray-400">
                {selectedUserType === "admin"
                  ? t("adminUser")
                  : t("normalUser")}
              </span>

              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.5 7l4.5 4.5L14.5 7z" />
              </svg>
            </button>
            <Dropdown
              isOpen={isUserTypeDropdownOpen}
              onClose={closeDropdown}
              className="absolute z-10 mt-1 w-full"
            >
              <DropdownItem onItemClick={() => handleUserTypeSelect("normal")}>
                {t("normalUser")}
              </DropdownItem>
              <DropdownItem onItemClick={() => handleUserTypeSelect("admin")}>
                {t("adminUser")}
              </DropdownItem>
            </Dropdown>
          </div>

          <div>
            <Label>{t("email")}</Label>
            <Input type="email" {...register("email", { maxLength: 20 })} />
          </div>

          <div>
            <Label>{t("mobileNumber")}</Label>
            <Input {...register("mobileNumber", { maxLength: 15 })} />
          </div>

          <div>
            <Label>{t("locationGroup")}</Label>
            <Input {...register("locationGroup")} />
          </div>

          <div>
            <Label>{t("designation")}</Label>
            <Input {...register("designation")} />
          </div>

          <div>
            <Label>{t("department")}</Label>
            <Input {...register("department")} />
          </div>

          <div>
            <Label>{t("manager")}</Label>
            <Input {...register("manager")} />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="assignRole">{t("assignRoles")}</Label>
            <MultiSelect
              options={roles}
              label="Multiple Select Options"
              onChange={(selected) => setValue("assignRole", selected)}
            />
          </div>

          <div>
            <Label>{t("modifiable")}</Label>
            <Checkbox checked={modifiable} onChange={setModifiable} label={t("yes")} />
          </div>

          <div>
            <Label>{t("trainingCompleted")}</Label>
            <Checkbox
              checked={trainingCompleted}
              onChange={setTrainingCompleted}
              label={t("yes")}
            />
          </div>

          <div>
            <Label>{t("password")}</Label>
            <Input type="password" {...register("password")} />
          </div>

          <div>
            <Label>{t("confirmPassword")}</Label>
            <Input type="password" {...register("confirmPassword")} />
          </div>

          <div>
            <Label>{t("passwordExpiry")}</Label>
            <Input
              type="date"
              defaultValue={dayjs().format("YYYY-MM-DD")}
              {...register("passwordExpiry")}
            />
          </div>

          <div className="md:col-span-2">
            <Label>{t("signature")}</Label>
            <SignatureCanvas />
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

export default CreateUserModal;
