import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import TextArea from "@/components/common/form/input/TextArea";

import { getDepartmentSchema } from "@/lib/schema";
import { Location } from "@/types/common.types";

interface UserOption {
  _id: string;
  name?: string;
  fullName?: string;
}

interface CreateDepartmentModalProps {
  onClose: () => void;
  onSubmit: (data: CreateDepartmentForm) => void;
  initialData?: any;
  locations?: Location[];
  managers?: UserOption[];
  mode?: "create" | "edit" | "view";
}

type CreateDepartmentForm = z.infer<typeof getDepartmentSchema>;

const CreateDepartmentModal = ({
  onClose,
  onSubmit,
  initialData,
  locations = [],
  managers = [],
  mode = "create"
}: CreateDepartmentModalProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const getInitialManagerId = () => {
    const manager =
      initialData?.departmentManager ?? initialData?.departmentManagerId;

    if (typeof manager === "object" && manager !== null) {
      return manager._id || "";
    }

    return manager || "";
  };

  const getInitialLocationId = () => {
    const location =
      initialData?.departmentGroupLocation ??
      initialData?.locationId ??
      initialData?.location;

    if (typeof location === "object" && location !== null) {
      return location._id || "";
    }

    return location || "";
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting }
  } = useForm<CreateDepartmentForm>({
    resolver: zodResolver(getDepartmentSchema),
    defaultValues: {
      departmentName: initialData?.departmentName || "",
      description: initialData?.description || "",
      departmentManager: getInitialManagerId(),
      departmentGroupLocation: getInitialLocationId()
    }
  });

  const description = useWatch({ control, name: "description" });

  return (
    <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("department") })
            : initialData
              ? t("update", { entity: t("department") })
              : t("create", { entity: t("department") })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-32">
          {/* Department Name */}
          <div>
            <Label htmlFor="departmentName" required>
              {t("departmentName")}
            </Label>
            <Input
              {...register("departmentName")}
              disabled={isReadOnly}
              error={!!errors.departmentName}
              hint={errors.departmentName?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Description */}
          <div>
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val)}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Manager Dropdown */}
          <div>
            <Label required>{t("departmentManager")}</Label>
            <Controller
              name="departmentManager"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  disabled={isReadOnly}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  portal
                  dropdownMaxHeight={320}
                  listMaxHeight={240}
                  placeholder={t("select", {
                    entity: t("departmentManager")
                  })}
                  options={managers.map((manager) => ({
                    label: manager.fullName || manager.name || "",
                    value: manager._id
                  }))}
                />
              )}
            />

            {errors.departmentManager && (
              <p className="text-xs text-error-500 mt-1">
                {errors.departmentManager.message}
              </p>
            )}
          </div>

          {/* Location Dropdown */}
          <div>
            <Label required>{t("locationGroup")}</Label>
            <Controller
              name="departmentGroupLocation"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  disabled={isReadOnly}
                  value={field.value}
                  onChange={(val) => field.onChange(val)}
                  portal
                  dropdownMaxHeight={320}
                  listMaxHeight={240}
                  placeholder={t("select", { entity: t("location") })}
                  options={locations.map((loc) => ({
                    label: loc.locationName,
                    value: loc._id
                  }))}
                />
              )}
            />

            {errors.departmentGroupLocation && (
              <p className="text-xs text-error-500 mt-1">
                {errors.departmentGroupLocation.message}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
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

export default CreateDepartmentModal;
