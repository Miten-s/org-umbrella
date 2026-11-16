import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  NEW_RECORD,
  recordPageUrl,
  recordsActionUrl
} from "@/components/data/recordPage";
import { PageUrl } from "@/types/utils.types";

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
import { fetchLimsInstrumentPartList } from "./LimsInstrumentPart.api";
import { getLimsInstrumentPartColumns } from "./LimsInstrumentPart.columns";
import {
  limsInstrumentPartKeys,
  useBulkCloneLimsInstrumentPart,
  useBulkDeleteLimsInstrumentPart,
  useBulkUpdateLimsInstrumentPart,
  useLimsInstrumentPartAudit,
  useRestoreLimsInstrumentPart,
  useBulkRestoreLimsInstrumentPart
} from "./LimsInstrumentPart.queries";
import type {
  LimsInstrumentPart,
  LimsInstrumentPartPayload
} from "./LimsInstrumentPart.types";

/** LimsInstrumentPart list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsInstrumentPartList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<
    LimsInstrumentPart,
    LimsInstrumentPartPayload
  >();
  const auditQuery = useLimsInstrumentPartAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsInstrumentPartList>[1],
      signal?: AbortSignal
    ) => fetchLimsInstrumentPartList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsInstrumentPart>({
    entity: "limsInstrumentPart",
    queryKey: [...limsInstrumentPartKeys.all, { includeRemoved }],
    fetchList
  });

  const bulkClone = useBulkCloneLimsInstrumentPart();
  const bulkDelete = useBulkDeleteLimsInstrumentPart();
  const bulkUpdate = useBulkUpdateLimsInstrumentPart();
  const restore = useRestoreLimsInstrumentPart();
  const bulkRestoreInstrumentPart = useBulkRestoreLimsInstrumentPart();

  const busy =
    bulkClone.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restore.isPending ||
    bulkRestoreInstrumentPart.isPending;

  const columnDefs = useMemo(
    () => getLimsInstrumentPartColumns({ t, includeRemoved }),
    [t, includeRemoved]
  );

  // View/Edit/Copy always open a page: one record its own page, several the selected-records page.
  const openCopy = useCallback(
    (ids: string[]) =>
      navigate(
        recordsActionUrl(PageUrl.LIMSInstrumentPartsWorkspace.path, "copy", ids)
      ),
    [navigate]
  );

  const openView = useCallback(
    (ids: string[]) =>
      navigate(
        recordsActionUrl(PageUrl.LIMSInstrumentPartsWorkspace.path, "view", ids)
      ),
    [navigate]
  );

  const openEdit = useCallback(
    (ids: string[]) =>
      navigate(
        recordsActionUrl(PageUrl.LIMSInstrumentPartsWorkspace.path, "edit", ids)
      ),
    [navigate]
  );

  const label = (row: LimsInstrumentPart) =>
    String(row.partId ?? row.partName ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "view",
        label: () => t("limsView"),
        icon: EyeIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.VIEW_INSTRUMENT_PART,
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
        permission: LIMS_PERMISSIONS.CREATE_INSTRUMENT_PART,
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
        permission: LIMS_PERMISSIONS.UPDATE_INSTRUMENT_PART,
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
        permission: LIMS_PERMISSIONS.UPDATE_INSTRUMENT_PART,
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
        permission: LIMS_PERMISSIONS.DELETE_INSTRUMENT_PART,
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

  const rowActions = useMemo<AppDataTableRowAction<LimsInstrumentPart>[]>(
    () => [
      {
        key: "view",
        label: t("limsView"),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_INSTRUMENT_PART,
        onClick: (row) => openView([row.id])
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_INSTRUMENT_PART,
        onClick: (row) => openEdit([row.id])
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_INSTRUMENT_PART,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_INSTRUMENT_PART,
        onClick: (row) => openCopy([row.id])
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_INSTRUMENT_PART,
        hidden: (row: LimsInstrumentPart) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_INSTRUMENT_PART,
        hidden: (row: LimsInstrumentPart) => Boolean(row.isRemoved),
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
      <DataTable<LimsInstrumentPart>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsInstrumentParts")}
        searchPlaceholder={t("search", { entity: t("limsInstrumentParts") })}
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
            label: t("create", { entity: t("limsInstrumentPart") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_INSTRUMENT_PART,
            onClick: () =>
              navigate(
                recordPageUrl(
                  PageUrl.LIMSInstrumentPartsWorkspace.path,
                  NEW_RECORD
                )
              )
          }
        ]}
        emptyState={{ title: t("limsNoInstrumentParts") }}
      />

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsInstrumentPart")}
        entityLabelPlural={t("limsInstrumentParts")}
        getRecordLabel={label}
        deleting={bulkDelete.isPending}
        restoring={restore.isPending}
        bulkRestoring={bulkRestoreInstrumentPart.isPending}
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
            await bulkRestoreInstrumentPart.mutateAsync({
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

export default LimsInstrumentPartList;
