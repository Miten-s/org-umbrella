import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import Label from "@/components/common/form/Label";
import Input from "@/components/common/form/input/InputField";
import Button from "@/components/ui/button/Button";
import Switch from "@/components/common/form/switch/Switch";
import { getApplicationSoftwareModuleSchema } from "@/lib/schema";

type AppSoftwareModuleFormInput = z.input<typeof getApplicationSoftwareModuleSchema>;
type AppSoftwareModuleFormOutput = z.output<typeof getApplicationSoftwareModuleSchema>;

interface CreateApplicationSoftwareModuleModalProps {
    onClose: () => void;
    onSubmit: (data: Partial<AppSoftwareModuleFormOutput>) => void;
    initialData?: Partial<AppSoftwareModuleFormOutput>;
}

const CreateApplicationSoftwareModuleModal = ({
    onClose,
    onSubmit,
    initialData,
}: CreateApplicationSoftwareModuleModalProps) => {
    const { t } = useTranslation();

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<AppSoftwareModuleFormInput>({
        resolver: zodResolver(getApplicationSoftwareModuleSchema),
        defaultValues: {
            moduleName: initialData?.moduleName ?? "",
            status: initialData?.status ?? "enabled",
        },
    });

    const onFormSubmit = (data: AppSoftwareModuleFormInput) => {
        const parsed = getApplicationSoftwareModuleSchema.parse(data);
        onSubmit(parsed);
    };

    return (
        <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <h2 className="text-xl font-semibold">
                    {t(initialData ? "edit" : "create", { entity: t("gxpAppModules") })}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    {/* Module Name */}
                    <div>
                        <Label htmlFor="moduleName" required>{t("moduleName")}</Label>
                        <Input
                            {...register("moduleName")}
                            error={!!errors.moduleName}
                            hint={errors.moduleName?.message}
                            className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
                        />
                    </div>

                    {/* Active */}
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
                    <Button type="submit" variant="primary">
                        {t("save")}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateApplicationSoftwareModuleModal;
