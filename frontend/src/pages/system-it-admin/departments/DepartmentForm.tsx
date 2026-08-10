import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";
import AsyncSelect from "@/components/data/AsyncSelect";
import { useUserOptions } from "@/pages/system-it-admin/users/User.queries";
import { useLocationOptions } from "@/pages/system-it-admin/locations/Location.queries";
import { departmentSchema, type DepartmentFormValues } from "./Department.schema";
import type { Department } from "./Department.types";
import type { AsyncOption } from "@/lib/query/listTypes";

export type DepartmentFormMode = "create" | "edit" | "view";

interface DepartmentFormProps {
  mode?: DepartmentFormMode;
  initialData?: Department | null;
  onClose: () => void;
  onSubmit: (values: DepartmentFormValues) => Promise<void> | void;
  submitting?: boolean;
}

const seed = (
  ref: Department["departmentManager"],
  labelKey: "name" | "locationName"
): AsyncOption[] | undefined =>
  ref?.id && ref[labelKey] ? [{ value: ref.id, label: ref[labelKey] as string }] : undefined;

/**
 * Department create/edit/view form. Manager (User) and Location dropdowns use
 * AsyncSelect (never load-all); labels are seeded from the record's nested refs
 * so they show correctly on edit (STANDARDS.md §5, MIGRATION §4).
 */
const DepartmentForm = ({ mode = "create", initialData, onClose, onSubmit, submitting = false }: DepartmentFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      departmentName: initialData?.departmentName || "",
      description: initialData?.description || "",
      departmentManager: initialData?.departmentManager?.id || "",
      departmentGroupLocation: initialData?.departmentGroupLocation?.id || ""
    }
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  return (
    <div className="max-h-[120vh] overflow-y-auto bg-white p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit((values) => onSubmit(values))} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("department") })
            : initialData
              ? t("update", { entity: t("department") })
              : t("create", { entity: t("department") })}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="departmentName" required>
              {t("departmentName")}
            </Label>
            <Input
              {...register("departmentName")}
              disabled={isReadOnly}
              error={!!errors.departmentName}
              hint={errors.departmentName?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val)}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <Label required>{t("departmentManager")}</Label>
            <Controller
              name="departmentManager"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useUserOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.departmentManager}
                  placeholder={t("select", { entity: t("departmentManager") })}
                  initialSelectedOptions={seed(initialData?.departmentManager, "name")}
                />
              )}
            />
            {errors.departmentManager && (
              <p className="mt-1 text-xs text-error-500">{errors.departmentManager.message}</p>
            )}
          </div>

          <div>
            <Label required>{t("locationGroup")}</Label>
            <Controller
              name="departmentGroupLocation"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLocationOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.departmentGroupLocation}
                  placeholder={t("select", { entity: t("location") })}
                  initialSelectedOptions={seed(initialData?.departmentGroupLocation, "locationName")}
                />
              )}
            />
            {errors.departmentGroupLocation && (
              <p className="mt-1 text-xs text-error-500">{errors.departmentGroupLocation.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>
            {t("cancel")}
          </Button>
          {!isReadOnly ? (
            <Button type="submit" variant="primary" loading={busy}>
              {t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default DepartmentForm;
