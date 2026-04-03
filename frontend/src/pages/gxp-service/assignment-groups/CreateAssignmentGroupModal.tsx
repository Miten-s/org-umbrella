import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";

import { getAssignmentGroupSchema } from "@/lib/schema";
import { User } from "@/types/common.types";
import MultiSelect from "@/components/common/form/MultiSelect";
import Switch from "@/components/common/form/switch/Switch";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { getUsers } from "@/services/admin.service";
import { UserTypes } from "@/utils/common.constants";

interface CreateAssignmentGroupModalProps {
  onClose: () => void;
  onSubmit: (data: CreateAssignmentGroupForm) => void;
  initialData?: any;
  mode?: "create" | "edit" | "view";
}

interface SelectOption {
  value: string;
  label: string;
}

type CreateAssignmentGroupForm = z.infer<typeof getAssignmentGroupSchema>;

const CreateAssignmentGroupModal = ({
  onClose,
  onSubmit,
  initialData,
  mode = "create",
}: CreateAssignmentGroupModalProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateAssignmentGroupForm>({
    resolver: zodResolver(getAssignmentGroupSchema),
    defaultValues: {
      groupName: initialData?.groupName || "",
      manager: initialData?.manager || { userId: "", name: "" },
      members: initialData?.members || [],
      description: initialData?.description || "",
      isActive: initialData?.isActive ?? true,
    },
  });

  const description = useWatch({ control, name: "description" });
  const isActive = useWatch({ control, name: "isActive" });
  useEffect(() => {
    const fetchUsers = async () => {
      const { users } = await getUsers();
      setAllUsers(users);
      setAdminUsers(users.filter((user: User) => user.userType === UserTypes.ADMIN));
    };
    fetchUsers();
  }, []);

  const userOptions = allUsers.map((user) => ({
    text: user.fullName, // <-- Change 'label' to 'text'
    value: user._id,
  }));

  const adminUserOptions: SelectOption[] = adminUsers.map((user) => ({
    label: user.fullName,
    value: user._id,
  }));

  return (
    <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("group") })
            : initialData
              ? t("update", { entity: t("group") })
              : t("create", { entity: t("group") })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Group Name */}
          <div>
            <Label htmlFor="groupName" required>
              {t("groupName")}
            </Label>
            <Input
              {...register("groupName")}
              disabled={isReadOnly}
              error={!!errors.groupName}
              hint={errors.groupName?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Manager */}
          <div>
            <Label htmlFor="manager" required>
              {t("manager")}
            </Label>
            <Controller
              name="manager"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  disabled={isReadOnly}
                  value={field.value.userId}
                  onChange={(val: string) => {
                    const selectedUser = adminUsers?.find((user) => user._id === val);
                    field.onChange({
                      userId: val,
                      name: selectedUser?.fullName || "",
                    });
                  }}
                  options={adminUserOptions}
                  placeholder={t("select", { entity: t("manager") })}
                />
              )}
            />
            {errors.manager && <p className="text-red-500 text-xs mt-1">{errors.manager.message}</p>}
          </div>

          {/* Members */}
          <div>
            <Label htmlFor="members">{t("members")}</Label>
            <Controller
              name="members"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  disabled={isReadOnly}
                  options={userOptions}
                  label={t("members")}
                  onChange={(selectedValues: string[]) => {
                    const selectedMembers = allUsers?.filter((user) =>
                      selectedValues.includes(user._id)
                    ).map((user) => ({ userId: user._id, name: user.fullName }));
                    field.onChange(selectedMembers);
                  }}
                  defaultSelected={Array.isArray(field.value) ? field.value.map((m: any) => m.userId) : []}
                />
              )}
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

          {/* Is Active */}
          <div>
            <Label>{t("isActive")}</Label>
            <Switch
              label={isActive ? t("active") : t("inactive")}
              checked={isActive}
              disabled={isReadOnly}
              onChange={(checked) => setValue("isActive", checked)}
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

export default CreateAssignmentGroupModal;
