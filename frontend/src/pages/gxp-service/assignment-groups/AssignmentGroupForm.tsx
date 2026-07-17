import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";
import Switch from "@/components/common/form/switch/Switch";
import AsyncSelect from "@/components/data/AsyncSelect";
import { useUserOptions } from "@/pages/system-it-admin/users/User.queries";
import { assignmentGroupSchema, type AssignmentGroupFormValues } from "./AssignmentGroup.schema";
import type { AssignmentGroup, GroupMember } from "./AssignmentGroup.types";
import type { AsyncOption } from "@/lib/query/listTypes";

export type AssignmentGroupFormMode = "create" | "edit" | "view";

interface AssignmentGroupFormProps {
  mode?: AssignmentGroupFormMode;
  initialData?: AssignmentGroup | null;
  onClose: () => void;
  onSubmit: (values: AssignmentGroupFormValues) => Promise<void> | void;
  submitting?: boolean;
}

const memberSeed = (members?: GroupMember[]): AsyncOption[] | undefined =>
  members?.length ? members.map((m) => ({ value: m.userId, label: m.name })) : undefined;

const managerSeed = (manager?: GroupMember): AsyncOption[] | undefined =>
  manager?.userId ? [{ value: manager.userId, label: manager.name }] : undefined;

/**
 * Assignment Group form. manager (single) and members (multi) are stored as
 * { userId, name } objects — built from AsyncSelect's additive onChangeOption /
 * onChangeOptions (full { value, label }). Labels seed from the record on edit.
 */
const AssignmentGroupForm = ({ mode = "create", initialData, onClose, onSubmit, submitting = false }: AssignmentGroupFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<AssignmentGroupFormValues>({
    resolver: zodResolver(assignmentGroupSchema),
    defaultValues: {
      groupName: initialData?.groupName || "",
      manager: initialData?.manager ?? { userId: "", name: "" },
      members: initialData?.members ?? [],
      description: initialData?.description || "",
      isActive: initialData?.isActive ?? true
    }
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit((values) => onSubmit(values))} className="min-w-0 space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("assignmentGroup") })
            : initialData
              ? t("update", { entity: t("assignmentGroup") })
              : t("create", { entity: t("assignmentGroup") })}
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label required>{t("groupName")}</Label>
            <Input
              {...register("groupName")}
              disabled={isReadOnly}
              error={!!errors.groupName}
              hint={errors.groupName?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div>
            <Label required>{t("manager")}</Label>
            <Controller
              name="manager"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useUserOptions}
                  value={field.value?.userId || ""}
                  onChange={() => {}}
                  onChangeOption={(option) =>
                    field.onChange(option ? { userId: option.value, name: option.label } : { userId: "", name: "" })
                  }
                  disabled={isReadOnly}
                  error={!!errors.manager}
                  placeholder={t("select", { entity: t("manager") })}
                  initialSelectedOptions={managerSeed(initialData?.manager)}
                />
              )}
            />
            {errors.manager?.userId && (
              <p className="mt-1 text-xs text-error-500">{errors.manager.userId.message as string}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <Label>{t("members")}</Label>
            <Controller
              name="members"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  multi
                  useOptions={useUserOptions}
                  value={(field.value ?? []).map((m) => m.userId)}
                  onChange={() => {}}
                  onChangeOptions={(options) =>
                    field.onChange(options.map((o) => ({ userId: o.value, name: o.label })))
                  }
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("members") })}
                  initialSelectedOptions={memberSeed(initialData?.members)}
                />
              )}
            />
          </div>

          <div>
            <Label>{t("status")}</Label>
            <Controller
              name="isActive"
              control={control}
              render={({ field: { value, onChange } }) => (
                <Switch
                  label={value ? t("active") : "Inactive"}
                  checked={!!value}
                  disabled={isReadOnly}
                  onChange={onChange}
                />
              )}
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

export default AssignmentGroupForm;
