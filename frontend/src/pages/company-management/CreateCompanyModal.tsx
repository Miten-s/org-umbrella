import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { useTranslation } from "react-i18next";
import TextArea from "@/components/common/form/input/TextArea";
import { z } from "zod";
import DropzoneUploader from "@/components/common/form/form-elements/DropZone";
import { useEffect, useState } from "react";
import { getImageUrl } from "@/services/utils.service";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  description: z.string().optional(),
  logo: z.any().optional()
});

type CreateCompanyForm = z.infer<typeof companySchema>;

interface CreateCompanyModalProps {
  onClose: () => void;
  onSubmit: (data: CreateCompanyForm) => void;
  initialData?: Partial<CreateCompanyForm>;
}

const CreateCompanyModal = ({
  onClose,
  initialData,
  onSubmit
}: CreateCompanyModalProps) => {
  const { t } = useTranslation();
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData?.logo || null
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<CreateCompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      logo: initialData?.logo || undefined
    }
  });

  const handleFileUpload = (files: File[]) => {
    const file = files[0];
    if (file) {
      setValue("logo", file, { shouldValidate: true });
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    if (initialData?.logo) {
      if (typeof initialData.logo === "string") {
        const fullUrl = getImageUrl(initialData.logo);
        setLogoPreview(fullUrl || null);
        setValue("logo", initialData.logo);
      }
    }
  }, [initialData?.logo, setValue]);
  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {t("update", { entity: t("company") })}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label required>{t("companyName")}</Label>
            <Input
              {...register("name")}
              placeholder={t("enterEntity", { entity: t("companyName") })}
              error={!!errors.name}
              hint={errors.name?.message}
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

          <div>
            <Label>{t("upload", { entity: t("logo") })}</Label>
            <DropzoneUploader
              onDrop={handleFileUpload}
              title="Upload Company Logo"
              description="Supported formats: PNG, JPG, WebP, SVG. Max size: 5MB."
              previewUrl={logoPreview ?? undefined}
            />
            {errors.logo && (
              <p className="text-sm text-red-600 dark:text-red-500 mt-1">
                {errors.logo.message?.toString()}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting}>
            {t("save")}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateCompanyModal;
