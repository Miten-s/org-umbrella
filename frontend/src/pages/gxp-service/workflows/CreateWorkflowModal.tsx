import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";
import MultiSelect from "@/components/common/form/MultiSelect";

import { getWorkflowSchema } from "@/lib/schema";
import Switch from "@/components/common/form/switch/Switch";

interface CreateWorkflowModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  assignmentGroups?: any[];
}

// If you re-exported type from schema file, import it instead:
type CreateWorkflowForm = z.infer<typeof getWorkflowSchema>;

const CreateWorkflowModal = ({
  onClose,
  onSubmit,
  initialData,
  assignmentGroups = [],
}: CreateWorkflowModalProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateWorkflowForm>({
    resolver: zodResolver(getWorkflowSchema),
    defaultValues: {
      workflowName: initialData?.workflowName || "",
      levels: initialData?.levels?.join(", ") || "",
      description: initialData?.description || "",
      assignmentGroups: initialData?.assignmentGroups || [],
      status: initialData?.status ?? "enabled", // <-- default to enabled
    },
  });

  const description = useWatch({ control, name: "description" });

  const handleFormSubmit = (data: CreateWorkflowForm) => {
    // robust split/trim, drop empties, dedupe
    const levelsArray = Array.from(
      new Set(
        data.levels
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    );

    const submissionData = {
      ...data,
      levels: levelsArray,
      numberOfLevels: levelsArray.length,
      // status already in `data.status`
    };

    onSubmit(submissionData);
  };

  return (
    <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t(initialData ? "edit" : "create", { entity: t("gxpWorkflows") })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Workflow Name */}
          <div>
            <Label htmlFor="workflowName" required>
              {t("workflowName")}
            </Label>
            <Input
              {...register("workflowName")}
              error={!!errors.workflowName}
              hint={errors.workflowName?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Levels (comma-separated) */}
          <div>
            <Label htmlFor="levels" required>
              {t("levels")}
            </Label>
            <Input
              {...register("levels")}
              error={!!errors.levels}
              hint={errors.levels?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Assignment Groups */}
          <div>
            <Label htmlFor="assignmentGroups">{t("gxpAssignmentGroups")}</Label>
            <Controller
              name="assignmentGroups"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  options={assignmentGroups?.map((group) => ({
                    text: group.name,
                    value: group._id,
                  }))}
                  label={t("selectGroups")}
                  onChange={field.onChange}
                  defaultSelected={field.value}
                />
              )}
            />
            {errors.assignmentGroups && (
              <p className="text-red-500 text-xs mt-1">
                {errors.assignmentGroups.message as string}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-end">
            <div className="w-full">
              <Label htmlFor="status">{t("status")}</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => {
                  const checked = field.value === "enabled";
                  return (
                    <div className="flex items-center gap-3 py-2">
                      <Switch
                        checked={checked}
                        onChange={(val: boolean) =>
                          field.onChange(val ? "enabled" : "disabled")
                        }
                        label={checked ? t("enabled") : t("disabled")}
                      />
                    </div>
                  );
                }}
              />
              {errors.status && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.status.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="col-span-2">
            <Label>{t("description")}</Label>
            <TextArea
              value={description || ""}
              onChange={(val) => setValue("description", val)}
              error={!!errors.description}
              hint={errors.description?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
        </div>

        {/* Action Buttons */}
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

export default CreateWorkflowModal;
