import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RecordWorkspace from "@/components/data/RecordWorkspace";
import { useWorkspaceTab } from "@/components/data/useWorkspaceTab";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { AuditTrailTable } from "@/components/data/AuditTrailDialog";
import { EmptyState } from "@/components/data/TableStates";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS, hasPermission } from "@/utils/permissions";
import {
  createLimsSample,
  fetchLimsSampleById,
  updateLimsSample
} from "./LimsSample.api";
import { useLimsSampleAudit } from "./LimsSample.queries";
import type { LimsSample, LimsSamplePayload } from "./LimsSample.types";
import LimsSampleForm from "./LimsSampleForm";
import { createBulkTestsStore } from "./sampleBulkStore";
import { slotOfPending } from "./sampleTests";
import SampleTestsResultsGrid from "./SampleTestsResultsGrid";
import { saveSampleComponentChanges } from "./sampleComponents.api";
import { NEW_SAMPLE, workspaceUrl } from "./sampleRoutes";

const TABS = ["details", "execution", "other", "approvals"] as const;
const FORM_ID = "sample-workspace-form";

interface PendingSave {
  form: { payload: LimsSamplePayload; files: File[] } | null;
  values: [string, string][];
}

const errorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } }).response?.data
    ?.message ?? fallback;

/** One sample on its own page: Details · Test Execution · Other (attachments, audit) · Approvals.
 * With no sample it creates one; otherwise one Save, with one reason, covers every tab. */
const Workspace = ({
  sample,
  readOnly,
  onReload
}: {
  sample: LimsSample | null;
  readOnly: boolean;
  onReload: () => void;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !sample;
  const hasRunningTests = (sample?.tests ?? []).some(
    (test) => test.status !== "Cancelled"
  );
  const [tab, setTab] = useWorkspaceTab(
    [...TABS],
    hasRunningTests ? "execution" : "details"
  );

  // Execution tab: the results grid with this one sample as its only column.
  const store = useMemo(() => createBulkTestsStore(), []);
  useEffect(() => {
    store.register(
      0,
      { existing: sample?.tests ?? [], pending: [] },
      () => sample?.sampleName ?? ""
    );
  }, [store, sample]);
  const steps = useSyncExternalStore(store.subscribe, store.getSteps);
  const step = steps.get(0);
  const [edits, setEdits] = useState<Map<string, string>>(new Map());
  const [formDirty, setFormDirty] = useState(false);
  const picks = (step?.pending ?? []).map((tpl) => {
    const prefix = `${slotOfPending(tpl)}|`;
    const values = Object.fromEntries(
      Object.entries(step?.values ?? {})
        .filter(([key, value]) => key.startsWith(prefix) && value)
        .map(([key, value]) => [key.slice(prefix.length), value])
    );
    return {
      analysisId: tpl.id,
      repeatNumber: tpl.repeatNumber,
      sourceTestGroupId: tpl.sourceGroupId,
      ...(Object.keys(values).length ? { values } : {})
    };
  });
  const dirty = edits.size + picks.length > 0 || formDirty;

  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [saving, setSaving] = useState(false);
  // The form reports through onSubmit/onUnchanged; this carries what Save started with.
  const saveRequested = useRef(false);

  const create = async (form: NonNullable<PendingSave["form"]>) => {
    setSaving(true);
    try {
      const result = await createLimsSample(
        {
          ...form.payload,
          ...(picks.length ? { testTemplates: picks } : {})
        },
        form.files
      );
      const id = result?.data?.id ?? result?.id;
      toast(t("workspaceSampleCreated"), "success");
      await queryClient.invalidateQueries({ queryKey: ["limsSample"] });
      navigate(
        id ? `${workspaceUrl(id)}?tab=execution` : PageUrl.LIMSSamples.path,
        { replace: true }
      );
    } catch (error) {
      toast(errorMessage(error, t("bulkSaveFailed")), "error");
    } finally {
      setSaving(false);
    }
  };

  const collect = (form: PendingSave["form"]) => {
    if (!saveRequested.current) return;
    saveRequested.current = false;
    if (isNew) {
      if (form) void create(form);
      return;
    }
    if (!form && !picks.length && !edits.size) {
      toast(t("workspaceNoChanges"), "info");
      return;
    }
    setPendingSave({ form, values: [...edits] });
  };

  const confirmSave = async (reason: string) => {
    if (!pendingSave || !sample) return;
    setSaving(true);
    try {
      if (pendingSave.form || picks.length)
        await updateLimsSample(
          sample.id,
          {
            ...(pendingSave.form?.payload ?? { sampleName: sample.sampleName }),
            ...(picks.length ? { testTemplates: picks } : {}),
            changeReason: reason
          } as LimsSamplePayload,
          pendingSave.form?.files
        );
      if (pendingSave.values.length)
        await saveSampleComponentChanges(
          pendingSave.values.map(([id, value]) => ({ id, value })),
          reason
        );
      toast(t("workspaceSaved"), "success");
      setPendingSave(null);
      await queryClient.invalidateQueries({ queryKey: ["limsSample"] });
      onReload();
    } catch (error) {
      toast(errorMessage(error, t("bulkSaveFailed")), "error");
    } finally {
      setSaving(false);
    }
  };

  const audit = useLimsSampleAudit(
    tab === "other" && sample ? sample.id : undefined
  );
  const label = sample
    ? [sample.sampleId, sample.sampleName].filter(Boolean).join(" · ")
    : t("workspaceNewSample");

  return (
    <>
      <RecordWorkspace
        title={
          isNew ? (
            t("create", { entity: t("limsSample") })
          ) : (
            <span className="inline-flex items-center gap-2">
              {label}
              {sample?.result ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    sample.result === "Pass"
                      ? "bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-300"
                      : "bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-300"
                  }`}
                >
                  {sample.result}
                </span>
              ) : null}
            </span>
          )
        }
        subtitle={
          readOnly
            ? t("workspaceViewing")
            : isNew
              ? t("workspaceNewSampleHint")
              : t("workspaceEditing")
        }
        backTo={PageUrl.LIMSSamples.path}
        tabs={[
          { key: "details", label: t("workspaceTabDetails") },
          { key: "execution", label: t("workspaceTabExecution") },
          { key: "other", label: t("workspaceTabOther") },
          { key: "approvals", label: t("workspaceTabApprovals") }
        ]}
        defaultTab={hasRunningTests ? "execution" : "details"}
        readOnly={readOnly}
        dirty={dirty}
        saving={saving}
        onSave={() => {
          saveRequested.current = true;
          (
            document.getElementById(FORM_ID) as HTMLFormElement | null
          )?.requestSubmit();
        }}
        onDiscard={onReload}
      >
        {(active) => (
          <>
            {/* Every tab stays mounted, so moving between them never loses work. */}
            <div
              className={
                active === "details" || active === "other"
                  ? "rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
                  : "hidden"
              }
            >
              <LimsSampleForm
                mode={readOnly ? "view" : isNew ? "create" : "edit"}
                initialData={sample}
                formId={FORM_ID}
                pageSection={
                  active === "other"
                    ? "other"
                    : active === "details"
                      ? "details"
                      : "none"
                }
                onDirtyChange={setFormDirty}
                onInvalid={() => {
                  saveRequested.current = false;
                  setTab("details");
                  toast(t("workspaceFixFields"), "error");
                }}
                onClose={() => undefined}
                onUnchanged={() => collect(null)}
                onSubmit={(payload, files) => collect({ payload, files })}
              />
              {active === "other" && sample ? (
                <div className="mt-6">
                  <h2 className="mb-3 text-base font-semibold">
                    {t("workspaceAuditTrail")}
                  </h2>
                  <AuditTrailTable
                    entries={audit.entries}
                    loading={audit.isLoading}
                    hasNextPage={audit.hasNextPage}
                    isFetchingNextPage={audit.isFetchingNextPage}
                    onLoadMore={audit.fetchNextPage}
                  />
                </div>
              ) : null}
            </div>

            <div className={active === "execution" ? "" : "hidden"}>
              <SampleTestsResultsGrid
                samples={[
                  {
                    id: sample?.id ?? NEW_SAMPLE,
                    saved: !isNew,
                    label,
                    specificationId: sample?.specification?.id
                  }
                ]}
                store={store}
                readOnly={readOnly}
                header={null}
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

            {active === "approvals" ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                <EmptyState
                  title={t("workspaceApprovalsTitle")}
                  message={t("workspaceApprovalsBody")}
                />
              </div>
            ) : null}
          </>
        )}
      </RecordWorkspace>

      <ConfirmDialog
        isOpen={pendingSave !== null}
        onClose={() => setPendingSave(null)}
        loading={saving}
        tone="default"
        requireReason
        title={t("limsConfirmChangesTitle")}
        description={t("workspaceConfirmBody")}
        onConfirm={(reason) => confirmSave(reason ?? "")}
      />
    </>
  );
};

/** `new` creates a sample; an id edits it — or views it with ?mode=view or without permission. */
const LimsSampleWorkspacePage = () => {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === NEW_SAMPLE;
  // Bumped after Save/Discard so the form and grid start again from the saved sample.
  const [version, setVersion] = useState(0);
  const query = useQuery({
    queryKey: ["limsSample", "workspace", id, version],
    queryFn: ({ signal }) => fetchLimsSampleById(id, signal),
    enabled: !isNew,
    staleTime: 0,
    // A background refetch must never reset work in progress.
    refetchOnWindowFocus: false
  });

  const readOnly =
    params.get("mode") === "view" ||
    !hasPermission(
      user,
      isNew ? LIMS_PERMISSIONS.CREATE_SAMPLE : LIMS_PERMISSIONS.UPDATE_SAMPLE
    );

  if (!isNew && query.isLoading) return <LoadingSpinner />;
  if (!isNew && (query.isError || !query.data))
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-gray-500">
        {t("workspaceLoadFailed")}
        <Button
          variant="outline"
          onClick={() => navigate(PageUrl.LIMSSamples.path)}
        >
          {t("bulkBack")}
        </Button>
      </div>
    );

  return (
    <Workspace
      key={`${id}:${version}`}
      sample={isNew ? null : (query.data ?? null)}
      readOnly={readOnly}
      onReload={() => setVersion((v) => v + 1)}
    />
  );
};

export default LimsSampleWorkspacePage;
