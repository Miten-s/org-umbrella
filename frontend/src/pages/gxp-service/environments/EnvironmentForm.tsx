import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { environmentSchema, type EnvironmentFormValues } from "./Environment.schema";
import type { Environment } from "./Environment.types";

export type EnvironmentFormMode = "create" | "edit" | "view";

interface EnvironmentFormProps {
  mode?: EnvironmentFormMode;
  initialData?: Environment | null;
  onClose: () => void;
  onSubmit: (values: EnvironmentFormValues) => Promise<void> | void;
  submitting?: boolean;
}

/** Environment create/edit/view form (no relational dropdowns). */
const EnvironmentForm = ({ mode = "create", initialData, onClose, onSubmit, submitting = false }: EnvironmentFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<EnvironmentFormValues>({
    resolver: zodResolver(environmentSchema),
    defaultValues: {
      environmentName: initialData?.environmentName || "",
      description: initialData?.description || ""
    }
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit((values) => onSubmit(values))} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("environment") })
            : initialData
              ? t("update", { entity: t("environment") })
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

export default EnvironmentForm;
