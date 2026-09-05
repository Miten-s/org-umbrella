import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { locationSchema, type LocationFormValues } from "./Location.schema";
import type { Location } from "./Location.types";

export type LocationFormMode = "create" | "edit" | "view" | "copy" | "bulk-edit";

interface LocationFormProps {
  mode?: LocationFormMode;
  initialData?: Location | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (values: LocationFormValues) => Promise<void> | void;
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

/** Location create/edit/view/copy/bulk-edit form (no relational dropdowns). */
const LocationForm = ({
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
}: LocationFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const initialValues: LocationFormValues = {
    locationName: initialData?.locationName || "",
    description: initialData?.description || ""
  };

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
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
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("location") })
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("location") })}${stepLabel ?? ""}`
              : initialData
                ? `${t("update", { entity: t("location") })}${stepLabel ?? ""}`
                : t("create", { entity: t("location") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4">
          <div className="min-w-0">
            <Label required>{t("locationName")}</Label>
            <Input
              {...register("locationName")}
              disabled={isReadOnly}
              error={!!errors.locationName}
              hint={errors.locationName?.message}
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

export default LocationForm;
