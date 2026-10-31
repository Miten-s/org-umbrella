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
  createLimsSampleTemplate,
  fetchLimsSampleTemplateById,
  updateLimsSampleTemplate
} from "./LimsSampleTemplate.api";
import type {
  LimsSampleTemplate,
  LimsSampleTemplatePayload
} from "./LimsSampleTemplate.types";
import LimsSampleTemplateForm from "./LimsSampleTemplateForm";
import { NEW_SAMPLE_TEMPLATE, sampleTemplateUrl } from "./sampleTemplateRoutes";

const TABS = ["details", "fields", "tests"];
const FORM_ID = "sample-template-workspace-form";

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
  record: LimsSampleTemplate | null;
  isNew: boolean;
  isCopy: boolean;
  readOnly: boolean;
  onReload: () => void;
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [, setTab] = useWorkspaceTab(TABS);
  const [dirty, setDirty] = useState(false);
  const [fieldCount, setFieldCount] = useState(0);
  const [pending, setPending] = useState<LimsSampleTemplatePayload | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const saveRequested = useRef(false);

  const create = async (payload: LimsSampleTemplatePayload) => {
    setSaving(true);
    try {
      const result = await createLimsSampleTemplate(payload);
      const id = result?.data?.id ?? result?.id;
      toast(t("workspaceRecordCreated"), "success");
      await queryClient.invalidateQueries({
        queryKey: ["limsSampleTemplate"]
      });
      navigate(id ? sampleTemplateUrl(id) : PageUrl.LIMSSampleTemplates.path, {
        replace: true
      });
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
      await updateLimsSampleTemplate(record.id, {
        ...pending,
        changeReason: reason
      });
      toast(t("workspaceRecordSaved"), "success");
      setPending(null);
      await queryClient.invalidateQueries({
        queryKey: ["limsSampleTemplate"]
      });
      onReload();
    } catch (error) {
      toast(errorMessage(error, t("bulkSaveFailed")), "error");
    } finally {
      setSaving(false);
    }
  };

  const title = isNew
    ? t(isCopy ? "copyEntity" : "create", { entity: t("limsSampleTemplate") })
    : [record?.sampleTemplateId, record?.name].filter(Boolean).join(" · ");

  return (
    <>
      <RecordWorkspace
        title={title}
        subtitle={readOnly ? t("workspaceViewing") : t("workspaceEditing")}
        backTo={PageUrl.LIMSSampleTemplates.path}
        tabs={[
          { key: "details", label: t("workspaceTabTemplateDetails") },
          { key: "fields", label: t("limsTemplateFields"), count: fieldCount },
          { key: "tests", label: t("limsSampleTests") }
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
            <LimsSampleTemplateForm
              mode={
                readOnly ? "view" : isCopy ? "copy" : isNew ? "create" : "edit"
              }
              initialData={record}
              formId={FORM_ID}
              pageSection={tab as "details" | "fields" | "tests"}
              onDirtyChange={setDirty}
              onFieldCount={setFieldCount}
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
              onSubmit={(payload) => {
                if (!saveRequested.current) return;
                saveRequested.current = false;
                if (isNew) void create(payload);
                else setPending(payload);
              }}
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
        description={t("workspaceConfirmBody")}
        onConfirm={(reason) => confirmUpdate(reason ?? "")}
      />
    </>
  );
};

/** One Sample Template on its own page: Template details · Fields · Tests. `new` creates (or
 * copies with ?copyFrom=), an id edits — or views with ?mode=view or without permission. */
const LimsSampleTemplateWorkspacePage = () => {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === NEW_SAMPLE_TEMPLATE;
  const copyFrom = isNew ? (params.get("copyFrom") ?? "") : "";
  const sourceId = isNew ? copyFrom : id;
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const query = useQuery({
    queryKey: ["limsSampleTemplate", "workspace", sourceId, version],
    queryFn: ({ signal }) => fetchLimsSampleTemplateById(sourceId, signal),
    enabled: Boolean(sourceId),
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  const readOnly =
    params.get("mode") === "view" ||
    !hasPermission(
      user,
      isNew
        ? LIMS_PERMISSIONS.CREATE_SAMPLE_TEMPLATE
        : LIMS_PERMISSIONS.UPDATE_SAMPLE_TEMPLATE
    );

  if (sourceId && query.isLoading) return <LoadingSpinner />;
  if (sourceId && (query.isError || !query.data))
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-gray-500">
        {t("workspaceLoadFailed")}
        <Button
          variant="outline"
          onClick={() => navigate(PageUrl.LIMSSampleTemplates.path)}
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

export default LimsSampleTemplateWorkspacePage;
