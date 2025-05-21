import { useForm } from "react-hook-form";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useState } from "react";
import dayjs from "dayjs";

interface CreateDepartmentModalProps {
  onClose: () => void;
}

const CreateDepartmentModal = ({ onClose }: CreateDepartmentModalProps) => {
  const { register, handleSubmit, setValue } = useForm();
  const { t } = useTranslation();
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const handleManagerSelect = (manager: string) => {
    setSelectedManager(manager);
    setValue("departmentManager", manager);
    setIsManagerDropdownOpen(false);
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setValue("departmentLocation", location);
    setIsLocationDropdownOpen(false);
  };

  const onSubmit = async (data: any) => {
    console.log(data);
    // Send to API
    onClose();
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">{t("createDepartment")}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Department ID</Label>
            <Input {...register("departmentId", { maxLength: 20 })} />
          </div>

          <div>
            <Label>Department Name</Label>
            <Input {...register("departmentName", { maxLength: 50 })} />
          </div>

          <div className="relative">
            <Label>Department Manager</Label>
            <button
              type="button"
              onClick={() => setIsManagerDropdownOpen((prev) => !prev)}
              className="input flex justify-between items-center"
            >
              {selectedManager || t("selectManager")}
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.5 7l4.5 4.5L14.5 7z" />
              </svg>
            </button>
            <Dropdown
              isOpen={isManagerDropdownOpen}
              onClose={() => setIsManagerDropdownOpen(false)}
              className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-md"
            >
              {/* Replace these with actual users */}
              <DropdownItem onItemClick={() => handleManagerSelect("USR001 - John Doe")}>USR001 - John Doe</DropdownItem>
              <DropdownItem onItemClick={() => handleManagerSelect("USR002 - Jane Smith")}>USR002 - Jane Smith</DropdownItem>
            </Dropdown>
          </div>

          <div className="relative">
            <Label>Location/Group</Label>
            <button
              type="button"
              onClick={() => setIsLocationDropdownOpen((prev) => !prev)}
              className="input flex justify-between items-center"
            >
              {selectedLocation || t("selectLocation")}
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.5 7l4.5 4.5L14.5 7z" />
              </svg>
            </button>
            <Dropdown
              isOpen={isLocationDropdownOpen}
              onClose={() => setIsLocationDropdownOpen(false)}
              className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-md"
            >
              {/* Replace these with actual location options */}
              <DropdownItem onItemClick={() => handleLocationSelect("LOC01 - Mumbai")}>LOC01 - Mumbai</DropdownItem>
              <DropdownItem onItemClick={() => handleLocationSelect("LOC02 - Pune")}>LOC02 - Pune</DropdownItem>
            </Dropdown>
          </div>

          <div>
            <Label>Description</Label>
            <Input {...register("description", { maxLength: 100 })} />
          </div>

          {/* Metadata fields (disabled and auto-filled on save) */}
          <div>
            <Label>Created On</Label>
            <Input disabled value={dayjs().format("YYYY-MM-DD HH:mm")} />
          </div>

          <div>
            <Label>Created By</Label>
            <Input disabled value="currentUser" />
          </div>

          <div>
            <Label>Modified On</Label>
            <Input disabled value={dayjs().format("YYYY-MM-DD HH:mm")} />
          </div>

          <div>
            <Label>Modified By</Label>
            <Input disabled value="currentUser" />
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

export default CreateDepartmentModal;
