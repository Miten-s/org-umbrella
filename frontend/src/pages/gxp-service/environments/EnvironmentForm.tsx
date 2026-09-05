import { useMemo } from "react";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";
import Switch from "@/components/common/form/switch/Switch";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { environmentSchema, type EnvironmentFormValues } from "./Environment.schema";
import type { Environment } from "./Environment.types";

export type EnvironmentFormMode = "create" | "edit" | "view" | "copy" | "bulk-edit";

interface EnvironmentFormProps {
  mode?: EnvironmentFormMode;
  initialData?: Environment | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (values: EnvironmentFormValues) => Promise<void> | void;
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
  /** " (2 of 5)" appended after the title when Copy/Edit are reviewing
   * more than one record — undefined otherwise. */
  stepLabel?: string;
}

/** Environment create/edit/view/copy/bulk-edit form (no relational dropdowns). */
const EnvironmentForm = ({
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
}: EnvironmentFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const initialValues = useMemo<EnvironmentFormValues>(
    () => ({
      environmentName: mode === "copy" ? "" : initialData?.environmentName || "",
      description: initialData?.description || "",
      status: initialData?.status || "enabled"
    }),
    [initialData, mode]
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<EnvironmentFormValues>({
    resolver: zodResolver(environmentSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const status = useWatch({ control, name: "status" });
  const busy = submitting || isSubmitting;

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        id={formId}
        onSubmit={handleSubmit((values) => {
          if ((mode === "edit" || mode === "bulk-edit") && isPayloadEqual(values, initialValues)) {
            (onUnchanged ?? onClose)();
            return;
          }
          onSubmit(values);
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("environment") })
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("environment") })}${stepLabel ?? ""}`
              : initialData
                ? `${t("update", { entity: t("environment") })}${stepLabel ?? ""}`
                : t("create", { entity: t("environment") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4">
          <div className="min-w-0">
            <Label required>{t("environmentName")}</Label>
            <Input
              {...register("environmentName")}
              disabled={isReadOnly}
              error={!!errors.environmentName}
              hint={errors.environmentName?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val, { shouldValidate: true })}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label>{t("status")}</Label>
            <Switch
              label={status === "enabled" ? t("enabled") : t("disabled")}
              checked={status === "enabled"}
              disabled={isReadOnly}
              onChange={(checked) => setValue("status", checked ? "enabled" : "disabled")}
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

export default EnvironmentForm;
