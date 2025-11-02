import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";

import { getWorkflowSchema } from "@/lib/schema";

interface CreateWorkflowModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

type CreateWorkflowForm = z.infer<typeof getWorkflowSchema>;

const CreateWorkflowModal = ({
  onClose,
  onSubmit,
  initialData,
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
    },
  });

  const description = useWatch({ control, name: "description" });

  const handleFormSubmit = (data: CreateWorkflowForm) => {
    const levelsArray = data.levels.split(',').map(item => item.trim());
    const submissionData = {
      ...data,
      levels: levelsArray,
      numberOfLevels: levelsArray.length,
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

          {/* Levels */}
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
