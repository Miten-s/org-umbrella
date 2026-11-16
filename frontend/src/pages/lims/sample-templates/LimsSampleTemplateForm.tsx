import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { sectionHidden } from "@/components/data/recordPage";

import Input from "@/components/common/form/input/InputField";
import DateField from "@/components/common/form/input/DateField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import type { AsyncOption } from "@/lib/query/listTypes";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { useLimsProjectOptions } from "@/pages/lims/projects/LimsProject.queries";
import { useSampleTypeOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsSpecificationOptions } from "@/pages/lims/specifications/LimsSpecification.queries";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import SampleTestsPicker, {
  type PendingTemplate
} from "@/pages/lims/samples/SampleTestsPicker";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import FormHeader from "@/components/data/FormHeader";
import { useFormHeaderAction } from "@/components/data/formHeaderContext";
import { useEntryEditorState } from "@/components/data/entryEditorContext";
import EntryTable from "@/components/data/EntryTable";
import {
  SAMPLE_FIELDS,
  fieldDef,
  rowsWithMandatory,
  type SampleFieldRow
} from "@/pages/lims/samples/sampleFields";
import {
  limsSampleTemplateSchema,
  limsSampleTemplateCopySchema,
  type LimsSampleTemplateFormValues
} from "./LimsSampleTemplate.schema";
import type {
  LimsRef,
  LimsSampleTemplate,
  LimsSampleTemplatePayload
} from "./LimsSampleTemplate.types";

export type LimsSampleTemplateFormMode =
  "create" | "edit" | "view" | "copy" | "bulk-edit";

interface LimsSampleTemplateFormProps {
  mode?: LimsSampleTemplateFormMode;
  initialData?: LimsSampleTemplate | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: LimsSampleTemplatePayload) => Promise<void> | void;
  submitting?: boolean;
  /** Overrides the submit label — CopyStepper says "Next" until the last step. */
  submitLabel?: string;
  disabled?: boolean;
  /** Lets an outside button (the steppers' header) submit this form. */
  formId?: string;
  /** " (2 of 5)" when stepping through several records. */
  stepLabel?: string;
  /** Set on the template's page: no modal frame or buttons, only this tab's part shows. */
  pageSection?: string;
  onDirtyChange?: (dirty: boolean) => void;
  /** Save found a problem — the page switches to the tab that holds it. */
  onInvalid?: (section: "details" | "fields") => void;
  onFieldCount?: (count: number) => void;
}

const seedOne = (ref: LimsRef | null | undefined): AsyncOption[] | undefined =>
  ref?.id && ref.name ? [{ value: ref.id, label: ref.name }] : undefined;

/** Setup form for a Sample Template: the defaults new Sample forms start from. */
const LimsSampleTemplateForm = ({
  mode = "create",
  initialData,
  onClose,
  onUnchanged,
  onSubmit,
  submitting = false,
  submitLabel,
  disabled = false,
  formId,
  stepLabel,
  pageSection,
  onDirtyChange,
  onInvalid,
  onFieldCount
}: LimsSampleTemplateFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const onPage = pageSection !== undefined;

  const initialRows = useMemo(
    () => rowsWithMandatory(initialData?.fieldRows),
    [initialData]
  );
  const [rows, setRows] = useState<SampleFieldRow[]>(initialRows);
  const [rowsError, setRowsError] = useState<string | undefined>();

  const initialTests = useMemo<PendingTemplate[]>(
    () =>
      [...(initialData?.tests ?? [])]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((row) => ({
          id: String(row.analysisId ?? row.analysis?.id ?? ""),
          name: String(row.analysis?.name ?? "")
        }))
        .filter((row) => row.id),
    [initialData]
  );
  const [tests, setTests] = useState<PendingTemplate[]>(initialTests);

  const initialValues = useMemo<LimsSampleTemplateFormValues>(
    () => ({
      sampleTemplateId:
        mode === "copy" ? "" : (initialData?.sampleTemplateId ?? ""),
      name: initialData?.name ?? "",
      sampleName: initialData?.sampleName ?? "",
      idText: initialData?.idText ?? "",
      sampleType: initialData?.sampleType?.id ?? "",
      project: initialData?.project?.id ?? "",
      specification: initialData?.specification?.id ?? "",
      location: initialData?.location?.id ?? "",
      group: initialData?.group?.id ?? "",
      lotNumber: initialData?.lotNumber ?? "",
      serialNumber: initialData?.serialNumber ?? "",
      loginDate: initialData?.loginDate ?? "",
      loginBy: initialData?.loginBy ?? "",
      sampleStartDate: initialData?.sampleStartDate ?? "",
      sampleStartBy: initialData?.sampleStartBy ?? "",
      description: initialData?.description ?? "",
      comments: initialData?.comments ?? ""
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors, isSubmitting }
  } = useForm<LimsSampleTemplateFormValues>({
    resolver: zodResolver(
      mode === "copy" ? limsSampleTemplateCopySchema : limsSampleTemplateSchema
    ),
    defaultValues: initialValues
  });

  const watched = useWatch({ control });
  const dirty =
    !isPayloadEqual({ ...initialValues, ...watched }, initialValues) ||
    !isPayloadEqual(tests, initialTests) ||
    !isPayloadEqual(rows, initialRows);
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  useEffect(() => onFieldCount?.(rows.length), [rows.length, onFieldCount]);

  // The entry form: which field (new, or the one being edited) and its display name. A field's
  // default value is a form value, edited in place; Cancel puts it back.
  const [draftKey, setDraftKey] = useState("");
  const [draftName, setDraftName] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [viewing, setViewing] = useState(false);
  const [entryDirty, setEntryDirty] = useState(false);
  const valueBefore = useRef<unknown>(undefined);
  const formRef = useRef<HTMLDivElement>(null);
  const touched = useRef(new WeakSet<object>());
  const [removedSaved, setRemovedSaved] = useState(0);
  const [refLabels, setRefLabels] = useState<Record<string, string>>(() => {
    const labels: Record<string, string> = {};
    for (const key of [
      "sampleType",
      "project",
      "specification",
      "location",
      "group"
    ] as const) {
      const name = initialData?.[key]?.name;
      if (name) labels[key] = name;
    }
    return labels;
  });

  const resetEntry = () => {
    setDraftKey("");
    setDraftName("");
    setEditIndex(null);
    setViewing(false);
    setEntryDirty(false);
    setRowsError(undefined);
  };
  const cancelEntry = () => {
    const key = editIndex !== null ? draftKey : "";
    if (key && key in initialValues && !viewing)
      setValue(
        key as Path<LimsSampleTemplateFormValues>,
        valueBefore.current as string
      );
    else if (editIndex === null) clearValue(draftKey);
    resetEntry();
  };
  const focusEntry = () =>
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  useFormHeaderAction(
    isReadOnly
      ? null
      : {
          label: t("limsAddRow"),
          onClick: () => {
            cancelEntry();
            focusEntry();
          }
        }
  );
  const openRow = (index: number, readOnly: boolean) => {
    const row = rows[index];
    const key = String(row.fieldKey ?? "");
    valueBefore.current =
      key in initialValues
        ? getValues(key as Path<LimsSampleTemplateFormValues>)
        : undefined;
    setDraftKey(key);
    setDraftName(String(row.displayName ?? ""));
    setEditIndex(index);
    setViewing(readOnly);
    setEntryDirty(false);
    setRowsError(undefined);
    requestAnimationFrame(focusEntry);
  };
  const saveEntry = () => {
    if (!draftKey) {
      setRowsError(t("limsPickField"));
      return;
    }
    const saved: SampleFieldRow = {
      fieldKey: draftKey,
      displayName: draftName
    };
    touched.current.add(saved);
    setRows((prev) =>
      editIndex === null
        ? [...prev, saved]
        : prev.map((row, i) => (i === editIndex ? saved : row))
    );
    resetEntry();
  };
  const removeRow = (index: number) => {
    const row = rows[index];
    if (!touched.current.has(row)) setRemovedSaved((n) => n + 1);
    clearValue(String(row.fieldKey ?? ""));
    if (editIndex === index) resetEntry();
    else if (editIndex !== null && editIndex > index)
      setEditIndex(editIndex - 1);
    setRows((prev) => prev.filter((_, i) => i !== index));
  };
  useEntryEditorState({
    unsaved:
      rows.filter((row) => touched.current.has(row)).length + removedSaved,
    pendingEntry: entryDirty && !viewing,
    label: t("limsTemplateFields"),
    focus: focusEntry,
    clearEntry: cancelEntry
  });
  const clearValue = (key?: string) => {
    if (key && key in initialValues)
      setValue(key as Path<LimsSampleTemplateFormValues>, "");
  };

  const description = useWatch({ control, name: "description" });
  const comments = useWatch({ control, name: "comments" });
  const busy = submitting || isSubmitting;

  const field = (
    name: Path<LimsSampleTemplateFormValues>,
    label: string,
    type: "text" | "date" = "text",
    required = false,
    bare = false
  ) => (
    <div className="min-w-0">
      {bare ? null : <Label required={required}>{label}</Label>}
      {type === "date" ? (
        <Controller
          name={name}
          control={control}
          render={({ field: f }) => (
            <DateField
              mode="date"
              value={f.value as string}
              onChange={f.onChange}
              onBlur={f.onBlur}
              disabled={isReadOnly}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          )}
        />
      ) : (
        <Input
          {...register(name)}
          disabled={
            isReadOnly || (name === "sampleTemplateId" && mode === "copy")
          }
          error={!!errors[name]}
          hint={errors[name]?.message as string}
          className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
      )}
    </div>
  );

  const select = (
    name: Path<LimsSampleTemplateFormValues>,
    label: string,
    useOptions: Parameters<typeof AsyncSelect>[0]["useOptions"],
    seed: AsyncOption[] | undefined,
    bare = false
  ) => (
    <div className="min-w-0">
      {bare ? null : <Label>{label}</Label>}
      <Controller
        name={name}
        control={control}
        render={({ field: f }) => (
          <AsyncSelect
            useOptions={useOptions}
            value={f.value as string}
            onChange={(value) => {
              setEntryDirty(true);
              f.onChange(value);
            }}
            onChangeOption={(option) =>
              option &&
              setRefLabels((prev) => ({ ...prev, [name]: option.label }))
            }
            disabled={isReadOnly || viewing}
            placeholder={t("select", { entity: label })}
            initialSelectedOptions={seed}
          />
        )}
      />
    </div>
  );

  /** The default-value input for a chosen field. */
  const valueInput = (key: string, label: string) => {
    switch (key) {
      case "sampleId":
        return (
          <p className="px-1 text-sm text-gray-500 dark:text-gray-400">
            {t("limsGeneratedId")}
          </p>
        );
      case "sampleType":
        return select(
          key,
          label,
          useSampleTypeOptions,
          seedOne(initialData?.sampleType),
          true
        );
      case "project":
        return select(
          key,
          label,
          useLimsProjectOptions,
          seedOne(initialData?.project),
          true
        );
      case "specification":
        return select(
          key,
          label,
          useLimsSpecificationOptions,
          seedOne(initialData?.specification),
          true
        );
      case "location":
        return select(
          key,
          label,
          useLimsLocationOptions,
          seedOne(initialData?.location),
          true
        );
      case "group":
        return select(
          key,
          label,
          useLimsGroupOptions,
          seedOne(initialData?.group),
          true
        );
      case "loginDate":
      case "sampleStartDate":
        return field(key, label, "date", false, true);
      case "description":
        return (
          <TextArea
            rows={2}
            disabled={isReadOnly}
            value={description || ""}
            onChange={(val) => setValue("description", val)}
            className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        );
      case "comments":
        return (
          <TextArea
            rows={2}
            disabled={isReadOnly}
            value={comments || ""}
            onChange={(val) => setValue("comments", val)}
            className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        );
      default:
        return key
          ? field(
              key as Path<LimsSampleTemplateFormValues>,
              label,
              "text",
              false,
              true
            )
          : null;
    }
  };

  const takenKeys = new Set(rows.map((row) => String(row.fieldKey ?? "")));
  const draftDef = fieldDef(draftKey);
  const draftLabel = draftDef ? t(draftDef.labelKey) : "";
  const values = watched as Record<string, unknown>;
  /** A field's default value as the table shows it. */
  const defaultValueText = (key: string) => {
    if (key === "sampleId") return t("limsGeneratedId");
    if (key in refLabels && values[key]) return refLabels[key];
    const value = values[key];
    return value === undefined || value === null || value === ""
      ? "—"
      : String(value);
  };

  return (
    <div
      className={
        onPage
          ? "text-gray-900 dark:text-gray-100"
          : "modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100"
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit(
          (values) => {
            if (rows.some((row) => !row.fieldKey)) {
              setRowsError(t("limsPickFieldOrRemove"));
              onInvalid?.("fields");
              return;
            }
            if (
              (mode === "edit" || mode === "bulk-edit") &&
              isPayloadEqual(values, initialValues) &&
              isPayloadEqual(tests, initialTests) &&
              isPayloadEqual(rows, initialRows)
            ) {
              (onUnchanged ?? onClose)();
              return;
            }
            onSubmit({
              ...values,
              fieldRows: rows.map((row, index) => ({
                fieldKey: String(row.fieldKey),
                displayName: String(row.displayName ?? "").trim(),
                sortOrder: index
              })),
              tests: tests.map((row, index) => ({
                analysisId: row.id,
                sortOrder: index
              }))
            });
          },
          () => onInvalid?.("details")
        )}
        className="min-w-0 space-y-4"
      >
        {onPage ? null : (
          <FormHeader
            title={
              isReadOnly
                ? t("view", { entity: t("limsSampleTemplate") })
                : mode === "copy"
                  ? `${t("copyEntity", { entity: t("limsSampleTemplate") })}${stepLabel ?? ""}`
                  : initialData
                    ? `${t("update", { entity: t("limsSampleTemplate") })}${stepLabel ?? ""}`
                    : t("create", { entity: t("limsSampleTemplate") })
            }
          />
        )}

        <div
          data-section="details"
          className={`grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 ${sectionHidden(pageSection, "details") ? "hidden" : ""}`}
        >
          {field("sampleTemplateId", t("limsSampleTemplateId"), "text", true)}
          {field("name", t("name"), "text", true)}
        </div>

        <div
          data-section="fields"
          className={`space-y-4 ${sectionHidden(pageSection, "fields") ? "hidden" : ""}`}
        >
          <Label className="mb-0">{t("limsTemplateFields")}</Label>
          {!isReadOnly || editIndex !== null ? (
            <div
              ref={formRef}
              className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[14rem_minmax(0,1fr)_14rem]">
                <div className="min-w-0">
                  <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    {t("limsTemplateField")} *
                  </span>
                  {draftDef?.mandatory ? (
                    <p className="flex h-11 items-center text-sm font-medium">
                      {t(draftDef.labelKey)}
                      <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                        {t("limsRequiredField")}
                      </span>
                    </p>
                  ) : (
                    <SelectDropdown
                      options={SAMPLE_FIELDS.filter(
                        (f) => f.key === draftKey || !takenKeys.has(f.key)
                      ).map((f) => ({ value: f.key, label: t(f.labelKey) }))}
                      value={draftKey}
                      onChange={(next) => {
                        if (editIndex === null) clearValue(draftKey);
                        setDraftKey(next);
                        setEntryDirty(true);
                        setRowsError(undefined);
                      }}
                      placeholder={t("limsPickField")}
                      ariaLabel={t("limsTemplateField")}
                      disabled={isReadOnly || viewing || editIndex !== null}
                      portal
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    {t("limsDefaultValue")}
                  </span>
                  {draftKey ? (
                    <fieldset
                      disabled={isReadOnly || viewing}
                      onInput={() => setEntryDirty(true)}
                    >
                      {valueInput(draftKey, draftLabel)}
                    </fieldset>
                  ) : (
                    <p className="flex h-11 items-center text-sm text-gray-400">
                      —
                    </p>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
                    {t("limsDisplayName")}
                  </span>
                  <input
                    aria-label={t("limsDisplayName")}
                    placeholder={draftLabel || t("limsDisplayName")}
                    value={draftName}
                    maxLength={100}
                    disabled={isReadOnly || viewing}
                    onChange={(event) => {
                      setDraftName(event.target.value);
                      setEntryDirty(true);
                    }}
                    className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-brand-300 focus:outline-hidden disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800"
                  />
                </div>
              </div>
              {rowsError ? (
                <p className="mt-2 text-xs text-red-500">{rowsError}</p>
              ) : null}
              <div className="mt-3 flex items-center justify-end gap-2">
                {!viewing ? (
                  <span className="mr-auto text-xs text-gray-500 dark:text-gray-400">
                    {t("entryAddedHint")}
                  </span>
                ) : null}
                {editIndex !== null || entryDirty ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={cancelEntry}
                  >
                    {viewing ? t("close") : t("cancel")}
                  </Button>
                ) : null}
                {!viewing ? (
                  <Button type="button" size="sm" onClick={saveEntry}>
                    {t("save")}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <EntryTable
            label={t("limsTemplateFields")}
            rows={rows}
            emptyLabel={t("limsNoRows")}
            activeIndex={editIndex}
            columns={[
              {
                key: "field",
                header: t("limsTemplateField"),
                render: (row) => {
                  const def = fieldDef(String(row.fieldKey ?? ""));
                  return (
                    <span>
                      {def ? t(def.labelKey) : String(row.fieldKey ?? "")}
                      {def?.mandatory ? (
                        <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          {t("limsRequiredField")}
                        </span>
                      ) : null}
                    </span>
                  );
                }
              },
              {
                key: "value",
                header: t("limsDefaultValue"),
                render: (row) => defaultValueText(String(row.fieldKey ?? ""))
              },
              {
                key: "displayName",
                header: t("limsDisplayName"),
                render: (row) => String(row.displayName ?? "") || "—"
              }
            ]}
            onView={(index) => openRow(index, true)}
            onEdit={isReadOnly ? undefined : (index) => openRow(index, false)}
            onDelete={isReadOnly ? undefined : removeRow}
            canDelete={(row) =>
              !fieldDef(String(row.fieldKey ?? ""))?.mandatory
            }
            isUnsaved={(row) => touched.current.has(row)}
          />
        </div>

        <div
          data-section="tests"
          className={sectionHidden(pageSection, "tests") ? "hidden" : ""}
        >
          <SampleTestsPicker
            existing={[]}
            pending={tests}
            onChange={setTests}
            disabled={isReadOnly}
            markNew={false}
          />
        </div>

        <div className={onPage ? "hidden" : "mt-4 flex justify-end gap-2"}>
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

export default LimsSampleTemplateForm;
