import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/common/form/switch/Switch";
import { Controller } from "react-hook-form";
import { workflowSchema, type WorkflowFormValues } from "./Workflow.schema";
import { parseLevels, type Workflow, type WorkflowPayload } from "./Workflow.types";

export type WorkflowFormMode = "create" | "edit" | "view";

interface WorkflowFormProps {
  mode?: WorkflowFormMode;
  initialData?: Workflow | null;
  onClose: () => void;
  onSubmit: (payload: WorkflowPayload) => Promise<void> | void;
  submitting?: boolean;
}

const WorkflowForm = ({ mode = "create", initialData, onClose, onSubmit, submitting = false }: WorkflowFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<WorkflowFormValues>({
    resolver: zodResolver(workflowSchema),
    defaultValues: {
      workflowName: initialData?.workflowName || "",
      levels: initialData?.levels?.join(", ") ?? "",
      status: initialData?.status || "enabled"
    }
  });

  const busy = submitting || isSubmitting;

  const submit = (values: WorkflowFormValues) => {
    const levels = parseLevels(values.levels);
    return onSubmit({
      workflowName: values.workflowName,
      levels,
      numberOfLevels: levels.length,
      status: values.status
    });
  };

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(submit)} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("workflow") })
            : initialData
              ? t("update", { entity: t("workflow") })
              : t("create", { entity: t("workflow") })}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="workflowName" required>
              {t("workflowName")}
            </Label>
            <Input
              {...register("workflowName")}
              disabled={isReadOnly}
              error={!!errors.workflowName}
              hint={errors.workflowName?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="levels" required>
              {t("levels")}
            </Label>
            <Input
              {...register("levels")}
              disabled={isReadOnly}
              error={!!errors.levels}
              hint={errors.levels?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <Label>{t("status")}</Label>
            <Controller
              name="status"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Switch
                  label={value === "enabled" ? t("enabled") : t("disabled")}
                  checked={value === "enabled"}
                  disabled={isReadOnly}
                  onChange={(checked) => onChange(checked ? "enabled" : "disabled")}
                />
              )}
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

export default WorkflowForm;
