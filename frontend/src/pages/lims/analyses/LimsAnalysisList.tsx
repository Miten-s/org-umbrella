import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { PageUrl } from "@/types/utils.types";
import { recordsActionUrl } from "@/components/data/recordPage";
import { analysisWorkspaceUrl, NEW_ANALYSIS } from "./analysisRoutes";

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
import { fetchLimsAnalysisList } from "./LimsAnalysis.api";
import { getLimsAnalysisColumns } from "./LimsAnalysis.columns";
import {
  limsAnalysisKeys,
  useBulkCloneLimsAnalysis,
  useBulkDeleteLimsAnalysis,
  useBulkUpdateLimsAnalysis,
  useLimsAnalysisAudit,
  useRestoreLimsAnalysis,
  useBulkRestoreLimsAnalysis
} from "./LimsAnalysis.queries";
import type { LimsAnalysis, LimsAnalysisPayload } from "./LimsAnalysis.types";

/** LimsAnalysis list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsAnalysisList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsAnalysis, LimsAnalysisPayload>();
  const auditQuery = useLimsAnalysisAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsAnalysisList>[1],
      signal?: AbortSignal
    ) => fetchLimsAnalysisList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsAnalysis>({
    entity: "limsAnalysis",
    queryKey: [...limsAnalysisKeys.all, { includeRemoved }],
    fetchList
  });

  const bulkClone = useBulkCloneLimsAnalysis();
  const bulkDelete = useBulkDeleteLimsAnalysis();
  const bulkUpdate = useBulkUpdateLimsAnalysis();
  const restore = useRestoreLimsAnalysis();
  const bulkRestoreAnalysis = useBulkRestoreLimsAnalysis();

  const busy =
    bulkClone.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restore.isPending ||
    bulkRestoreAnalysis.isPending;

  const columnDefs = useMemo(
    () => getLimsAnalysisColumns({ t, includeRemoved }),
    [t, includeRemoved]
  );

  // View/Edit/Copy always open a page: one record its own page, several the selected-records page.
  const openCopy = useCallback(
    (ids: string[]) =>
      navigate(
        recordsActionUrl(PageUrl.LIMSAnalysisWorkspace.path, "copy", ids)
      ),
    [navigate]
  );

  const openView = useCallback(
    (ids: string[]) =>
      navigate(
        recordsActionUrl(PageUrl.LIMSAnalysisWorkspace.path, "view", ids)
      ),
    [navigate]
  );

  const openEdit = useCallback(
    (ids: string[]) =>
      navigate(
        recordsActionUrl(PageUrl.LIMSAnalysisWorkspace.path, "edit", ids)
      ),
    [navigate]
  );

  const label = (row: LimsAnalysis) => String(row.analysisId ?? row.name ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("limsView"),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_ANALYSIS,
        onClick: (selection) => {
          // Checkbox selection opens the stepper; "select all matching filter" isn't bounded enough to review.
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
        permission: LIMS_PERMISSIONS.CREATE_ANALYSIS,
        onClick: async (selection) => {
          // Same split as View/Edit; "select all matching filter" keeps the old immediate server-side clone.
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
        permission: LIMS_PERMISSIONS.UPDATE_ANALYSIS,
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
        permission: LIMS_PERMISSIONS.UPDATE_ANALYSIS,
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
              .map(label)
          );
        }
      },
      {
        key: "delete",
        label: () => t("limsRemove"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_ANALYSIS,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows
                  .filter((row) => selection.ids.includes(row.id))
                  .map(label)
              : []
          )
      }
    ],
    [bulkClone, compliance, openCopy, openEdit, openView, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsAnalysis>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_ANALYSIS,
        onClick: (row) => openView([row.id])
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_ANALYSIS,
        onClick: (row) => openEdit([row.id])
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_ANALYSIS,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_ANALYSIS,
        onClick: (row) => openCopy([row.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_ANALYSIS,
        hidden: (row: LimsAnalysis) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_ANALYSIS,
        hidden: (row: LimsAnalysis) => Boolean(row.isRemoved),
        onClick: (row) =>
          compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [
            label(row)
          ])
      }
    ],
    [compliance, openCopy, openEdit, openView, t]
  );

  return (
    <div className="flex flex-col h-[calc(100dvh-132px)] min-h-0">
      <DataTable<LimsAnalysis>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsAnalyses")}
        searchPlaceholder={t("search", { entity: t("limsAnalyses") })}
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
            label: t("create", { entity: t("limsAnalysis") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_ANALYSIS,
            onClick: () => navigate(analysisWorkspaceUrl(NEW_ANALYSIS))
          }
        ]}
        emptyState={{ title: t("limsNoAnalyses") }}
      />

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsAnalysis")}
        entityLabelPlural={t("limsAnalyses")}
        getRecordLabel={label}
        deleting={bulkDelete.isPending}
        restoring={restore.isPending}
        bulkRestoring={bulkRestoreAnalysis.isPending}
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
            await restore.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
        onBulkRestore={async (reason) => {
          const pending = compliance.pendingBulkRestore;
          if (pending) {
            await bulkRestoreAnalysis.mutateAsync({
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

export default LimsAnalysisList;
