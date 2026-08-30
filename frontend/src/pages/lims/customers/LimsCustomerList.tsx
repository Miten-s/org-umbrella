import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, {
  type DataTableBulkAction
} from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import CopyStepper from "@/components/data/CopyStepper";
import EditStepper from "@/components/data/EditStepper";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import Switch from "@/components/common/form/switch/Switch";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import { toast } from "@/lib/toast";
import { idsSelection } from "@/lib/query/listTypes";
import {
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TimeIcon,
  TrashBinIcon
} from "@/public/icons";
import { fetchLimsCustomerById, fetchLimsCustomerList } from "./LimsCustomer.api";
import { getLimsCustomerColumns } from "./LimsCustomer.columns";
import {
  limsCustomerKeys,
  useBulkCloneLimsCustomer,
  useBulkCopyLimsCustomer,
  useBulkDeleteLimsCustomer,
  useBulkUpdateLimsCustomer,
  useCreateLimsCustomer,
  useLimsCustomerAudit,
  useRestoreLimsCustomer,
  useUpdateLimsCustomer,
  useLimsCustomerById
} from "./LimsCustomer.queries";
import LimsCustomerForm, {
  type LimsCustomerFormMode
} from "./LimsCustomerForm";
import type { LimsCustomer, LimsCustomerPayload } from "./LimsCustomer.types";

/** LIMS Customers — Track A module. */
const LimsCustomerList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  // Only the id of the row being edited/viewed — the list row itself is
  // never passed into the form; the full record (including attachments)
  // is fetched fresh the moment the modal actually needs it.
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<LimsCustomerFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);
  // Set instead of activeId/formMode while the Copy review flow is open.
  const [copyIds, setCopyIds] = useState<string[] | null>(null);
  const [editIds, setEditIds] = useState<string[] | null>(null);

  const compliance = useLimsCompliance<LimsCustomer, LimsCustomerPayload>();
  const auditQuery = useLimsCustomerAudit(compliance.auditRow?.id);
  const detailQuery = useLimsCustomerById(
    activeId ?? undefined,
    isOpen && formMode !== "create"
  );

  const fetchList = useCallback(
    (
      params: Parameters<typeof fetchLimsCustomerList>[1],
      signal?: AbortSignal
    ) => fetchLimsCustomerList(includeRemoved, params, signal),
    [includeRemoved]
  );

  const table = useServerTable<LimsCustomer>({
    entity: "limsCustomer",
    queryKey: [...limsCustomerKeys.all, { includeRemoved }],
    fetchList
  });

  const createCustomer = useCreateLimsCustomer();
  const updateCustomer = useUpdateLimsCustomer();
  const bulkClone = useBulkCloneLimsCustomer();
  const bulkCopy = useBulkCopyLimsCustomer();
  const bulkDelete = useBulkDeleteLimsCustomer();
  const bulkUpdate = useBulkUpdateLimsCustomer();
  const restoreCustomer = useRestoreLimsCustomer();

  const busy =
    createCustomer.isPending ||
    updateCustomer.isPending ||
    bulkClone.isPending ||
    bulkCopy.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending ||
    restoreCustomer.isPending;

  const columnDefs = useMemo(() => getLimsCustomerColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsCustomerFormMode, customer: LimsCustomer | null) => {
      setFormMode(mode);
      setActiveId(customer?.id ?? null);
      openModal();
    },
    [openModal]
  );

  const openCopy = useCallback(
    (ids: string[]) => {
      setCopyIds(ids);
      openModal();
    },
    [openModal]
  );

  const openEdit = useCallback(
    (ids: string[]) => {
      setEditIds(ids);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActiveId(null);
    setFormMode("create");
    setCopyIds(null);
    setEditIds(null);
  };

  const handleSaveCopies = async (payloads: LimsCustomerPayload[]) => {
    await bulkCopy.mutateAsync(payloads);
    handleCloseForm();
    table.clearSelection();
  };

  const handleSaveEdits = (updates: { id: string; payload: LimsCustomerPayload }[]) => {
    handleCloseForm();
    compliance.requestBulkUpdate(updates);
  };

  const handleDuplicateUnreviewedCopies = async (unreviewedIds: string[]) => {
    await bulkClone.mutateAsync(idsSelection(unreviewedIds));
  };

  const handleSave = async (payload: LimsCustomerPayload, files: File[]) => {
    if (activeId) {
      compliance.requestUpdate(activeId, payload, files);
      closeModal();
      return;
    }
    await createCustomer.mutateAsync({ payload, files });
    handleCloseForm();
  };

  const confirmUpdate = async (reason: string) => {
    const pending = compliance.pendingUpdate;
    if (!pending) return;
    await updateCustomer.mutateAsync({
      id: pending.id,
      payload: { ...pending.payload, changeReason: reason },
      files: pending.files
    });
    compliance.clearUpdate();
    setActiveId(null);
    setFormMode("create");
  };

  const bulkActions = useMemo<DataTableBulkAction[]>(
    () => [
      {
        key: "clone",
        label: (count) => (count > 1 ? "Copy customers" : "Copy customer"),
        icon: CopyIcon,
        variant: "outline",
        permission: LIMS_PERMISSIONS.CREATE_CUSTOMER,
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
        permission: LIMS_PERMISSIONS.UPDATE_CUSTOMER,
        onClick: (selection) => {
          if (selection.mode !== "ids") {
            toast(t("editBulkFilterUnsupported"), "error");
            return;
          }
          openEdit(selection.ids);
        }
      },
      {
        key: "delete",
        label: (count) => (count > 1 ? "Remove customers" : "Remove customer"),
        icon: TrashBinIcon,
        variant: "destructive",
        permission: LIMS_PERMISSIONS.DELETE_CUSTOMER,
        onClick: (selection, count) =>
          compliance.requestDelete(
            selection,
            count,
            selection.mode === "ids"
              ? table.rows
                  .filter((row) => selection.ids.includes(row.id))
                  .map((row) => row.customerName)
              : []
          )
      }
    ],
    [bulkClone, compliance, openCopy, openEdit, t, table]
  );

  const rowActions = useMemo<AppDataTableRowAction<LimsCustomer>[]>(
    () => [
      {
        key: "view",
        label: "View customer",
        icon: EyeIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.VIEW_CUSTOMER,
        onClick: (customer) => openForm("view", customer)
      },
      {
        key: "edit",
        label: "Edit customer",
        icon: PencilIcon,
        placement: "inline",
        permission: LIMS_PERMISSIONS.UPDATE_CUSTOMER,
        onClick: (customer) => openForm("edit", customer)
      },
      {
        key: "audit",
        label: "Audit trail",
        icon: TimeIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.VIEW_CUSTOMER,
        onClick: (customer) => compliance.openAudit(customer)
      },
      {
        key: "clone",
        label: "Copy customer",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.CREATE_CUSTOMER,
        onClick: (customer) =>
          openCopy([customer.id])
      },
      {
        key: "restore",
        label: "Restore customer",
        icon: CopyIcon,
        placement: "menu",
        permission: LIMS_PERMISSIONS.UPDATE_CUSTOMER,
        hidden: (customer: LimsCustomer) => !customer.isRemoved,
        onClick: (customer) => compliance.requestRestore(customer)
      },
      {
        key: "delete",
        label: "Remove customer",
        icon: TrashBinIcon,
        placement: "menu",
        tone: "danger",
        permission: LIMS_PERMISSIONS.DELETE_CUSTOMER,
        hidden: (customer: LimsCustomer) => Boolean(customer.isRemoved),
        onClick: (customer) =>
          compliance.requestDelete({ mode: "ids", ids: [customer.id] }, 1, [
            customer.customerName
          ])
      }
    ],
    [compliance, openCopy, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsCustomer>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsCustomers")}
        searchPlaceholder="Search customers…"
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
            label: t("create", { entity: t("limsCustomer") }),
            icon: PlusIcon,
            variant: "primary",
            permission: LIMS_PERMISSIONS.CREATE_CUSTOMER,
            onClick: () => openForm("create", null)
          }
        ]}
        emptyState={{ title: t("limsNoCustomers") }}
      />

      <Modal
        isOpen={isOpen}
        onClose={handleCloseForm}
        className="m-4 max-w-[1000px] overflow-x-hidden dark:bg-gray-900"
        disableOuterScroll
      >
        {copyIds ? (
          <CopyStepper<LimsCustomer, LimsCustomerPayload>
            ids={copyIds}
            fetchById={fetchLimsCustomerById}
            FormComponent={LimsCustomerForm}
            onSaveAll={handleSaveCopies}
            onDuplicateUnreviewed={handleDuplicateUnreviewedCopies}
            onClose={handleCloseForm}
            saving={bulkCopy.isPending || bulkClone.isPending}
            entityLabel={t("limsCustomer")}
          />
        ) : editIds ? (
          <EditStepper<LimsCustomer, LimsCustomerPayload>
            ids={editIds}
            fetchById={fetchLimsCustomerById}
            FormComponent={LimsCustomerForm}
            onSaveAll={handleSaveEdits}
            onClose={handleCloseForm}
            saving={bulkUpdate.isPending}
            entityLabel={t("limsCustomer")}
          />
        ) : formMode !== "create" && (detailQuery.isLoading || detailQuery.isFetching) ? (
          <div className="flex min-h-[300px] items-center justify-center p-10">
            <LoadingSpinner fullScreen={false} />
          </div>
        ) : (
          <LimsCustomerForm
            mode={formMode}
            initialData={
              formMode === "create" ? null : (detailQuery.data ?? null)
            }
            onClose={handleCloseForm}
            onSubmit={handleSave}
            submitting={createCustomer.isPending || updateCustomer.isPending}
          />
        )}
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="customer"
        entityLabelPlural="customers"
        getRecordLabel={(row) => row.customerId || row.customerName}
        updating={updateCustomer.isPending}
        deleting={bulkDelete.isPending}
        restoring={restoreCustomer.isPending}
        bulkUpdating={bulkUpdate.isPending}
        auditEntries={auditQuery.entries}

        auditLoading={auditQuery.isLoading}

        auditHasNextPage={auditQuery.hasNextPage}

        auditFetchingNextPage={auditQuery.isFetchingNextPage}

        onAuditLoadMore={auditQuery.fetchNextPage}
        onUpdate={confirmUpdate}
        onBulkUpdate={async (reason) => {
          const pending = compliance.pendingBulkUpdate;
          if (pending) {
            await bulkUpdate.mutateAsync({ updates: pending.updates, changeReason: reason });
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
            await restoreCustomer.mutateAsync({
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

export default LimsCustomerList;
