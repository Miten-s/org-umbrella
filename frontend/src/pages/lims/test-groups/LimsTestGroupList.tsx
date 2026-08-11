import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TimeIcon, TrashBinIcon } from "@/public/icons";
import { fetchLimsTestGroupList } from "./LimsTestGroup.api";
import { getLimsTestGroupColumns } from "./LimsTestGroup.columns";
import {
  limsTestGroupKeys,
  useBulkCloneLimsTestGroup,
  useBulkDeleteLimsTestGroup,
  useCreateLimsTestGroup,
  useLimsTestGroupAudit,
  useRestoreLimsTestGroup,
  useUpdateLimsTestGroup
} from "./LimsTestGroup.queries";
import LimsTestGroupForm, { type LimsTestGroupFormMode } from "./LimsTestGroupForm";
import type { LimsTestGroup, LimsTestGroupPayload } from "./LimsTestGroup.types";

/**
 * LIMS Pick Lists (Phrases) — Track A module.
 *
 * System pick lists are seeded by the backend and must not be removed or
 * cloned; their values can still be edited. Those actions are hidden per row.
 */
const LimsTestGroupList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsTestGroup | null>(null);
  const [formMode, setFormMode] = useState<LimsTestGroupFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsTestGroup, LimsTestGroupPayload>();
  const auditQuery = useLimsTestGroupAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsTestGroupList>[1], signal?: AbortSignal) =>
      fetchLimsTestGroupList(includeRemoved, params, signal),
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
      setActive(phrase);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (payload: LimsTestGroupPayload) => {
    if (active) {
      compliance.requestUpdate(active.id, payload);
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
    setActive(null);
    setFormMode("create");
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "delete",
        label: (count) => (count > 1 ? "Remove pick lists" : "Remove pick list"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_TEST_GROUP,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows.filter((row) => selection.ids.includes(row.id)).map((row) => row.name)
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
        label: "View pick list",
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_TEST_GROUP,
        onClick: (phrase) => openForm("view", phrase)
      },
      {
        key: "edit",
        label: "Edit pick list",
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
        label: "Copy pick list",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_TEST_GROUP,
        onClick: (phrase) => bulkClone.mutate({ mode: "ids", ids: [phrase.id] })
      },
      {
        key: "restore",
        label: "Restore pick list",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_TEST_GROUP,
        hidden: (phrase: LimsTestGroup) => !phrase.isRemoved,
        onClick: (phrase) => compliance.requestRestore(phrase)
      },
      {
        key: "delete",
        label: "Remove pick list",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_TEST_GROUP,
        hidden: (phrase: LimsTestGroup) => Boolean(phrase.isRemoved),
        onClick: (phrase) =>
          compliance.requestDelete({ mode: "ids", ids: [phrase.id] }, 1, [phrase.name])
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
        <LimsTestGroupForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createPhrase.isPending || updatePhrase.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="pick list"
        entityLabelPlural="pick lists"
        getRecordLabel={(row) => row.testGroupId || row.name}
        updating={updatePhrase.isPending}
        deleting={bulkDelete.isPending}
        restoring={restorePhrase.isPending}
        auditEntries={auditQuery.data ?? []}
        auditLoading={auditQuery.isLoading}
        onUpdate={confirmUpdate}
        onDelete={async (reason) => {
          const pending = compliance.pendingDelete;
          if (pending) {
            await bulkDelete.mutateAsync({ selection: pending.selection, changeReason: reason });
            table.clearSelection();
          }
          compliance.clearDelete();
        }}
        onRestore={async (reason) => {
          const pending = compliance.pendingRestore;
          if (pending) {
            await restorePhrase.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsTestGroupList;
