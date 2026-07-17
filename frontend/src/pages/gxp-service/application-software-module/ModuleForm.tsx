import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/common/form/switch/Switch";
import AsyncSelect from "@/components/data/AsyncSelect";
import { useApplicationOptions } from "@/pages/gxp-service/add-new-application/Application.options";
import { moduleSchema, type ModuleFormValues } from "./Module.schema";
import { getModuleApplicationId, type ApplicationSoftwareModule } from "./Module.types";
import type { AsyncOption } from "@/lib/query/listTypes";

export type ModuleFormMode = "create" | "edit" | "view";

interface ModuleFormProps {
  mode?: ModuleFormMode;
  initialData?: ApplicationSoftwareModule | null;
  onClose: () => void;
  onSubmit: (values: ModuleFormValues) => Promise<void> | void;
  submitting?: boolean;
}

const seedApplication = (module?: ApplicationSoftwareModule | null): AsyncOption[] | undefined => {
  const app = module?.application;
  if (app && typeof app === "object" && app.id && app.applicationName) {
    return [{ value: app.id, label: app.applicationName }];
  }
  return undefined;
};

const ModuleForm = ({ mode = "create", initialData, onClose, onSubmit, submitting = false }: ModuleFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting }
  } = useForm<ModuleFormValues>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      moduleName: initialData?.moduleName ?? "",
      application: getModuleApplicationId(initialData),
      status: initialData?.status ?? "enabled"
    }
  });

  const busy = submitting || isSubmitting;

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit((values) => onSubmit(values))} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("module") })
            : initialData
              ? t("update", { entity: t("module") })
              : t("create", { entity: t("module") })}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="moduleName" required>
              {t("moduleName")}
            </Label>
            <Input
              {...register("moduleName")}
              disabled={isReadOnly}
              error={!!errors.moduleName}
              hint={errors.moduleName?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <Label>{t("application")}</Label>
            <Controller
              name="application"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useApplicationOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("application") })}
                  initialSelectedOptions={seedApplication(initialData)}
                />
              )}
            />
          </div>

          <div>
            <Label>{t("status")}</Label>
            <Controller
              name="status"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Switch
                  label={value === "enabled" ? t("enabled") : t("disabled")}
                  checked={value === "enabled"}
                  disabled={isReadOnly}
                  onChange={(checked) => onChange(checked ? "enabled" : "disabled")}
                />
              )}
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

export default ModuleForm;
