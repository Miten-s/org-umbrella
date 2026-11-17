import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import DropzoneUploader from "@/components/common/form/form-elements/DropZone";
import Button from "@/components/ui/button/Button";
import { getCompany, updateCompany } from "@/services/admin.service";
import { getImageUrl } from "@/services/utils.service";
import { Company } from "@/types/common.types";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import { ADMIN_PERMISSIONS } from "@/utils/permissions";

const companySchema = z.object({
  name: z.string().trim().min(1, "Company name is required"),
  description: z.string().optional(),
  logo: z.any().optional()
});

type CompanyForm = z.infer<typeof companySchema>;

const toFormValues = (company?: Company): CompanyForm => ({
  name: company?.name || "",
  description: company?.description || "",
  logo: company?.logo || undefined
});

const CompanyManagement = () => {
  const { refreshAuth } = useAuth();
  const { t } = useTranslation();
  const [company, setCompany] = useState<Company>();
  const [logoPreview, setLogoPreview] = useState<string>();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: toFormValues()
  });

  const loadCompany = (data?: Company) => {
    setCompany(data);
    reset(toFormValues(data));
    setLogoPreview(data?.logo ? getImageUrl(data.logo) : undefined);
  };

  useEffect(() => {
    getCompany().then((res) => loadCompany(res.company));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setValue("logo", file, { shouldValidate: true, shouldDirty: true });
    setLogoPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: CompanyForm) => {
    if (!company) return;
    await updateCompany(company._id || company.id, data);
    await refreshAuth();
    const res = await getCompany();
    loadCompany(res.company);
    toast("Company updated successfully.", "success");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {t("company")}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            This name and description appear on your team's dashboard.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={() => loadCompany(company)}
            disabled={!isDirty || isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button
            type="submit"
            variant="primary"
            permission={ADMIN_PERMISSIONS.OPERATE_ALL}
            disabled={!isDirty || !company}
            loading={isSubmitting}
          >
            {t("save")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 lg:grid-cols-[1fr_minmax(280px,38%)]">
        <div className="flex flex-col gap-4">
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
              rows={6}
              value={watch("description") || ""}
              onChange={(e) =>
                setValue("description", e, {
                  shouldValidate: true,
                  shouldDirty: true
                })
              }
              error={!!errors.description}
              hint={errors.description?.message}
            />
          </div>
        </div>

        <div>
          <Label>{t("upload", { entity: t("logo") })}</Label>
          <DropzoneUploader
            onDrop={handleFileUpload}
            title="Upload Company Logo"
            description="Supported formats: PNG, JPG, WebP, SVG. Max size: 5MB."
            previewUrl={logoPreview}
          />
        </div>
      </div>
    </form>
  );
};

export default CompanyManagement;
