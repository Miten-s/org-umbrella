import { useCallback, useRef, useState, type ComponentType } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RecordWorkspace from "@/components/data/RecordWorkspace";
import RecordInfoPanel from "@/components/lims/RecordInfoPanel";
import { useWorkspaceTab } from "@/components/data/useWorkspaceTab";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import type { PageFormProps } from "@/components/data/pageForm";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import { hasPermission } from "@/utils/permissions";
import { NEW_RECORD, recordPageUrl } from "./recordPage";

type FormMode = "create" | "edit" | "view" | "copy";

export interface ModuleFormProps<T, P> extends PageFormProps {
  mode?: FormMode;
  initialData?: T | null;
  formId?: string;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: P, files?: File[]) => Promise<void> | void;
}

export interface ModuleWorkspaceConfig<T, P> {
  /** i18n key of the record's name, e.g. "limsAliquot". */
  entityKey: string;
  listPath: string;
  /** Route pattern of this page, with ":id". */
  pagePath: string;
  /** The module's API route, e.g. "/lims-aliquots" — for the record info panel. */
  apiRoute: string;
  /** React Query key prefix the module's list uses, so it refreshes after a save. */
  queryKey: string;
  fetchById: (id: string, signal?: AbortSignal) => Promise<T>;
  create: (payload: P, files?: File[]) => Promise<unknown>;
  update: (id: string, payload: P, files?: File[]) => Promise<unknown>;
  Form: ComponentType<ModuleFormProps<T, P>>;
  /** Sections after "details", each an i18n key that is also the form's section name. */
  sections: string[];
  title: (record: T) => string;
  createPermission: string;
  updatePermission: string;
  /** The record's group name, shown with created/modified info. */
  groupOf?: (record: T) => string | undefined;
}

const FORM_ID = "module-workspace-form";

const errorMessage = (error: unknown, fallback: string) =>
  (error as { response?: { data?: { message?: string } } }).response?.data
    ?.message ?? fallback;

const newId = (result: unknown) => {
  const r = result as { data?: { id?: string }; id?: string } | undefined;
  return r?.data?.id ?? r?.id;
};

function Workspace<T extends { id: string }, P>({
  config,
  record,
  isNew,
  isCopy,
  readOnly,
  onReload
}: {
  config: ModuleWorkspaceConfig<T, P>;
  record: T | null;
  isNew: boolean;
  isCopy: boolean;
  readOnly: boolean;
  onReload: () => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tabs = ["details", ...config.sections];
  const [, setTab] = useWorkspaceTab(tabs);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState<{ payload: P; files?: File[] } | null>(
    null
  );
  const [saving, setSaving] = useState(false);
  const saveRequested = useRef(false);
  const entity = t(config.entityKey);
  const { Form } = config;

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: [config.queryKey] });

  const create = async (payload: P, files?: File[]) => {
    setSaving(true);
    try {
      const id = newId(await config.create(payload, files));
      toast(t("workspaceRecordCreated", { entity }), "success");
      await refresh();
      setDirty(false);
      navigate(id ? recordPageUrl(config.pagePath, id) : config.listPath, {
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
      await config.update(
        record.id,
        { ...pending.payload, changeReason: reason },
        pending.files
      );
      toast(t("workspaceRecordSaved", { entity }), "success");
      setPending(null);
      await refresh();
      onReload();
    } catch (error) {
      toast(errorMessage(error, t("bulkSaveFailed")), "error");
    } finally {
      setSaving(false);
    }
  };

  const title = isNew
    ? t(isCopy ? "copyEntity" : "create", { entity })
    : record
      ? config.title(record)
      : entity;

  return (
    <>
      <RecordWorkspace
        title={title}
        subtitle={
          readOnly
            ? t("workspaceViewing")
            : isNew
              ? t("workspaceNewRecord")
              : t("workspaceEditing")
        }
        backTo={config.listPath}
        tabs={tabs.map((key) => ({
          key,
          label: key === "details" ? t("workspaceTabRecordDetails") : t(key)
        }))}
        readOnly={readOnly}
        stacked={!isNew}
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
            <Form
              mode={
                readOnly ? "view" : isCopy ? "copy" : isNew ? "create" : "edit"
              }
              initialData={record}
              formId={FORM_ID}
              pageSection={tab}
              onDirtyChange={setDirty}
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
              onSubmit={(payload, files) => {
                if (!saveRequested.current) return;
                saveRequested.current = false;
                if (isNew) void create(payload, files);
                else setPending({ payload, files });
              }}
            />
            {record && !isNew ? (
              <RecordInfoPanel
                route={config.apiRoute}
                recordId={record.id}
                group={config.groupOf?.(record)}
              />
            ) : null}
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
        description={t("workspaceRecordConfirmBody", { entity })}
        onConfirm={(reason) => confirmUpdate(reason ?? "")}
      />
    </>
  );
}

/** One record of a module on its own page: Details plus a tab per sub-list. `new` creates (or
 * copies with ?copyFrom=), an id edits — or views with ?mode=view or without update permission. */
function ModuleWorkspacePage<T extends { id: string }, P>({
  config
}: {
  config: ModuleWorkspaceConfig<T, P>;
}) {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === NEW_RECORD;
  const copyFrom = isNew ? (params.get("copyFrom") ?? "") : "";
  const sourceId = isNew ? copyFrom : id;
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const query = useQuery({
    queryKey: [config.queryKey, "workspace", sourceId, version],
    queryFn: ({ signal }) => config.fetchById(sourceId, signal),
    enabled: Boolean(sourceId),
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  const readOnly =
    params.get("mode") === "view" ||
    !hasPermission(
      user,
      isNew ? config.createPermission : config.updatePermission
    );

  if (sourceId && query.isLoading) return <LoadingSpinner />;
  if (sourceId && (query.isError || !query.data))
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-gray-500">
        {t("workspaceLoadFailed")}
        <Button variant="outline" onClick={() => navigate(config.listPath)}>
          {t("bulkBack")}
        </Button>
      </div>
    );

  return (
    <Workspace<T, P>
      key={`${id}:${copyFrom}:${version}`}
      config={config}
      record={query.data ?? null}
      isNew={isNew}
      isCopy={Boolean(copyFrom)}
      readOnly={readOnly}
      onReload={reload}
    />
  );
}

export default ModuleWorkspacePage;
