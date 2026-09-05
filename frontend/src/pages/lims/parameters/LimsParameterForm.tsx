import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { useParameterTypeOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import {
  limsParameterSchema,
  limsParameterCopySchema,
  type LimsParameterFormValues
} from "./LimsParameter.schema";
import type { LimsParameter, LimsParameterPayload, LimsRef } from "./LimsParameter.types";

/** "copy" renders like "create" except the business ID starts blank (stays EDITABLE —
 * `applyBusinessId` only mints when empty, otherwise honors what the user typed). */
export type LimsParameterFormMode = "create" | "edit" | "view" | "copy" | "bulk-edit";

interface LimsParameterFormProps {
  mode?: LimsParameterFormMode;
  initialData?: LimsParameter | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: LimsParameterPayload) => Promise<void> | void;
  submitting?: boolean;
  /** Overrides the submit button's label — CopyStepper uses this to say
   * "Next" on every step but the last, where the batch actually saves. */
  submitLabel?: string;
  /** Grays out the submit button without a spinner — EditStepper uses
   * this on the last step now that its own Save button lives outside it. */
  disabled?: boolean;
  /** Set on the `<form>` element so an outside button (CopyStepper's
   * header Next/Save) can submit it via `<Button form={formId}>`. */
  formId?: string;
  /** " (2 of 5)" appended after the title when Copy is reviewing more
   * than one record — undefined otherwise. */
  stepLabel?: string;
}

const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsParameterForm = ({
  mode = "create",
  initialData,
  onClose,
  onUnchanged,
  onSubmit,
  submitting = false,
  submitLabel,
  disabled = false,
  formId,
  stepLabel
}: LimsParameterFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsParameterFormValues>(
    () => ({
      parameterId: mode === "copy" ? "" : (initialData?.parameterId ?? ""),
      parameterName: initialData?.parameterName ?? "",
      parameterType: initialData?.parameterType?.id ?? "",
      defaultValue: initialData?.defaultValue ?? "",
      unit: initialData?.unit ?? ""
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting }
  } = useForm<LimsParameterFormValues>({
    resolver: zodResolver(mode === "copy" ? limsParameterCopySchema : limsParameterSchema),
    defaultValues: initialValues
  });

  // Only for the client-side type/value consistency check below — never submitted itself,
  // since the payload only ever carries the type's id (see LimsParameter.schema).
  const [typeLabel, setTypeLabel] = useState(initialData?.parameterType?.name ?? "");

  const busy = submitting || isSubmitting;

  /** Mirrors the server's own check (parameter.routes.ts) so the mismatch surfaces
   * before a round-trip — Text/Option carry no constraint. */
  const validateDefaultValueAgainstType = (defaultValue: string) => {
    const value = defaultValue.trim();
    if (!value) return true;
    const type = typeLabel.trim().toLowerCase();
    if (type === "numeric" && Number.isNaN(Number(value))) {
      setError("defaultValue", { type: "manual", message: `"${value}" is not a valid number for a Numeric parameter.` });
      return false;
    }
    if (type === "date" && Number.isNaN(Date.parse(value))) {
      setError("defaultValue", { type: "manual", message: `"${value}" is not a valid date for a Date parameter.` });
      return false;
    }
    if (type === "boolean" && !["true", "false"].includes(value.toLowerCase())) {
      setError("defaultValue", { type: "manual", message: `"${value}" must be true or false for a Boolean parameter.` });
      return false;
    }
    clearErrors("defaultValue");
    return true;
  };

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        id={formId}
        onSubmit={handleSubmit((values) => {
          // Edit + nothing actually changed: skip the reason modal, update
          // call, and audit entry entirely — a no-op Save just closes.
          if ((mode === "edit" || mode === "bulk-edit") && isPayloadEqual(values, initialValues)) {
            (onUnchanged ?? onClose)();
            return;
          }
          if (!validateDefaultValueAgainstType(values.defaultValue ?? "")) return;
          onSubmit(values);
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsParameter") })
                        : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsParameter") })}${stepLabel ?? ""}`
              : initialData
              ? `${t("update", { entity: t("limsParameter") })}${stepLabel ?? ""}`
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
                  onChangeOption={(option) => setTypeLabel(option?.label ?? "")}
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
            <Button type="submit" variant="primary" loading={busy} disabled={busy || disabled}>
              {submitLabel ?? t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default LimsParameterForm;
