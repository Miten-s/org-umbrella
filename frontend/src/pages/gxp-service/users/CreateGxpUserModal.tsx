// src/pages/gxp/CreateGxpUserModal.tsx
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import Switch from "@/components/common/form/switch/Switch";
import MultiSelect from "@/components/common/form/MultiSelect";
import { getGxpUserSchema, GxpUserFormInput, GxpUserFormOutput } from "@/lib/schema";

type Role = { _id: string; name: string };
type BareUser = { _id: string; fullName?: string; name?: string };

export interface GxpUserEntity {
    _id: string;
    user: { id: string; name: string };
    userType: "User" | "Resolver";
    roles: string[];
    description?: string;
    status: "enabled" | "disabled";
}

interface CreateGxpUserModalProps {
    onClose: () => void;
    onSubmit: (payload: Partial<GxpUserEntity>) => void;
    initialData?: GxpUserEntity;
    selectableUsers: BareUser[];
    selectableRoles: Role[];
    mode?: "create" | "edit" | "view";
}

const CreateGxpUserModal = ({
    onClose,
    onSubmit,
    initialData,
    selectableUsers,
    selectableRoles,
    mode = "create",
}: CreateGxpUserModalProps) => {
    const { t } = useTranslation();
    const isReadOnly = mode === "view";

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm<GxpUserFormInput>({
        resolver: zodResolver(getGxpUserSchema),
        defaultValues: {
            userId: initialData?.user?.id ?? "",
            userType: initialData?.userType ?? "User",
            roleId: Array.isArray(initialData?.roles)
                ? initialData?.roles
                : initialData?.roles
                ? [initialData.roles]
                : [],
            description: initialData?.description ?? "",
            status: initialData?.status ?? "enabled",
        } satisfies GxpUserFormInput,
    });

    const userOptions =
        selectableUsers?.map(u => ({
            label: u.fullName ?? u.name ?? u._id,
            value: u._id,
        })) ?? [];

    const normalizeArray = (val: any): string[] => {
        if (Array.isArray(val)) return val.map(String).filter(Boolean);
        if (val && typeof val === "object" && "value" in val) return [String(val.value ?? "")].filter(Boolean);
        return val == null ? [] : [String(val)].filter(Boolean);
    };

    const normalizeScalar = (val: any): string => {
        if (Array.isArray(val)) return val[0] ?? "";
        if (val && typeof val === "object" && "value" in val) return String(val.value ?? "");
        return val == null ? "" : String(val);
    };

    const onFormSubmit = (raw: GxpUserFormInput) => {
        // normalize select values that might be arrays or {label,value}
        const normalized: GxpUserFormInput = {
            userId: normalizeScalar(raw.userId),
            userType: normalizeScalar(raw.userType) as GxpUserFormInput["userType"],
            roleId: normalizeArray(raw.roleId),
            description: raw.description ?? "",
            status: normalizeScalar(raw.status) as "enabled" | "disabled",
        };

        // apply defaults & validate
        const parsed: GxpUserFormOutput = getGxpUserSchema.parse(normalized);

        // look up the user's name here (not in the form state)
        const name =
            selectableUsers.find(u => u._id === parsed.userId)?.fullName ??
            selectableUsers.find(u => u._id === parsed.userId)?.name ??
            "";

        const payload: Partial<GxpUserEntity> = {
            user: { id: parsed.userId, name },         // 👈 backend shape here
            userType: parsed.userType,
            roles: parsed.roleId,
            description: parsed.description,
            status: parsed.status,
        };

        onSubmit(payload);
    };

    return (
        <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
                <h2 className="text-xl font-semibold">
                    {isReadOnly
                        ? t("view", { entity: t("gxpUsers") })
                        : initialData
                            ? t("update", { entity: t("gxpUsers") })
                            : t("create", { entity: t("gxpUsers") })}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User */}
                    <div>
                        <Label htmlFor="userId" required>{t("user")}</Label>
                        <Controller
                            name="userId"
                            control={control}
                            render={({ field }) => (
                                <SelectDropdown
                                    disabled={isReadOnly}
                                    value={field.value}
                                    onChange={(val: string) => field.onChange(val)}
                                    options={userOptions}
                                    placeholder={t("select", { entity: t("user") })}
                                />
                            )}
                        />
                        {errors.userId && <p className="text-red-500 text-xs mt-1">{errors.userId.message}</p>}
                    </div>

                    {/* User Type */}
                    <div>
                        <Label htmlFor="userType" required>{t("userType")}</Label>
                        <Controller
                            name="userType"
                            control={control}
                            render={({ field }) => (
                                <SelectDropdown
                                    disabled={isReadOnly}
                                    value={field.value}
                                    onChange={(val: string) => field.onChange(val)}
                                    options={[
                                        { label: "User", value: "User" },
                                        { label: "Resolver", value: "Resolver" },
                                    ]}
                                    placeholder={t("select", { entity: t("userType") })}
                                />
                            )}
                        />
                        {errors.userType && <p className="text-red-500 text-xs mt-1">{errors.userType.message as string}</p>}
                    </div>

                    {/* Assign Roles */}
                    <div className="md:col-span-2">
                        <Label htmlFor="roleId" required>{t("assignRoles")}</Label>
                        <Controller
                            name="roleId"
                            control={control}
                            render={({ field }) => (
                                <MultiSelect
                                    disabled={isReadOnly}
                                    options={selectableRoles.map(role => ({ text: role.name, value: role._id }))}
                                    label={t("selectRoles")}
                                    onChange={field.onChange}
                                    defaultSelected={field.value}
                                />
                            )}
                        />
                        {errors.roleId && <p className="text-red-500 text-xs mt-1">{errors.roleId.message as string}</p>}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <Label htmlFor="description">{t("description")}</Label>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <TextArea
                                    disabled={isReadOnly}
                                    value={field.value}
                                    onChange={field.onChange}
                                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
                                />
                            )}
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message as string}</p>}
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
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
                                            onChange={(val: boolean) => field.onChange(val ? "enabled" : "disabled")}
                                            label={on ? t("enabled") : t("disabled")}
                                        />
                                    </div>
                                );
                            }}
                        />
                        {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message as string}</p>}
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

export default CreateGxpUserModal;
