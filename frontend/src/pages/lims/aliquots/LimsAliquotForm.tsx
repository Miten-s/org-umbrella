import { useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import SubFormGrid from "@/components/data/SubFormGrid";

import { useLimsStockBatchOptions } from "@/pages/lims/stock-batches/LimsStockBatch.queries";
import { seedRefOption } from "@/utils/refLabel";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { limsAliquotSchema, limsAliquotCopySchema, type LimsAliquotFormValues } from "./LimsAliquot.schema";
import type { LimsAliquot, LimsAliquotPayload, LimsAliquotRow } from "./LimsAliquot.types";

/**
 * "copy" renders like "create" (fully editable) except the business ID
 * starts blank instead of pre-filled with the source's — stays EDITABLE,
 * not disabled: `applyBusinessId` mints a fresh one only when the field
 * is empty, and otherwise honors whatever the user typed (subject to the
 * usual uniqueness check). Used by CopyStepper.
 */
export type LimsAliquotFormMode = "create" | "edit" | "view" | "copy";

interface LimsAliquotFormProps {
  mode?: LimsAliquotFormMode;
  initialData?: LimsAliquot | null;
  onClose: () => void;
  onSubmit: (payload: LimsAliquotPayload) => Promise<void> | void;
  submitting?: boolean;
  /** Overrides the submit button's label — CopyStepper uses this to say
   * "Next" on every step but the last, where the batch actually saves. */
  submitLabel?: string;
  /** Set on the `<form>` element so an outside button (CopyStepper's
   * header Next/Save) can submit it via `<Button form={formId}>`. */
  formId?: string;
  /** " (2 of 5)" appended after the title when Copy is reviewing more
   * than one record — undefined otherwise. */
  stepLabel?: string;
}

const LimsAliquotForm = ({
  mode = "create",
  initialData,
  onClose,
  onSubmit,
  submitting = false,
  submitLabel,
  formId,
  stepLabel
}: LimsAliquotFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const initialAliquotsRef = useRef(initialData?.aliquots ?? []);
  const [aliquots, setAliquots] = useState<LimsAliquotRow[]>(initialAliquotsRef.current);

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsAliquotFormValues>(
    () => ({
      aliquotSetId: mode === "copy" ? "" : (initialData?.aliquotSetId ?? ""),
      stockBatch: initialData?.stockBatch?.id ?? "",
      aliquotsNumber: initialData?.aliquotsNumber ?? "",
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LimsAliquotFormValues>({
    resolver: zodResolver(mode === "copy" ? limsAliquotCopySchema : limsAliquotSchema),
    defaultValues: initialValues
  });

  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsAliquotFormValues,
    label: string,
    required = false,
    type = "text",
    forceDisabled = false
  ) => (
    <div className="min-w-0">
      <Label required={required}>{label}</Label>
      <Input
        {...register(name)}
        type={type}
        disabled={isReadOnly || forceDisabled}
        error={!!errors[name]}
        hint={errors[name]?.message as string}
        className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
      />
    </div>
  );

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        id={formId}
        onSubmit={handleSubmit((values) => {
          // Edit + nothing actually changed: skip the reason modal, update
          // call, and audit entry entirely — a no-op Save just closes.
          if (
            mode === "edit" &&
            isPayloadEqual(values, initialValues) &&
            isPayloadEqual(aliquots, initialAliquotsRef.current)
          ) {
            onClose();
            return;
          }
          onSubmit({ ...values, aliquots });
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsAliquot") })
                        : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsAliquot") })}${stepLabel ?? ""}`
              : initialData
              ? t("update", { entity: t("limsAliquot") })
              : t("create", { entity: t("limsAliquot") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("aliquotSetId", t("limsAliquotSetId"), true, "text")}
          <div className="min-w-0">
            <Label required={true}>{t("limsStockBatch")}</Label>
            <Controller
              name="stockBatch"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsStockBatchOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsStockBatch") })}
                  initialSelectedOptions={seedRefOption(initialData?.stockBatch)}
                />
              )}
            />
          </div>
          {text("aliquotsNumber", t("limsAliquotsNumber"), false, "number")}
          <div className="col-span-full min-w-0">
            <SubFormGrid<LimsAliquotRow>
              label={t("limsAliquotsList")}
              rows={aliquots}
              onChange={setAliquots}
              disabled={isReadOnly}
              columns={[
                { key: "aliquotId", header: t("limsAliquotId") },
                { key: "description", header: t("description") },
                { key: "quantity", header: t("limsQuantity"), type: "number" },
                { key: "unit", header: t("limsUnit") }
              ]}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" type="button" onClick={onClose} disabled={busy}>
            {t("cancel")}
          </Button>
          {!isReadOnly ? (
            <Button type="submit" variant="primary" loading={busy}>
              {submitLabel ?? t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default LimsAliquotForm;
