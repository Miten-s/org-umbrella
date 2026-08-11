import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import DataTable, { type DataTableBulkAction } from "@/components/data/DataTable";
import LimsComplianceDialogs from "@/components/data/LimsComplianceDialogs";
import LimsShowRemovedSwitch from "@/components/lims/LimsShowRemovedSwitch";
import { LIMS_SUPPORTS_SEARCH } from "@/utils/lims.backend.shim";
import { type AppDataTableRowAction } from "@/components/common/table/AppDataTable";
import { Modal } from "@/components/ui/modal";
import { useServerTable } from "@/hooks/useServerTable";
import { useLimsCompliance } from "@/hooks/useLimsCompliance";
import { useModal } from "@/hooks/useModal";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import { CopyIcon, EyeIcon, PencilIcon, PlusIcon, TimeIcon, TrashBinIcon } from "@/public/icons";
import { fetchLimsCustomerList } from "./LimsCustomer.api";
import { getLimsCustomerColumns } from "./LimsCustomer.columns";
import {
  limsCustomerKeys,
  useBulkCloneLimsCustomer,
  useBulkDeleteLimsCustomer,
  useCreateLimsCustomer,
  useLimsCustomerAudit,
  useRestoreLimsCustomer,
  useUpdateLimsCustomer
} from "./LimsCustomer.queries";
import LimsCustomerForm, { type LimsCustomerFormMode } from "./LimsCustomerForm";
import type { LimsCustomer, LimsCustomerPayload } from "./LimsCustomer.types";

/** LIMS Customers — Track A module. */
const LimsCustomerList = () => {
  const { t } = useTranslation();
  const { isOpen, openModal, closeModal } = useModal();

  const [active, setActive] = useState<LimsCustomer | null>(null);
  const [formMode, setFormMode] = useState<LimsCustomerFormMode>("create");
  const [includeRemoved, setIncludeRemoved] = useState(false);

  const compliance = useLimsCompliance<LimsCustomer, LimsCustomerPayload>();
  const auditQuery = useLimsCustomerAudit(compliance.auditRow?.id);

  const fetchList = useCallback(
    (params: Parameters<typeof fetchLimsCustomerList>[1], signal?: AbortSignal) =>
      fetchLimsCustomerList(includeRemoved, params, signal),
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
  const bulkDelete = useBulkDeleteLimsCustomer();
  const restoreCustomer = useRestoreLimsCustomer();

  const busy =
    createCustomer.isPending ||
    updateCustomer.isPending ||
    bulkClone.isPending ||
    bulkDelete.isPending ||
    restoreCustomer.isPending;

  const columnDefs = useMemo(() => getLimsCustomerColumns({ t }), [t]);

  const openForm = useCallback(
    (mode: LimsCustomerFormMode, customer: LimsCustomer | null) => {
      setFormMode(mode);
      setActive(customer);
      openModal();
    },
    [openModal]
  );

  const handleCloseForm = () => {
    closeModal();
    setActive(null);
    setFormMode("create");
  };

  const handleSave = async (payload: LimsCustomerPayload, files: File[]) => {
    if (active) {
      compliance.requestUpdate(active.id, payload, files);
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
    setActive(null);
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
          await bulkClone.mutateAsync(selection);
          table.clearSelection();
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
    [bulkClone, compliance, table]
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
        onClick: (customer) => bulkClone.mutate({ mode: "ids", ids: [customer.id] })
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
    [bulkClone, compliance, openForm]
  );

  return (
    <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
      <DataTable<LimsCustomer>
        table={table}
        columnDefs={columnDefs}
        tableName={t("limsCustomers")}
        searchable={LIMS_SUPPORTS_SEARCH}
        searchPlaceholder="Search customers…"
        enableSelection
        fillAvailableHeight
        busy={busy}
        rowActions={rowActions}
        bulkActions={bulkActions}
        titleExtra={
          <LimsShowRemovedSwitch checked={includeRemoved} onChange={setIncludeRemoved} />
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
        className="m-4 max-h-[90vh] max-w-[1000px] overflow-y-auto overflow-x-hidden dark:bg-gray-900"
      >
        <LimsCustomerForm
          mode={formMode}
          initialData={active}
          onClose={handleCloseForm}
          onSubmit={handleSave}
          submitting={createCustomer.isPending || updateCustomer.isPending}
        />
      </Modal>

      <LimsComplianceDialogs
        compliance={compliance}
        entityLabel="customer"
        entityLabelPlural="customers"
        getRecordLabel={(row) => row.customerId || row.customerName}
        updating={updateCustomer.isPending}
        deleting={bulkDelete.isPending}
        restoring={restoreCustomer.isPending}
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
            await restoreCustomer.mutateAsync({ id: pending.id, changeReason: reason });
          }
          compliance.clearRestore();
        }}
      />
    </div>
  );
};

export default LimsCustomerList;
