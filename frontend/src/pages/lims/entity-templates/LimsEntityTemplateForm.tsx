import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Input from "@/components/common/form/input/InputField";
import Label from "@/components/common/form/Label";
import TextArea from "@/components/common/form/input/TextArea";
import Button from "@/components/ui/button/Button";
import AsyncSelect from "@/components/data/AsyncSelect";
import FormHeader from "@/components/data/FormHeader";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { isPayloadEqual } from "@/lib/formChangeDetection";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { fetchEntityCatalog } from "./LimsEntityTemplate.api";
import {
  limsEntityTemplateSchema,
  type LimsEntityTemplateFormValues
} from "./LimsEntityTemplate.schema";
import type {
  LimsEntityTemplate,
  LimsEntityTemplatePayload,
  QueryGroup
} from "./LimsEntityTemplate.types";
import QueryBuilder from "./QueryBuilder";
import { emptyQuery, isGroup, queryProblem } from "./entityQuery";

export type LimsEntityTemplateFormMode =
  "create" | "edit" | "view" | "copy" | "bulk-edit";

interface LimsEntityTemplateFormProps {
  mode?: LimsEntityTemplateFormMode;
  initialData?: LimsEntityTemplate | null;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: LimsEntityTemplatePayload) => Promise<void> | void;
  submitting?: boolean;
  /** Overrides the submit label — CopyStepper says "Next" until the last step. */
  submitLabel?: string;
  disabled?: boolean;
  /** Lets an outside button (the steppers' header) submit this form. */
  formId?: string;
  /** " (2 of 5)" when stepping through several records. */
  stepLabel?: string;
  /** Set on the template's page: no modal frame or buttons, only this tab's part shows. */
  pageSection?: "details" | "conditions";
  onDirtyChange?: (dirty: boolean) => void;
  /** Save found a problem — the page switches to the tab that holds it. */
  onInvalid?: (section: "details" | "conditions") => void;
  onRuleCount?: (count: number) => void;
}

const countRules = (query: QueryGroup): number =>
  query.rules.reduce(
    (total, node) => total + (isGroup(node) ? countRules(node) : 1),
    0
  );

/** A table plus the conditions that narrow it. */
const LimsEntityTemplateForm = ({
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
  onRuleCount
}: LimsEntityTemplateFormProps) => {
  const { t } = useTranslation();
  const isReadOnly = mode === "view";
  const onPage = pageSection !== undefined;

  const { data: catalog } = useQuery({
    queryKey: ["limsEntityTemplate", "catalog"],
    queryFn: ({ signal }) => fetchEntityCatalog(signal),
    staleTime: 5 * 60_000
  });

  const initialQuery = useMemo<QueryGroup>(
    () => initialData?.query ?? emptyQuery(),
    [initialData]
  );
  const [query, setQuery] = useState<QueryGroup>(initialQuery);
  const [queryError, setQueryError] = useState<string | undefined>();

  const initialValues = useMemo<LimsEntityTemplateFormValues>(
    () => ({
      entityTemplateId:
        mode === "copy" ? "" : (initialData?.entityTemplateId ?? ""),
      name: initialData?.name ?? "",
      entity: initialData?.entity ?? "",
      group: initialData?.group?.id ?? "",
      description: initialData?.description ?? ""
    }),
    [initialData, mode]
  );

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LimsEntityTemplateFormValues>({
    resolver: zodResolver(limsEntityTemplateSchema),
    defaultValues: initialValues
  });

  const watched = useWatch({ control });
  const entity = useWatch({ control, name: "entity" });
  const description = useWatch({ control, name: "description" });
  const dirty =
    !isPayloadEqual({ ...initialValues, ...watched }, initialValues) ||
    !isPayloadEqual(query, initialQuery);
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  useEffect(() => onRuleCount?.(countRules(query)), [query, onRuleCount]);

  const busy = submitting || isSubmitting;

  const submit = (values: LimsEntityTemplateFormValues) => {
    if (mode !== "copy" && !dirty && mode !== "create") {
      onUnchanged?.();
      return;
    }
    const problem = queryProblem(
      query,
      catalog?.tables.find((table) => table.key === values.entity)
    );
    setQueryError(problem);
    if (problem) {
      onInvalid?.("conditions");
      return;
    }
    return onSubmit({ ...values, query });
  };

  return (
    <div className={onPage ? "" : "p-5 lg:p-6"}>
      {onPage ? null : (
        <FormHeader
          title={`${t(
            mode === "view"
              ? "view"
              : mode === "copy"
                ? "copyEntity"
                : mode === "create"
                  ? "create"
                  : "update",
            { entity: t("limsEntityTemplate") }
          )}${stepLabel ?? ""}`}
        />
      )}
      <form
        id={formId}
        noValidate
        onSubmit={handleSubmit(submit, () => onInvalid?.("details"))}
        className="space-y-4"
      >
        <div
          className={
            onPage && pageSection !== "details"
              ? "hidden"
              : "grid gap-4 md:grid-cols-2"
          }
        >
          <div className="min-w-0">
            <Label>{t("limsEntityTemplateId")}</Label>
            <Input
              {...register("entityTemplateId")}
              placeholder={t("limsAutoAssigned")}
              disabled={isReadOnly || mode === "copy"}
              error={!!errors.entityTemplateId}
              hint={errors.entityTemplateId?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="min-w-0">
            <Label required>{t("name")}</Label>
            <Input
              {...register("name")}
              disabled={isReadOnly}
              error={!!errors.name}
              hint={errors.name?.message}
              className="dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="min-w-0">
            <Label required>{t("limsTable")}</Label>
            <Controller
              name="entity"
              control={control}
              render={({ field }) => (
                <SelectDropdown
                  options={(catalog?.tables ?? []).map((table) => ({
                    value: table.key,
                    label: table.label
                  }))}
                  value={field.value}
                  onChange={(value) => {
                    if (value !== field.value) setQuery(emptyQuery());
                    field.onChange(value);
                  }}
                  placeholder={t("select", { entity: t("limsTable") })}
                  ariaLabel={t("limsTable")}
                  disabled={isReadOnly}
                  portal
                />
              )}
            />
            {errors.entity ? (
              <p className="mt-1 text-xs text-red-500">
                {errors.entity.message}
              </p>
            ) : null}
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
                  placeholder={t("select", { entity: t("limsGroup") })}
                  initialSelectedOptions={
                    initialData?.group?.name
                      ? [
                          {
                            value: initialData.group.id,
                            label: initialData.group.name
                          }
                        ]
                      : undefined
                  }
                />
              )}
            />
          </div>
          <div className="min-w-0 md:col-span-2">
            <Label>{t("description")}</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea
                  value={description ?? ""}
                  onChange={field.onChange}
                  rows={3}
                  disabled={isReadOnly}
                />
              )}
            />
          </div>
        </div>

        <div className={onPage && pageSection !== "conditions" ? "hidden" : ""}>
          {onPage ? null : <Label>{t("limsConditions")}</Label>}
          {catalog ? (
            <QueryBuilder
              entity={entity}
              catalog={catalog}
              query={query}
              onChange={(next) => {
                setQuery(next);
                setQueryError(undefined);
              }}
              disabled={isReadOnly}
            />
          ) : (
            <LoadingSpinner fullScreen={false} />
          )}
          {queryError ? (
            <p className="mt-1 text-xs text-red-500">{queryError}</p>
          ) : null}
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

export default LimsEntityTemplateForm;
