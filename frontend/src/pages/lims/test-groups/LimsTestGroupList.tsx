import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, {
  type DataTableBulkAction
} from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon
} from "@/public/icons";
import { fetchLimsTestGroupList } from "./LimsTestGroup.api";
import { getLimsTestGroupColumns } from "./LimsTestGroup.columns";
import {
  limsTestGroupKeys,
  useBulkCloneLimsTestGroup,
  useBulkDeleteLimsTestGroup,
  useCreateLimsTestGroup,
  useLimsTestGroupAudit,
  useRestoreLimsTestGroup,
  useUpdateLimsTestGroup,
  useLimsTestGroupById
} from "./LimsTestGroup.queries";
import LimsTestGroupForm, {
  type LimsTestGroupFormMode
} from "./LimsTestGroupForm";
import type {
  LimsTestGroup,
  LimsTestGroupPayload
} from "./LimsTestGroup.types";

/**
 * LIMS Test Groups — Track A module.
 *
 * System test groups are seeded by the backend and must not be removed or
 * cloned; their values can still be edited. Those actions are hidden per row.
 */
const LimsTestGroupList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Only the id of the row being edited/viewed — the list row itself is
  // never passed into the form; the full record (including attachments)
  // is fetched fresh the moment the modal actually needs it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsTestGroupFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsTestGroup, LimsTestGroupPayload>();
  const auditQuery = useLimsTestGroupAudit(compliance.auditRow?.id);
  const detailQuery = useLimsTestGroupById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsTestGroupList>[1],
      signal?: AbortSignal
    ) => fetchLimsTestGroupList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsTestGroup>({
    entity: "limsTestGroup",
    queryKey: [...limsTestGroupKeys.all, { includeRemoved }],
    fetchList
  });

  const createPhrase = useCreateLimsTestGroup();
  const updatePhrase = useUpdateLimsTestGroup();
  const bulkClone = useBulkCloneLimsTestGroup();
  const bulkDelete = useBulkDeleteLimsTestGroup();
  const restorePhrase = useRestoreLimsTestGroup();

  const busy =
    createPhrase.isPending ||
    updatePhrase.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restorePhrase.isPending;

  const columnDefs = useMemo(() => getLimsTestGroupColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsTestGroupFormMode, phrase: LimsTestGroup | null) => {
      setFormMode(mode);
      setActiveId(phrase?.id ?? null);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActiveId(null);
    setFormMode("create");
  };

  const handleSave = async (payload: LimsTestGroupPayload) => {
    if (activeId) {
      compliance.requestUpdate(activeId, payload);
      closeModal();
      return;
    }
    await createPhrase.mutateAsync(payload);
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await updatePhrase.mutateAsync({
      id: pending.id,
      payload: { ...pending.payload, changeReason: reason }
    });
    compliance.clearUpdate();
    setActiveId(null);
    setFormMode("create");
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "delete",
        label: (count) =>
          count > 1 ? "Remove test groups" : "Remove test group",
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_TEST_GROUP,
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
    [compliance, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsTestGroup>[]>(
    () => [
      {
        key: "view",
        label: "View test group",
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_TEST_GROUP,
        onClick: (phrase) => openForm("view", phrase)
      },
      {
        key: "edit",
        label: "Edit test group",
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_TEST_GROUP,
        onClick: (phrase) => openForm("edit", phrase)
      },
      {
        key: "audit",
        label: "Audit trail",
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_TEST_GROUP,
        onClick: (phrase) => compliance.openAudit(phrase)
      },
      {
        key: "clone",
        label: "Copy test group",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_TEST_GROUP,
        onClick: (phrase) => bulkClone.mutate({ mode: "ids", ids: [phrase.id] })
      },
      {
        key: "restore",
        label: "Restore test group",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_TEST_GROUP,
        hidden: (phrase: LimsTestGroup) => !phrase.isRemoved,
        onClick: (phrase) => compliance.requestRestore(phrase)
      },
      {
        key: "delete",
        label: "Remove test group",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_TEST_GROUP,
        hidden: (phrase: LimsTestGroup) => Boolean(phrase.isRemoved),
        onClick: (phrase) =>
          compliance.requestDelete({ mode: "ids", ids: [phrase.id] }, 1, [
            phrase.name
          ])
      }
    ],
    [bulkClone, compliance, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsTestGroup>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsTestGroups")}
        searchPlaceholder="Search test groups…"
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
            label: t("create", { entity: t("limsTestGroup") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_TEST_GROUP,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoTestGroups") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1000px] overflow-x-hidden dark:bg-gray-900"
      >
        {formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsTestGroupForm
            mode={formMode}
            initialData={
              formMode === "create" ? null : (detailQuery.data ?? null)
            }
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createPhrase.isPending || updatePhrase.isPending}
          />
        )}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="test group"
        entityLabelPlural="test groups"
        getRecordLabel={(row) => row.testGroupId || row.name}
        updating={updatePhrase.isPending}
        deleting={bulkDelete.isPending}
        restoring={restorePhrase.isPending}
        auditEntries={auditQuery.entries}

        auditLoading={auditQuery.isLoading}

        auditHasNextPage={auditQuery.hasNextPage}

        auditFetchingNextPage={auditQuery.isFetchingNextPage}

        onAuditLoadMore={auditQuery.fetchNextPage}
        onUpdate={confirmUpdate}
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
      />
    </div>
  );
};

export default LimsTestGroupList;
