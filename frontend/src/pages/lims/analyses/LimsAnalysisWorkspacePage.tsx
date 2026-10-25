import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RecordWorkspace from "@/components/data/RecordWorkspace";
import { useWorkspaceTab } from "@/components/data/useWorkspaceTab";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS, hasPermission } from "@/utils/permissions";
import {
  createLimsAnalysis,
  fetchLimsAnalysisById,
  updateLimsAnalysis
} from "./LimsAnalysis.api";
import type { LimsAnalysis, LimsAnalysisPayload } from "./LimsAnalysis.types";
import LimsAnalysisForm from "./LimsAnalysisForm";
import { analysisWorkspaceUrl, NEW_ANALYSIS } from "./analysisRoutes";

const TABS = ["details", "components"] as const;
const FORM_ID = "analysis-workspace-form";

const errorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } }).response?.data
    ?.message ?? fallback;

const Workspace = ({
  record,
  isNew,
  isCopy,
  readOnly,
  onReload
}: {
  record: LimsAnalysis | null;
  isNew: boolean;
  isCopy: boolean;
  readOnly: boolean;
  onReload: () => void;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [, setTab] = useWorkspaceTab([...TABS]);
  const [dirty, setDirty] = useState(false);
  const [componentCount, setComponentCount] = useState(
    record?.components?.length ?? 0
  );
  const [pending, setPending] = useState<LimsAnalysisPayload | null>(null);
  const [saving, setSaving] = useState(false);
  const saveRequested = useRef(false);

  const create = async (payload: LimsAnalysisPayload) => {
    setSaving(true);
    try {
      const result = await createLimsAnalysis(payload);
      const id = result?.data?.id ?? result?.id;
      toast(t("workspaceTemplateCreated"), "success");
      await queryClient.invalidateQueries({ queryKey: ["limsAnalysis"] });
      setDirty(false);
      navigate(
        id
          ? `${analysisWorkspaceUrl(id)}?tab=components`
          : PageUrl.LIMSAnalyses.path,
        {
          replace: true
        }
      );
    } catch (error) {
      toast(errorMessage(error, t("bulkSaveFailed")), "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmUpdate = async (reason: string) => {
    if (!pending || !record) return;
    setSaving(true);
    try {
      await updateLimsAnalysis(record.id, { ...pending, changeReason: reason });
      toast(t("workspaceTemplateSaved"), "success");
      setPending(null);
      await queryClient.invalidateQueries({ queryKey: ["limsAnalysis"] });
      onReload();
    } catch (error) {
      toast(errorMessage(error, t("bulkSaveFailed")), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (payload: LimsAnalysisPayload) => {
    if (!saveRequested.current) return;
    saveRequested.current = false;
    if (isNew) void create(payload);
    else setPending(payload);
  };

  const title = isNew
    ? isCopy
      ? t("copyEntity", { entity: t("limsAnalysis") })
      : t("create", { entity: t("limsAnalysis") })
    : [record?.analysisId, record?.name].filter(Boolean).join(" · ");

  return (
    <>
      <RecordWorkspace
        title={title}
        subtitle={
          readOnly
            ? t("workspaceViewing")
            : isNew
              ? t("workspaceNewTemplate")
              : t("workspaceEditing")
        }
        backTo={PageUrl.LIMSAnalyses.path}
        tabs={[
          { key: "details", label: t("workspaceTabTemplateDetails") },
          {
            key: "components",
            label: t("limsComponents"),
            count: componentCount
          }
        ]}
        readOnly={readOnly}
        dirty={dirty || (isCopy && isNew)}
        saving={saving}
        onSave={() => {
          saveRequested.current = true;
          (
            document.getElementById(FORM_ID) as HTMLFormElement | null
          )?.requestSubmit();
        }}
        onDiscard={onReload}
      >
        {(tab) => (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <LimsAnalysisForm
              mode={
                readOnly ? "view" : isCopy ? "copy" : isNew ? "create" : "edit"
              }
              initialData={record}
              formId={FORM_ID}
              pageSection={tab === "components" ? "components" : "details"}
              onDirtyChange={setDirty}
              onComponentCount={setComponentCount}
              onInvalid={(section) => {
                saveRequested.current = false;
                setTab(section);
                toast(t("workspaceFixFields"), "error");
              }}
              onClose={() => undefined}
              onUnchanged={() => {
                saveRequested.current = false;
                toast(t("workspaceNoChanges"), "info");
              }}
              onSubmit={handleSubmit}
            />
          </div>
        )}
      </RecordWorkspace>

      <ConfirmDialog
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        loading={saving}
        tone="default"
        requireReason
        title={t("limsConfirmChangesTitle")}
        description={t("workspaceTemplateConfirmBody")}
        onConfirm={(reason) => confirmUpdate(reason ?? "")}
      />
    </>
  );
};

/** One Test Template on its own page: Template details · Components. `new` creates (or copies
 * with ?copyFrom=), an id edits — or views with ?mode=view or without update permission. */
const LimsAnalysisWorkspacePage = () => {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === NEW_ANALYSIS;
  const copyFrom = isNew ? (params.get("copyFrom") ?? "") : "";
  const sourceId = isNew ? copyFrom : id;
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const query = useQuery({
    queryKey: ["limsAnalysis", "workspace", sourceId, version],
    queryFn: ({ signal }) => fetchLimsAnalysisById(sourceId, signal),
    enabled: Boolean(sourceId),
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  const readOnly =
    params.get("mode") === "view" ||
    !hasPermission(
      user,
      isNew
        ? LIMS_PERMISSIONS.CREATE_ANALYSIS
        : LIMS_PERMISSIONS.UPDATE_ANALYSIS
    );

  if (sourceId && query.isLoading) return <LoadingSpinner />;
  if (sourceId && (query.isError || !query.data))
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-gray-500">
        {t("workspaceLoadFailed")}
        <Button
          variant="outline"
          onClick={() => navigate(PageUrl.LIMSAnalyses.path)}
        >
          {t("bulkBack")}
        </Button>
      </div>
    );

  return (
    <Workspace
      key={`${id}:${copyFrom}:${version}`}
      record={query.data ?? null}
      isNew={isNew}
      isCopy={Boolean(copyFrom)}
      readOnly={readOnly}
      onReload={reload}
    />
  );
};

export default LimsAnalysisWorkspacePage;
