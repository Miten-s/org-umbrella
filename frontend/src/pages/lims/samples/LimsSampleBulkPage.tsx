import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ColDef } from "ag-grid-community";
import BulkWorkspace, {
  type WorkspaceField,
  type WorkspaceHandle,
  type WorkspaceStatus
} from "@/components/data/BulkWorkspace";
import { useWarnBeforeUnload } from "@/components/data/useWarnBeforeUnload";
import TourButton from "@/components/tour/TourButton";
import { useProductTour, type TourStep } from "@/components/tour/productTour";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS, hasPermission } from "@/utils/permissions";
import { useLimsProjectOptions } from "@/pages/lims/projects/LimsProject.queries";
import { fetchLimsProjectOptions } from "@/pages/lims/projects/LimsProject.api";
import {
  fetchPhraseEntryOptions,
  PHRASE_CODES
} from "@/pages/lims/phrases/LimsPhrase.api";
import { fetchLimsSpecificationOptions } from "@/pages/lims/specifications/LimsSpecification.api";
import { fetchLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.api";
import { fetchLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.api";
import { fetchLimsStockBatchOptions } from "@/pages/lims/stock-batches/LimsStockBatch.api";
import { useSampleTypeOptions } from "@/pages/lims/phrases/LimsPhrase.queries";
import { useLimsSpecificationOptions } from "@/pages/lims/specifications/LimsSpecification.queries";
import { useLimsLocationOptions } from "@/pages/lims/locations/LimsLocation.queries";
import { useLimsGroupOptions } from "@/pages/lims/groups/LimsGroup.queries";
import { useLimsStockBatchOptions } from "@/pages/lims/stock-batches/LimsStockBatch.queries";
import { fetchLimsSampleTemplateById } from "@/pages/lims/sample-templates/LimsSampleTemplate.api";
import { MAX_BULK_CREATE } from "@/lib/limsBulk";
import { fetchLimsSampleById } from "./LimsSample.api";
import {
  useBulkCreateLimsSample,
  useBulkUpdateLimsSample
} from "./LimsSample.queries";
import type { LimsSample, LimsSamplePayload } from "./LimsSample.types";
import { createBulkTestsStore } from "./sampleBulkStore";
import { sampleFromTemplate } from "./sampleFromTemplate";
import { takenTemplateIds, type PendingTemplate } from "./sampleTests";
import SampleTestsResultsGrid from "./SampleTestsResultsGrid";
import { saveSampleComponentChanges } from "./sampleComponents.api";

const day = (value?: string | null) => (value ? value.slice(0, 10) : "");

type Mode = "create" | "copy" | "edit" | "view";
type Tab = "fields" | "tests";

/** A saved sample's tests become fresh picks on its copy (or a template's on a new sample). */
const picksFrom = (record: LimsSample): PendingTemplate[] =>
  (record.tests ?? [])
    .filter((test) => test.status !== "Cancelled" && test.analysisId)
    .map((test) => ({
      id: String(test.analysisId),
      name: String(test.testName ?? ""),
      componentCount: test.componentCount ?? test.components?.length,
      sourceGroupId: test.sourceTestGroupId ?? undefined,
      sourceGroupName: test.sourceTestGroup?.name
    }));

/** Samples on one full page for Create (N) / Copy / Edit / View — tab Fields: one row per
 * sample, one column per field; tab Results: one row per component, one Value column per
 * sample. New rows get their Results once saved; the page then reopens them in Edit. */
const SampleBulkWorkspacePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const mode = (
    ["create", "copy", "edit", "view"].includes(params.get("mode") ?? "")
      ? params.get("mode")
      : "view"
  ) as Mode;
  const isNew = mode === "create" || mode === "copy";
  const ids = useMemo(
    () => (params.get("ids") ?? "").split(",").filter(Boolean),
    [params]
  );
  const count = Math.min(
    Math.max(Number(params.get("count") ?? 1) || 1, 1),
    MAX_BULK_CREATE
  );
  const templateId = params.get("template") ?? "";
  const readOnly =
    mode === "view" ||
    (mode === "edit" && !hasPermission(user, LIMS_PERMISSIONS.UPDATE_SAMPLE)) ||
    (isNew && !hasPermission(user, LIMS_PERMISSIONS.CREATE_SAMPLE));
  const [tab, setTab] = useState<Tab>(
    ["tests", "results"].includes(params.get("tab") ?? "") ? "tests" : "fields"
  );

  const sourceIds = mode === "create" ? [] : ids;
  const queries = useQueries({
    queries: [...new Set(sourceIds)].map((id) => ({
      queryKey: ["limsSample", "bulk-detail", id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchLimsSampleById(id, signal),
      staleTime: 0
    }))
  });
  const templateQuery = useQuery({
    queryKey: ["limsSampleTemplate", "bulk-start", templateId],
    queryFn: ({ signal }) => fetchLimsSampleTemplateById(templateId, signal),
    enabled: mode === "create" && Boolean(templateId)
  });
  const loading =
    queries.some((q) => q.isLoading) ||
    (mode === "create" && Boolean(templateId) && templateQuery.isLoading);
  const failed = queries.some((q) => q.isError) || templateQuery.isError;

  // Rebuilt when a fetch lands, not on every render's new `queries` array.
  const fetchedKey = queries.map((q) => q.dataUpdatedAt).join();
  const sourceKey = sourceIds.join();
  // Copy keeps one row per selected id (the same sample picked N times gives N copies).
  const records = useMemo<LimsSample[]>(() => {
    if (loading) return [];
    if (mode === "create") {
      const base = templateQuery.data
        ? sampleFromTemplate(templateQuery.data)
        : ({} as LimsSample);
      return Array.from(
        { length: count },
        (_, i) => ({ ...base, id: `new-${i + 1}`, sampleId: "" }) as LimsSample
      );
    }
    const byId = new Map(
      queries.flatMap((q) => (q.data ? [[q.data.id, q.data] as const] : []))
    );
    const loaded = sourceIds.flatMap((id) =>
      byId.has(id) ? [byId.get(id)!] : []
    );
    return mode === "copy"
      ? loaded.map((source, i) => ({
          ...source,
          id: `copy-${i + 1}`,
          sampleId: ""
        }))
      : loaded;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, mode, count, templateQuery.data, fetchedKey, sourceKey]);

  // A fresh store for each set of records, so a refetch after Save drops the saved picks.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => createBulkTestsStore(), [records]);
  const valuesRef = useRef(new Map<string, Record<string, string>>());
  useEffect(() => {
    records.forEach((record, i) =>
      store.register(
        i,
        {
          existing: isNew ? [] : (record.tests ?? []),
          pending: isNew ? picksFrom(record) : []
        },
        () =>
          valuesRef.current.get(record.id)?.sampleName ||
          record.sampleName ||
          `#${i + 1}`
      )
    );
  }, [records, store, isNew]);
  const steps = useSyncExternalStore(store.subscribe, store.getSteps);
  const pendingCount = [...steps.values()].reduce(
    (sum, step) => sum + step.pending.length,
    0
  );
  // A new row whose picked tests differ from what it started with counts as touched.
  const touchedIds = useMemo(
    () =>
      new Set(
        records.flatMap((record, i) => {
          const start = isNew
            ? picksFrom(record)
                .map((p) => p.id)
                .join()
            : "";
          const step = steps.get(i);
          const now = (step?.pending ?? []).map((p) => p.id).join();
          const typed = Object.values(step?.values ?? {}).some(Boolean);
          return now !== start || typed ? [record.id] : [];
        })
      ),
    [records, steps, isNew]
  );
  // Edits to saved results (by server row id) and the fields grid's live counts.
  const [edits, setEdits] = useState<Map<string, string>>(new Map());
  const workspace = useRef<WorkspaceHandle<LimsSample> | null>(null);
  const [status, setStatus] = useState<WorkspaceStatus>({
    changedCells: 0,
    invalidCount: 0,
    savedRows: 0,
    skippedRows: 0
  });
  const newValues = [...steps.values()].reduce(
    (sum, step) =>
      sum +
      Object.keys(step.values ?? {}).filter((key) =>
        step.pending.some((tpl) => key.startsWith(`${tpl.id}|`))
      ).length,
    0
  );

  const fields = useMemo<WorkspaceField<LimsSample>[]>(() => {
    const general = t("bulkSectionGeneral");
    const lot = t("bulkSectionLot");
    const dates = t("bulkSectionDates");
    const notes = t("bulkSectionNotes");
    return [
      {
        key: "sampleName",
        label: t("limsSampleName"),
        type: "text",
        required: true,
        pinned: true,
        width: 200,
        get: (r) => r.sampleName ?? ""
      },
      {
        key: "idText",
        label: t("limsIdText"),
        section: general,
        type: "text",
        get: (r) => r.idText ?? ""
      },
      {
        key: "sampleType",
        label: t("limsSampleType"),
        section: general,
        type: "ref",
        useOptions: useSampleTypeOptions,
        search: fetchPhraseEntryOptions(PHRASE_CODES.SAMPLE_TYPE),
        get: (r) => r.sampleType?.id ?? "",
        refLabel: (r) => r.sampleType?.name ?? ""
      },
      {
        key: "project",
        label: t("limsProject"),
        section: general,
        type: "ref",
        useOptions: useLimsProjectOptions,
        search: fetchLimsProjectOptions,
        get: (r) => r.project?.id ?? "",
        refLabel: (r) => r.project?.name ?? ""
      },
      {
        key: "specification",
        label: t("limsSpecification"),
        section: general,
        type: "ref",
        useOptions: useLimsSpecificationOptions,
        search: fetchLimsSpecificationOptions,
        get: (r) => r.specification?.id ?? "",
        refLabel: (r) => r.specification?.name ?? ""
      },
      {
        key: "group",
        label: t("limsGroup"),
        section: general,
        type: "ref",
        useOptions: useLimsGroupOptions,
        search: fetchLimsGroupOptions,
        get: (r) => r.group?.id ?? "",
        refLabel: (r) => r.group?.name ?? ""
      },
      {
        key: "location",
        label: t("limsLocation"),
        section: general,
        type: "ref",
        useOptions: useLimsLocationOptions,
        search: fetchLimsLocationOptions,
        get: (r) => r.location?.id ?? "",
        refLabel: (r) => r.location?.name ?? ""
      },
      {
        key: "stockBatch",
        label: t("limsStockBatch"),
        section: general,
        type: "ref",
        useOptions: useLimsStockBatchOptions,
        search: fetchLimsStockBatchOptions,
        get: (r) => r.stockBatch?.id ?? "",
        refLabel: (r) => r.stockBatch?.name ?? ""
      },
      {
        key: "lotNumber",
        label: t("limsLotNumber"),
        section: lot,
        type: "text",
        get: (r) => r.lotNumber ?? ""
      },
      {
        key: "serialNumber",
        label: t("limsSerialNumber"),
        section: lot,
        type: "text",
        get: (r) => r.serialNumber ?? ""
      },
      {
        key: "loginDate",
        label: t("limsLoginDate"),
        section: dates,
        type: "date",
        width: 150,
        get: (r) => day(r.loginDate)
      },
      {
        key: "loginBy",
        label: t("limsLoginBy"),
        section: dates,
        type: "text",
        get: (r) => r.loginBy ?? ""
      },
      {
        key: "sampleStartDate",
        label: t("limsSampleStartDate"),
        section: dates,
        type: "date",
        width: 160,
        get: (r) => day(r.sampleStartDate)
      },
      {
        key: "sampleStartBy",
        label: t("limsSampleStartBy"),
        section: dates,
        type: "text",
        get: (r) => r.sampleStartBy ?? ""
      },
      {
        key: "description",
        label: t("description"),
        section: notes,
        type: "textarea",
        maxLength: 500,
        get: (r) => r.description ?? ""
      },
      {
        key: "comments",
        label: t("comments"),
        section: notes,
        type: "textarea",
        maxLength: 500,
        get: (r) => r.comments ?? ""
      }
    ];
  }, [t]);

  const testsColumn = useMemo<ColDef[]>(
    () => [
      {
        colId: "__tests",
        headerName: t("limsSampleTests"),
        width: 160,
        pinned: "left",
        editable: false,
        valueGetter: (p) => {
          const index = records.findIndex((r) => r.id === p.data?.id);
          const step = steps.get(index);
          if (!step) return "";
          const total = takenTemplateIds(step.existing, step.pending).size;
          return step.pending.length && !isNew
            ? `${t("limsTestsCount", { count: total })} · ${t("limsNewCount", { count: step.pending.length })}`
            : t("limsTestsCount", { count: total });
        }
      }
    ],
    [records, steps, t, isNew]
  );

  const [pendingSave, setPendingSave] = useState<{
    updates: { id: string; payload: LimsSamplePayload }[];
    values: [string, string][];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const bulkUpdate = useBulkUpdateLimsSample();
  const bulkCreate = useBulkCreateLimsSample();
  const backToList = () => navigate(PageUrl.LIMSSamples.path);
  const bulkUrl = (query: string) => `${PageUrl.LIMSSamplesBulk.path}?${query}`;
  // A new query string remounts the page: fresh records, picks and edits.
  const reopen = (query: string) =>
    navigate(bulkUrl(`${query}&v=${Date.now()}`), { replace: true });

  // Picked tests, each with the values typed for it before it existed.
  const picksOf = (index: number) => {
    const step = steps.get(index);
    return (step?.pending ?? []).map((tpl) => {
      const prefix = `${tpl.id}|`;
      const values = Object.fromEntries(
        Object.entries(step?.values ?? {})
          .filter(([key, value]) => key.startsWith(prefix) && value)
          .map(([key, value]) => [key.slice(prefix.length), value])
      );
      return {
        analysisId: tpl.id,
        sourceTestGroupId: tpl.sourceGroupId,
        ...(Object.keys(values).length ? { values } : {})
      };
    });
  };

  const changeCount = isNew
    ? status.savedRows
    : status.changedCells + pendingCount + newValues + edits.size;
  const dirty = isNew
    ? status.changedCells > 0 || pendingCount > 0
    : changeCount > 0;
  useWarnBeforeUnload(dirty && !saving);

  const saveAll = async () => {
    const changes = workspace.current?.collect() ?? [];
    if (isNew) {
      // Every filled field, plus picked tests with their values — tests and results are
      // created with the sample in one save.
      const payloads = changes.map(({ record, values }) => {
        const filled = Object.fromEntries(
          Object.entries(values).filter(([, v]) => v !== "")
        );
        const tests = picksOf(records.findIndex((r) => r.id === record.id));
        return {
          ...filled,
          ...(tests.length ? { testTemplates: tests } : {})
        } as LimsSamplePayload;
      });
      setSaving(true);
      try {
        const result = await bulkCreate.mutateAsync(payloads);
        const created = result.results.flatMap((r) =>
          "id" in r && r.id ? [r.id] : []
        );
        if (created.length)
          reopen(`mode=edit&ids=${created.join(",")}&tab=tests`);
      } finally {
        setSaving(false);
      }
      return;
    }
    const updates = changes.flatMap(({ record, values, changed }) => {
      const tests = picksOf(records.findIndex((r) => r.id === record.id));
      if (!changed.length && !tests.length) return [];
      const payload: LimsSamplePayload = {
        sampleName: values.sampleName,
        ...Object.fromEntries(changed.map((key) => [key, values[key]])),
        ...(tests.length ? { testTemplates: tests } : {})
      };
      return [{ id: record.id, payload }];
    });
    if (updates.length || edits.size)
      setPendingSave({ updates, values: [...edits] });
  };

  const confirmSave = async (reason: string) => {
    if (!pendingSave) return;
    setSaving(true);
    try {
      if (pendingSave.updates.length)
        await bulkUpdate.mutateAsync({
          updates: pendingSave.updates,
          changeReason: reason
        });
      if (pendingSave.values.length) {
        const result = await saveSampleComponentChanges(
          pendingSave.values.map(([id, value]) => ({ id, value })),
          reason
        );
        toast(result.message, "success");
      }
      setPendingSave(null);
      await queryClient.invalidateQueries({ queryKey: ["limsSample"] });
      reopen(`mode=edit&ids=${ids.join(",")}&tab=${tab}`);
    } catch (error) {
      toast(
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? t("bulkSaveFailed"),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const tourStep = (target: string, key: string): TourStep => ({
    target,
    title: t(`${key}Title`),
    body: t(`${key}Body`)
  });
  const fieldsTour = useProductTour(
    "samples-bulk-fields",
    [
      tourStep('[data-tour="tabs"]', "tourSampleTabs"),
      tourStep('[data-tour="grid"] .ag-header', "tourSampleFieldsGrid"),
      tourStep('[data-tour="fill-bar"]', "tourSampleFillBar"),
      tourStep('[data-tour="only-diff"]', "tourSampleFieldsDiff"),
      tourStep('[data-tour="legend"]', "tourSampleFieldsLegend"),
      tourStep('[data-tour="save"]', "tourSampleSave")
    ],
    {
      ready: !loading && tab === "fields",
      waitFor: '[data-tour="grid"] .ag-header'
    }
  );
  const testsTour = useProductTour(
    "samples-bulk-tests",
    [
      tourStep('[data-tour="tabs"]', "tourSampleTabs"),
      tourStep('[data-tour="add-tests"]', "tourSampleAddTests"),
      tourStep(".tour-group .ag-cell[col-id='s0']", "tourSampleGroupCell"),
      tourStep(
        ".tour-template .ag-cell[col-id='s0']",
        "tourSampleTemplateCell"
      ),
      tourStep(".tour-component .ag-cell[col-id='s0']", "tourSampleValueCell"),
      tourStep('[data-tour="search"]', "tourSampleSearch"),
      tourStep('[data-tour="only-empty"]', "tourSampleOnlyEmpty"),
      tourStep('[data-tour="only-diff"]', "tourSampleTestsDiff"),
      tourStep('[data-tour="legend"]', "tourSampleTestsLegend"),
      tourStep('[data-tour="save"]', "tourSampleSave")
    ],
    // Opens the first time there are tests to explain.
    { ready: !loading && tab === "tests", waitFor: ".tour-component" }
  );

  const title = t(
    {
      create: "bulkCreateTitle",
      copy: "bulkCopyTitle",
      edit: "bulkEditTitle",
      view: "bulkViewTitle"
    }[mode],
    { count: records.length || ids.length || count, entity: t("limsSamples") }
  );
  const header = (
    <>
      <Button type="button" variant="outline" onClick={backToList}>
        {t("bulkBack")}
      </Button>
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h1>
      <div
        role="tablist"
        data-tour="tabs"
        className="flex overflow-hidden rounded-lg border border-gray-200 text-sm dark:border-gray-700"
      >
        {(["fields", "tests"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`px-4 py-2 ${
              tab === value
                ? "bg-brand-500 text-white"
                : "bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-300"
            }`}
          >
            {t(value === "fields" ? "bulkTabFields" : "bulkTabTests")}
          </button>
        ))}
      </div>
      <TourButton onClick={tab === "fields" ? fieldsTour : testsTour} />
    </>
  );

  const saveArea = readOnly ? null : (
    <div data-tour="save" className="flex items-center gap-3">
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {status.invalidCount
          ? t("bulkMissingRequired", { count: status.invalidCount })
          : mode === "create"
            ? t("bulkCreateSummary", {
                count: status.savedRows,
                skipped: status.skippedRows
              })
            : isNew
              ? t("bulkNewRows", { count: records.length })
              : t("bulkChangesCount", { count: changeCount })}
      </span>
      <Button
        type="button"
        variant="outline"
        disabled={!dirty || saving}
        onClick={() =>
          reopen(
            mode === "create"
              ? `mode=create&count=${count}${templateId ? `&template=${templateId}` : ""}`
              : `mode=${mode}&ids=${ids.join(",")}&tab=${tab}`
          )
        }
      >
        {t("bulkDiscard")}
      </Button>
      <Button
        type="button"
        onClick={saveAll}
        loading={saving}
        disabled={
          saving ||
          status.invalidCount > 0 ||
          (isNew ? !status.savedRows : !changeCount)
        }
      >
        {t("bulkSaveAll")}
      </Button>
    </div>
  );

  const sampleColumns = records.map((r, i) => ({
    id: r.id,
    saved: !isNew,
    label: [
      isNew ? t("bulkNewRow", { n: i + 1 }) : r.sampleId,
      isNew
        ? (valuesRef.current.get(r.id)?.sampleName ?? r.sampleName)
        : r.sampleName
    ]
      .filter(Boolean)
      .join(" · ")
  }));

  if (loading)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-gray-500">
        <LoadingSpinner fullScreen={false} />
        {t("limsLoadingSamples", {
          loaded: queries.filter((q) => q.data).length,
          total: sourceIds.length
        })}
      </div>
    );
  if (failed || !records.length)
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-gray-500">
        {t("bulkLoadFailed")}
        <Button variant="outline" onClick={backToList}>
          {t("bulkBack")}
        </Button>
      </div>
    );

  return (
    <>
      {/* Both tabs stay mounted so switching never loses work; one Save covers both. */}
      <div className={tab === "fields" ? "" : "hidden"}>
        <BulkWorkspace<LimsSample>
          header={header}
          records={records}
          fields={fields}
          idColumn={{
            label: t("limsSampleId"),
            get: (r) =>
              r.sampleId || t("bulkNewRow", { n: records.indexOf(r) + 1 })
          }}
          readOnly={readOnly}
          newRecords={isNew}
          skipUntouched={mode === "create"}
          touchedIds={touchedIds}
          saving={saving}
          onSave={() => undefined}
          hideSave
          trailing={saveArea}
          onStatus={setStatus}
          handleRef={workspace}
          extraColumns={testsColumn}
          valuesRef={valuesRef}
        />
      </div>
      <div className={tab === "tests" ? "" : "hidden"}>
        <SampleTestsResultsGrid
          samples={sampleColumns}
          store={store}
          readOnly={readOnly}
          header={header}
          trailing={saveArea}
          edits={edits}
          onEdit={(rowId, value) =>
            setEdits((prev) => {
              const next = new Map(prev);
              if (value === null) next.delete(rowId);
              else next.set(rowId, value);
              return next;
            })
          }
        />
      </div>
      <ConfirmDialog
        isOpen={pendingSave !== null}
        onClose={() => setPendingSave(null)}
        loading={saving}
        tone="default"
        requireReason
        title={t("limsConfirmChangesTitle")}
        description={t("bulkConfirmAllBody", {
          samples: pendingSave?.updates.length ?? 0,
          values: pendingSave?.values.length ?? 0
        })}
        onConfirm={(reason) => confirmSave(reason ?? "")}
      />
    </>
  );
};

/** A fresh page per selection — Create's save reopens the new samples in Edit on the same route. */
const LimsSampleBulkPage = () => {
  const location = useLocation();
  return <SampleBulkWorkspacePage key={location.search} />;
};

export default LimsSampleBulkPage;
