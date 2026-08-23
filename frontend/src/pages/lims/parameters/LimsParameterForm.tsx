import { useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { useParameterTypeOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { limsParameterSchema, type LimsParameterFormValues } from "./LimsParameter.schema";
import type { LimsParameter, LimsParameterPayload, LimsRef } from "./LimsParameter.types";

export type LimsParameterFormMode = "create" | "edit" | "view";

interface LimsParameterFormProps {
  mode?: LimsParameterFormMode;
  initialData?: LimsParameter | null;
  onClose: () => void;
  onSubmit: (payload: LimsParameterPayload) => Promise<void> | void;
  submitting?: boolean;
}

const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsParameterForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false
}: LimsParameterFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsParameterFormValues>(
    () => ({
      parameterId: initialData?.parameterId ?? "",
      parameterName: initialData?.parameterName ?? "",
      parameterType: initialData?.parameterType?.id ?? "",
      defaultValue: initialData?.defaultValue ?? "",
      unit: initialData?.unit ?? ""
    }),
    [initialData]
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LimsParameterFormValues>({
    resolver: zodResolver(limsParameterSchema),
    defaultValues: initialValues
  });

  const busy = submitting || isSubmitting;

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        onSubmit={handleSubmit((values) => {
          // Edit + nothing actually changed: skip the reason modal, update
          // call, and audit entry entirely — a no-op Save just closes.
          if (mode === "edit" && isPayloadEqual(values, initialValues)) {
            onClose();
            return;
          }
          onSubmit(values);
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsParameter") })
            : initialData
              ? t("update", { entity: t("limsParameter") })
              : t("create", { entity: t("limsParameter") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <Label required>{t("limsParameterId")}</Label>
            <Input
              {...register("parameterId")}
              disabled={isReadOnly}
              error={!!errors.parameterId}
              hint={errors.parameterId?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label required>{t("limsParameterName")}</Label>
            <Input
              {...register("parameterName")}
              disabled={isReadOnly}
              error={!!errors.parameterName}
              hint={errors.parameterName?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label>{t("limsParameterType")}</Label>
            <Controller
              name="parameterType"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useParameterTypeOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.parameterType}
                  placeholder={t("select", { entity: t("limsParameterType") })}
                  initialSelectedOptions={seedOne(initialData?.parameterType)}
                />
              )}
            />
            {errors.parameterType ? (
              <p className="mt-1 text-xs text-red-500">{errors.parameterType.message}</p>
            ) : null}
          </div>

          <div className="min-w-0">
            <Label>{t("limsDefaultValue")}</Label>
            <Input
              {...register("defaultValue")}
              disabled={isReadOnly}
              error={!!errors.defaultValue}
              hint={errors.defaultValue?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label>{t("limsUnit")}</Label>
            <Input
              {...register("unit")}
              disabled={isReadOnly}
              error={!!errors.unit}
              hint={errors.unit?.message}
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

export default LimsParameterForm;
