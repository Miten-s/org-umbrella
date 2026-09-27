import { useMemo, useState, type ReactNode } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Label from "@/components/common/form/Label";
import HelpTooltip from "@/components/common/HelpTooltip";
import AsyncSelect from "@/components/data/AsyncSelect";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { TrashBinIcon } from "@/public/icons";
import { toast } from "@/lib/toast";
import { fetchLimsPhraseList } from "@/pages/lims/phrases/LimsPhrase.api";
import {
  BOOLEAN_OPTIONS,
  TYPE_LABELS,
  isTyped
} from "@/pages/lims/analyses/componentTypes";
import type { LimsComponentRow } from "@/pages/lims/analyses/LimsAnalysis.types";
import type { LimsLimitRow } from "./LimsSpecification.types";
import {
  expandSource,
  templateQuery,
  useTestSourceOptions
} from "@/pages/lims/analyses/testSources";

interface SpecLimitsEditorProps {
  rows: LimsLimitRow[];
  onChange: (rows: LimsLimitRow[]) => void;
  disabled?: boolean;
  error?: string;
}

const inputClasses =
  "h-10 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90 dark:disabled:bg-gray-900";

const str = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const Cell = ({
  label,
  width,
  children
}: {
  label: string;
  width: string;
  children: ReactNode;
}) => (
  <div className={`shrink-0 ${width}`}>
    <span className="mb-1 block whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
      {label}
    </span>
    {children}
  </div>
);

const ReadOnly = ({ value }: { value: string }) => (
  <div className="flex h-10 items-center truncate rounded-lg bg-gray-50 px-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-300">
    {value || "—"}
  </div>
);

/** Specification limits — one line per Test Template component. Rows are added by picking a
 * Test Template or Test Group (a one-off copy, nothing stays linked) and removed one by one. */
const SpecLimitsEditor = ({
  rows,
  onChange,
  disabled = false,
  error
}: SpecLimitsEditorProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);

  // Component details (type, unit, list) come from each row's template — fetched once per template.
  const templateIds = useMemo(
    () => [...new Set(rows.map((r) => str(r.analysisId)).filter(Boolean))],
    [rows]
  );
  const templates = useQueries({
    queries: templateIds.map((id) => templateQuery(id))
  });
  const componentById = useMemo(() => {
    const map = new Map<string, LimsComponentRow>();
    for (const query of templates)
      for (const component of query.data?.components ?? [])
        if (component.id) map.set(String(component.id), component);
    return map;
  }, [templates]);

  const { data: pickLists } = useQuery({
    queryKey: ["limsPhrase", "all-with-entries"],
    queryFn: ({ signal }) =>
      fetchLimsPhraseList(false, { page: 1, limit: 200 }, signal),
    staleTime: 60_000
  });
  const entryOptionsFor = (listCode: string) =>
    (pickLists?.rows ?? [])
      .find((list) => list.phrase === listCode)
      ?.entries?.map((entry) => ({
        value: String(entry.phraseEntryId ?? ""),
        label: String(entry.name ?? entry.phraseEntryId ?? "")
      }))
      .filter((option) => option.value) ?? [];

  const patchRow = (index: number, patch: Partial<LimsLimitRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const addSource = async (value: string, label: string) => {
    if (!value) return;
    setAdding(true);
    try {
      const { rows: incoming, skipped } = await expandSource(
        queryClient,
        value
      );
      const present = new Set(rows.map((r) => str(r.componentId)));
      const fresh = incoming.filter((r) => !present.has(str(r.componentId)));
      if (fresh.length) onChange([...rows, ...fresh]);
      else if (!skipped.length)
        toast(t("limsAllComponentsPresent", { name: label }), "info");
      if (skipped.length)
        toast(
          t("limsSkippedNotApproved", { names: skipped.join(", ") }),
          "info",
          { duration: 6000 }
        );
    } finally {
      setAdding(false);
    }
  };

  const limitCells = (row: LimsLimitRow, index: number) => {
    const component = componentById.get(str(row.componentId));
    if (!component) return null;
    const numberCell = (key: "min" | "max", label: string) => (
      <Cell key={key} label={label} width="w-28">
        <input
          aria-label={label}
          inputMode="decimal"
          className={inputClasses}
          value={str(row[key])}
          disabled={disabled}
          onChange={(event) => patchRow(index, { [key]: event.target.value })}
        />
      </Cell>
    );

    if (!isTyped(component))
      return [numberCell("min", t("limsMin")), numberCell("max", t("limsMax"))];

    switch (component.type) {
      case "VALUE":
      case "CALCULATION":
        return [
          numberCell("min", t("limsMin")),
          numberCell("max", t("limsMax")),
          <Cell key="unit" label={t("limsUnit")} width="w-24">
            <ReadOnly value={str(component.unit)} />
          </Cell>
        ];
      case "LIST":
        return (
          <Cell label={t("limsAcceptableAnswer")} width="w-48">
            <SelectDropdown
              options={[
                { value: "", label: "—" },
                ...entryOptionsFor(str(component.list))
              ]}
              value={str(row.phrase)}
              onChange={(value) => patchRow(index, { phrase: value })}
              placeholder={t("limsAcceptableAnswer")}
              disabled={disabled}
              ariaLabel={t("limsAcceptableAnswer")}
              portal
            />
          </Cell>
        );
      case "BOOLEAN": {
        const [yes, no] = (
          BOOLEAN_OPTIONS.find((o) => o.value === component.option)?.label ??
          "Yes / No"
        ).split(" / ");
        return (
          <Cell label={t("limsExpectedAnswer")} width="w-48">
            <SelectDropdown
              options={[
                { value: "", label: "—" },
                { value: "true", label: yes },
                { value: "false", label: no }
              ]}
              value={str(row.boolean)}
              onChange={(value) => patchRow(index, { boolean: value })}
              placeholder={t("limsExpectedAnswer")}
              disabled={disabled}
              ariaLabel={t("limsExpectedAnswer")}
              portal
            />
          </Cell>
        );
      }
      case "TEXT":
        return (
          <Cell label={t("limsExpectedText")} width="w-56">
            <input
              aria-label={t("limsExpectedText")}
              className={inputClasses}
              value={str(row.text)}
              disabled={disabled}
              onChange={(event) =>
                patchRow(index, { text: event.target.value })
              }
            />
          </Cell>
        );
      default:
        return (
          <span className="shrink-0 self-center pt-5 text-xs text-gray-400">
            {t("limsNoLimitForType")}
          </span>
        );
    }
  };

  const legacySummary = (row: LimsLimitRow) =>
    [
      ["Min", row.min],
      ["Max", row.max],
      ["Text", row.text],
      ["Pick list", row.phrase],
      ["Boolean", row.boolean],
      ["Calculation", row.calculation]
    ]
      .filter(([, value]) => str(value).trim())
      .map(([key, value]) => `${key}: ${str(value)}`)
      .join(" · ");

  return (
    <div className="min-w-0">
      <Label className="mb-2">{t("limsLimits")}</Label>

      {!disabled ? (
        <div className="mb-3 max-w-md">
          <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
            {t("limsAddTests")}
            <HelpTooltip content={t("limsAddTestsHint")} />
          </span>
          <AsyncSelect
            useOptions={useTestSourceOptions}
            value=""
            onChange={() => undefined}
            onChangeOption={(option) =>
              option && addSource(option.value, option.label)
            }
            disabled={adding}
            placeholder={t("limsAddTestsPlaceholder")}
          />
        </div>
      ) : null}

      {rows.length ? (
        <div className="space-y-2">
          {rows.map((row, index) => {
            const legacy = !row.componentId;
            const component = componentById.get(str(row.componentId));
            return (
              <div
                key={str(row.componentId) || str(row.id) || index}
                className="rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-end gap-2 overflow-x-auto p-3">
                  <span className="w-6 shrink-0 pb-2.5 text-xs font-medium text-gray-400">
                    {index + 1}
                  </span>
                  <Cell label={t("limsTestTemplate")} width="w-48">
                    <ReadOnly value={str(row.analysisName)} />
                  </Cell>
                  <Cell label={t("limsComponent")} width="w-48">
                    <ReadOnly value={str(row.componentName)} />
                  </Cell>
                  {!legacy ? (
                    <Cell label={t("limsType")} width="w-32">
                      <ReadOnly
                        value={
                          component && isTyped(component)
                            ? TYPE_LABELS[component.type]
                            : ""
                        }
                      />
                    </Cell>
                  ) : null}
                  {!legacy && limitCells(row, index)}
                  {!disabled ? (
                    <button
                      type="button"
                      aria-label={`${t("delete")} ${index + 1}`}
                      onClick={() =>
                        onChange(rows.filter((_, i) => i !== index))
                      }
                      className="ml-auto shrink-0 self-end rounded p-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-500/10"
                    >
                      <TrashBinIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                {legacy ? (
                  <div className="flex items-center gap-2 border-t border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    <span className="rounded bg-warning-100 px-1.5 py-0.5 font-semibold text-warning-800 dark:bg-warning-500/15 dark:text-warning-300">
                      {t("limsLegacy")}
                    </span>
                    <span className="truncate">
                      {legacySummary(row) || "—"}
                    </span>
                    <HelpTooltip content={t("limsLegacyLimitHint")} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t("limsNoLimits")}
        </div>
      )}

      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
};

export default SpecLimitsEditor;
