import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";
import Switch from "@/components/common/form/switch/Switch";
import { supplierSchema, type SupplierFormValues } from "./Supplier.schema";
import type { Supplier } from "./Supplier.types";

export type SupplierFormMode = "create" | "edit" | "view";

interface SupplierFormProps {
  mode?: SupplierFormMode;
  initialData?: Supplier | null;
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => Promise<void> | void;
  submitting?: boolean;
}

/** Supplier create/edit/view form (no relational dropdowns; status toggle). */
const SupplierForm = ({ mode = "create", initialData, onClose, onSubmit, submitting = false }: SupplierFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting }
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
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
  const busy = submitting || isSubmitting;

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit((values) => onSubmit(values))} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("supplier") })
            : initialData
              ? t("update", { entity: t("supplier") })
              : t("create", { entity: t("supplier") })}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="supplierName" required>
              {t("supplierName")}
            </Label>
            <Input
              {...register("supplierName")}
              disabled={isReadOnly}
              error={!!errors.supplierName}
              hint={errors.supplierName?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="typeOfSupplier">{t("typeOfSupplier")}</Label>
            <Input
              {...register("typeOfSupplier")}
              disabled={isReadOnly}
              error={!!errors.typeOfSupplier}
              hint={errors.typeOfSupplier?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="product">{t("product")}</Label>
            <Input
              {...register("product")}
              disabled={isReadOnly}
              error={!!errors.product}
              hint={errors.product?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <Label>{t("status")}</Label>
            <Switch
              label={status === "enabled" ? t("enabled") : t("disabled")}
              checked={status === "enabled"}
              disabled={isReadOnly}
              onChange={(checked) => setValue("status", checked ? "enabled" : "disabled")}
            />
          </div>

          <div className="md:col-span-2">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val)}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>
            {t("cancel")}
          </Button>
          {!isReadOnly ? (
            <Button type="submit" variant="primary" loading={busy}>
              {t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default SupplierForm;
