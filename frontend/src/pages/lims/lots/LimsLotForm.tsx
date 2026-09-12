import { useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { RelationManagerModal } from "@/components/data/cells/RelationManagerModal";
import LimsAttachmentsField from "@/components/lims/LimsAttachmentsField";
import { useAttachments } from "@/hooks/useAttachments";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsSampleOptions } from "@/pages/lims/samples/LimsSample.queries";
import {
  fetchLimsSampleList
} from "@/pages/lims/samples/LimsSample.api";
import {
  attachLimsLotChild,
  detachLimsLotChild
} from "./LimsLot.api";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import {
  limsLotSchema,
  limsLotCopySchema,
  type LimsLotFormValues
} from "./LimsLot.schema";
import type { LimsLot, LimsLotPayload, LimsRef } from "./LimsLot.types";

/** "copy" renders like "create" except the business ID starts blank (stays EDITABLE —
 * `applyBusinessId` only mints when empty). Attachments hidden: the batch save is JSON-only. */
export type LimsLotFormMode = "create" | "edit" | "view" | "copy" | "bulk-edit";

interface LimsLotFormProps {
  mode?: LimsLotFormMode;
  initialData?: LimsLot | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: LimsLotPayload, files: File[]) => Promise<void> | void;
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

/** Seeds a dropdown label from the record's nested ref — no extra fetch. */
const seedOne = (ref: LimsRef | null | undefined) =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

const LimsLotForm = ({
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
}: LimsLotFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const attachments = useAttachments(initialData?.attachments);
  const [isManagingSamples, setIsManagingSamples] = useState(false);
  // Samples is capped for display (see attachRelationCounts) — only a brand-new
  // record (create/copy) is safe to manage via the bulk multi-select, since it
  // starts empty. An existing one is edited one item at a time (see
  // RelationManagerModal) so Save is never a "here's the complete set" resend.
  const samplesAreManaged =
    (mode === "edit" || mode === "view") && Boolean(initialData);

  // Captured once per record — also the no-change baseline `submit` diffs
  // against, so Save is a no-op when nothing actually differs from it.
  const initialValues = useMemo<LimsLotFormValues>(
    () => ({
      lotId: mode === "copy" ? "" : (initialData?.lotId ?? ""),
      lotName: initialData?.lotName ?? "",
      group: initialData?.group?.id ?? "",
      samples: (initialData?.samples ?? []).map((ref) => ref.id),
      description: initialData?.description ?? ""
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<LimsLotFormValues>({
    resolver: zodResolver(mode === "copy" ? limsLotCopySchema : limsLotSchema),
    defaultValues: initialValues
  });

  const description = useWatch({ control, name: "description" });
  const busy = submitting || isSubmitting;

  const text = (
    name: keyof LimsLotFormValues,
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
            (mode === "edit" || mode === "bulk-edit") &&
            !attachments.isDirty &&
            isPayloadEqual(values, initialValues)
          ) {
            (onUnchanged ?? onClose)();
            return;
          }
          const { samples: _managedSeparately, ...rest } = values;
          onSubmit(
            {
              ...(samplesAreManaged ? rest : values),
              keptAttachmentIds: attachments.keptIds
            },
            attachments.newFiles
          );
        })}
        className="min-w-0 space-y-4"
      >
        <h2 className="text-xl font-semibold">
          {isReadOnly
            ? t("view", { entity: t("limsLot") })
            : mode === "copy"
              ? `${t("copyEntity", { entity: t("limsLot") })}${stepLabel ?? ""}`
              : initialData
                ? `${t("update", { entity: t("limsLot") })}${stepLabel ?? ""}`
                : t("create", { entity: t("limsLot") })}
        </h2>

        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {text("lotId", t("limsLotId"), true, "text")}
          {text("lotName", t("limsLotName"), true, "text")}
          <div className="min-w-0">
            <Label required={false}>{t("limsGroup")}</Label>
            <Controller
              name="group"
              control={control}
              render={({ field }) => (
                <AsyncSelect
                  useOptions={useLimsGroupOptions}
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isReadOnly}
                  placeholder={t("select", { entity: t("limsGroup") })}
                  initialSelectedOptions={seedOne(initialData?.group)}
                />
              )}
            />
          </div>
          <div className="min-w-0">
            <Label required={false}>{t("limsSamples")}</Label>
            {samplesAreManaged ? (
              <>
                <div className="flex min-h-11 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-700">
                  <div className="min-w-0 flex-1">
                    <TagListCell
                      items={initialData?.samples}
                      totalCount={initialData?.samplesCount}
                      getLabel={(item) => item.name ?? ""}
                      getKey={(item) => item.id}
                      tooltipHeaderLabel={t("limsSamples")}
                      queryKey={["lots", initialData?.id, "samples"]}
                      fetchPage={async ({ search, page }) => {
                        const result = await fetchLimsSampleList(false, {
                          page,
                          limit: 20,
                          search: search || undefined,
                          filters: { lotId: initialData?.id }
                        });
                        return {
                          ...result,
                          rows: result.rows.map((row) => ({
                            id: row.id,
                            name: row.sampleName || row.sampleId || ""
                          }))
                        };
                      }}
                    />
                  </div>
                  {!isReadOnly ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsManagingSamples(true)}
                    >
                      {t("manage")}
                    </Button>
                  ) : null}
                </div>
                {!isReadOnly && initialData?.id ? (
                  <RelationManagerModal
                    isOpen={isManagingSamples}
                    onClose={() => setIsManagingSamples(false)}
                    title={t("limsSamples")}
                    totalCount={initialData.samplesCount ?? initialData.samples?.length ?? 0}
                    getLabel={(item: { id: string; name: string }) => item.name}
                    getKey={(item: { id: string; name: string }) => item.id}
                    queryKey={["lots", initialData.id, "samples"]}
                    fetchAttached={async ({ search, page }) => {
                      const result = await fetchLimsSampleList(false, {
                        page,
                        limit: 20,
                        search: search || undefined,
                        filters: { lotId: initialData.id }
                      });
                      return {
                        ...result,
                        rows: result.rows.map((row) => ({
                          id: row.id,
                          name: row.sampleName || row.sampleId || ""
                        }))
                      };
                    }}
                    useCandidateOptions={useLimsSampleOptions}
                    onAttach={(childId) =>
                      attachLimsLotChild(initialData.id, "samples", childId)
                    }
                    onDetach={(childId) =>
                      detachLimsLotChild(initialData.id, "samples", childId)
                    }
                  />
                ) : null}
              </>
            ) : (
              // Create/Copy: samples is `manageOnly` (see lot.routes.ts), so the
              // backend now silently ignores this field on every create/copy
              // call regardless — an interactive multi-select here would look
              // functional and do nothing. Honest and disabled beats that.
              <div className="flex min-h-11 items-center rounded-lg border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-400 dark:border-gray-700">
                {t("limsSamplesAddAfterCreate", {
                  defaultValue: "Add samples after creating this lot"
                })}
              </div>
            )}
          </div>
          <div className="col-span-full min-w-0">
            <Label>{t("description")}</Label>
            <TextArea
              disabled={isReadOnly}
              value={description || ""}
              onChange={(val) =>
                setValue("description", val, { shouldValidate: true })
              }
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          {mode !== "copy" && mode !== "bulk-edit" && (
            <LimsAttachmentsField
              attachments={attachments}
              disabled={isReadOnly}
            />
          )}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            {t("cancel")}
          </Button>
          {!isReadOnly ? (
            <Button
              type="submit"
              variant="primary"
              loading={busy}
              disabled={busy || disabled}
            >
              {submitLabel ?? t("save")}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  );
};

export default LimsLotForm;
