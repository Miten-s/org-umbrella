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
import { fetchLimsSpecificationList } from "./LimsSpecification.api";
import { getLimsSpecificationColumns } from "./LimsSpecification.columns";
import {
  limsSpecificationKeys,
  useBulkCloneLimsSpecification,
  useBulkDeleteLimsSpecification,
  useCreateLimsSpecification,
  useLimsSpecificationAudit,
  useRestoreLimsSpecification,
  useUpdateLimsSpecification
} from "./LimsSpecification.queries";
import LimsSpecificationForm, { type LimsSpecificationFormMode } from "./LimsSpecificationForm";
import type { LimsSpecification, LimsSpecificationPayload } from "./LimsSpecification.types";

/** LimsSpecification list — built to STANDARDS.md and the MIGRATION.md §5 definition of done. */
const LimsSpecificationList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsSpecification | null>(null);
  const [formMode, setFormMode] = useState<LimsSpecificationFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsSpecification, LimsSpecificationPayload>();
  const auditQuery = useLimsSpecificationAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsSpecificationList>[1], signal?: AbortSignal) =>
      fetchLimsSpecificationList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsSpecification>({
    entity: "limsSpecification",
    queryKey: [...limsSpecificationKeys.all, { includeRemoved }],
    fetchList
  });

  const create = useCreateLimsSpecification();
  const update = useUpdateLimsSpecification();
  const bulkClone = useBulkCloneLimsSpecification();
  const bulkDelete = useBulkDeleteLimsSpecification();
  const restore = useRestoreLimsSpecification();

  const busy =
    create.isPending ||
    update.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restore.isPending;

  const columnDefs = useMemo(() => getLimsSpecificationColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsSpecificationFormMode, row: LimsSpecification | null) => {
      setFormMode(mode);
      setActive(row);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (payload: LimsSpecificationPayload, files: File[]) => {
    if (active) {
      compliance.requestUpdate(active.id, payload, files);
      closeModal();
      return;
    }
    await create.mutateAsync({ payload, files });
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await update.mutateAsync({
      id: pending.id,
      payload: { ...pending.payload, changeReason: reason }, files: pending.files
    });
    compliance.clearUpdate();
    setActive(null);
    setFormMode("create");
  };

  const label = (row: LimsSpecification) => String(row.specId ?? row.name ?? "");

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: () => t("limsCopy"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_SPECIFICATION,
        onClick: async (selection) => {
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
        }
      },
      {
        key: "delete",
        label: () => t("limsRemove"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_SPECIFICATION,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows.filter((row) => selection.ids.includes(row.id)).map(label)
              : []
          )
      }
    ],
    [bulkClone, compliance, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsSpecification>[]>(
    () => [
      {
        key: "view",
        label: t("view", { entity: t("limsSpecification") }),
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_SPECIFICATION,
        onClick: (row) => openForm("view", row)
      },
      {
        key: "edit",
        label: t("edit"),
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_SPECIFICATION,
        onClick: (row) => openForm("edit", row)
      },
      {
        key: "audit",
        label: t("limsAudit"),
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_SPECIFICATION,
        onClick: (row) => compliance.openAudit(row)
      },
      {
        key: "clone",
        label: t("limsCopy"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_SPECIFICATION,
        onClick: (row) => bulkClone.mutate({ mode: "ids", ids: [row.id] })
      },
      {
        key: "restore",
        label: t("limsRestore"),
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_SPECIFICATION,
        hidden: (row: LimsSpecification) => !row.isRemoved,
        onClick: (row) => compliance.requestRestore(row)
      },
      {
        key: "delete",
        label: t("limsRemove"),
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_SPECIFICATION,
        hidden: (row: LimsSpecification) => Boolean(row.isRemoved),
        onClick: (row) => compliance.requestDelete({ mode: "ids", ids: [row.id] }, 1, [label(row)])
      }
    ],
    [bulkClone, compliance, openForm, t]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsSpecification>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsSpecifications")}
        searchPlaceholder={t("search", { entity: t("limsSpecifications") })}
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
            label: t("create", { entity: t("limsSpecification") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_SPECIFICATION,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoSpecifications") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-h-[90vh] max-w-[1100px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <LimsSpecificationForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={create.isPending || update.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel={t("limsSpecification")}
        entityLabelPlural={t("limsSpecifications")}
        getRecordLabel={label}
        updating={update.isPending}
        deleting={bulkDelete.isPending}
        restoring={restore.isPending}
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
            await restore.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsSpecificationList;
