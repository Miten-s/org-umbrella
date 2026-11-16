import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageUrl } from "@/types/utils.types";
import { useTranslation } from "react-i18next";
import {
  NEW_RECORD,
  recordPageUrl,
  recordsActionUrl
} from "@/components/data/recordPage";

import DataTable, {
  type DataTableBulkAction
} from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import Switch from "@/components/common/form/switch/Switch";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import { toast } from "@/lib/toast";
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon
} from "@/public/icons";
import { fetchLimsPhraseList } from "./LimsPhrase.api";
import { getLimsPhraseColumns } from "./LimsPhrase.columns";
import {
  limsPhraseKeys,
  useBulkCloneLimsPhrase,
  useBulkDeleteLimsPhrase,
  useBulkUpdateLimsPhrase,
  useLimsPhraseAudit,
  useRestoreLimsPhrase,
  useBulkRestoreLimsPhrase
} from "./LimsPhrase.queries";
import type { LimsPhrase, LimsPhrasePayload } from "./LimsPhrase.types";

/** LIMS Pick Lists (Phrases) — system pick lists are seeded by the backend and must not be
 * removed or cloned (hidden per row); their values can still be edited. */
const LimsPhraseList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsPhrase, LimsPhrasePayload>();
  const auditQuery = useLimsPhraseAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsPhraseList>[1], signal?: AbortSignal) =>
      fetchLimsPhraseList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsPhrase>({
    entity: "limsPhrase",
    queryKey: [...limsPhraseKeys.all, { includeRemoved }],
    fetchList
  });

  const bulkClone = useBulkCloneLimsPhrase();
  const bulkDelete = useBulkDeleteLimsPhrase();
  const bulkUpdate = useBulkUpdateLimsPhrase();
  const restorePhrase = useRestoreLimsPhrase();
  const bulkRestorePhrase = useBulkRestoreLimsPhrase();

  const busy =
    bulkClone.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restorePhrase.isPending ||
    bulkRestorePhrase.isPending;

  const columnDefs = useMemo(
    () => getLimsPhraseColumns({ t, includeRemoved }),
    [t, includeRemoved]
  );

  // View/Edit/Copy always open a page: one record its own page, several the selected-records page.
  const openCopy = useCallback(
    (ids: string[]) =>
      navigate(
        recordsActionUrl(PageUrl.LIMSPhrasesWorkspace.path, "copy", ids)
      ),
    [navigate]
  );

  const openView = useCallback(
    (ids: string[]) =>
      navigate(
        recordsActionUrl(PageUrl.LIMSPhrasesWorkspace.path, "view", ids)
      ),
    [navigate]
  );

  const openEdit = useCallback(
    (ids: string[]) =>
      navigate(
        recordsActionUrl(PageUrl.LIMSPhrasesWorkspace.path, "edit", ids)
      ),
    [navigate]
  );

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("limsView"),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_PHRASE,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast(t("viewBulkFilterUnsupported"), "error");
            return;
          }
          openView(selection.ids);
        }
      },
      {
        key: "clone",
        label: () => t("limsCopy"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_PHRASE,
        onClick: async (selection) => {
          if (selection.mode === "ids") {
            openCopy(selection.ids);
            return;
          }
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "edit",
        label: () => t("edit"),
        icon: PencilIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.UPDATE_PHRASE,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast(t("editBulkFilterUnsupported"), "error");
            return;
          }
          openEdit(selection.ids);
        }
      },
      {
        key: "restore",
        label: () => t("limsRestore"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.UPDATE_PHRASE,
        // Only offered when the current selection actually has something removed —
        // an all-active selection would otherwise fire a no-op restore request.
        hidden: (rows) => !rows.some((row) => row.isRemoved),
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast(t("editBulkFilterUnsupported"), "error");
            return;
          }
          compliance.requestBulkRestore(
            selection.ids,
            table.rows
              .filter((row) => selection.ids.includes(row.id))
              .map((row) => row.name)
          );
        }
      },
      {
        key: "delete",
        label: () => t("limsRemove"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_PHRASE,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows
                  .filter((row) => selection.ids.includes(row.id))
                  .map((row) => row.name)
              : []
          )
      }
    ],
    [bulkClone, compliance, openCopy, openEdit, openView, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsPhrase>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_PHRASE,
        onClick: (phrase) => openView([phrase.id])
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_PHRASE,
        onClick: (phrase) => openEdit([phrase.id])
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_PHRASE,
        onClick: (phrase) => compliance.openAudit(phrase)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_PHRASE,
        // A cloned system list would collide on its seeded code.
        hidden: (phrase: LimsPhrase) => Boolean(phrase.isSystem),
        onClick: (phrase) => openCopy([phrase.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_PHRASE,
        hidden: (phrase: LimsPhrase) => !phrase.isRemoved,
        onClick: (phrase) => compliance.requestRestore(phrase)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_PHRASE,
        // System pick lists cannot be deleted (spec p.25).
        hidden: (phrase: LimsPhrase) =>
          Boolean(phrase.isSystem) || Boolean(phrase.isRemoved),
        onClick: (phrase) =>
          compliance.requestDelete({ mode: "ids", ids: [phrase.id] }, 1, [
            phrase.name
          ])
      }
    ],
    [compliance, openCopy, openEdit, openView, t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-132px)] min-h-0">
      <DataTable<LimsPhrase>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsPhrases")}
        searchPlaceholder="Search pick lists…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        titleExtra={
          <Switch
            checked={includeRemoved}
            onChange={setIncludeRemoved}
            label={t("limsShowRemoved")}
          />
        }
        toolbarActions={[
          {
            key: "create",
            label: t("create", { entity: t("limsPhrase") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_PHRASE,
            onClick: () =>
              navigate(
                recordPageUrl(PageUrl.LIMSPhrasesWorkspace.path, NEW_RECORD)
              )
          }
        ]}
        emptyState={{ title: t("limsNoPhrases") }}
      />

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="pick list"
        entityLabelPlural="pick lists"
        getRecordLabel={(row) => row.phrase || row.name}
        deleting={bulkDelete.isPending}
        restoring={restorePhrase.isPending}
        bulkRestoring={bulkRestorePhrase.isPending}
        bulkUpdating={bulkUpdate.isPending}
        auditEntries={auditQuery.entries}

        auditLoading={auditQuery.isLoading}

        auditHasNextPage={auditQuery.hasNextPage}

        auditFetchingNextPage={auditQuery.isFetchingNextPage}

        onAuditLoadMore={auditQuery.fetchNextPage}
        onBulkUpdate={async (reason) => {
          const pending = compliance.pendingBulkUpdate;
          if (pending) {
            await bulkUpdate.mutateAsync({
              updates: pending.updates,
              changeReason: reason
            });
            table.clearSelection();
          }
          compliance.clearBulkUpdate();
        }}
        onDelete={async (reason) => {
          const pending = compliance.pendingDelete;
          if (pending) {
            await bulkDelete.mutateAsync({
              selection: pending.selection,
              changeReason: reason
            });
            table.clearSelection();
          }
          compliance.clearDelete();
        }}
        onRestore={async (reason) => {
          const pending = compliance.pendingRestore;
          if (pending) {
            await restorePhrase.mutateAsync({
              id: pending.id,
              changeReason: reason
            });
          }
          compliance.clearRestore();
        }}
        onBulkRestore={async (reason) => {
          const pending = compliance.pendingBulkRestore;
          if (pending) {
            await bulkRestorePhrase.mutateAsync({
              selection: { mode: "ids", ids: pending.ids },
              changeReason: reason
            });
            table.clearSelection();
          }
          compliance.clearBulkRestore();
        }}
      />
    </div>
  );
};

export default LimsPhraseList;
