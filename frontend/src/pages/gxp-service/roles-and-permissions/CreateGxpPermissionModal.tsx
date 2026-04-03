import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import TextArea from "@/components/common/form/input/TextArea";

import { getGxpPermissionSchema } from "@/lib/schema";

interface CreateGxpPermissionModalProps {
  onClose: () => void;
  onSubmit: (data: CreateGxpPermissionForm) => void;
  initialData?: any;
  mode?: "create" | "edit" | "view";
}

type CreateGxpPermissionForm = z.infer<typeof getGxpPermissionSchema>;

const CreateGxpPermissionModal = ({
  onClose,
  onSubmit,
  initialData,
  mode = "create",
}: CreateGxpPermissionModalProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateGxpPermissionForm>({
    resolver: zodResolver(getGxpPermissionSchema),
    defaultValues: {
      permissionName: initialData?.permissionName || "",
      description: initialData?.description || "",
    },
  });

  const description = useWatch({ control, name: "description" });

  return (
    <div className="p-6 max-h-[120vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("gxpPermissions") })
            : t(initialData ? "edit" : "create", { entity: t("gxpPermissions") })}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Permission Name */}
          <div>
            <Label htmlFor="permissionName" required>
              {t("permissionName")}
            </Label>
            <Input
              {...register("permissionName")}
              disabled={isReadOnly}
              error={!!errors.permissionName}
              hint={errors.permissionName?.message}
              className="dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>

          {/* Description */}
          <div className="col-span-2">
            <Label>{t("description")}</Label>
            <TextArea
              value={description || ""}
              disabled={isReadOnly}
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

export default CreateGxpPermissionModal;
