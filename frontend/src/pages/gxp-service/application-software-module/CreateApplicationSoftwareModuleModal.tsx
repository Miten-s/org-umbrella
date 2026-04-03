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
import type { Application, ApplicationSoftwareModule } from "@/types/gxp-service.types";

type AppSoftwareModuleFormInput = z.input<typeof getApplicationSoftwareModuleSchema>;
type AppSoftwareModuleFormOutput = z.output<typeof getApplicationSoftwareModuleSchema>;

interface CreateApplicationSoftwareModuleModalProps {
    onClose: () => void;
    onSubmit: (data: Partial<AppSoftwareModuleFormOutput>) => void;
    initialData?: Partial<AppSoftwareModuleFormOutput> & Pick<Partial<ApplicationSoftwareModule>, "moduleId">;
    applications: Application[];
    mode?: "create" | "edit" | "view";
}

const CreateApplicationSoftwareModuleModal = ({
    onClose,
    onSubmit,
    initialData,
    applications,
    mode = "create",
}: CreateApplicationSoftwareModuleModalProps) => {
    const { t } = useTranslation();
    const isReadOnly = mode === "view";
    const moduleIdentity = initialData?.moduleId?.trim() || "-";

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AppSoftwareModuleFormInput>({
        resolver: zodResolver(getApplicationSoftwareModuleSchema),
        defaultValues: {
            moduleName: initialData?.moduleName ?? "",
            application: initialData?.application ?? "",
            status: initialData?.status ?? "enabled",
        },
    });

    const onFormSubmit = (data: AppSoftwareModuleFormInput) => {
        const parsed = getApplicationSoftwareModuleSchema.parse(data);
        onSubmit({
            ...parsed,
            application: parsed.application || undefined,
        });
    };

    return (
        <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <h2 className="text-xl font-semibold">
                    {isReadOnly
                        ? t("view", { entity: t("gxpAppModules") })
                        : initialData
                            ? t("update", { entity: t("gxpAppModules") })
                            : t("create", { entity: t("gxpAppModules") })}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                    <div className="md:col-span-2">
                        <Label htmlFor="identity">{t("identity", { defaultValue: "Identity" })}</Label>
                        <Input
                            id="identity"
                            value={moduleIdentity}
                            readOnly
                            disabled
                            className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label htmlFor="moduleName" required>{t("moduleName")}</Label>
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
                                        value: app._id,
                                    }))}
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

export default CreateApplicationSoftwareModuleModal;
