import { useState, type ComponentType } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button/Button";
import { useAuth } from "@/context/AuthContext";
import { hasPermission } from "@/utils/permissions";
import { idsSelection, type BulkSelection } from "@/lib/query/listTypes";
import ViewStepper, { type ViewStepperFormProps } from "./ViewStepper";
import EditStepper, { type EditStepperFormProps } from "./EditStepper";
import CopyStepper, { type CopyStepperFormProps } from "./CopyStepper";
import { ConfirmDialog } from "./ConfirmDialog";
import { SELECTED_RECORDS, type SelectedRecordsMode } from "./recordPage";

interface Mutation<A> {
  mutateAsync: (args: A) => Promise<unknown>;
  isPending: boolean;
}

export interface SelectedRecordsConfig<T, P> {
  /** i18n keys of the record's name, e.g. "limsTest" / "limsTests". */
  entityKey: string;
  entityPluralKey: string;
  listPath: string;
  fetchById: (id: string, signal?: AbortSignal) => Promise<T>;
  /** The module's own form — the same one its single-record page uses. */
  Form: ComponentType<ViewStepperFormProps<T>> &
    ComponentType<EditStepperFormProps<T, P>> &
    ComponentType<CopyStepperFormProps<T, P>>;
  useBulkUpdate: () => Mutation<{
    updates: { id: string; payload: P }[];
    changeReason: string;
  }>;
  useBulkCopy: () => Mutation<P[]>;
  useBulkClone: () => Mutation<BulkSelection>;
  createPermission: string;
  updatePermission: string;
}

const MODES: SelectedRecordsMode[] = ["view", "edit", "copy"];

/** Several selected records of a module on one page (`<module>/selected?mode=&ids=`), stepped
 * through with the module's own form. Without the needed permission, edit and copy fall back to view. */
function SelectedRecordsPage<T, P>({
  config
}: {
  config: SelectedRecordsConfig<T, P>;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
  const asked = MODES.find((m) => m === params.get("mode")) ?? "view";
  const allowed =
    (asked === "edit" && hasPermission(user, config.updatePermission)) ||
    (asked === "copy" && hasPermission(user, config.createPermission));
  const mode: SelectedRecordsMode = allowed ? asked : "view";

  const bulkUpdate = config.useBulkUpdate();
  const bulkCopy = config.useBulkCopy();
  const bulkClone = config.useBulkClone();
  const [pendingUpdates, setPendingUpdates] = useState<
    { id: string; payload: P }[] | null
  >(null);

  const entity = t(config.entityKey);
  const backToList = () => navigate(config.listPath);
  const { Form } = config;

  const titleKey = {
    view: "selectedRecordsView",
    edit: "selectedRecordsEdit",
    copy: "selectedRecordsCopy"
  }[mode];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={backToList}>
          {t("bulkBack")}
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-white">
            {t(titleKey, {
              count: ids.length,
              entity: t(
                ids.length === 1 ? config.entityKey : config.entityPluralKey
              )
            })}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("selectedRecordsHint")}
          </p>
        </div>
      </div>

      {ids.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
          {t("selectedRecordsNone")}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          {mode === "view" ? (
            <ViewStepper<T>
              ids={ids}
              fetchById={config.fetchById}
              FormComponent={Form}
              onClose={backToList}
              entityLabel={entity}
            />
          ) : mode === "edit" ? (
            <EditStepper<T, P>
              ids={ids}
              fetchById={config.fetchById}
              FormComponent={Form}
              onSaveAll={setPendingUpdates}
              onClose={backToList}
              saving={bulkUpdate.isPending}
              entityLabel={entity}
            />
          ) : (
            <CopyStepper<T, P>
              ids={ids}
              fetchById={config.fetchById}
              FormComponent={Form}
              onSaveAll={async (payloads) => {
                await bulkCopy.mutateAsync(payloads);
                backToList();
              }}
              onDuplicateUnreviewed={async (unreviewed) => {
                await bulkClone.mutateAsync(idsSelection(unreviewed));
              }}
              onClose={backToList}
              saving={bulkCopy.isPending || bulkClone.isPending}
              entityLabel={entity}
            />
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={pendingUpdates !== null}
        onClose={() => setPendingUpdates(null)}
        loading={bulkUpdate.isPending}
        tone="default"
        requireReason
        title={t("limsConfirmBulkChangesTitle")}
        description={t("limsConfirmBulkChangesBody", {
          count: pendingUpdates?.length ?? 0
        })}
        onConfirm={async (reason) => {
          if (!pendingUpdates) return;
          await bulkUpdate.mutateAsync({
            updates: pendingUpdates,
            changeReason: reason ?? ""
          });
          setPendingUpdates(null);
          backToList();
        }}
      />
    </div>
  );
}

/** Serves a module's record route for both one record (`:id`) and several (`selected`). */
export function withSelectedRecords<T, P>(
  RecordPage: ComponentType,
  config: SelectedRecordsConfig<T, P>
) {
  const Page = () => {
    const { id } = useParams();
    return id === SELECTED_RECORDS ? (
      <SelectedRecordsPage config={config} />
    ) : (
      <RecordPage />
    );
  };
  return Page;
}

export default SelectedRecordsPage;
