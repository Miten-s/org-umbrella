import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";
import TextArea from "@/components/common/form/input/TextArea";
import { z } from "zod";

const companySchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  logoUrl: z.string().url("Must be a valid URL").optional()
});

type CreateCompanyForm = z.infer<typeof companySchema>;

interface CreateCompanyModalProps {
  onClose: () => void;
  onSubmit: (data: CreateCompanyForm) => void;
  initialData?: Partial<CreateCompanyForm>;
}

const CreateCompanyModal = ({ onClose, initialData, onSubmit }: CreateCompanyModalProps) => {
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateCompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      description: initialData?.description || "",
      logoUrl: initialData?.logoUrl || ""
    },
  });

  return (
    <div className="p-6 max-h-[90vh] overflow-y-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">{t("create", { entity: t("company") })}</h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label required>{t("companyName")}</Label>
            <Input
              {...register("companyName")}
              placeholder={t("enterEntity", { entity: t("companyName") })}
              error={!!errors.companyName}
              hint={errors.companyName?.message}
            />
          </div>

          <div>
            <Label>{t("description")}</Label>
            <TextArea
              value={watch("description") || ""}
              onChange={(e) => setValue("description", e, { shouldValidate: true })}
              error={!!errors.description}
              hint={errors.description?.message}
            />
          </div>

          <div>
            <Label>{t("upload", { entity: t("logo") })}</Label>
            <Input
              {...register("logoUrl")}
              placeholder="https://example.com/logo.png"
              error={!!errors.logoUrl}
              hint={errors.logoUrl?.message}
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

export default CreateCompanyModal;
