import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";

const getEnvironmentSchema = z.object({
  environmentName: z.string().min(1, "Environment name is required").max(20, "Environment name must be 20 characters or less"),
  description: z.string().max(50, "Description must be 50 characters or less").optional(),
});

type CreateEnvironmentForm = z.infer<typeof getEnvironmentSchema>;

interface CreateEnvironmentModalProps {
  onClose: () => void;
  onSubmit: (data: CreateEnvironmentForm) => void;
  initialData?: any;
}

const CreateEnvironmentModal = ({
  onClose,
  onSubmit,
  initialData,
}: CreateEnvironmentModalProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateEnvironmentForm>({
    resolver: zodResolver(getEnvironmentSchema),
    defaultValues: {
      environmentName: initialData?.environmentName || "",
      description: initialData?.description || "",
    },
  });

  const description = useWatch({ control, name: "description" });
  

  return (
    <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t(initialData ? "edit" : "create", { entity: t("environment") })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-32">
          <div>
            <Label htmlFor="environmentName" required>
              {t("environmentName")}
            </Label>
            <Input
              {...register("environmentName")}
              error={!!errors.environmentName}
              hint={errors.environmentName?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          <div>
            <Label>{t("description")}</Label>
            <TextArea
              value={description || ""}
              onChange={(val) => setValue("description", val)}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          
        </div>

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

export default CreateEnvironmentModal;
