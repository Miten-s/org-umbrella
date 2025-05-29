import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {  useState } from "react";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import TextArea from "@/components/common/form/input/TextArea";

import { getDepartmentSchema } from "@/lib/schema";
import { Location } from "@/types/common.types";

interface UserOption {
  _id: string;
  name: string;
}

interface CreateDepartmentModalProps {
  onClose: () => void;
  onSubmit: (data: CreateDepartmentForm) => void;
  initialData?: any;
  locations?: Location[];
  managers?: UserOption[];
}

type CreateDepartmentForm = z.infer<typeof getDepartmentSchema>;

const CreateDepartmentModal = ({
  onClose,
  onSubmit,
  initialData,
  locations = [],
  managers = [],
}: CreateDepartmentModalProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateDepartmentForm>({
    resolver: zodResolver(getDepartmentSchema),
    defaultValues: {
      departmentName: initialData?.departmentName || "",
      description: initialData?.description || "",
      departmentManager:
        typeof initialData?.departmentManager === "object"
          ? initialData?.departmentManager?._id
          : initialData?.departmentManager || "",
      departmentGroupLocation: initialData?.departmentGroupLocation || "",
    },
  });

  const description = useWatch({ control, name: "description" });
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const getManagerName = (id: string) =>
    managers.find((m) => m._id === id)?.name || "";
  const getLocationName = (id: string) =>
    locations.find((l) => l._id === id)?.locationName || "";

  const selectedManagerId = useWatch({ control, name: "departmentManager" });
  const selectedLocationId = useWatch({ control, name: "departmentGroupLocation" });

  const handleManagerSelect = (id: string) => {
    setValue("departmentManager", id, { shouldValidate: true });
    setManagerDropdownOpen(false);
  };

  const handleLocationSelect = (id: string) => {
    setValue("departmentGroupLocation", id, { shouldValidate: true });
    setLocationDropdownOpen(false);
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t(initialData ? "edit" : "create", { entity: t("department") })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="departmentName" required>
              {t("departmentName")}
            </Label>
            <Input
              {...register("departmentName")}
              error={!!errors.departmentName}
              hint={errors.departmentName?.message}
            />
          </div>

          <div>
            <Label>{t("description")}</Label>
            <TextArea
              value={description || ""}
              onChange={(val) => setValue("description", val)}
            />
          </div>

          <div className="relative">
            <Label required>{t("departmentManager")}</Label>
            <input type="hidden" {...register("departmentManager")} />
            <button
              type="button"
              onClick={() => setManagerDropdownOpen((prev) => !prev)}
              className="input flex justify-between items-center"
            >
              <span className="text-theme-sm dark:text-gray-400">
                {getManagerName(selectedManagerId) ||
                  t("select", { entity: t("departmentManager") })}
              </span>
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.5 7l4.5 4.5L14.5 7z" />
              </svg>
            </button>

            <Dropdown
              isOpen={managerDropdownOpen}
              onClose={() => setManagerDropdownOpen(false)}
              className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-md"
            >
              {managers.map((manager) => (
                <DropdownItem
                  key={manager._id}
                  onItemClick={() => handleManagerSelect(manager._id)}
                >
                  {manager.name}
                </DropdownItem>
              ))}
            </Dropdown>

            {errors.departmentManager && (
              <p className="text-xs text-error-500 mt-1">
                {errors.departmentManager.message}
              </p>
            )}
          </div>

          <div className="relative">
            <Label required>{t("locationGroup")}</Label>
            <input type="hidden" {...register("departmentGroupLocation")} />
            <button
              type="button"
              onClick={() => setLocationDropdownOpen((prev) => !prev)}
              className="input flex justify-between items-center"
            >
              <span className="text-theme-sm dark:text-gray-400">
                {getLocationName(selectedLocationId) ||
                  t("select", { entity: t("location") })}
              </span>
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.5 7l4.5 4.5L14.5 7z" />
              </svg>
            </button>

            <Dropdown
              isOpen={locationDropdownOpen}
              onClose={() => setLocationDropdownOpen(false)}
              className="absolute z-10 mt-1 w-full rounded-xl border bg-white shadow-md"
            >
              {locations.map((loc) => (
                <DropdownItem
                  key={loc._id}
                  onItemClick={() => handleLocationSelect(loc._id)}
                >
                  {loc.locationName}
                </DropdownItem>
              ))}
            </Dropdown>

            {errors.departmentGroupLocation && (
              <p className="text-xs text-error-500 mt-1">
                {errors.departmentGroupLocation.message}
              </p>
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
