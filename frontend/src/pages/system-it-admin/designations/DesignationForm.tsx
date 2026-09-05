import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { designationSchema, type DesignationFormValues } from "./Designation.schema";
import type { Designation } from "./Designation.types";

export type DesignationFormMode = "create" | "edit" | "view" | "copy" | "bulk-edit";

interface DesignationFormProps {
  mode?: DesignationFormMode;
  initialData?: Designation | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (values: DesignationFormValues) => Promise<void> | void;
  submitting?: boolean;
  /** Overrides the submit button's label — CopyStepper uses this to say
   * "Next" on every step but the last, where the batch actually saves. */
  submitLabel?: string;
  /** Grays out the submit button without a spinner — EditStepper uses
   * this on the last step now that its own Save button lives outside it. */
  disabled?: boolean;
  /** Set on the `<form>` element so an outside button (CopyStepper's
   * header Next/Save) can submit it via `<Button form={formId}>`. */
  formId?: string;
  /** " (2 of 5)" appended after the title when Copy/Edit is reviewing
   * more than one record — undefined otherwise. */
  stepLabel?: string;
}

/**
 * Designation create/edit/view/copy/bulk-edit form (STANDARDS.md §1). Replaces
 * CreateDesignationModal; validation lives in Designation.schema.ts.
 */
const DesignationForm = ({
  mode = "create",
  initialData,
  onClose,
  onUnchanged,
  onSubmit,
  submitting = false,
  submitLabel,
  disabled = false,
  formId,
  stepLabel
}: DesignationFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const initialValues: DesignationFormValues = {
    designationName: initialData?.designationName ?? "",
    description: initialData?.description ?? ""
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema),
    defaultValues: initialValues
  });

  const busy = submitting || isSubmitting;

  return (
    <div className="max-h-[90vh] overflow-y-auto bg-white p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        id={formId}
        onSubmit={handleSubmit((values) => {
          // Edit + nothing actually changed: skip the update call entirely — a no-op Save just closes.
          if ((mode === "edit" || mode === "bulk-edit") && isPayloadEqual(values, initialValues)) {
            (onUnchanged ?? onClose)();
            return;
          }
          onSubmit(values);
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isReadOnly
            ? t("view", { entity: t("designation") })
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("designation") })}${stepLabel ?? ""}`
              : initialData
                ? `${t("update", { entity: t("designation") })}${stepLabel ?? ""}`
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
            <Button type="submit" variant="primary" loading={busy} disabled={busy || disabled}>
              {submitLabel ?? t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default DesignationForm;
