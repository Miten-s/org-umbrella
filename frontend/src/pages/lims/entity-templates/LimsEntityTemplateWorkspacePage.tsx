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
  createLimsEntityTemplate,
  fetchLimsEntityTemplateById,
  updateLimsEntityTemplate
} from "./LimsEntityTemplate.api";
import type {
  LimsEntityTemplate,
  LimsEntityTemplatePayload
} from "./LimsEntityTemplate.types";
import LimsEntityTemplateForm from "./LimsEntityTemplateForm";
import { NEW_ENTITY_TEMPLATE, entityTemplateUrl } from "./entityTemplateRoutes";

const TABS = ["details", "conditions"];
const FORM_ID = "entity-template-workspace-form";

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
  record: LimsEntityTemplate | null;
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
  const [ruleCount, setRuleCount] = useState(0);
  const [pending, setPending] = useState<LimsEntityTemplatePayload | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const saveRequested = useRef(false);

  const create = async (payload: LimsEntityTemplatePayload) => {
    setSaving(true);
    try {
      const result = await createLimsEntityTemplate(payload);
      const id = result?.data?.id ?? result?.id;
      toast(t("workspaceRecordCreated"), "success");
      await queryClient.invalidateQueries({
        queryKey: ["limsEntityTemplate"]
      });
      navigate(id ? entityTemplateUrl(id) : PageUrl.LIMSEntityTemplates.path, {
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
      await updateLimsEntityTemplate(record.id, {
        ...pending,
        changeReason: reason
      });
      toast(t("workspaceRecordSaved"), "success");
      setPending(null);
      await queryClient.invalidateQueries({
        queryKey: ["limsEntityTemplate"]
      });
      onReload();
    } catch (error) {
      toast(errorMessage(error, t("bulkSaveFailed")), "error");
    } finally {
      setSaving(false);
    }
  };

  const title = isNew
    ? t(isCopy ? "copyEntity" : "create", { entity: t("limsEntityTemplate") })
    : [record?.entityTemplateId, record?.name].filter(Boolean).join(" · ");

  return (
    <>
      <RecordWorkspace
        title={title}
        subtitle={readOnly ? t("workspaceViewing") : t("workspaceEditing")}
        backTo={PageUrl.LIMSEntityTemplates.path}
        tabs={[
          { key: "details", label: t("workspaceTabTemplateDetails") },
          { key: "conditions", label: t("limsConditions"), count: ruleCount }
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
            <LimsEntityTemplateForm
              mode={
                readOnly ? "view" : isCopy ? "copy" : isNew ? "create" : "edit"
              }
              initialData={record}
              formId={FORM_ID}
              pageSection={tab as "details" | "conditions"}
              onDirtyChange={setDirty}
              onRuleCount={setRuleCount}
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

/** One Entity Template on its own page: Details · Conditions. `new` creates (or
 * copies with ?copyFrom=), an id edits — or views with ?mode=view or without permission. */
const LimsEntityTemplateWorkspacePage = () => {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === NEW_ENTITY_TEMPLATE;
  const copyFrom = isNew ? (params.get("copyFrom") ?? "") : "";
  const sourceId = isNew ? copyFrom : id;
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const query = useQuery({
    queryKey: ["limsEntityTemplate", "workspace", sourceId, version],
    queryFn: ({ signal }) => fetchLimsEntityTemplateById(sourceId, signal),
    enabled: Boolean(sourceId),
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  const readOnly =
    params.get("mode") === "view" ||
    !hasPermission(
      user,
      isNew
        ? LIMS_PERMISSIONS.CREATE_ENTITY_TEMPLATE
        : LIMS_PERMISSIONS.UPDATE_ENTITY_TEMPLATE
    );

  if (sourceId && query.isLoading) return <LoadingSpinner />;
  if (sourceId && (query.isError || !query.data))
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-gray-500">
        {t("workspaceLoadFailed")}
        <Button
          variant="outline"
          onClick={() => navigate(PageUrl.LIMSEntityTemplates.path)}
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

export default LimsEntityTemplateWorkspacePage;
