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
  mode = "create"
}: CreateAssignmentGroupModalProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  console.log('allUsers', allUsers);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors }
  } = useForm<CreateAssignmentGroupForm>({
    resolver: zodResolver(getAssignmentGroupSchema),
    defaultValues: {
      groupName: "",
      manager: { userId: "", name: "" },
      members: [],
      description: "",
      isActive: true
    }
  });

  const normalizeInitialData = (data: any) => ({
    groupName: data?.groupName || "",
    manager: {
      userId: data?.manager?.userId || data?.manager?._id || "",
      name: data?.manager?.name || data?.manager?.fullName || ""
    },
    members: Array.isArray(data?.members)
      ? data.members.map((member: any) => ({
        userId: member?.userId || member?._id || "",
        name: member?.name || member?.fullName || ""
      }))
      : [],
    description: data?.description || "",
    isActive: data?.isActive ?? true
  });

  useEffect(() => {
    reset(normalizeInitialData(initialData));
  }, [initialData, reset]);

  const description = useWatch({ control, name: "description" });
  const isActive = useWatch({ control, name: "isActive" });
  useEffect(() => {
    if (isReadOnly) {
      return;
    }

    const fetchUsers = async () => {
      const { users } = await getUsers({ limit: 100 });
      setAllUsers(users);
      setAdminUsers(
        users.filter((user: User) => user.userType === UserTypes.ADMIN)
      );
    };

    fetchUsers();
  }, [isReadOnly]);
  const userOptions = allUsers.map((user) => ({
    text: user.fullName, // <-- Change 'label' to 'text'
    value: user._id
  }));

  const adminUserOptions: SelectOption[] = adminUsers.map((user) => ({
    label: user.fullName,
    value: user._id
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
          {/* Manager */}
          <div>
            <Label htmlFor="manager" required>
              {t("manager")}
            </Label>

            {isReadOnly ? (
              <Input
                value={initialData?.manager?.name || "-"}
                disabled
                className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
              />
            ) : (
              <Controller
                name="manager"
                control={control}
                render={({ field }) => (
                  <SelectDropdown
                    value={field.value.userId}
                    onChange={(val: string) => {
                      const selectedUser = adminUsers?.find(
                        (user) => user._id === val
                      );

                      field.onChange({
                        userId: val,
                        name: selectedUser?.fullName || ""
                      });
                    }}
                    options={adminUserOptions}
                    placeholder={t("select", { entity: t("manager") })}
                  />
                )}
              />
            )}

            {errors.manager && !isReadOnly && (
              <p className="text-red-500 text-xs mt-1">
                {errors.manager.message}
              </p>
            )}
          </div>

          {/* Members */}
          {/* Members */}
          <div>
            <Label htmlFor="members">{t("members")}</Label>

            {isReadOnly ? (
              <div className="flex min-h-11 flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                {Array.isArray(initialData?.members) && initialData.members.length ? (
                  initialData.members.map((member: any) => (
                    <span
                      key={member.userId || member._id}
                      className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                    >
                      {member.name || member.fullName || "-"}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">-</span>
                )}
              </div>
            ) : (
              <Controller
                name="members"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    options={userOptions}
                    label={t("members")}
                    onChange={(selectedValues: string[]) => {
                      const selectedMembers = allUsers
                        ?.filter((user) => selectedValues.includes(user._id))
                        .map((user) => ({
                          userId: user._id,
                          name: user.fullName
                        }));

                      field.onChange(selectedMembers);
                    }}
                    defaultSelected={
                      Array.isArray(field.value)
                        ? field.value.map((m: any) => m.userId || m._id).filter(Boolean)
                        : []
                    }
                  />
                )}
              />
            )}
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
