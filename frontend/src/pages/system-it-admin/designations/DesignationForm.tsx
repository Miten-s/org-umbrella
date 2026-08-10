import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { designationSchema, type DesignationFormValues } from "./Designation.schema";
import type { Designation } from "./Designation.types";

export type DesignationFormMode = "create" | "edit" | "view";

interface DesignationFormProps {
  mode?: DesignationFormMode;
  initialData?: Designation | null;
  onClose: () => void;
  onSubmit: (values: DesignationFormValues) => Promise<void> | void;
  submitting?: boolean;
}

/**
 * Designation create/edit/view form (STANDARDS.md §1). Replaces
 * CreateDesignationModal; validation lives in Designation.schema.ts.
 */
const DesignationForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: DesignationFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema),
    defaultValues: {
      designationName: initialData?.designationName ?? "",
      description: initialData?.description ?? ""
    }
  });

  const busy = submitting || isSubmitting;

  return (
    <div className="max-h-[90vh] overflow-y-auto bg-white p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit((values) => onSubmit(values))} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isReadOnly
            ? t("view", { entity: t("designation") })
            : initialData
              ? t("update", { entity: t("designation") })
              : t("create", { entity: t("designation") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4">
          <div className="min-w-0">
            <Label required>{t("designationName")}</Label>
            <Input
              {...register("designationName")}
              disabled={isReadOnly}
              placeholder={t("enterDesignationName")}
              error={!!errors.designationName}
              hint={errors.designationName?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={watch("description") || ""}
              onChange={(value) => setValue("description", value, { shouldValidate: true })}
              error={!!errors.description}
              hint={errors.description?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
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

export default DesignationForm;
