import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import RecordWorkspace from "@/components/data/RecordWorkspace";
import RecordInfoPanel from "@/components/lims/RecordInfoPanel";
import { useWorkspaceTab } from "@/components/data/useWorkspaceTab";
import { ConfirmDialog } from "@/components/data/ConfirmDialog";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/lib/toast";
import { withSelectedRecords } from "@/components/data/SelectedRecordsPage";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS, hasPermission } from "@/utils/permissions";
import {
  createLimsSpecification,
  fetchLimsSpecificationById,
  updateLimsSpecification
} from "./LimsSpecification.api";
import type {
  LimsSpecification,
  LimsSpecificationPayload
} from "./LimsSpecification.types";
import LimsSpecificationForm from "./LimsSpecificationForm";
import {
  useBulkCloneLimsSpecification,
  useBulkCopyLimsSpecification,
  useBulkUpdateLimsSpecification
} from "./LimsSpecification.queries";
import {
  NEW_SPECIFICATION,
  specificationWorkspaceUrl
} from "./specificationRoutes";

const TABS = ["details", "limits", "other"] as const;
const FORM_ID = "specification-workspace-form";

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
  record: LimsSpecification | null;
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
  const [limitCount, setLimitCount] = useState(record?.limits?.length ?? 0);
  const [pending, setPending] = useState<{
    payload: LimsSpecificationPayload;
    files: File[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const saveRequested = useRef(false);

  const create = async (payload: LimsSpecificationPayload, files: File[]) => {
    setSaving(true);
    try {
      const result = await createLimsSpecification(payload, files);
      const id = result?.data?.id ?? result?.id;
      toast(t("workspaceSpecificationCreated"), "success");
      await queryClient.invalidateQueries({ queryKey: ["limsSpecification"] });
      setDirty(false);
      navigate(
        id
          ? `${specificationWorkspaceUrl(id)}?tab=limits`
          : PageUrl.LIMSSpecifications.path,
        { replace: true }
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
      await updateLimsSpecification(
        record.id,
        { ...pending.payload, changeReason: reason },
        pending.files
      );
      toast(t("workspaceSpecificationSaved"), "success");
      setPending(null);
      await queryClient.invalidateQueries({ queryKey: ["limsSpecification"] });
      onReload();
    } catch (error) {
      toast(errorMessage(error, t("bulkSaveFailed")), "error");
    } finally {
      setSaving(false);
    }
  };

  const title = isNew
    ? isCopy
      ? t("copyEntity", { entity: t("limsSpecification") })
      : t("create", { entity: t("limsSpecification") })
    : [record?.specId, record?.name].filter(Boolean).join(" · ");

  return (
    <>
      <RecordWorkspace
        title={title}
        subtitle={
          readOnly
            ? t("workspaceViewing")
            : isNew
              ? t("workspaceNewSpecification")
              : t("workspaceEditing")
        }
        backTo={PageUrl.LIMSSpecifications.path}
        tabs={[
          { key: "details", label: t("workspaceTabSpecificationDetails") },
          { key: "limits", label: t("limsLimits"), count: limitCount },
          { key: "other", label: t("workspaceTabOtherInformation") }
        ]}
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
            <LimsSpecificationForm
              mode={
                readOnly ? "view" : isCopy ? "copy" : isNew ? "create" : "edit"
              }
              initialData={record}
              formId={FORM_ID}
              pageSection={tab}
              onDirtyChange={setDirty}
              onLimitCount={setLimitCount}
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
                route="/lims-specifications"
                recordId={record.id}
                group={record.group?.name}
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
        description={t("workspaceSpecificationConfirmBody")}
        onConfirm={(reason) => confirmUpdate(reason ?? "")}
      />
    </>
  );
};

/** One Specification on its own page: Details · Limits · Other information (attachments).
 * `new` creates (or copies with ?copyFrom=), an id edits — or views with ?mode=view or
 * without update permission. */
const RecordPage = () => {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = id === NEW_SPECIFICATION;
  const copyFrom = isNew ? (params.get("copyFrom") ?? "") : "";
  const sourceId = isNew ? copyFrom : id;
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const query = useQuery({
    queryKey: ["limsSpecification", "workspace", sourceId, version],
    queryFn: ({ signal }) => fetchLimsSpecificationById(sourceId, signal),
    enabled: Boolean(sourceId),
    staleTime: 0,
    refetchOnWindowFocus: false
  });

  const readOnly =
    params.get("mode") === "view" ||
    !hasPermission(
      user,
      isNew
        ? LIMS_PERMISSIONS.CREATE_SPECIFICATION
        : LIMS_PERMISSIONS.UPDATE_SPECIFICATION
    );

  if (sourceId && query.isLoading) return <LoadingSpinner />;
  if (sourceId && (query.isError || !query.data))
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-sm text-gray-500">
        {t("workspaceLoadFailed")}
        <Button
          variant="outline"
          onClick={() => navigate(PageUrl.LIMSSpecifications.path)}
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

const LimsSpecificationWorkspacePage = withSelectedRecords<
  LimsSpecification,
  LimsSpecificationPayload
>(RecordPage, {
  entityKey: "limsSpecification",
  entityPluralKey: "limsSpecifications",
  listPath: PageUrl.LIMSSpecifications.path,
  fetchById: fetchLimsSpecificationById,
  Form: LimsSpecificationForm,
  useBulkUpdate: useBulkUpdateLimsSpecification,
  useBulkCopy: useBulkCopyLimsSpecification,
  useBulkClone: useBulkCloneLimsSpecification,
  createPermission: LIMS_PERMISSIONS.CREATE_SPECIFICATION,
  updatePermission: LIMS_PERMISSIONS.UPDATE_SPECIFICATION
});

export default LimsSpecificationWorkspacePage;
