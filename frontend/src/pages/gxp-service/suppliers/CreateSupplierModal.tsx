import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";

import Switch from "@/components/common/form/switch/Switch";

import { getSupplierSchema } from "@/lib/schema";

interface CreateSupplierModalProps {
  onClose: () => void;
  onSubmit: (data: CreateSupplierForm) => void;
  initialData?: any;
  mode?: "create" | "edit" | "view";
}

type CreateSupplierForm = z.infer<typeof getSupplierSchema>;

const CreateSupplierModal = ({
  onClose,
  onSubmit,
  initialData,
  mode = "create"
}: CreateSupplierModalProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors }
  } = useForm<CreateSupplierForm>({
    resolver: zodResolver(getSupplierSchema),
    defaultValues: {
      supplierName: initialData?.supplierName || "",
      typeOfSupplier: initialData?.typeOfSupplier || "",
      product: initialData?.product || "",
      description: initialData?.description || "",
      status: initialData?.status || "enabled"
    }
  });

  const description = useWatch({ control, name: "description" });
  const status = useWatch({ control, name: "status" });

  return (
    <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("supplier") })
            : initialData
              ? t("update", { entity: t("supplier") })
              : t("create", { entity: t("supplier") })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supplier Name */}
          <div>
            <Label htmlFor="supplierName" required>
              {t("supplierName")}
            </Label>
            <Input
              {...register("supplierName")}
              disabled={isReadOnly}
              error={!!errors.supplierName}
              hint={errors.supplierName?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Type of Supplier */}
          <div>
            <Label htmlFor="typeOfSupplier">{t("typeOfSupplier")}</Label>
            <Input
              {...register("typeOfSupplier")}
              disabled={isReadOnly}
              error={!!errors.typeOfSupplier}
              hint={errors.typeOfSupplier?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Product */}
          <div>
            <Label htmlFor="product">{t("product")}</Label>
            <Input
              {...register("product")}
              disabled={isReadOnly}
              error={!!errors.product}
              hint={errors.product?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Description */}
          <div>
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val)}
              error={!!errors.description}
              hint={errors.description?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Status */}
          <div>
            <Label>{t("status")}</Label>
            <Switch
              label={status === "enabled" ? t("enabled") : t("disabled")}
              checked={status === "enabled"}
              disabled={isReadOnly}
              onChange={(checked) =>
                setValue("status", checked ? "enabled" : "disabled")
              }
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

export default CreateSupplierModal;
