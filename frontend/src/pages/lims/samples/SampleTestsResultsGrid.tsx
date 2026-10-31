import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode
} from "react";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AgGridReact, type CustomCellEditorProps } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellClassParams,
  type ColDef,
  type ICellRendererParams
} from "ag-grid-community";
import AsyncSelect from "@/components/data/AsyncSelect";
import Button from "@/components/ui/button/Button";
import { createAgTableTheme } from "@/components/common/table/tableTheme";
import { useCloseEditorOnScroll } from "@/components/data/useCloseEditorOnScroll";
import {
  finishPopupEdit,
  useEscapeCancelsEdit
} from "@/components/data/finishPopupEdit";
import { useSpreadsheet } from "@/components/data/spreadsheet";
import TextCellEditor from "@/components/data/TextCellEditor";
import { useTheme } from "@/context/ThemeContext";
import { toast } from "@/lib/toast";
import { ChevronDownIcon, CloseLineIcon, PlusIcon } from "@/public/icons";
import ComponentValueEditor from "@/pages/lims/analyses/ComponentValueEditor";
import {
  isEnterable,
  type ComponentSpec
} from "@/pages/lims/analyses/componentValue";
import {
  displayValue,
  parseValue
} from "@/pages/lims/analyses/componentValueText";
import { TYPE_LABELS, isTyped } from "@/pages/lims/analyses/componentTypes";
import { computeCalculations } from "@/pages/lims/analyses/formula";
import {
  hasLimit,
  limitProblem,
  typeProblem,
  statusOf,
  type ResultLimit,
  type ResultStatus
} from "@/pages/lims/analyses/resultCheck";
import { fetchLimsSpecificationById } from "@/pages/lims/specifications/LimsSpecification.api";
import { usePickLists } from "@/pages/lims/analyses/usePickListOptions";
import {
  GROUP_PREFIX,
  TEMPLATE_PREFIX,
  useTestSourceOptions
} from "@/pages/lims/analyses/testSources";
import {
  expandLimsTestSources,
  type ExpandedTemplate,
  type ExpandedTestSources
} from "@/pages/lims/test-groups/LimsTestGroup.api";
import {
  fetchSampleComponents,
  type SampleComponentRow
} from "./sampleComponents.api";
import { valueKey, type BulkTestsStore } from "./sampleBulkStore";
import {
  addRepeat,
  addTemplates,
  applyExpansion,
  parseSlot,
  runLabel,
  slotKey,
  slotOfPending,
  slotOfTest
} from "./sampleTests";

ModuleRegistry.registerModules([AllCommunityModule]);

const INDIVIDUAL = "__individual";
/** Past this many component rows, templates start collapsed. */
const AUTO_COLLAPSE = 400;

export interface SampleColumn {
  id: string;
  label: string;
  /** Saved samples have result rows on the server; new ones only have picks. */
  saved: boolean;
  /** Its limits judge the tests that are in this Specification. */
  specificationId?: string;
}

type Presence = "saved" | "new" | null;

interface Cell {
  state: Presence;
  value: string;
  /** The server row of a saved result. */
  rowId?: string;
  cancelled?: boolean;
  filled?: number;
  total?: number;
  present?: number;
  /** The heading this sample's test sits under, when it isn't this row's. */
  elsewhere?: string;
  limit?: ResultLimit;
  status?: ResultStatus;
}

interface GridRow {
  id: string;
  kind: "group" | "template" | "component";
  depth: number;
  name: string;
  groupKey: string;
  groupId?: string;
  groupName?: string;
  analysisId?: string;
  componentId?: string;
  spec?: ComponentSpec;
  templateIds?: string[];
  open?: boolean;
  cells: Cell[];
  differs: Set<number>;
}

interface ComponentDef {
  /** The template component's row id, which Specification limits point at. */
  rowId?: string;
  componentId: string;
  name: string;
  spec: ComponentSpec;
}

/** Popup editor for answers picked from a list, a yes/no or a date. */
const PICKER_TYPES = ["LIST", "BOOLEAN", "DATETIME", "ENTITY"];

const STATUS_TONES: Record<ResultStatus, string> = {
  Unentered: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  Report: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  Pass: "bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-300",
  Fail: "bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-300"
};

const StatusChip = ({ status }: { status?: ResultStatus }) =>
  status ? (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONES[status]}`}
    >
      {status}
    </span>
  ) : null;

/** "1 – 10", "≥ 1" or "≤ 10"; empty when the limit isn't a range. */
const limitRange = ({ min, max }: ResultLimit) => {
  const low = min === undefined || min === null ? "" : String(min);
  const high = max === undefined || max === null ? "" : String(max);
  if (low && high) return `${low} – ${high}`;
  return low ? `≥ ${low}` : high ? `≤ ${high}` : "";
};

const PickCellEditor = (
  props: CustomCellEditorProps & { spec: ComponentSpec; label: string }
) => {
  useEscapeCancelsEdit(props);
  const { t } = useTranslation();
  const box = useRef<HTMLDivElement>(null);
  const isSelect = props.spec.type !== "DATETIME";
  const [value, setValue] = useState(String(props.value ?? ""));
  const { data: pickLists } = usePickLists();
  const typing = () =>
    document.activeElement instanceof HTMLInputElement &&
    Boolean(box.current?.contains(document.activeElement));
  // Enter takes what was typed in the search or date box: "Pass", a list answer, dd-mm-yyyy hh:mm.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Enter" || !typing() || props.spec.type === "ENTITY")
        return;
      const text = (document.activeElement as HTMLInputElement).value;
      const parsed = text ? parseValue(props.spec, text, pickLists) : null;
      if (!parsed) {
        if (text)
          toast(
            `${props.label}: ${
              typeProblem(props.spec.type, text) ?? t("limsInvalidEntry")
            }`,
            "error"
          );
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      props.onValueChange(parsed);
      finishPopupEdit(props);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [props, pickLists, t]);
  useLayoutEffect(() => {
    if (isSelect)
      box.current?.querySelector<HTMLButtonElement>("button")?.click();
    else {
      // Selected, so typing replaces the value rather than adding to it.
      const input = box.current?.querySelector<HTMLInputElement>("input");
      input?.focus();
      input?.select();
    }
    // Runs once, when the editor opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div
      ref={box}
      className={`${props.spec.type === "DATETIME" ? "w-80" : "w-64"} rounded-lg bg-white p-2 shadow-lg dark:bg-gray-900`}
    >
      <ComponentValueEditor
        spec={props.spec}
        value={value}
        label={props.label}
        onChange={(next) => {
          setValue(next);
          props.onValueChange(next);
          // Date + time stays open until the time is picked; Enter or clicking away also commits.
          if (!(
            props.spec.type === "DATETIME" &&
            (typing() || !next.includes("T"))
          ))
            finishPopupEdit(props);
        }}
      />
    </div>
  );
};

interface SampleTestsResultsGridProps {
  samples: SampleColumn[];
  store: BulkTestsStore;
  readOnly: boolean;
  /** Back, title and tabs — shared with the Fields tab. */
  header: ReactNode;
  /** The page's shared Save. */
  trailing?: ReactNode;
  /** Edits to saved results, by server row id; the page saves them. */
  edits: Map<string, string>;
  onEdit: (rowId: string, value: string | null) => void;
}

/**
 * Tests & Results for many samples in one sheet: rows are Test Group → Test Template →
 * Component, columns are samples. Group/template cells show what each sample has (and add
 * what it lacks); component cells hold the value, entered with the editor its type calls for.
 */
const SampleTestsResultsGrid = ({
  samples,
  store,
  readOnly,
  header,
  trailing,
  edits,
  onEdit
}: SampleTestsResultsGridProps) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const gridTheme = useMemo(
    () =>
      createAgTableTheme({ theme, rowHeight: 40 }).withParams({
        columnBorder: true
      }),
    [theme]
  );
  const closeEditorOnScroll = useCloseEditorOnScroll();
  const sheet = useSpreadsheet();
  const { data: pickLists } = usePickLists();
  const steps = useSyncExternalStore(store.subscribe, store.getSteps);

  // Saved result rows, one request per saved sample.
  const [rowsBySample, setRowsBySample] = useState<
    Map<string, SampleComponentRow[]>
  >(new Map());
  const savedKey = samples
    .filter((s) => s.saved)
    .map((s) => s.id)
    .join(",");
  useEffect(() => {
    const controller = new AbortController();
    samples
      .filter((s) => s.saved)
      .forEach((sample) =>
        fetchSampleComponents([sample.id], controller.signal)
          .then(({ data }) =>
            setRowsBySample((prev) => new Map(prev).set(sample.id, data))
          )
          .catch(() => undefined)
      );
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);
  const loadingRows = samples.some((s) => s.saved && !rowsBySample.has(s.id));

  // Group and template definitions (template list of a group, components of a template).
  const [groupDefs, setGroupDefs] = useState(
    () => new Map<string, { name: string; templateIds: string[] }>()
  );
  const [templateDefs, setTemplateDefs] = useState(
    () => new Map<string, ExpandedTemplate>()
  );
  const requested = useRef({
    groups: new Set<string>(),
    templates: new Set<string>()
  });
  const mergeDefs = (expansion: ExpandedTestSources) => {
    setGroupDefs((prev) => {
      const next = new Map(prev);
      for (const g of expansion.groups)
        next.set(g.id, {
          name: g.name,
          templateIds: g.templates.map((tpl) => tpl.id)
        });
      return next;
    });
    setTemplateDefs((prev) => {
      const next = new Map(prev);
      for (const tpl of [
        ...expansion.groups.flatMap((g) => g.templates),
        ...expansion.templates
      ])
        next.set(tpl.id, tpl);
      return next;
    });
  };
  const inPlay = useMemo(() => {
    const groups = new Set<string>();
    const templates = new Set<string>();
    steps.forEach((step) => {
      for (const test of step.existing) {
        if (test.sourceTestGroupId) groups.add(test.sourceTestGroupId);
        if (test.analysisId) templates.add(test.analysisId);
      }
      for (const tpl of step.pending) {
        if (tpl.sourceGroupId) groups.add(tpl.sourceGroupId);
        templates.add(tpl.id);
      }
    });
    return {
      groups: [...groups].sort().join(","),
      templates: [...templates].sort().join(",")
    };
  }, [steps]);
  useEffect(() => {
    const groups = inPlay.groups
      .split(",")
      .filter((id) => id && !requested.current.groups.has(id));
    const templates = inPlay.templates
      .split(",")
      .filter((id) => id && !requested.current.templates.has(id));
    if (!groups.length && !templates.length) return;
    groups.forEach((id) => requested.current.groups.add(id));
    templates.forEach((id) => requested.current.templates.add(id));
    expandLimsTestSources({
      testGroupIds: groups,
      analysisIds: templates,
      includeComponents: true
    })
      .then(mergeDefs)
      .catch(() => toast(t("limsExpandTestsFailed"), "error"));
  }, [inPlay, t]);

  const [open, setOpen] = useState<Map<string, boolean>>(new Map());
  const [search, setSearch] = useState("");
  const [onlyEmpty, setOnlyEmpty] = useState(false);
  const [onlyDiff, setOnlyDiff] = useState(false);

  // Limits of each column's Specification, by template + component row id.
  const specIds = [...new Set(samples.flatMap((s) => s.specificationId ?? []))];
  const specQueries = useQueries({
    queries: specIds.map((id) => ({
      queryKey: ["limsSpecification", "limits", id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchLimsSpecificationById(id, signal),
      staleTime: 60_000
    }))
  });
  const specKey = specQueries.map((q) => q.dataUpdatedAt).join();
  const limitsBySpec = useMemo(() => {
    const out = new Map<string, Map<string, ResultLimit>>();
    specQueries.forEach((q, index) => {
      const map = new Map<string, ResultLimit>();
      for (const limit of q.data?.limits ?? [])
        if (limit.analysisId && limit.componentId)
          map.set(`${limit.analysisId}|${limit.componentId}`, limit);
      out.set(specIds[index], map);
    });
    return out;
    // Rebuilt when a fetch lands, not on every render's new `specQueries` array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specKey, specIds.join()]);

  const rows = useMemo<GridRow[]>(() => {
    // What each sample has: template → saved/new, and its saved rows by template|component.
    const presence = samples.map((sample, i) => {
      const step = steps.get(i);
      const has = new Map<string, Presence>();
      // Which heading (group id or INDIVIDUAL) each test was added through.
      const under = new Map<string, string>();
      const cancelled = new Set<string>();
      for (const test of step?.existing ?? []) {
        if (!test.analysisId) continue;
        const slot = slotOfTest(test);
        if (test.status === "Cancelled") cancelled.add(slot);
        else {
          has.set(slot, "saved");
          under.set(slot, test.sourceTestGroupId || INDIVIDUAL);
        }
      }
      for (const tpl of step?.pending ?? []) {
        const slot = slotOfPending(tpl);
        if (!has.has(slot)) {
          has.set(slot, "new");
          under.set(slot, tpl.sourceGroupId || INDIVIDUAL);
        }
      }
      const saved = new Map<string, SampleComponentRow>();
      for (const row of rowsBySample.get(sample.id) ?? [])
        if (row.analysisId)
          saved.set(
            valueKey(
              slotKey(row.analysisId, row.repeatNumber),
              String(row.componentId ?? "")
            ),
            row
          );
      return { has, under, cancelled, saved, values: step?.values ?? {} };
    });

    // Groups (first seen first), the templates under each, and each template's components.
    const groups = new Map<
      string,
      {
        id?: string;
        name: string;
        templateIds: string[];
        names: Map<string, string>;
      }
    >();
    const groupOf = (id: string | null | undefined, name?: string) => {
      const key = id || INDIVIDUAL;
      let g = groups.get(key);
      if (!g) {
        g = {
          id: id || undefined,
          name: id
            ? (groupDefs.get(id)?.name ?? name ?? "")
            : t("limsIndividualTemplates"),
          templateIds: [],
          names: new Map()
        };
        groups.set(key, g);
      }
      return g;
    };
    steps.forEach((step) => {
      for (const test of step.existing)
        if (test.analysisId) {
          const slot = slotOfTest(test);
          const g = groupOf(test.sourceTestGroupId, test.sourceTestGroup?.name);
          if (!g.templateIds.includes(slot)) g.templateIds.push(slot);
          g.names.set(slot, test.testName ?? "");
        }
      for (const tpl of step.pending) {
        const slot = slotOfPending(tpl);
        const g = groupOf(tpl.sourceGroupId, tpl.sourceGroupName);
        if (!g.templateIds.includes(slot)) g.templateIds.push(slot);
        g.names.set(slot, tpl.name);
      }
    });
    // Templates in the group's own order (else first seen), each run right after the one before.
    const repeated = new Set<string>();
    for (const g of groups.values()) {
      const def = g.id ? groupDefs.get(g.id)?.templateIds : undefined;
      const bases = [
        ...(def ?? []),
        ...g.templateIds.map((slot) => parseSlot(slot).analysisId)
      ].filter((id, i, all) => all.indexOf(id) === i);
      const slots = new Set(g.templateIds);
      g.templateIds = bases.flatMap((base) => {
        const runs = [...slots]
          .filter((slot) => parseSlot(slot).analysisId === base)
          .sort(
            (a, b) => parseSlot(a).repeatNumber - parseSlot(b).repeatNumber
          );
        if (runs.some((slot) => parseSlot(slot).repeatNumber > 1))
          repeated.add(base);
        return def?.includes(base) && !runs.includes(base)
          ? [base, ...runs]
          : runs;
      });
    }
    const ordered = [...groups.entries()].sort(([a], [b]) =>
      a === INDIVIDUAL ? 1 : b === INDIVIDUAL ? -1 : 0
    );

    const componentsOf = (analysisId: string): ComponentDef[] => {
      const list: ComponentDef[] = (
        templateDefs.get(parseSlot(analysisId).analysisId)?.components ?? []
      ).map((c) => ({
        rowId: c.id,
        componentId: String(c.componentId ?? ""),
        name: String(c.name ?? c.componentId ?? ""),
        spec: {
          type: c.type as string,
          list: c.list as string,
          option: c.option as string,
          unit: c.unit as string,
          formula: c.formula as string,
          entityTemplateId: c.entityTemplateId as string
        }
      }));
      // A saved test keeps its own snapshot even if the template has changed since.
      for (const p of presence)
        for (const [key, row] of p.saved) {
          if (!key.startsWith(`${analysisId}|`)) continue;
          const known = list.find(
            (c) => c.componentId === String(row.componentId)
          );
          if (known) {
            if (row.componentEntityTemplateId)
              known.spec.entityTemplateId = row.componentEntityTemplateId;
          } else
            list.push({
              componentId: String(row.componentId ?? ""),
              name: String(row.componentName ?? ""),
              spec: {
                type: row.componentType,
                list: row.componentList,
                option: row.componentOption,
                unit: row.unit,
                formula: row.componentFormula,
                entityTemplateId: row.componentEntityTemplateId
              }
            });
        }
      return list;
    };

    const valueCell = (
      i: number,
      key: string,
      analysisId: string,
      componentId: string
    ): Cell => {
      const p = presence[i];
      if (p.under.has(analysisId) && p.under.get(analysisId) !== key)
        return { state: null, value: "" };
      const state = p.has.get(analysisId) ?? null;
      if (state === "saved") {
        const row = p.saved.get(valueKey(analysisId, componentId));
        if (!row) return { state: null, value: "" };
        return {
          state,
          rowId: row.id,
          value: edits.get(row.id) ?? String(row.value ?? ""),
          cancelled: row.testStatus === "Cancelled"
        };
      }
      if (state === "new")
        return {
          state,
          value: p.values[valueKey(analysisId, componentId)] ?? ""
        };
      return { state: null, value: "" };
    };

    const query = search.trim().toLowerCase();
    const matches = (...texts: (string | undefined)[]) =>
      !query || texts.some((x) => (x ?? "").toLowerCase().includes(query));
    const totalComponents = [...groups.values()].reduce(
      (sum, g) =>
        sum + g.templateIds.reduce((s, id) => s + componentsOf(id).length, 0),
      0
    );
    const filtering = Boolean(query) || onlyEmpty || onlyDiff;

    const out: GridRow[] = [];
    for (const [key, g] of ordered) {
      const groupRows: GridRow[] = [];
      for (const analysisId of g.templateIds) {
        const run = parseSlot(analysisId);
        const name = runLabel(
          templateDefs.get(run.analysisId)?.name ??
            g.names.get(analysisId) ??
            "",
          run.repeatNumber,
          repeated.has(run.analysisId)
        );
        const comps = componentsOf(analysisId);
        const compRows: GridRow[] = [];
        // A Calculation shows what its inputs give right now, saved or not.
        const calculatedCell = (i: number, c: ComponentDef) => {
          const cell = valueCell(i, key, analysisId, c.componentId);
          if (!cell.state) return cell;
          const computed = computeCalculations(
            comps.map((d) => ({
              componentId: d.componentId,
              componentType: d.spec.type,
              componentFormula: d.spec.formula,
              value: valueCell(i, key, analysisId, d.componentId).value
            }))
          ).get(c.componentId);
          return { ...cell, value: computed ?? "" };
        };
        const judgedCell = (i: number, c: ComponentDef): Cell => {
          const cell =
            c.spec.type === "CALCULATION"
              ? calculatedCell(i, c)
              : valueCell(i, key, analysisId, c.componentId);
          const specId = samples[i].specificationId;
          const limit =
            specId && c.rowId
              ? limitsBySpec.get(specId)?.get(`${run.analysisId}|${c.rowId}`)
              : undefined;
          return cell.state
            ? {
                ...cell,
                limit,
                status: statusOf(c.spec.type, limit, cell.value)
              }
            : cell;
        };
        for (const c of comps) {
          const cells = samples.map((_, i) => judgedCell(i, c));
          const entered = cells.flatMap((cell, i) =>
            cell.state && cell.value ? [[i, cell.value] as const] : []
          );
          const counts = new Map<string, number>();
          entered.forEach(([, v]) => counts.set(v, (counts.get(v) ?? 0) + 1));
          const differs = new Set<number>();
          if (counts.size > 1) {
            const [common, shared] = [...counts].sort((a, b) => b[1] - a[1])[0];
            entered.forEach(([i, v]) => {
              if (shared < 2 || v !== common) differs.add(i);
            });
          }
          if (!matches(g.name, name, c.name)) continue;
          if (
            onlyEmpty &&
            !cells.some(
              (cell) => cell.state && !cell.value && isEnterable(c.spec.type)
            )
          )
            continue;
          if (onlyDiff && !differs.size) continue;
          compRows.push({
            id: `c:${key}:${analysisId}:${c.componentId}`,
            kind: "component",
            depth: 2,
            name: c.name,
            groupKey: key,
            groupId: g.id,
            groupName: g.name,
            analysisId,
            componentId: c.componentId,
            spec: c.spec,
            cells,
            differs
          });
        }
        if (filtering && !compRows.length) continue;
        const templateOpen = filtering
          ? true
          : (open.get(`t:${key}:${analysisId}`) ??
            totalComponents <= AUTO_COLLAPSE);
        const enterable = comps.filter((c) => isEnterable(c.spec.type));
        const cells = samples.map((_, i): Cell => {
          const at = presence[i].under.get(analysisId);
          if (at && at !== key)
            return {
              state: null,
              value: "",
              elsewhere: groups.get(at)?.name ?? t("limsIndividualTemplates")
            };
          const judged = comps
            .map((c) => ({ cell: judgedCell(i, c), type: c.spec.type }))
            .filter(
              ({ cell, type }) => cell.limit && hasLimit(type, cell.limit)
            )
            .map(({ cell }) => cell);
          return {
            state: presence[i].has.get(analysisId) ?? null,
            value: "",
            status: judged.some((x) => x.status === "Fail")
              ? "Fail"
              : judged.length && judged.every((x) => x.status === "Pass")
                ? "Pass"
                : undefined,
            filled: enterable.filter(
              (c) => valueCell(i, key, analysisId, c.componentId).value
            ).length,
            total: enterable.length
          };
        });
        groupRows.push({
          id: `t:${key}:${analysisId}`,
          kind: "template",
          depth: 1,
          name,
          groupKey: key,
          groupId: g.id,
          groupName: g.name,
          analysisId,
          open: templateOpen,
          cells,
          differs: new Set()
        });
        if (templateOpen) groupRows.push(...compRows);
      }
      if (filtering && !groupRows.length) continue;
      const groupOpen = filtering ? true : (open.get(`g:${key}`) ?? true);
      const templateIds =
        g.id && groupDefs.has(g.id)
          ? groupDefs.get(g.id)!.templateIds
          : g.templateIds;
      out.push({
        id: `g:${key}`,
        kind: "group",
        depth: 0,
        name: g.name,
        groupKey: key,
        groupId: g.id,
        groupName: g.name,
        templateIds,
        open: groupOpen,
        cells: samples.map((_, i) => ({
          state: null,
          value: "",
          present: templateIds.filter((id) => presence[i].has.has(id)).length,
          total: templateIds.length
        })),
        differs: new Set()
      });
      if (groupOpen) out.push(...groupRows);
    }
    return out;
  }, [
    samples,
    steps,
    rowsBySample,
    groupDefs,
    templateDefs,
    limitsBySpec,
    edits,
    open,
    search,
    onlyEmpty,
    onlyDiff,
    t
  ]);

  // Adding/removing picks — read through a ref so the column definitions stay stable.
  const actions = useRef({
    add: (_i: number, _row: GridRow) => {},
    repeat: (_i: number, _row: GridRow) => {},
    remove: (_i: number, _analysisId: string) => {},
    toggle: (_id: string, _open: boolean) => {}
  });
  actions.current = {
    add: (i, row) => {
      const step = store.getStep(i);
      if (!step) return;
      const group = row.groupId
        ? { id: row.groupId, name: row.groupName ?? "" }
        : undefined;
      const run = parseSlot(row.analysisId ?? "");
      // A repeat row adds that same run to a sample that lacks it.
      if (row.kind === "template" && run.repeatNumber > 1) {
        const def = templateDefs.get(run.analysisId);
        if (!def) return;
        store.setPending(
          new Map([
            [
              i,
              [
                ...step.pending,
                {
                  id: def.id,
                  name: def.name,
                  componentCount: def.componentCount,
                  repeatNumber: run.repeatNumber,
                  sourceGroupId: group?.id,
                  sourceGroupName: group?.name
                }
              ]
            ]
          ])
        );
        return;
      }
      const ids =
        row.kind === "group" ? (row.templateIds ?? []) : [run.analysisId];
      const templates = ids.flatMap((id) =>
        templateDefs.has(id) ? [templateDefs.get(id)!] : []
      );
      if (!templates.length) return;
      const result = addTemplates(
        step.existing,
        step.pending,
        templates,
        group
      );
      if (result.skipped.length)
        toast(
          t("limsSkippedNotApproved", { names: result.skipped.join(", ") }),
          "info"
        );
      store.setPending(new Map([[i, result.pending]]));
    },
    repeat: (i, row) => {
      const step = store.getStep(i);
      const def = templateDefs.get(parseSlot(row.analysisId ?? "").analysisId);
      if (!step || !def) return;
      const result = addRepeat(step.existing, step.pending, {
        id: def.id,
        name: def.name,
        componentCount: def.componentCount,
        sourceGroupId: row.groupId,
        sourceGroupName: row.groupName
      });
      store.setPending(new Map([[i, result.pending]]));
    },
    remove: (i, analysisId) => {
      const step = store.getStep(i);
      if (step)
        store.setPending(
          new Map([
            [i, step.pending.filter((tpl) => slotOfPending(tpl) !== analysisId)]
          ])
        );
    },
    toggle: (id, isOpen) => setOpen((prev) => new Map(prev).set(id, !isOpen))
  };

  const columns = useMemo<ColDef<GridRow>[]>(() => {
    const nameColumn: ColDef<GridRow> = {
      colId: "name",
      headerName: t("bulkTestOrComponent"),
      pinned: "left",
      width: 320,
      cellRenderer: (p: ICellRendererParams<GridRow>) => {
        const row = p.data!;
        const toggle = row.kind !== "component";
        return (
          <div
            className="flex h-full items-center gap-1.5"
            style={{ paddingLeft: row.depth * 18 }}
          >
            {toggle ? (
              <button
                type="button"
                aria-expanded={row.open}
                onClick={() =>
                  actions.current.toggle(row.id, Boolean(row.open))
                }
                className="shrink-0 text-gray-500"
              >
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${row.open ? "" : "-rotate-90"}`}
                />
              </button>
            ) : null}
            <span
              className={`truncate ${row.kind === "group" ? "font-semibold" : row.kind === "template" ? "font-medium" : ""}`}
              title={row.name}
            >
              {row.name}
            </span>
          </div>
        );
      }
    };
    const typeColumn: ColDef<GridRow> = {
      colId: "type",
      headerName: t("limsType"),
      pinned: "left",
      width: 130,
      valueGetter: (p) => {
        const spec = p.data?.spec;
        if (!spec?.type) return "";
        const label = isTyped({ type: spec.type })
          ? TYPE_LABELS[spec.type as keyof typeof TYPE_LABELS]
          : spec.type;
        return spec.unit ? `${label} · ${spec.unit}` : label;
      },
      cellClass: "text-xs text-gray-500"
    };
    const changed = (p: CellClassParams<GridRow>, i: number) => {
      const cell = p.data?.cells[i];
      if (p.data?.kind !== "component" || !cell?.state) return false;
      return cell.state === "new"
        ? Boolean(cell.value)
        : Boolean(cell.rowId && edits.has(cell.rowId));
    };
    const sampleColumns = samples.map<ColDef<GridRow>>((sample, i) => ({
      colId: `s${i}`,
      headerName: sample.label,
      headerTooltip: sample.label,
      wrapHeaderText: true,
      autoHeaderHeight: true,
      width: 220,
      cellDataType: false,
      valueGetter: (p) => {
        const cell = p.data?.cells[i];
        return p.data?.kind === "component" && cell?.state ? cell.value : null;
      },
      valueSetter: (p) => {
        const row = p.data;
        const cell = row?.cells[i];
        if (
          !row ||
          row.kind !== "component" ||
          !cell?.state ||
          !isEnterable(row.spec?.type)
        )
          return false;
        const parsed = parseValue(
          row.spec ?? {},
          String(p.newValue ?? ""),
          pickLists
        );
        if (parsed === null) {
          const problem = typeProblem(row.spec?.type, p.newValue);
          toast(
            problem
              ? `${row.name}: ${problem}`
              : t("bulkValueInvalid", {
                  value: String(p.newValue ?? ""),
                  field: row.name
                }),
            "error",
            { id: `value-${row.id}` }
          );
          return false;
        }
        const missed = cell.limit
          ? limitProblem(row.spec?.type, cell.limit, parsed)
          : null;
        if (missed)
          toast(
            t("limsOutOfSpecMessage", { field: row.name, problem: missed }),
            "error",
            { id: `limit-${row.id}` }
          );
        if (cell.state === "saved" && cell.rowId) onEdit(cell.rowId, parsed);
        else
          store.setValue(
            i,
            valueKey(row.analysisId!, row.componentId!),
            parsed
          );
        return true;
      },
      editable: (p) => {
        const row = p.data;
        const cell = row?.cells[i];
        return (
          !readOnly &&
          row?.kind === "component" &&
          Boolean(cell?.state) &&
          !cell?.cancelled &&
          isEnterable(row.spec?.type)
        );
      },
      // Typing starts plain text (parsed on commit: "Pass", a list name, dd-mm-yyyy hh:mm); click/F2 opens the picker.
      cellEditorSelector: (p) =>
        p.data?.spec?.type === "ENTITY" ||
        (PICKER_TYPES.includes(String(p.data?.spec?.type)) &&
          !(p.eventKey && p.eventKey.length === 1))
          ? {
              component: PickCellEditor,
              popup: true,
              params: {
                spec: p.data?.spec ?? {},
                label: `${p.data?.name ?? ""} — ${sample.label}`
              }
            }
          : { component: TextCellEditor },
      cellRenderer: (p: ICellRendererParams<GridRow>) => {
        const row = p.data!;
        const cell = row.cells[i];
        if (row.kind === "group") {
          const missing = (cell.total ?? 0) - (cell.present ?? 0);
          return (
            <div className="flex h-full items-center gap-2 text-xs">
              <span
                className={
                  cell.present
                    ? "text-gray-700 dark:text-gray-300"
                    : "text-gray-300"
                }
              >
                {cell.present === cell.total && cell.total
                  ? t("bulkGroupAll", { count: cell.total })
                  : cell.present
                    ? t("bulkGroupSome", {
                        present: cell.present,
                        total: cell.total
                      })
                    : "—"}
              </span>
              {!readOnly && missing > 0 ? (
                <button
                  type="button"
                  onClick={() => actions.current.add(i, row)}
                  className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-brand-600 hover:bg-brand-50 dark:text-brand-400"
                >
                  <PlusIcon className="h-3 w-3" /> {t("bulkAdd")}
                </button>
              ) : null}
            </div>
          );
        }
        if (row.kind === "template") {
          if (cell.elsewhere)
            return (
              <span
                className="truncate text-xs italic text-gray-400"
                title={t("bulkUnderGroup", { group: cell.elsewhere })}
              >
                {t("bulkUnderGroup", { group: cell.elsewhere })}
              </span>
            );
          if (!cell.state)
            return !readOnly ? (
              <button
                type="button"
                onClick={() => actions.current.add(i, row)}
                className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs text-brand-600 hover:bg-brand-50 dark:text-brand-400"
              >
                <PlusIcon className="h-3 w-3" /> {t("bulkAdd")}
              </button>
            ) : (
              <span className="text-gray-300">—</span>
            );
          return (
            <div className="flex h-full items-center gap-2 text-xs">
              {cell.state === "new" ? (
                <span className="rounded-full bg-success-100 px-2 py-0.5 font-semibold text-success-800 dark:bg-success-500/15 dark:text-success-300">
                  {t("limsNewTest")}
                </span>
              ) : (
                <span className="text-success-600">✓</span>
              )}
              <span
                className={
                  cell.filled === cell.total
                    ? "text-gray-600 dark:text-gray-300"
                    : "text-warning-600"
                }
              >
                {t("bulkFilledOf", { filled: cell.filled, total: cell.total })}
              </span>
              <StatusChip status={cell.status} />
              {!readOnly ? (
                <button
                  type="button"
                  title={t("limsAddRepeatHint")}
                  onClick={() => actions.current.repeat(i, row)}
                  className="ml-auto inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-brand-600 hover:bg-brand-50 dark:text-brand-400"
                >
                  <PlusIcon className="h-3 w-3" /> {t("limsAddRepeat")}
                </button>
              ) : null}
              {cell.state === "new" && !readOnly ? (
                <button
                  type="button"
                  aria-label={t("delete")}
                  onClick={() => actions.current.remove(i, row.analysisId!)}
                  className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-error-600 dark:hover:bg-gray-800"
                >
                  <CloseLineIcon className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
          );
        }
        if (!cell.state) return <span className="text-gray-300">—</span>;
        if (cell.value)
          return (
            <div
              className="flex h-full items-center justify-between gap-2"
              title={
                (cell.limit &&
                  limitProblem(row.spec?.type, cell.limit, cell.value)) ||
                undefined
              }
            >
              <span className="truncate">
                {displayValue(row.spec ?? {}, cell.value, pickLists)}
              </span>
              <StatusChip status={cell.status} />
            </div>
          );
        const hasResult =
          isEnterable(row.spec?.type) || row.spec?.type === "CALCULATION";
        if (!hasResult) return "";
        const range = cell.limit ? limitRange(cell.limit) : "";
        const hint = readOnly
          ? ""
          : range
            ? range
            : row.spec?.type === "LIST" || row.spec?.type === "BOOLEAN"
              ? t("bulkHintSelect")
              : row.spec?.type === "DATETIME"
                ? "dd-mm-yyyy hh:mm"
                : (row.spec?.unit ?? "");
        return (
          <div className="flex h-full items-center justify-between gap-2">
            <span className="truncate text-gray-300 dark:text-gray-600">
              {hint}
            </span>
            <StatusChip status={cell.status} />
          </div>
        );
      },
      cellClassRules: {
        "bg-gray-50 dark:bg-gray-800/40": (p) =>
          p.data?.kind !== "component" || !p.data?.cells[i]?.state,
        "bg-brand-50 dark:bg-brand-500/10 font-medium": (p) => changed(p, i),
        "bg-warning-50 dark:bg-warning-500/10": (p) =>
          Boolean(p.data?.differs.has(i)) && !changed(p, i)
      }
    }));
    return [nameColumn, typeColumn, ...sampleColumns];
    // Cells read `edits` for colour; everything else arrives through the row data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [samples, readOnly, pickLists, edits, t]);

  // "Add to all samples" — the quick way to put a group or template on every sample.
  const [staged, setStaged] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const addToAll = async () => {
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
      mergeDefs(expansion);
      const updates = new Map<
        number,
        ReturnType<typeof applyExpansion>["pending"]
      >();
      let added = 0;
      let duplicates = 0;
      const skipped = new Set<string>();
      samples.forEach((_, i) => {
        const step = store.getStep(i);
        if (!step) return;
        const result = applyExpansion(step.existing, step.pending, expansion);
        if (result.added) updates.set(i, result.pending);
        added += result.added;
        duplicates += result.duplicates;
        result.skipped.forEach((name) => skipped.add(name));
      });
      store.setPending(updates);
      setStaged([]);
      if (added)
        toast(
          t("limsAddedAcrossSamples", { count: added, samples: updates.size }),
          "success"
        );
      else if (duplicates)
        toast(t("limsAlreadyOnSamplesUseRepeat"), "info", { duration: 6000 });
      if (skipped.size)
        toast(
          t("limsSkippedNotApproved", { names: [...skipped].join(", ") }),
          "info",
          { duration: 6000 }
        );
    } catch {
      toast(t("limsExpandTestsFailed"), "error");
    } finally {
      setAdding(false);
    }
  };

  const setAllOpen = (value: boolean) =>
    setOpen(
      new Map(
        rows.filter((r) => r.kind !== "component").map((r) => [r.id, value])
      )
    );

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-128 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {header}
        <div className="ml-auto" />
        {trailing}
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900">
        {!readOnly ? (
          <div data-tour="add-tests" className="flex items-center gap-2">
            <div className="w-80">
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
              size="sm"
              onClick={addToAll}
              loading={adding}
              disabled={adding || !staged.length}
            >
              {t("limsAddToAllSamples", { count: samples.length })}
            </Button>
          </div>
        ) : null}
        <input
          type="search"
          data-tour="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("bulkSearchComponents")}
          className="h-9 w-56 rounded-lg border border-gray-200 bg-transparent px-3 text-sm dark:border-gray-700"
        />
        <label
          data-tour="only-empty"
          className="flex items-center gap-1.5 text-xs"
        >
          <input
            type="checkbox"
            checked={onlyEmpty}
            onChange={(e) => setOnlyEmpty(e.target.checked)}
            className="h-3.5 w-3.5 accent-brand-500"
          />
          {t("bulkOnlyEmpty")}
        </label>
        <label
          data-tour="only-diff"
          className="flex items-center gap-1.5 text-xs"
        >
          <input
            type="checkbox"
            checked={onlyDiff}
            onChange={(e) => setOnlyDiff(e.target.checked)}
            className="h-3.5 w-3.5 accent-brand-500"
          />
          {t("limsOnlyDifferences")}
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
        <span
          data-tour="legend"
          className="ml-auto flex items-center gap-3 text-xs text-gray-500"
        >
          <span className="inline-block h-3 w-3 rounded-sm bg-brand-100" />{" "}
          {t("bulkLegendChanged")}
          <span className="inline-block h-3 w-3 rounded-sm bg-warning-100" />{" "}
          {t("bulkLegendDiffers")}
          <span className="text-gray-400">—</span> {t("bulkLegendNotOnSample")}
        </span>
      </div>
      <div className="min-h-0 flex-1" {...sheet.containerProps}>
        {loadingRows ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            {t("limsLoadingSamples", {
              loaded: rowsBySample.size,
              total: samples.filter((s) => s.saved).length
            })}
          </div>
        ) : (
          <AgGridReact<GridRow>
            theme={gridTheme}
            rowData={rows}
            columnDefs={columns}
            getRowId={(p) => p.data.id}
            getRowClass={(p) => `tour-${p.data?.kind}`}
            onGridReady={sheet.onGridReady}
            singleClickEdit
            enterNavigatesVertically
            enterNavigatesVerticallyAfterEdit
            stopEditingWhenCellsLoseFocus={false}
            defaultColDef={{
              resizable: true,
              sortable: false,
              suppressMovable: true
            }}
            overlayNoRowsTemplate={t("bulkNoTestsYet")}
            {...closeEditorOnScroll}
          />
        )}
      </div>
    </div>
  );
};

export default SampleTestsResultsGrid;
