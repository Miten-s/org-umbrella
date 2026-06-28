import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import Label from "@/components/common/form/Label";
import Input from "@/components/common/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/common/form/switch/Switch";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { getApplicationSoftwareModuleSchema } from "@/lib/schema";
import type {
  Application,
  ApplicationSoftwareModule
} from "@/types/gxp-service.types";

type AppSoftwareModuleFormInput = z.input<
  typeof getApplicationSoftwareModuleSchema
>;
type AppSoftwareModuleFormOutput = z.output<
  typeof getApplicationSoftwareModuleSchema
>;

interface CreateApplicationSoftwareModuleModalProps {
  onClose: () => void;
  onSubmit: (data: Partial<AppSoftwareModuleFormOutput>) => void;
  initialData?: Partial<AppSoftwareModuleFormOutput> &
  Pick<Partial<ApplicationSoftwareModule>, "moduleId"> & {
    applicationId?: string;
  };
  applications: Application[];
  mode?: "create" | "edit" | "view";
}

const getInitialApplicationId = (
  initialData?: CreateApplicationSoftwareModuleModalProps["initialData"]
) => {
  const application = initialData?.application;
  if (!application) return initialData?.applicationId ?? "";
  if (typeof application === "string") return application;
  if (typeof application === "object") {
    return (
      String(
        (application as { _id?: string; id?: string })._id ??
        (application as { _id?: string; id?: string }).id ??
        ""
      ) || initialData?.applicationId || ""
    );
  }
  return "";
};

const CreateApplicationSoftwareModuleModal = ({
  onClose,
  onSubmit,
  initialData,
  applications,
  mode = "create"
}: CreateApplicationSoftwareModuleModalProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const moduleIdentity = initialData?.moduleId?.trim() || "-";

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<AppSoftwareModuleFormInput>({
    resolver: zodResolver(getApplicationSoftwareModuleSchema),
    defaultValues: {
      moduleName: initialData?.moduleName ?? "",
      application: getInitialApplicationId(initialData),
      status: initialData?.status ?? "enabled"
    }
  });

  const onFormSubmit = (data: AppSoftwareModuleFormInput) => {
    const parsed = getApplicationSoftwareModuleSchema.parse(data);
    return onSubmit({
      ...parsed,
      application: parsed.application || undefined
    });
  };

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("gxpAppModules") })
            : initialData
              ? t("update", { entity: t("gxpAppModules") })
              : t("create", { entity: t("gxpAppModules") })}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="identity">
              {t("identity", { defaultValue: "Identity" })}
            </Label>
            <Input
              id="identity"
              value={moduleIdentity}
              readOnly
              disabled
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="moduleName" required>
              {t("moduleName")}
            </Label>
            <Input
              {...register("moduleName")}
              disabled={isReadOnly}
              error={!!errors.moduleName}
              hint={errors.moduleName?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="application">{t("application")}</Label>
            <Controller
              name="application"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  disabled={isReadOnly}
                  value={field.value ?? ""}
                  onChange={(value) => field.onChange(value)}
                  options={applications.map((app) => ({
                    label: app.applicationName,
                    value: app._id
                  }))}
                  portal
                  dropdownMaxHeight={320}
                  listMaxHeight={240}
                  placeholder={t("select", { entity: t("application") })}
                />
              )}
            />
            {errors.application && (
              <p className="text-red-500 text-xs mt-1">
                {errors.application.message as string}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="status">{t("status")}</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => {
                const on = field.value === "enabled";
                return (
                  <div className="flex items-center gap-3 py-2">
                    <Switch
                      checked={on}
                      disabled={isReadOnly}
                      onChange={(val: boolean) =>
                        field.onChange(val ? "enabled" : "disabled")
                      }
                      label={on ? t("enabled") : t("disabled")}
                    />
                  </div>
                );
              }}
            />
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
          {!isReadOnly ? (
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default CreateApplicationSoftwareModuleModal;
