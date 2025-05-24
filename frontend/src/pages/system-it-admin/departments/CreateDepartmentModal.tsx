import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useState } from "react";
import TextArea from "@/components/common/form/input/TextArea";
import { getDepartmentSchema } from "@/lib/schema";

interface CreateDepartmentModalProps {
  onClose: () => void;
}

type CreateDepartmentForm = z.infer<typeof getDepartmentSchema>;

const CreateDepartmentModal = ({ onClose }: CreateDepartmentModalProps) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateDepartmentForm>({
    resolver: zodResolver(getDepartmentSchema),
  });
  const [isManagerDropdownOpen, setIsManagerDropdownOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState<string>("");
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("");

  const handleManagerSelect = (manager: string) => {
    setSelectedManager(manager);
    setValue("departmentManager", manager, { shouldValidate: true });
    setIsManagerDropdownOpen(false);
  };

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
    setValue("departmentLocation", location, { shouldValidate: true });
    setIsLocationDropdownOpen(false);
  };


  const onSubmit = async (data: CreateDepartmentForm) => {
    console.log(data);
    onClose();
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">{t("create", { entity: t("department") })}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="departmentName" required>{t("departmentName")}</Label>
            <Input
              {...register("departmentName")}
              error={!!errors.departmentName}
              hint={errors.departmentName?.message}
            />

          </div>

          <div>
            <Label>{t("description")}</Label>
            <TextArea
              value={watch("description") || ""}
              onChange={(event) => setValue("description", event)}
            />
          </div>

          <div className="relative">
            <Label required>{t("departmentManager")}</Label>
            <input type="hidden" {...register("departmentManager")} />
            <button
              type="button"
              onClick={() => setIsManagerDropdownOpen((prev) => !prev)}
              className='input flex justify-between items-center'
            >
              <span className="text-theme-sm dark:text-gray-400">

                {selectedManager || t("select", { entity: t("departmentManager") })}
              </span>
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.5 7l4.5 4.5L14.5 7z" />
              </svg>
            </button>

            <Dropdown
              isOpen={isManagerDropdownOpen}
              onClose={() => setIsManagerDropdownOpen(false)}
              className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-md"
            >
              <DropdownItem onItemClick={() => handleManagerSelect("USR001 - John Doe")}>
                USR001 - John Doe
              </DropdownItem>
              <DropdownItem onItemClick={() => handleManagerSelect("USR002 - Jane Smith")}>
                USR002 - Jane Smith
              </DropdownItem>
            </Dropdown>

            {errors.departmentManager && (
              <p className="text-xs text-error-500 mt-1">{errors.departmentManager.message}</p>
            )}
          </div>

          <div className="relative">
            <Label required>{t("locationGroup")}</Label>
            <input type="hidden" {...register("departmentLocation")} />
            <button
              type="button"
              onClick={() => setIsLocationDropdownOpen((prev) => !prev)}
              className='input flex justify-between items-center'
            >
              <span className="text-theme-sm dark:text-gray-400">
                {selectedLocation || t("select", { entity: t("location") })}
              </span>
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.5 7l4.5 4.5L14.5 7z" />
              </svg>
            </button>

            <Dropdown
              isOpen={isLocationDropdownOpen}
              onClose={() => setIsLocationDropdownOpen(false)}
              className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-md"
            >
              <DropdownItem onItemClick={() => handleLocationSelect("LOC01 - Mumbai")}>
                LOC01 - Mumbai
              </DropdownItem>
              <DropdownItem onItemClick={() => handleLocationSelect("LOC02 - Pune")}>
                LOC02 - Pune
              </DropdownItem>
            </Dropdown>

            {errors.departmentLocation && (
              <p className="text-xs text-error-500 mt-1">{errors.departmentLocation.message}</p>
            )}
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
