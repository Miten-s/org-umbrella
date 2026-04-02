import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";
import TextArea from "@/components/common/form/input/TextArea";
import { z } from "zod";
import { getDesignationSchema } from "@/lib/schema";

interface CreateDesignationModalProps {
  onClose: () => void;
  onSubmit: (data: CreateDesignationForm) => void;
  initialData?: Partial<CreateDesignationForm>;
  mode?: "create" | "edit" | "view";
}

type CreateDesignationForm = z.infer<typeof getDesignationSchema>;

const CreateDesignationModal = ({
  onClose,
  initialData,
  onSubmit,
  mode = "create"
}: CreateDesignationModalProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateDesignationForm>({
    resolver: zodResolver(getDesignationSchema),
    defaultValues: {
      designationName: initialData?.designationName || "",
      description: initialData?.description || "",
    },
  });



  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {isReadOnly
            ? t("view", { entity: t("designation") })
            : initialData
              ? t("update", { entity: t("designation") })
              : t("create", { entity: t("designation") })}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {/* Designation Name */}
          <div>
            <Label required>{t("designationName")}</Label>
            <Input
              {...register("designationName")}
              disabled={isReadOnly}
              placeholder={t("enterDesignationName")}
              error={!!errors.designationName}
              hint={errors.designationName?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Description */}
          <div>
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={watch("description") || ""}
              onChange={(event) =>
                setValue("description", event, { shouldValidate: true })
              }
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
          {!isReadOnly ? (
            <Button type="submit" variant="primary">
              {t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>

  );
};

export default CreateDesignationModal;
