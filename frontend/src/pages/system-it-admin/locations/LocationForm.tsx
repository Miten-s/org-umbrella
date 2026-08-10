import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { locationSchema, type LocationFormValues } from "./Location.schema";
import type { Location } from "./Location.types";

export type LocationFormMode = "create" | "edit" | "view";

interface LocationFormProps {
  mode?: LocationFormMode;
  initialData?: Location | null;
  onClose: () => void;
  onSubmit: (values: LocationFormValues) => Promise<void> | void;
  submitting?: boolean;
}

/** Location create/edit/view form (no relational dropdowns). */
const LocationForm = ({ mode = "create", initialData, onClose, onSubmit, submitting = false }: LocationFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      locationName: initialData?.locationName || "",
      description: initialData?.description || ""
    }
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  return (
    <div className="max-h-[90vh] overflow-y-auto bg-white p-6 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit((values) => onSubmit(values))} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("location") })
            : initialData
              ? t("update", { entity: t("location") })
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
            <Button type="submit" variant="primary" loading={busy}>
              {t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default LocationForm;
