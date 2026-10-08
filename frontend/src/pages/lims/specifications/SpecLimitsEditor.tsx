import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslation } from "react-i18next";
import Label from "@/components/common/form/Label";
import HelpTooltip from "@/components/common/HelpTooltip";
import AsyncSelect from "@/components/data/AsyncSelect";
import Button from "@/components/ui/button/Button";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { ChevronDownIcon, TrashBinIcon } from "@/public/icons";
import { toast } from "@/lib/toast";
import { usePickLists } from "@/pages/lims/analyses/usePickListOptions";
import {
  BOOLEAN_OPTIONS,
  TYPE_LABELS,
  isTyped
} from "@/pages/lims/analyses/componentTypes";
import type { LimsComponentRow } from "@/pages/lims/analyses/LimsAnalysis.types";
import {
  GROUP_PREFIX,
  TEMPLATE_PREFIX,
  useTestSourceOptions
} from "@/pages/lims/analyses/testSources";
import {
  expandLimsTestSources,
  type ExpandedTemplate
} from "@/pages/lims/test-groups/LimsTestGroup.api";
import type { LimsLimitRow } from "./LimsSpecification.types";

interface SpecLimitsEditorProps {
  rows: LimsLimitRow[];
  onChange: (rows: LimsLimitRow[]) => void;
  disabled?: boolean;
  error?: string;
}

const inputClasses =
  "h-9 w-full rounded-lg border border-gray-300 bg-transparent px-2.5 text-sm text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90";
const displayClasses =
  "flex h-9 w-full items-center truncate rounded-lg bg-gray-50 px-2.5 text-left text-sm text-gray-700 hover:bg-gray-100 disabled:hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700";
const ROW_GRID =
  "grid grid-cols-[1.75rem_minmax(0,1fr)_7rem_25rem_2.25rem] items-center gap-2";

const str = (value: unknown) =>
  value === undefined || value === null ? "" : String(value);

const INDIVIDUAL = "__individual";
const LEGACY = "__legacy";
/** Up to this many limits, groups start expanded; past it they start collapsed. */
const AUTO_EXPAND_LIMIT = 60;
const ROW_HEIGHT = { group: 44, template: 40, row: 48 } as const;
/** The `expand` endpoint's cap on template ids per call. */
const DETAILS_BATCH = 5000;

type LimitField = "min" | "max" | "text" | "phrase" | "boolean";

const rowKey = (row: LimsLimitRow, index: number) =>
  row.componentId ? `c:${row.componentId}` : `l:${str(row.id) || index}`;

const isNumeric = (component?: LimsComponentRow) =>
  !component ||
  !isTyped(component) ||
  component.type === "VALUE" ||
  component.type === "CALCULATION";

/** Whether a linked row still has no limit for its component's type. */
const isMissing = (row: LimsLimitRow, component?: LimsComponentRow) => {
  if (!row.componentId || !component) return false;
  if (isNumeric(component)) return !str(row.min) && !str(row.max);
  if (component.type === "LIST") return !str(row.phrase);
  if (component.type === "BOOLEAN") return !str(row.boolean);
  if (component.type === "TEXT") return !str(row.text);
  return false;
};

/** One limit row per component, pre-filled from the template (Min/Max, default List answer). */
const limitRowsFor = (
  template: ExpandedTemplate,
  group?: { id: string; name: string }
): LimsLimitRow[] =>
  (template.components ?? [])
    .filter((component) => component.id)
    .map((component) => ({
      analysisId: template.id,
      analysisName: template.name,
      componentId: String(component.id),
      componentName: str(component.name ?? component.componentId),
      sourceTestGroupId: group?.id ?? null,
      sourceTestGroup: group ? { id: group.id, name: group.name } : null,
      min: str(component.min),
      max: str(component.max),
      phrase: component.type === "LIST" ? str(component.option) : "",
      boolean: "",
      text: ""
    }));

interface TemplateNode {
  key: string;
  name: string;
  indices: number[];
}

interface Bucket {
  key: string;
  name: string;
  templates: Map<string, TemplateNode>;
  legacy: number[];
}

type Node =
  | {
      kind: "group";
      key: string;
      bucket: Bucket;
      indices: number[];
      open: boolean;
    }
  | { kind: "template"; key: string; template: TemplateNode; open: boolean }
  | { kind: "row"; key: string; index: number };

/** Specification limits — one line per Test Template component, grouped by the Test Group (then
 * template) each came through. Virtualized, with inputs only on the row being edited, so a
 * specification carrying hundreds of groups and thousands of limits stays responsive. */
const SpecLimitsEditor = ({
  rows,
  onChange,
  disabled = false,
  error
}: SpecLimitsEditorProps) => {
  const { t } = useTranslation();
  const [staged, setStaged] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [open, setOpen] = useState<Map<string, boolean>>(new Map());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<{
    key: string;
    field: LimitField;
  } | null>(null);
  const [bulkMin, setBulkMin] = useState("");
  const [bulkMax, setBulkMax] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Component details (type, unit, list) for every template in use, in one request per batch.
  const [details, setDetails] = useState<Map<string, LimsComponentRow>>(
    new Map()
  );
  const requested = useRef(new Set<string>());
  const mergeDetails = (templates: ExpandedTemplate[]) =>
    setDetails((prev) => {
      const next = new Map(prev);
      for (const template of templates)
        for (const component of template.components ?? [])
          if (component.id) next.set(String(component.id), component);
      return next;
    });
  const templateIdsKey = useMemo(
    () =>
      [...new Set(rows.map((r) => str(r.analysisId)).filter(Boolean))].join(
        ","
      ),
    [rows]
  );
  useEffect(() => {
    const missing = templateIdsKey
      .split(",")
      .filter((id) => id && !requested.current.has(id));
    if (!missing.length) return;
    missing.forEach((id) => requested.current.add(id));
    (async () => {
      for (let i = 0; i < missing.length; i += DETAILS_BATCH) {
        const result = await expandLimsTestSources({
          testGroupIds: [],
          analysisIds: missing.slice(i, i + DETAILS_BATCH),
          includeComponents: true
        });
        mergeDetails(result.templates);
      }
    })().catch(() => {
      missing.forEach((id) => requested.current.delete(id));
      toast(t("limsExpandTestsFailed"), "error");
    });
  }, [templateIdsKey, t]);

  const { data: pickLists } = usePickLists();
  const entryOptionsFor = (listCode: string) =>
    (pickLists?.rows ?? [])
      .find((list) => list.phrase === listCode)
      ?.entries?.map((entry) => ({
        value: String(entry.phraseEntryId ?? ""),
        label: String(entry.name ?? entry.phraseEntryId ?? "")
      }))
      .filter((option) => option.value) ?? [];

  const componentOf = (row: LimsLimitRow) => details.get(str(row.componentId));

  const buckets = useMemo(() => {
    const byKey = new Map<string, Bucket>();
    const bucketFor = (key: string, name: string) => {
      let bucket = byKey.get(key);
      if (!bucket) {
        bucket = { key, name, templates: new Map(), legacy: [] };
        byKey.set(key, bucket);
      }
      return bucket;
    };
    rows.forEach((row, index) => {
      if (!row.componentId) {
        bucketFor(LEGACY, t("limsLegacyLimits")).legacy.push(index);
        return;
      }
      const groupId = str(row.sourceTestGroupId);
      const bucket = groupId
        ? bucketFor(groupId, str(row.sourceTestGroup?.name))
        : bucketFor(INDIVIDUAL, t("limsIndividualTemplates"));
      const templateId = str(row.analysisId);
      let template = bucket.templates.get(templateId);
      if (!template) {
        template = {
          key: `t:${bucket.key}:${templateId}`,
          name: str(row.analysisName),
          indices: []
        };
        bucket.templates.set(templateId, template);
      }
      template.indices.push(index);
    });
    const ordered = [...byKey.values()].filter(
      (b) => b.key !== INDIVIDUAL && b.key !== LEGACY
    );
    for (const key of [INDIVIDUAL, LEGACY]) {
      const bucket = byKey.get(key);
      if (bucket) ordered.push(bucket);
    }
    return ordered;
  }, [rows, t]);

  const nodes = useMemo<Node[]>(() => {
    const query = search.trim().toLowerCase();
    const matches = (text: unknown) =>
      !query || str(text).toLowerCase().includes(query);
    const keep = (index: number) =>
      !onlyMissing ||
      isMissing(rows[index], details.get(str(rows[index].componentId)));
    const filtering = Boolean(query) || onlyMissing;
    const defaultOpen = rows.length <= AUTO_EXPAND_LIMIT;
    const out: Node[] = [];
    for (const bucket of buckets) {
      const groupHit =
        bucket.key !== INDIVIDUAL &&
        bucket.key !== LEGACY &&
        matches(bucket.name);
      const templates = [...bucket.templates.values()]
        .map((template) => {
          const templateHit = groupHit || matches(template.name);
          return {
            template,
            indices: template.indices.filter(
              (i) => keep(i) && (templateHit || matches(rows[i].componentName))
            )
          };
        })
        .filter((entry) => entry.indices.length);
      const legacy = bucket.legacy.filter(
        (i) =>
          keep(i) &&
          (matches(rows[i].analysisName) || matches(rows[i].componentName))
      );
      if (!templates.length && !legacy.length) continue;

      const indices = [...templates.flatMap((e) => e.indices), ...legacy];
      const groupOpen = filtering
        ? true
        : (open.get(bucket.key) ?? defaultOpen);
      out.push({
        kind: "group",
        key: `g:${bucket.key}`,
        bucket,
        indices,
        open: groupOpen
      });
      if (!groupOpen) continue;
      for (const { template, indices: shown } of templates) {
        const templateOpen = filtering
          ? true
          : (open.get(template.key) ?? true);
        out.push({
          kind: "template",
          key: template.key,
          template,
          open: templateOpen
        });
        if (templateOpen)
          for (const index of shown)
            out.push({ kind: "row", key: rowKey(rows[index], index), index });
      }
      for (const index of legacy)
        out.push({ kind: "row", key: rowKey(rows[index], index), index });
    }
    return out;
  }, [buckets, rows, search, onlyMissing, open, details]);

  const virtualizer = useVirtualizer({
    count: nodes.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => ROW_HEIGHT[nodes[index].kind],
    getItemKey: (index) => nodes[index].key,
    overscan: 10,
    // Measures during render otherwise, which React warns about.
    useFlushSync: false
  });

  const totals = useMemo(
    () => ({
      groups: buckets.filter((b) => b.key !== INDIVIDUAL && b.key !== LEGACY)
        .length,
      templates: buckets.reduce((sum, b) => sum + b.templates.size, 0),
      limits: rows.length
    }),
    [buckets, rows.length]
  );

  const patchRows = (patches: Map<number, Partial<LimsLimitRow>>) => {
    if (!patches.size) return;
    onChange(
      rows.map((row, i) =>
        patches.has(i) ? { ...row, ...patches.get(i) } : row
      )
    );
  };
  const removeIndices = (indices: number[]) => {
    const drop = new Set(indices);
    onChange(rows.filter((_, i) => !drop.has(i)));
    setSelected(new Set());
    setActive(null);
  };
  const toggleOpen = (key: string, isOpen: boolean) =>
    setOpen((prev) => new Map(prev).set(key, !isOpen));
  const setAllOpen = (value: boolean) =>
    setOpen(
      new Map(
        buckets.flatMap((b) => [
          [b.key, value] as const,
          ...[...b.templates.values()].map((tpl) => [tpl.key, value] as const)
        ])
      )
    );

  const keysOf = (indices: number[]) => indices.map((i) => rowKey(rows[i], i));
  const selectionState = (indices: number[]) => {
    const picked = keysOf(indices).filter((key) => selected.has(key)).length;
    return picked === 0 ? "none" : picked === indices.length ? "all" : "some";
  };
  const toggleSelection = (indices: number[]) => {
    const keys = keysOf(indices);
    const all = keys.every((key) => selected.has(key));
    setSelected((prev) => {
      const next = new Set(prev);
      keys.forEach((key) => (all ? next.delete(key) : next.add(key)));
      return next;
    });
  };
  const selectedIndices = useMemo(
    () => rows.flatMap((row, i) => (selected.has(rowKey(row, i)) ? [i] : [])),
    [rows, selected]
  );

  const applyToSelected = () => {
    const patches = new Map<number, Partial<LimsLimitRow>>();
    for (const index of selectedIndices) {
      if (!rows[index].componentId || !isNumeric(componentOf(rows[index])))
        continue;
      patches.set(index, {
        ...(bulkMin !== "" ? { min: bulkMin } : {}),
        ...(bulkMax !== "" ? { max: bulkMax } : {})
      });
    }
    patchRows(patches);
    toast(
      t("limsAppliedToRows", { count: patches.size }),
      patches.size ? "success" : "info"
    );
  };

  // Excel paste: a block pasted into a Min/Max cell fills the visible numeric rows below it.
  const pasteBlock = (
    event: React.ClipboardEvent<HTMLInputElement>,
    startIndex: number,
    field: "min" | "max"
  ) => {
    const text = event.clipboardData
      .getData("text/plain")
      .replace(/\r/g, "")
      .replace(/\n$/, "");
    if (!/[\t\n]/.test(text)) return;
    event.preventDefault();
    const order = nodes.flatMap((node) =>
      node.kind === "row" &&
      rows[node.index].componentId &&
      isNumeric(componentOf(rows[node.index]))
        ? [node.index]
        : []
    );
    const start = order.indexOf(startIndex);
    if (start < 0) return;
    const columns: ("min" | "max")[] =
      field === "min" ? ["min", "max"] : ["max"];
    const patches = new Map<number, Partial<LimsLimitRow>>();
    text.split("\n").forEach((line, r) => {
      const index = order[start + r];
      if (index === undefined) return;
      const patch: Partial<LimsLimitRow> = {};
      line
        .split("\t")
        .slice(0, columns.length)
        .forEach((value, c) => {
          patch[columns[c]] = value.trim();
        });
      patches.set(index, patch);
    });
    patchRows(patches);
    toast(t("limsPastedRows", { count: patches.size }), "success");
  };

  const add = async () => {
    if (!staged.length) return;
    setAdding(true);
    try {
      const expansion = await expandLimsTestSources({
        testGroupIds: staged
          .filter((v) => v.startsWith(GROUP_PREFIX))
          .map((v) => v.slice(GROUP_PREFIX.length)),
        analysisIds: staged
          .filter((v) => v.startsWith(TEMPLATE_PREFIX))
          .map((v) => v.slice(TEMPLATE_PREFIX.length)),
        includeComponents: true
      });
      const templates = [
        ...expansion.groups.flatMap((g) => g.templates),
        ...expansion.templates
      ];
      templates.forEach((tpl) => requested.current.add(tpl.id));
      mergeDetails(templates);

      const present = new Set(
        rows.map((r) => str(r.componentId)).filter(Boolean)
      );
      const skipped = new Set<string>();
      const fresh: LimsLimitRow[] = [];
      let duplicates = 0;
      const take = (
        template: ExpandedTemplate,
        group?: { id: string; name: string }
      ) => {
        if (!template.approved) return void skipped.add(template.name);
        for (const row of limitRowsFor(template, group)) {
          if (present.has(str(row.componentId))) duplicates += 1;
          else {
            present.add(str(row.componentId));
            fresh.push(row);
          }
        }
      };
      expansion.groups.forEach((group) =>
        group.templates.forEach((tpl) => take(tpl, group))
      );
      expansion.templates.forEach((tpl) => take(tpl));

      if (fresh.length) onChange([...rows, ...fresh]);
      setStaged([]);
      toast(
        t("limsLimitsAddedSummary", { count: fresh.length, duplicates }),
        fresh.length ? "success" : "info"
      );
      if (skipped.size)
        toast(
          t("limsSkippedNotApproved", { names: [...skipped].join(", ") }),
          "info",
          {
            duration: 6000
          }
        );
    } catch {
      toast(t("limsExpandTestsFailed"), "error");
    } finally {
      setAdding(false);
    }
  };

  const checkbox = (
    state: "all" | "some" | "none",
    onToggle: () => void,
    label: string
  ) => (
    <input
      type="checkbox"
      aria-label={label}
      checked={state === "all"}
      ref={(el) => {
        if (el) el.indeterminate = state === "some";
      }}
      onChange={onToggle}
      className="h-4 w-4 cursor-pointer accent-brand-500"
    />
  );

  const display = (
    value: string,
    field: LimitField,
    key: string,
    placeholder: string
  ) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => setActive({ key, field })}
      className={displayClasses}
    >
      {value || <span className="text-gray-400">{placeholder}</span>}
    </button>
  );

  const limitCells = (row: LimsLimitRow, index: number, key: string) => {
    const component = componentOf(row);
    if (!component)
      return (
        <span className="text-xs text-gray-400">
          {t("limsLoadingComponentDetails")}
        </span>
      );
    const editing = !disabled && active?.key === key;
    const patch = (value: Partial<LimsLimitRow>) =>
      patchRows(new Map([[index, value]]));

    if (isNumeric(component)) {
      const numberCell = (field: "min" | "max", label: string) =>
        editing ? (
          <input
            aria-label={`${label} ${str(row.componentName)}`}
            inputMode="decimal"
            placeholder={label}
            autoFocus={active?.field === field}
            className={inputClasses}
            value={str(row[field])}
            onChange={(event) => patch({ [field]: event.target.value })}
            onPaste={(event) => pasteBlock(event, index, field)}
          />
        ) : (
          display(str(row[field]), field, key, label)
        );
      return (
        <div className="grid grid-cols-[1fr_1fr_6rem] items-center gap-2">
          {numberCell("min", t("limsMin"))}
          {numberCell("max", t("limsMax"))}
          <span className="truncate text-xs text-gray-500">
            {str(component.unit)}
          </span>
        </div>
      );
    }

    switch (component.type) {
      case "LIST": {
        const options = entryOptionsFor(str(component.list));
        return editing ? (
          <SelectDropdown
            options={[{ value: "", label: "—" }, ...options]}
            value={str(row.phrase)}
            onChange={(value) => patch({ phrase: value })}
            placeholder={t("limsAcceptableAnswer")}
            ariaLabel={t("limsAcceptableAnswer")}
            portal
          />
        ) : (
          display(
            options.find((o) => o.value === str(row.phrase))?.label ??
              str(row.phrase),
            "phrase",
            key,
            t("limsAcceptableAnswer")
          )
        );
      }
      case "BOOLEAN": {
        const [yes, no] = (
          BOOLEAN_OPTIONS.find((o) => o.value === component.option)?.label ??
          "Yes / No"
        ).split(" / ");
        const value = str(row.boolean);
        return editing ? (
          <SelectDropdown
            options={[
              { value: "", label: "—" },
              { value: "true", label: yes },
              { value: "false", label: no }
            ]}
            value={value}
            onChange={(next) => patch({ boolean: next })}
            placeholder={t("limsExpectedAnswer")}
            ariaLabel={t("limsExpectedAnswer")}
            portal
          />
        ) : (
          display(
            value === "true" ? yes : value === "false" ? no : "",
            "boolean",
            key,
            t("limsExpectedAnswer")
          )
        );
      }
      case "TEXT":
        return editing ? (
          <input
            aria-label={t("limsExpectedText")}
            placeholder={t("limsExpectedText")}
            autoFocus
            className={inputClasses}
            value={str(row.text)}
            onChange={(event) => patch({ text: event.target.value })}
          />
        ) : (
          display(str(row.text), "text", key, t("limsExpectedText"))
        );
      default:
        return (
          <span className="text-xs text-gray-400">
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

  const trash = (label: string, onClick: () => void) =>
    !disabled ? (
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="justify-self-end rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
      >
        <TrashBinIcon className="h-4 w-4" />
      </button>
    ) : (
      <span />
    );

  const renderNode = (node: Node) => {
    if (node.kind === "group") {
      const { bucket, indices, open: isOpen } = node;
      return (
        <div
          className={`${ROW_GRID} h-full border-b border-gray-200 bg-gray-50 px-3 text-sm dark:border-gray-700 dark:bg-gray-800/60`}
        >
          {disabled ? (
            <span />
          ) : (
            checkbox(
              selectionState(indices),
              () => toggleSelection(indices),
              bucket.name
            )
          )}
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => toggleOpen(bucket.key, isOpen)}
            className="col-span-3 flex min-w-0 items-center gap-2 text-left"
          >
            <ChevronDownIcon
              className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`}
            />
            <span className="truncate font-semibold">{bucket.name}</span>
            <span className="shrink-0 text-xs text-gray-500">
              {bucket.key !== LEGACY
                ? `${t("limsTemplatesCount", { count: bucket.templates.size })} · `
                : ""}
              {t("limsLimitsCount", { count: indices.length })}
            </span>
            {bucket.key === LEGACY ? (
              <HelpTooltip content={t("limsLegacyLimitHint")} />
            ) : null}
          </button>
          {trash(`${t("delete")} ${bucket.name}`, () => removeIndices(indices))}
        </div>
      );
    }
    if (node.kind === "template") {
      const { template, open: isOpen } = node;
      return (
        <div
          className={`${ROW_GRID} h-full border-b border-gray-100 px-3 text-sm dark:border-gray-800`}
        >
          {disabled ? (
            <span />
          ) : (
            checkbox(
              selectionState(template.indices),
              () => toggleSelection(template.indices),
              template.name
            )
          )}
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => toggleOpen(template.key, isOpen)}
            className="col-span-3 flex min-w-0 items-center gap-2 pl-5 text-left"
          >
            <ChevronDownIcon
              className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${isOpen ? "" : "-rotate-90"}`}
            />
            <span className="truncate font-medium">{template.name}</span>
            <span className="shrink-0 text-xs text-gray-500">
              {t("limsLimitsCount", { count: template.indices.length })}
            </span>
          </button>
          {trash(`${t("delete")} ${template.name}`, () =>
            removeIndices(template.indices)
          )}
        </div>
      );
    }

    const row = rows[node.index];
    const legacy = !row.componentId;
    const component = componentOf(row);
    return (
      <div
        className={`${ROW_GRID} h-full border-b border-gray-100 px-3 text-sm dark:border-gray-800 ${active?.key === node.key ? "bg-brand-50/50 dark:bg-brand-500/5" : ""}`}
        onKeyDown={(event) => {
          if (event.key === "Escape" && active) {
            event.stopPropagation();
            setActive(null);
          }
        }}
      >
        {disabled ? (
          <span />
        ) : (
          checkbox(
            selected.has(node.key) ? "all" : "none",
            () => toggleSelection([node.index]),
            str(row.componentName)
          )
        )}
        <span
          className={`truncate ${legacy ? "" : "pl-10"}`}
          title={str(row.componentName)}
        >
          {legacy
            ? `${str(row.analysisName)} / ${str(row.componentName)}`
            : str(row.componentName)}
        </span>
        <span className="truncate text-xs text-gray-500">
          {legacy
            ? t("limsLegacy")
            : component && isTyped(component)
              ? TYPE_LABELS[component.type]
              : ""}
        </span>
        {legacy ? (
          <span className="truncate text-xs text-gray-500">
            {legacySummary(row) || "—"}
          </span>
        ) : (
          limitCells(row, node.index, node.key)
        )}
        {trash(`${t("delete")} ${str(row.componentName)}`, () =>
          removeIndices([node.index])
        )}
      </div>
    );
  };

  return (
    <div className="min-w-0">
      <Label className="mb-2">{t("limsLimits")}</Label>

      {!disabled ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="min-w-[16rem] flex-1">
            <AsyncSelect
              multi
              useOptions={useTestSourceOptions}
              value={staged}
              onChange={setStaged}
              disabled={adding}
              placeholder={t("limsAddTestsPlaceholder")}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10.5 shrink-0 whitespace-nowrap"
            onClick={add}
            loading={adding}
            disabled={adding || !staged.length}
          >
            {staged.length
              ? t("limsAddCount", { count: staged.length })
              : t("limsAddTests")}
          </Button>
          <HelpTooltip content={t("limsAddTestsHint")} />
        </div>
      ) : null}

      {rows.length ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t("limsLimitsTotals", totals)}
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("limsSearchTests")}
              className="ml-auto h-8 w-56 rounded-md border border-gray-200 bg-transparent px-2 text-sm dark:border-gray-700"
            />
            <label className="flex items-center gap-1.5 text-xs">
              <input
                type="checkbox"
                checked={onlyMissing}
                onChange={(e) => setOnlyMissing(e.target.checked)}
                className="h-3.5 w-3.5 accent-brand-500"
              />
              {t("limsOnlyMissing")}
            </label>
            <button
              type="button"
              onClick={() => setAllOpen(true)}
              className="text-xs text-brand-600 hover:underline dark:text-brand-400"
            >
              {t("limsExpandAll")}
            </button>
            <button
              type="button"
              onClick={() => setAllOpen(false)}
              className="text-xs text-brand-600 hover:underline dark:text-brand-400"
            >
              {t("limsCollapseAll")}
            </button>
          </div>

          {!disabled && selectedIndices.length ? (
            <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-brand-50/60 px-3 py-2 text-sm dark:border-gray-700 dark:bg-brand-500/10">
              <span className="font-medium">
                {t("limsSelectedCount", { count: selectedIndices.length })}
              </span>
              <input
                aria-label={t("limsMin")}
                inputMode="decimal"
                placeholder={t("limsMin")}
                value={bulkMin}
                onChange={(e) => setBulkMin(e.target.value)}
                className={`${inputClasses} w-24`}
              />
              <input
                aria-label={t("limsMax")}
                inputMode="decimal"
                placeholder={t("limsMax")}
                value={bulkMax}
                onChange={(e) => setBulkMax(e.target.value)}
                className={`${inputClasses} w-24`}
              />
              <Button
                type="button"
                size="sm"
                onClick={applyToSelected}
                disabled={bulkMin === "" && bulkMax === ""}
              >
                {t("limsApplyToSelected")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => removeIndices(selectedIndices)}
              >
                {t("limsRemoveSelected")}
              </Button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-auto text-xs text-gray-500 hover:underline"
              >
                {t("limsClearSelection")}
              </button>
            </div>
          ) : null}

          {nodes.length ? (
            <div ref={scrollRef} className="max-h-128 overflow-y-auto">
              <div
                style={{
                  height: virtualizer.getTotalSize(),
                  position: "relative"
                }}
              >
                {virtualizer.getVirtualItems().map((item) => (
                  <div
                    key={item.key}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: item.size,
                      transform: `translateY(${item.start}px)`
                    }}
                  >
                    {renderNode(nodes[item.index])}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("limsNoMatchingTests")}
            </div>
          )}
          {!disabled ? (
            <p className="border-t border-gray-200 px-3 py-1.5 text-xs text-gray-500 dark:border-gray-700">
              {t("limsPasteHint")}
            </p>
          ) : null}
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
