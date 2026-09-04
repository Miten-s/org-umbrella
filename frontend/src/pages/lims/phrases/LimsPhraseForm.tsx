import { useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import SubFormGrid from "@/components/data/SubFormGrid";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { limsPhraseSchema, type LimsPhraseFormValues } from "./LimsPhrase.schema";
import type {
  LimsPhrase,
  LimsPhraseEntry,
  LimsPhrasePayload,
  LimsRef
} from "./LimsPhrase.types";

/** "copy" renders like "create" except the code starts blank (Phrase has no server-minted
 * id, stays EDITABLE). `isSystem` is only read on edit/view — a copy is never itself system. */
export type LimsPhraseFormMode = "create" | "edit" | "view" | "copy" | "bulk-edit";

interface LimsPhraseFormProps {
  mode?: LimsPhraseFormMode;
  initialData?: LimsPhrase | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: LimsPhrasePayload) => Promise<void> | void;
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

const LimsPhraseForm = ({
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
}: LimsPhraseFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";

  // System pick lists ship fixed (code/name), but values may still be added — a copy is never itself system.
  const isSystem = mode !== "copy" && Boolean(initialData?.isSystem);
  const identityLocked = isReadOnly || isSystem;

  const initialEntriesRef = useRef(initialData?.entries ?? []);
  const [entries, setEntries] = useState<LimsPhraseEntry[]>(initialEntriesRef.current);

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsPhraseFormValues>(
    () => ({
      phrase: mode === "copy" ? "" : (initialData?.phrase ?? ""),
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      group: initialData?.group?.id ?? ""
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsPhraseFormValues>({
    resolver: zodResolver(limsPhraseSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  return (
    <div className="modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <form
        id={formId}
        onSubmit={handleSubmit((values) => {
          // Edit + nothing actually changed: skip the reason modal, update
          // call, and audit entry entirely — a no-op Save just closes.
          if (
            (mode === "edit" || mode === "bulk-edit") &&
            isPayloadEqual(values, initialValues) &&
            isPayloadEqual(entries, initialEntriesRef.current)
          ) {
            (onUnchanged ?? onClose)();
            return;
          }
          onSubmit({ ...values, entries });
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsPhrase") })
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsPhrase") })}${stepLabel ?? ""}`
              : initialData
                ? `${t("update", { entity: t("limsPhrase") })}${stepLabel ?? ""}`
                : t("create", { entity: t("limsPhrase") })}
        </h2>

        {isSystem ? (
          <p className="rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-800 dark:bg-warning-500/10 dark:text-warning-300">
            {t("limsSystemPhraseNotice")}
          </p>
        ) : null}

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          <div className="min-w-0">
            <Label required>{t("limsPhraseCode")}</Label>
            <Input
              {...register("phrase")}
              disabled={identityLocked}
              error={!!errors.phrase}
              hint={errors.phrase?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label required>{t("name")}</Label>
            <Input
              {...register("name")}
              disabled={identityLocked}
              error={!!errors.name}
              hint={errors.name?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <div className="min-w-0">
            <Label>{t("limsGroup")}</Label>
            <Controller
              name="group"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsGroupOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  error={!!errors.group}
                  placeholder={t("select", { entity: t("limsGroup") })}
                  initialSelectedOptions={seedOne(initialData?.group)}
                />
              )}
            />
            {errors.group ? (
              <p className="mt-1 text-xs text-red-500">{errors.group.message}</p>
            ) : null}
          </div>

          <div className="min-w-0 md:col-span-2">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) => setValue("description", val, { shouldValidate: true })}
              error={!!errors.description}
              hint={errors.description?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* The selectable values — added even on system pick lists. */}
          <div className="min-w-0 md:col-span-2">
            <SubFormGrid<LimsPhraseEntry>
              label={t("limsPhraseEntries")}
              rows={entries}
              onChange={setEntries}
              disabled={isReadOnly}
              addLabel={t("limsAddValue")}
              emptyLabel={t("limsNoPhraseEntries")}
              columns={[
                { key: "phraseEntryId", header: t("limsPhraseId") },
                { key: "name", header: t("name") },
                { key: "description", header: t("description") }
              ]}
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

export default LimsPhraseForm;
