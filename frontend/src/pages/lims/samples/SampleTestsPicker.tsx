import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useTranslation } from "react-i18next";
import Label from "@/components/common/form/Label";
import AsyncSelect from "@/components/data/AsyncSelect";
import Button from "@/components/ui/button/Button";
import { ChevronDownIcon, TrashBinIcon } from "@/public/icons";
import { toast } from "@/lib/toast";
import {
  GROUP_PREFIX,
  TEMPLATE_PREFIX,
  useTestSourceOptions
} from "@/pages/lims/analyses/testSources";
import { expandLimsTestSources } from "@/pages/lims/test-groups/LimsTestGroup.api";
import { fetchLimsTestById } from "@/pages/lims/tests/LimsTest.api";
import type { LimsResultRow } from "@/pages/lims/tests/LimsTest.types";
import type { LimsSampleTest } from "./LimsSample.types";
import { applyExpansion, type PendingTemplate } from "./sampleTests";

const BADGE_TONES = {
  success:
    "bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-300",
  error: "bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-300",
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
};

/** Inline status chip — StatusPill is a full-width table-cell wrapper, which squeezed the
 * template name next to it down to nothing. */
const Badge = ({
  tone,
  children
}: {
  tone: keyof typeof BADGE_TONES;
  children: React.ReactNode;
}) => (
  <span
    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]}`}
  >
    {children}
  </span>
);

export type { PendingTemplate };

interface SampleTestsPickerProps {
  /** Tests already on the sample — shown read-only. */
  existing: LimsSampleTest[];
  pending: PendingTemplate[];
  onChange: (pending: PendingTemplate[]) => void;
  disabled?: boolean;
  /** Tag picked templates as "New" — off where every row is just a list entry (Sample Template). */
  markNew?: boolean;
  /** Shown beside the label, e.g. the bulk flows' "Compare tests across samples". */
  actions?: React.ReactNode;
}

const INDIVIDUAL = "__individual";
/** Up to this many tests, groups start expanded; past it they start collapsed. */
const AUTO_EXPAND_LIMIT = 20;
const ROW_HEIGHT = { group: 44, test: 40, component: 30 } as const;

interface Bucket {
  key: string;
  name: string;
  existing: LimsSampleTest[];
  pending: PendingTemplate[];
}

type Row =
  | { kind: "group"; key: string; bucket: Bucket; open: boolean }
  | { kind: "existing"; key: string; test: LimsSampleTest; open: boolean }
  | { kind: "pending"; key: string; tpl: PendingTemplate }
  | { kind: "component"; key: string; component: LimsResultRow }
  | { kind: "message"; key: string; text: string };

type LoadedComponents = LimsResultRow[] | "loading" | "error";

const componentCountOf = (test: LimsSampleTest) =>
  test.componentCount ?? test.components?.length ?? 0;

/** Sample login's test assignment, grouped by the Test Group each test came through. Groups
 * collapse to counts and the list is virtualized, so hundreds of groups stay responsive. */
const SampleTestsPicker = ({
  existing,
  pending,
  onChange,
  disabled = false,
  markNew = true,
  actions
}: SampleTestsPickerProps) => {
  const { t } = useTranslation();
  const [staged, setStaged] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [groupOpen, setGroupOpen] = useState<Map<string, boolean>>(new Map());
  const [openTests, setOpenTests] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState<Map<string, LoadedComponents>>(
    new Map()
  );
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const buckets = useMemo(() => {
    const byKey = new Map<string, Bucket>();
    const bucketFor = (groupId?: string | null, name?: string) => {
      const key = groupId || INDIVIDUAL;
      let bucket = byKey.get(key);
      if (!bucket) {
        bucket = {
          key,
          name: groupId ? (name ?? "") : t("limsIndividualTemplates"),
          existing: [],
          pending: []
        };
        byKey.set(key, bucket);
      }
      return bucket;
    };
    for (const test of existing)
      bucketFor(
        test.sourceTestGroupId,
        test.sourceTestGroup?.name
      ).existing.push(test);
    for (const tpl of pending)
      bucketFor(tpl.sourceGroupId, tpl.sourceGroupName).pending.push(tpl);
    const individual = byKey.get(INDIVIDUAL);
    byKey.delete(INDIVIDUAL);
    return individual ? [...byKey.values(), individual] : [...byKey.values()];
  }, [existing, pending, t]);

  const totals = useMemo(() => {
    const activeExisting = existing.filter(
      (test) => test.status !== "Cancelled"
    );
    return {
      groups: buckets.filter((b) => b.key !== INDIVIDUAL).length,
      tests: activeExisting.length + pending.length,
      components:
        activeExisting.reduce((sum, test) => sum + componentCountOf(test), 0) +
        pending.reduce((sum, tpl) => sum + (tpl.componentCount ?? 0), 0)
    };
  }, [buckets, existing, pending]);

  const rows = useMemo<Row[]>(() => {
    const query = search.trim().toLowerCase();
    const matches = (text?: string) =>
      !query || (text ?? "").toLowerCase().includes(query);
    const defaultOpen = totals.tests <= AUTO_EXPAND_LIMIT;
    const out: Row[] = [];
    for (const bucket of buckets) {
      const groupHit = bucket.key !== INDIVIDUAL && matches(bucket.name);
      const tests = groupHit
        ? bucket.existing
        : bucket.existing.filter(
            (test) => matches(test.testName) || matches(test.testId)
          );
      const tpls = groupHit
        ? bucket.pending
        : bucket.pending.filter((tpl) => matches(tpl.name));
      if (!tests.length && !tpls.length) continue;

      const open = query ? true : (groupOpen.get(bucket.key) ?? defaultOpen);
      out.push({ kind: "group", key: `g:${bucket.key}`, bucket, open });
      if (!open) continue;
      for (const test of tests) {
        const testOpen = openTests.has(test.id);
        out.push({
          kind: "existing",
          key: `t:${test.id}`,
          test,
          open: testOpen
        });
        if (!testOpen) continue;
        const components = test.components ?? loaded.get(test.id);
        if (Array.isArray(components))
          components.forEach((component, index) =>
            out.push({
              kind: "component",
              key: `c:${test.id}:${index}`,
              component
            })
          );
        else
          out.push({
            kind: "message",
            key: `m:${test.id}`,
            text: t(
              components === "error"
                ? "limsComponentsLoadFailed"
                : "limsLoadingComponents"
            )
          });
      }
      for (const tpl of tpls)
        out.push({ kind: "pending", key: `p:${tpl.id}`, tpl });
    }
    return out;
  }, [buckets, search, groupOpen, openTests, loaded, totals.tests, t]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) =>
      ROW_HEIGHT[
        rows[index].kind === "group"
          ? "group"
          : rows[index].kind === "component" || rows[index].kind === "message"
            ? "component"
            : "test"
      ],
    getItemKey: (index) => rows[index].key,
    overscan: 10,
    // Measures during render otherwise, which React warns about.
    useFlushSync: false
  });

  const toggleGroup = (key: string, open: boolean) =>
    setGroupOpen((prev) => new Map(prev).set(key, !open));
  const loadComponents = async (test: LimsSampleTest) => {
    const current = loaded.get(test.id);
    if (test.components || Array.isArray(current) || current === "loading")
      return;
    setLoaded((prev) => new Map(prev).set(test.id, "loading"));
    try {
      const full = await queryClient.fetchQuery({
        queryKey: ["limsTest", test.id],
        queryFn: ({ signal }) => fetchLimsTestById(test.id, signal),
        staleTime: 60_000
      });
      setLoaded((prev) => new Map(prev).set(test.id, full.components ?? []));
    } catch {
      setLoaded((prev) => new Map(prev).set(test.id, "error"));
    }
  };
  const toggleTest = (test: LimsSampleTest) => {
    const opening = !openTests.has(test.id);
    setOpenTests((prev) => {
      const next = new Set(prev);
      if (opening) next.add(test.id);
      else next.delete(test.id);
      return next;
    });
    if (opening) void loadComponents(test);
  };
  const setAllGroups = (open: boolean) =>
    setGroupOpen(new Map(buckets.map((bucket) => [bucket.key, open])));

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
          .map((v) => v.slice(TEMPLATE_PREFIX.length))
      });

      const result = applyExpansion(existing, pending, expansion);
      if (result.added) onChange(result.pending);
      setStaged([]);
      toast(
        t("limsTestsAddedSummary", {
          count: result.added,
          duplicates: result.duplicates
        }),
        result.added ? "success" : "info"
      );
      if (result.skipped.length)
        toast(
          t("limsSkippedNotApproved", { names: result.skipped.join(", ") }),
          "info",
          { duration: 6000 }
        );
    } catch {
      toast(t("limsExpandTestsFailed"), "error");
    } finally {
      setAdding(false);
    }
  };

  const removeBucket = (bucket: Bucket) => {
    const ids = new Set(bucket.pending.map((tpl) => tpl.id));
    onChange(pending.filter((tpl) => !ids.has(tpl.id)));
  };

  const renderRow = (row: Row) => {
    switch (row.kind) {
      case "group": {
        const { bucket, open } = row;
        const components =
          bucket.existing.reduce(
            (sum, test) => sum + componentCountOf(test),
            0
          ) +
          bucket.pending.reduce(
            (sum, tpl) => sum + (tpl.componentCount ?? 0),
            0
          );
        return (
          <div className="flex h-full items-center gap-2 border-b border-gray-200 bg-gray-50 px-2 text-sm dark:border-gray-700 dark:bg-gray-800/60">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => toggleGroup(bucket.key, open)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              <ChevronDownIcon
                className={`h-4 w-4 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`}
              />
              <span className="truncate font-semibold">{bucket.name}</span>
              <span className="shrink-0 text-xs text-gray-500">
                {t("limsTestsCount", {
                  count: bucket.existing.length + bucket.pending.length
                })}
                {" · "}
                {t("limsComponentsCount", { count: components })}
              </span>
            </button>
            {markNew && bucket.pending.length ? (
              <Badge tone="success">
                {t("limsNewCount", { count: bucket.pending.length })}
              </Badge>
            ) : null}
            {!disabled && bucket.pending.length ? (
              <button
                type="button"
                aria-label={`${t("delete")} ${bucket.name}`}
                title={t("limsRemoveNewFromGroup")}
                onClick={() => removeBucket(bucket)}
                className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <TrashBinIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        );
      }
      case "existing": {
        const { test, open } = row;
        return (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => toggleTest(test)}
            className="flex h-full w-full items-center gap-3 border-b border-gray-100 pl-8 pr-3 text-left text-sm dark:border-gray-800"
          >
            <ChevronDownIcon
              className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${open ? "" : "-rotate-90"}`}
            />
            <span className="shrink-0 font-medium">{test.testId}</span>
            <span className="flex-1 truncate">{test.testName}</span>
            <span className="shrink-0 text-xs text-gray-500">
              {t("limsComponentsCount", {
                count: componentCountOf(test)
              })}
            </span>
            <Badge tone={test.status === "Cancelled" ? "error" : "neutral"}>
              {test.status}
            </Badge>
          </button>
        );
      }
      case "pending": {
        const { tpl } = row;
        return (
          <div className="flex h-full items-center gap-3 border-b border-gray-100 pl-8 pr-3 text-sm dark:border-gray-800">
            {markNew ? <Badge tone="success">{t("limsNewTest")}</Badge> : null}
            <span className="flex-1 truncate">{tpl.name}</span>
            {tpl.componentCount !== undefined ? (
              <span className="shrink-0 text-xs text-gray-500">
                {t("limsComponentsCount", { count: tpl.componentCount })}
              </span>
            ) : null}
            {!disabled ? (
              <button
                type="button"
                aria-label={`${t("delete")} ${tpl.name}`}
                onClick={() => onChange(pending.filter((p) => p.id !== tpl.id))}
                className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <TrashBinIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        );
      }
      case "message":
        return (
          <div className="flex h-full items-center border-b border-gray-100 pl-16 pr-3 text-xs text-gray-500 dark:border-gray-800">
            {row.text}
          </div>
        );
      case "component": {
        const { component } = row;
        return (
          <div className="grid h-full grid-cols-[8rem_1fr_6rem_6rem] items-center gap-2 border-b border-gray-100 pl-16 pr-3 text-xs dark:border-gray-800">
            <span className="truncate text-gray-500">
              {component.componentId}
            </span>
            <span className="truncate">{component.componentName}</span>
            <span className="truncate text-gray-500">{component.unit}</span>
            <span className="truncate">{component.value || "—"}</span>
          </div>
        );
      }
    }
  };

  const hasTests = existing.length > 0 || pending.length > 0;

  return (
    <div className="min-w-0">
      <Label tooltip={t("limsSampleTestsHint")}>{t("limsSampleTests")}</Label>

      {!disabled || actions ? (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {!disabled ? (
            <>
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
            </>
          ) : null}
          {actions ? <div className="ml-auto shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      {hasTests ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 px-3 py-2 dark:border-gray-700">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t("limsTestsTotals", totals)}
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("limsSearchTests")}
              className="ml-auto h-8 w-56 rounded-md border border-gray-200 bg-transparent px-2 text-sm dark:border-gray-700"
            />
            <button
              type="button"
              onClick={() => setAllGroups(true)}
              className="text-xs text-brand-600 hover:underline dark:text-brand-400"
            >
              {t("limsExpandAll")}
            </button>
            <button
              type="button"
              onClick={() => setAllGroups(false)}
              className="text-xs text-brand-600 hover:underline dark:text-brand-400"
            >
              {t("limsCollapseAll")}
            </button>
          </div>
          {rows.length ? (
            <div ref={scrollRef} className="max-h-[28rem] overflow-y-auto">
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
                    {renderRow(rows[item.index])}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("limsNoMatchingTests")}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t("limsNoSampleTests")}
        </div>
      )}
    </div>
  );
};

export default SampleTestsPicker;
