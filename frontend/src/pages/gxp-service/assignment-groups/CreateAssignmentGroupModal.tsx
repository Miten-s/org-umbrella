import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import TextArea from "@/components/common/form/input/TextArea";

import { getAssignmentGroupSchema } from "@/lib/schema";
import { User } from "@/types/common.types";

interface CreateAssignmentGroupModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  users?: User[];
}

type CreateAssignmentGroupForm = z.infer<typeof getAssignmentGroupSchema>;

const CreateAssignmentGroupModal = ({
  onClose,
  onSubmit,
  initialData,
  users = [],
}: CreateAssignmentGroupModalProps) => {
  const { t } = useTranslation();

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
      manager: initialData?.manager?.userId || "",
      members: initialData?.members?.map((m: any) => m.userId) || [],
      description: initialData?.description || "",
    },
  });

  const description = useWatch({ control, name: "description" });

  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false);
  const [membersDropdownOpen, setMembersDropdownOpen] = useState(false);

  const selectedManagerId = useWatch({ control, name: "manager" });
  const selectedMemberIds = useWatch({ control, name: "members" });

  const getManagerName = (id: string) =>
    users.find((u) => u._id === id)?.fullName || "";

  const handleManagerSelect = (id: string) => {
    setValue("manager", id, { shouldValidate: true });
    setManagerDropdownOpen(false);
  };

  const handleMemberSelect = (id: string) => {
    const currentMembers = selectedMemberIds || [];
    const newMembers = currentMembers.includes(id)
      ? currentMembers.filter((memberId) => memberId !== id)
      : [...currentMembers, id];
    setValue("members", newMembers, { shouldValidate: true });
  };

  const handleFormSubmit = (data: CreateAssignmentGroupForm) => {
    const managerObject = {
      userId: data.manager,
      name: users.find(u => u._id === data.manager)?.fullName,
    };
    const membersArray = data.members.map(memberId => ({
      userId: memberId,
      name: users.find(u => u._id === memberId)?.fullName,
    }));

    const submissionData = {
      ...data,
      manager: managerObject,
      members: membersArray,
    };
    onSubmit(submissionData);
  };

  return (
    <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {t(initialData ? "edit" : "create", { entity: t("gxpAssignmentGroups") })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Group Name */}
          <div>
            <Label htmlFor="groupName" required>
              {t("groupName")}
            </Label>
            <Input
              {...register("groupName")}
              error={!!errors.groupName}
              hint={errors.groupName?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Manager Dropdown */}
          <div className="relative">
            <Label required>{t("manager")}</Label>
            <input type="hidden" {...register("manager")} />
            <button
              type="button"
              onClick={() => setManagerDropdownOpen((prev) => !prev)}
              className="input flex justify-between items-center dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <span className="text-theme-sm dark:text-gray-400">
                {getManagerName(selectedManagerId) ||
                  t("select", { entity: t("manager") })}
              </span>
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.5 7l4.5 4.5L14.5 7z" />
              </svg>
            </button>

            <Dropdown
              isOpen={managerDropdownOpen}
              onClose={() => setManagerDropdownOpen(false)}
              className="absolute z-10 mt-1 w-full rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-md text-gray-900 dark:text-gray-100"
            >
              {users.map((user) => (
                <DropdownItem
                  key={user._id}
                  onItemClick={() => handleManagerSelect(user._id)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {user.fullName}
                </DropdownItem>
              ))}
            </Dropdown>

            {errors.manager && (
              <p className="text-xs text-error-500 mt-1">
                {errors.manager.message}
              </p>
            )}
          </div>

          {/* Members Dropdown */}
          <div className="relative col-span-2">
            <Label required>{t("members")}</Label>
            <input type="hidden" {...register("members")} />
            <button
              type="button"
              onClick={() => setMembersDropdownOpen((prev) => !prev)}
              className="input flex justify-between items-center dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            >
              <span className="text-theme-sm dark:text-gray-400">
                {selectedMemberIds?.length > 0
                  ? `${selectedMemberIds.length} members selected`
                  : t("select", { entity: t("members") })}
              </span>
              <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.5 7l4.5 4.5L14.5 7z" />
              </svg>
            </button>

            <Dropdown
              isOpen={membersDropdownOpen}
              onClose={() => setMembersDropdownOpen(false)}
              className="absolute z-10 mt-1 w-full rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 shadow-md text-gray-900 dark:text-gray-100"
            >
              {users.map((user) => (
                <DropdownItem
                  key={user._id}
                  onItemClick={() => handleMemberSelect(user._id)}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <input
                    type="checkbox"
                    checked={selectedMemberIds?.includes(user._id)}
                    readOnly
                    className="mr-2"
                  />
                  {user.fullName}
                </DropdownItem>
              ))}
            </Dropdown>

            {errors.members && (
              <p className="text-xs text-error-500 mt-1">
                {errors.members.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="col-span-2">
            <Label>{t("description")}</Label>
            <TextArea
              value={description || ""}
              onChange={(val) => setValue("description", val)}
              error={!!errors.description}
              hint={errors.description?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
        </div>

        {/* Action Buttons */}
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

export default CreateAssignmentGroupModal;
