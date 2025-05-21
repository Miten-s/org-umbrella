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

interface CreateUserModalProps {
  onClose: () => void;
}

const CreateUserModal = ({ onClose }: CreateUserModalProps) => {
  const { register, handleSubmit, setValue, } = useForm();
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
        <h2 className="text-xl font-semibold">{t("createUser")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>User ID</Label>
            <Input {...register("userId", { maxLength: 10 })} />
          </div>

          <div>
            <Label>Full Name</Label>
            <Input {...register("fullName", { maxLength: 30 })} />
          </div>

          <div>
            <Label>Description</Label>
            <Input {...register("description", { maxLength: 50 })} />
          </div>

          <div className="relative">
            <Label>User Type</Label>
            <button
              type="button"
              onClick={toggleDropdown}
              className="input flex justify-between items-center"
            >
              {selectedUserType === "admin" ? "Admin User" : "Normal User"}
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.5 7l4.5 4.5L14.5 7z" />
              </svg>
            </button>
            <Dropdown isOpen={isUserTypeDropdownOpen} onClose={closeDropdown} className="absolute z-10 mt-1 w-full">
              <DropdownItem onItemClick={() => handleUserTypeSelect("normal")}>Normal User</DropdownItem>
              <DropdownItem onItemClick={() => handleUserTypeSelect("admin")}>Admin User</DropdownItem>
            </Dropdown>
          </div>

          <div>
            <Label>Email</Label>
            <Input type="email" {...register("email", { maxLength: 20 })} />
          </div>

          <div>
            <Label>Mobile Number</Label>
            <Input {...register("mobileNumber", { maxLength: 15 })} />
          </div>

          <div>
            <Label>Location / Group</Label>
            <Input {...register("locationGroup")} />
          </div>

          <div>
            <Label>Designation</Label>
            <Input {...register("designation")} />
          </div>

          <div>
            <Label>Department</Label>
            <Input {...register("department")} />
          </div>

          <div>
            <Label>Manager</Label>
            <Input {...register("manager")} />
          </div>

          <div>
            <Label>Created On</Label>
            <Input disabled value={dayjs().format("YYYY-MM-DD HH:mm:ss")} />
          </div>

          <div>
            <Label>Created By</Label>
            <Input disabled value="currentUserId" />
          </div>

          <div>
            <Label>Modified On</Label>
            <Input disabled value={dayjs().format("YYYY-MM-DD HH:mm:ss")} />
          </div>

          <div>
            <Label>Modified By</Label>
            <Input disabled value="currentUserId" />
          </div>

          <div>
            <Label>Modifiable</Label>
            <Checkbox checked={modifiable} onChange={setModifiable} label="Yes" />
          </div>

          <div>
            <Label>Training Completed</Label>
            <Checkbox checked={trainingCompleted} onChange={setTrainingCompleted} label="Yes" />
          </div>

          <div>
            <Label>Password</Label>
            <Input type="password" {...register("password")} />
          </div>

          <div>
            <Label>Confirm Password</Label>
            <Input type="password" {...register("confirmPassword")} />
          </div>

          <div>
            <Label>Password Expiry Date</Label>
            <Input type="date" defaultValue={dayjs().format("YYYY-MM-DD")} {...register("passwordExpiry")} />
          </div>

          <div className="md:col-span-2">
            <Label>Signature</Label>
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
