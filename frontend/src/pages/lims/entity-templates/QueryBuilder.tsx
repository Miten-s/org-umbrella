import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import AsyncSelect from "@/components/data/AsyncSelect";
import DateField from "@/components/common/form/input/DateField";
import Button from "@/components/ui/button/Button";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { toast } from "@/lib/toast";
import { PlusIcon, TrashBinIcon } from "@/public/icons";
import { previewEntityQuery } from "./LimsEntityTemplate.api";
import { fieldOptionsHook } from "./LimsEntityTemplate.queries";
import type {
  CatalogField,
  CatalogTable,
  EntityCatalog,
  EntityRecordPage,
  QueryGroup,
  QueryNode,
  QueryRule
} from "./LimsEntityTemplate.types";
import {
  OPERATOR_LABELS,
  emptyQuery,
  emptyRule,
  isGroup,
  queryProblem
} from "./entityQuery";

const inputClasses =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:disabled:bg-gray-900";

interface EditorContext {
  entity: string;
  table: CatalogTable | undefined;
  catalog: EntityCatalog;
  disabled: boolean;
}

const RefValue = ({
  context,
  rule,
  onChange
}: {
  context: EditorContext;
  rule: QueryRule;
  onChange: (patch: Partial<QueryRule>) => void;
}) => {
  const { t } = useTranslation();
  const useOptions = useMemo(
    () => fieldOptionsHook(context.entity, rule.field),
    [context.entity, rule.field]
  );
  return (
    <AsyncSelect
      key={`${rule.field}|${rule.value}`}
      useOptions={useOptions}
      value={rule.value}
      onChange={() => undefined}
      onChangeOption={(option) =>
        onChange({ value: option?.value ?? "", label: option?.label })
      }
      disabled={context.disabled}
      placeholder={t("limsPickValue")}
      initialSelectedOptions={
        rule.value && rule.label
          ? [{ value: rule.value, label: rule.label }]
          : undefined
      }
    />
  );
};

const RuleRow = ({
  context,
  rule,
  onChange,
  onRemove
}: {
  context: EditorContext;
  rule: QueryRule;
  onChange: (rule: QueryRule) => void;
  onRemove: () => void;
}) => {
  const { t } = useTranslation();
  const field: CatalogField | undefined = context.table?.fields.find(
    (f) => f.key === rule.field
  );
  const patch = (next: Partial<QueryRule>) => onChange({ ...rule, ...next });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="w-52">
        <SelectDropdown
          options={(context.table?.fields ?? []).map((f) => ({
            value: f.key,
            label: f.label
          }))}
          value={rule.field}
          onChange={(key) => {
            const next = context.table?.fields.find((f) => f.key === key);
            onChange({
              field: key,
              operator: next ? context.catalog.operators[next.type][0] : "",
              value: ""
            });
          }}
          placeholder={t("limsPickField")}
          ariaLabel={t("limsPickField")}
          disabled={context.disabled}
          portal
        />
      </div>
      <div className="w-32">
        <SelectDropdown
          options={(field ? context.catalog.operators[field.type] : []).map(
            (operator) => ({
              value: operator,
              label: OPERATOR_LABELS[operator] ?? operator
            })
          )}
          value={rule.operator}
          onChange={(operator) => patch({ operator })}
          placeholder={t("limsOperator")}
          ariaLabel={t("limsOperator")}
          disabled={context.disabled || !field}
          portal
        />
      </div>
      <div className="min-w-56 flex-1">
        {field?.type === "ref" ? (
          <RefValue context={context} rule={rule} onChange={patch} />
        ) : field?.type === "date" ? (
          <DateField
            mode="date"
            value={rule.value}
            onChange={(value) => patch({ value: value ?? "" })}
            disabled={context.disabled}
          />
        ) : (
          <input
            aria-label={t("limsValue")}
            className={inputClasses}
            inputMode={field?.type === "number" ? "decimal" : undefined}
            value={rule.value}
            placeholder={t("limsValue")}
            disabled={context.disabled || !field}
            onChange={(event) => patch({ value: event.target.value })}
          />
        )}
      </div>
      {!context.disabled ? (
        <button
          type="button"
          aria-label={t("limsRemoveRule")}
          title={t("limsRemoveRule")}
          onClick={onRemove}
          className="rounded-lg p-2 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
        >
          <TrashBinIcon className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
};

const GroupBox = ({
  context,
  group,
  depth,
  onChange,
  onRemove
}: {
  context: EditorContext;
  group: QueryGroup;
  depth: number;
  onChange: (group: QueryGroup) => void;
  onRemove?: () => void;
}) => {
  const { t } = useTranslation();
  const setNode = (index: number, node: QueryNode) =>
    onChange({
      ...group,
      rules: group.rules.map((item, i) => (i === index ? node : item))
    });
  const removeNode = (index: number) => {
    const rules = group.rules.filter((_, i) => i !== index);
    if (!rules.length && onRemove) onRemove();
    else onChange({ ...group, rules });
  };
  const add = (node: QueryNode) =>
    onChange({ ...group, rules: [...group.rules, node] });

  return (
    <div
      className={`space-y-3 rounded-xl border p-3 ${
        depth === 1
          ? "border-gray-200 dark:border-gray-700"
          : "border-brand-200 bg-brand-25 dark:border-brand-500/30 dark:bg-brand-500/5"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="radiogroup"
          aria-label={t("limsMatch")}
          className="inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700"
        >
          {(["and", "or"] as const).map((combinator) => (
            <button
              key={combinator}
              type="button"
              role="radio"
              aria-checked={group.combinator === combinator}
              disabled={context.disabled}
              onClick={() => onChange({ ...group, combinator })}
              className={`px-3 py-1.5 text-xs font-semibold ${
                group.combinator === combinator
                  ? "bg-brand-500 text-white"
                  : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
              }`}
            >
              {combinator.toUpperCase()}
            </button>
          ))}
        </div>
        {!context.disabled ? (
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              type="button"
              startIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => add(emptyRule())}
            >
              {t("limsAddRule")}
            </Button>
            {depth < context.catalog.maxDepth ? (
              <Button
                size="sm"
                variant="outline"
                type="button"
                startIcon={<PlusIcon className="h-4 w-4" />}
                onClick={() => add({ combinator: "and", rules: [emptyRule()] })}
              >
                {t("limsAddGroup")}
              </Button>
            ) : null}
            {onRemove ? (
              <button
                type="button"
                aria-label={t("limsRemoveGroup")}
                title={t("limsRemoveGroup")}
                onClick={onRemove}
                className="rounded-lg p-2 text-gray-400 hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-500/10"
              >
                <TrashBinIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {group.rules.map((node, index) =>
        isGroup(node) ? (
          <GroupBox
            key={index}
            context={context}
            group={node}
            depth={depth + 1}
            onChange={(next) => setNode(index, next)}
            onRemove={() => removeNode(index)}
          />
        ) : (
          <RuleRow
            key={index}
            context={context}
            rule={node}
            onChange={(next) => setNode(index, next)}
            onRemove={() => removeNode(index)}
          />
        )
      )}
    </div>
  );
};

interface QueryBuilderProps {
  entity: string;
  catalog: EntityCatalog;
  query: QueryGroup;
  onChange: (query: QueryGroup) => void;
  disabled?: boolean;
}

/** Nested AND/OR rules on one table. Apply shows which records they match right now. */
const QueryBuilder = ({
  entity,
  catalog,
  query,
  onChange,
  disabled = false
}: QueryBuilderProps) => {
  const { t } = useTranslation();
  const [preview, setPreview] = useState<EntityRecordPage | null>(null);
  const [applying, setApplying] = useState(false);
  const table = catalog.tables.find((item) => item.key === entity);

  const update = (next: QueryGroup) => {
    setPreview(null);
    onChange(next);
  };

  const apply = async () => {
    const problem = queryProblem(query, table);
    if (problem) {
      toast(problem, "error");
      return;
    }
    setApplying(true);
    try {
      setPreview(await previewEntityQuery(entity, query));
    } catch (error) {
      toast(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? t("limsPreviewFailed"),
        "error"
      );
    } finally {
      setApplying(false);
    }
  };

  if (!table)
    return <p className="text-sm text-gray-500">{t("limsPickTableFirst")}</p>;

  return (
    <div className="space-y-3">
      <GroupBox
        context={{ entity, table, catalog, disabled }}
        group={query}
        depth={1}
        onChange={update}
      />
      {!query.rules.length ? (
        <p className="text-sm text-gray-500">{t("limsNoConditionsHint")}</p>
      ) : null}
      <div className="flex items-center justify-end gap-2">
        {!disabled ? (
          <Button
            size="sm"
            variant="outline"
            type="button"
            onClick={() => update(emptyQuery())}
          >
            {t("limsClear")}
          </Button>
        ) : null}
        <Button size="sm" type="button" loading={applying} onClick={apply}>
          {t("limsApply")}
        </Button>
      </div>
      {preview ? (
        <div className="rounded-xl border border-gray-200 p-3 text-sm dark:border-gray-700">
          <p className="mb-2 font-medium">
            {t("limsRecordsMatch", { count: preview.total ?? 0 })}
          </p>
          <ul className="grid gap-1 text-gray-600 sm:grid-cols-2 dark:text-gray-300">
            {preview.data.map((record) => (
              <li key={record.id} className="truncate">
                {record.label}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default QueryBuilder;
