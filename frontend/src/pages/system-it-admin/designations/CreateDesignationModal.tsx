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
}

type CreateDesignationForm = z.infer<typeof getDesignationSchema>;

const CreateDesignationModal = ({ onClose,initialData,onSubmit }: CreateDesignationModalProps) => {
  const { t } = useTranslation();

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
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t("create", { entity: t("designation") })}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label required>{t("designationName")}</Label>
            <Input
              {...register("designationName")}
              placeholder={t("enterDesignationName")}
              error={!!errors.designationName}
              hint={errors.designationName?.message}
            />
          </div>

          <div>
            <Label>{t("description")}</Label>
            <TextArea
              value={watch("description") || ""}
              onChange={(event) =>
                setValue("description", event, { shouldValidate: true })
              }
              error={!!errors.description}
              hint={errors.description?.message}
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

export default CreateDesignationModal;
