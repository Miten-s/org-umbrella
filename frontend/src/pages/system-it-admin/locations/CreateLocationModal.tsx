import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";
import TextArea from "@/components/common/form/input/TextArea";
import { z } from "zod";
import { getLocationSchema } from "@/lib/schema"; 

interface CreateLocationModalProps {
  onClose: () => void;
  defaultValues?: {
    name?: string;
    description?: string;
  };
}

type CreateLocationForm = z.infer<typeof getLocationSchema>;

const CreateLocationModal = ({ onClose, defaultValues }: CreateLocationModalProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateLocationForm>({
    resolver: zodResolver(getLocationSchema),
    defaultValues: {
      locationName: defaultValues?.name || "",
      description: defaultValues?.description || "",
    },
  });

  const onSubmit = async (data: CreateLocationForm) => {
    console.log("Submit Location:", data);
    onClose();
  };

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t("create", { entity: t("location") })}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label required>{t("locationName")}</Label>
            <Input
              {...register("locationName")}
              placeholder={t("enterEntity", { entity: t("locationName") })}
              error={!!errors.locationName}
              hint={errors.locationName?.message}
            />
          </div>

          <div>
            <Label>{t("description")}</Label>
            <TextArea
              value={watch("description") || ""}
              onChange={(e) =>
                setValue("description", e, { shouldValidate: true })
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

export default CreateLocationModal;
