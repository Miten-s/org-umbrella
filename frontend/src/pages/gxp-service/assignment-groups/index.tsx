import AppDataTable, {
  AppDataTableBulkAction,
  AppDataTableRowAction,
  AppDataTableToolbarAction
} from "@/components/common/table/AppDataTable";
import CountWithTooltip from "@/components/common/CountWithTooltip";
import Switch from "@/components/common/form/switch/Switch";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";
import { useGlobalContext } from "@/context";
import { useModal } from "@/hooks/useModal";
import { useServerPagination } from "@/hooks/useServerPagination";
import { toast } from "@/lib/toast";
import {
  CheckLineIcon,
  CopyIcon,
  EyeIcon,
  PencilIcon,
  PlusIcon,
  TrashBinIcon
} from "@/public/icons";
import {
  createAssignmentGroup,
  deleteAssignmentGroup,
  disableAssignmentGroup,
  enableAssignmentGroup,
  getAssignmentGroups,
  updateAssignmentGroup
} from "@/services/gxp.service";
import { AssignmentGroup } from "@/types/common.types";
import { GXP_PERMISSIONS } from "@/utils/permissions";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CreateAssignmentGroupModal from "./CreateAssignmentGroupModal";

type AssignmentGroupModalMode = "create" | "edit" | "view";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "AG";

const getMemberNames = (group: AssignmentGroup) =>
  group.members?.map((member) => member.name).filter(Boolean) ?? [];

const copyAssignmentGroupsToClipboard = async (rows: AssignmentGroup[]) => {
  if (!rows.length) {
    return;
  }

  const content = [
    "Group\tManager\tMembers\tDescription\tStatus",
    ...rows.map((group) =>
      [
        group.groupName,
        group.manager?.name ?? "",
        getMemberNames(group).join(", "),
        group.description ?? "",
        group.isActive ? "Active" : "Inactive"
      ].join("\t")
    )
  ].join("\n");

  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(content);
    } else if (typeof document !== "undefined") {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    } else {
      throw new Error("Clipboard unavailable");
    }

    toast(
      rows.length > 1
        ? `${rows.length} assignment groups copied to clipboard.`
        : "Assignment group copied to clipboard.",
      "success"
    );
  } catch (error) {
    console.error("Error copying assignment groups:", error);
    toast(
      "Failed to copy assignment group details. Please try again.",
      "error"
    );
  }
};

const AssignmentGroups = () => {
  const { isOpen, openModal, closeModal } = useModal();
  const { t } = useTranslation();
  const { reFetch, setReFetch } = useGlobalContext();
  const [includeInactive, setIncludeInactive] = useState(false);
  const paginatedAssignmentGroups = useServerPagination<AssignmentGroup>({
    dataKeys: ["assignmentGroups", "groups", "data"],
    dependencies: [includeInactive, reFetch],
    errorMessage: "Failed to load assignment groups. Please try again.",
    fetchPage: (params) => getAssignmentGroups(includeInactive, params)
  });
  const assignmentGroups = paginatedAssignmentGroups.rows;
  const setAssignmentGroups = paginatedAssignmentGroups.setRows;
  const [activeAssignmentGroup, setActiveAssignmentGroup] =
    useState<AssignmentGroup | null>(null);
  const [assignmentGroupModalMode, setAssignmentGroupModalMode] =
    useState<AssignmentGroupModalMode>("create");
  const [pendingDeleteAssignmentGroups, setPendingDeleteAssignmentGroups] =
    useState<AssignmentGroup[]>([]);

  const handleCloseModal = () => {
    closeModal();
    setActiveAssignmentGroup(null);
    setAssignmentGroupModalMode("create");
  };

  const handleSave = async (data: Partial<AssignmentGroup>) => {
    try {
      if (activeAssignmentGroup) {
        await updateAssignmentGroup(activeAssignmentGroup._id, data);
      } else {
        await createAssignmentGroup(data);
      }
      handleCloseModal();
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error saving assignment group:", error);
      toast("Failed to save assignment group. Please try again.", "error");
    }
  };

  const handleStatusChange = useCallback(
    async (group: AssignmentGroup) => {
      const nextStatus = !group.isActive;

      setAssignmentGroups((prev) =>
        prev.map((item) =>
          item._id === group._id ? { ...item, isActive: nextStatus } : item
        )
      );

      try {
        if (nextStatus) {
          await enableAssignmentGroup(group.groupName);
        } else {
          await disableAssignmentGroup(group.groupName);
        }
      } catch (error) {
        console.error("Assignment group status update failed:", error);
        setAssignmentGroups((prev) =>
          prev.map((item) =>
            item._id === group._id
              ? { ...item, isActive: group.isActive }
              : item
          )
        );
      }
    },
    [setAssignmentGroups]
  );

  const handleDeleteConfirmed = async () => {
    if (!pendingDeleteAssignmentGroups.length) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        pendingDeleteAssignmentGroups.map((group) =>
          deleteAssignmentGroup(group._id, { silent: true })
        )
      );
      const failedDeletes = results.filter(
        (result) => result.status === "rejected"
      ).length;
      const successfulDeletes =
        pendingDeleteAssignmentGroups.length - failedDeletes;

      if (successfulDeletes > 0 && failedDeletes === 0) {
        toast(
          successfulDeletes > 1
            ? `${successfulDeletes} assignment groups deleted successfully.`
            : "Assignment group deleted successfully.",
          "success"
        );
      } else if (successfulDeletes > 0) {
        toast(
          `${successfulDeletes} assignment groups deleted, ${failedDeletes} failed.`,
          "error"
        );
      } else {
        toast(
          "Failed to delete selected assignment groups. Please try again.",
          "error"
        );
      }

      setPendingDeleteAssignmentGroups([]);
      setReFetch(!reFetch);
    } catch (error) {
      console.error("Error deleting assignment groups:", error);
      toast(
        "Failed to delete selected assignment groups. Please try again.",
        "error"
      );
    }
  };

  const titleExtra = useMemo<ReactNode>(
    () => (
      <Switch
        label={t("includeInactive")}
        checked={includeInactive}
        onChange={() => setIncludeInactive((prev) => !prev)}
      />
    ),
    [includeInactive, t]
  );

  const toolbarActions = useMemo<AppDataTableToolbarAction<AssignmentGroup>[]>(
    () => [
      {
        key: "create-assignment-group",
        label: t("create", { entity: t("group") }),
        className: "whitespace-nowrap",
        icon: PlusIcon,
        onClick: () => {
          setActiveAssignmentGroup(null);
          setAssignmentGroupModalMode("create");
          openModal();
        },
        permission: GXP_PERMISSIONS.CREATE_ASSIGNMENT_GROUP,
        variant: "primary"
      }
    ],
    [openModal, t]
  );

  const bulkActions = useMemo<AppDataTableBulkAction<AssignmentGroup>[]>(
    () => [
      {
        key: "copy-selected",
        label: (selectedRows) =>
          selectedRows.length > 1
            ? "Copy assignment groups"
            : "Copy assignment group",
        icon: CopyIcon,
        variant: "outline",
        onClick: (selectedRows) => copyAssignmentGroupsToClipboard(selectedRows)
      },
      {
        key: "delete-selected",
        label: (selectedRows) =>
          selectedRows.length > 1
            ? "Delete assignment groups"
            : "Delete assignment group",
        icon: TrashBinIcon,
        permission: GXP_PERMISSIONS.DELETE_ASSIGNMENT_GROUP,
        variant: "destructive",
        onClick: (selectedRows) =>
          setPendingDeleteAssignmentGroups(selectedRows)
      }
    ],
    []
  );

  const rowActions = useMemo<AppDataTableRowAction<AssignmentGroup>[]>(
    () => [
      {
        key: "view",
        label: "View assignment group",
        tooltip: "View assignment group",
        icon: EyeIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.VIEW_ASSIGNMENT_GROUP,
        onClick: (group) => {
          setActiveAssignmentGroup(group);
          setAssignmentGroupModalMode("view");
          openModal();
        }
      },
      {
        key: "edit",
        label: "Edit assignment group",
        tooltip: "Edit assignment group",
        icon: PencilIcon,
        placement: "inline",
        permission: GXP_PERMISSIONS.UPDATE_ASSIGNMENT_GROUP,
        onClick: (group) => {
          setActiveAssignmentGroup(group);
          setAssignmentGroupModalMode("edit");
          openModal();
        }
      },
      {
        key: "copy",
        label: "Copy assignment group",
        tooltip: "Copy assignment group",
        icon: CopyIcon,
        placement: "menu",
        onClick: async (group) => copyAssignmentGroupsToClipboard([group])
      },
      {
        key: "delete",
        label: "Delete assignment group",
        tooltip: "Delete assignment group",
        icon: TrashBinIcon,
        placement: "menu",
        permission: GXP_PERMISSIONS.DELETE_ASSIGNMENT_GROUP,
        tone: "danger",
        onClick: (group) => setPendingDeleteAssignmentGroups([group])
      }
    ],
    [openModal]
  );

  const columnDefs = useMemo<ColDef<AssignmentGroup>[]>(
    () => [
      {
        field: "groupName",
        flex: 1.1,
        headerName: t("groupName"),
        minWidth: 250,
        cellRenderer: (params: ICellRendererParams<AssignmentGroup>) => {
          const data = params.data;
          if (!data) return null;

          return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                {getInitials(data.groupName)}
              </div>
              <div className="min-w-0 truncate text-sm font-semibold text-gray-900 dark:text-white">
                {data.groupName}
              </div>
            </div>
          );
        }
      },
      {
        field: "manager",
        flex: 0.9,
        headerName: t("manager"),
        minWidth: 180,
        valueGetter: ({ data }) => data?.manager?.name ?? "-",
        cellRenderer: (params: ICellRendererParams<AssignmentGroup>) => (
          <div className="py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.value || "-"}
          </div>
        )
      },
      {
        field: "members",
        flex: 1.2,
        headerName: t("members"),
        minWidth: 240,
        sortable: false,
        valueGetter: ({ data }) =>
          getMemberNames(data as AssignmentGroup).join(", "),
        cellRenderer: (params: ICellRendererParams<AssignmentGroup>) => {
          const data = params.data;
          if (!data) return null;

          const memberNames = getMemberNames(data);
          const visibleMembers = memberNames.slice(0, 2);

          if (!memberNames.length) {
            return (
              <div className="py-1.5 text-sm text-gray-600 dark:text-gray-300">
                -
              </div>
            );
          }

          return (
            <div className="flex flex-wrap items-center gap-2 py-1.5">
              {visibleMembers.map((member) => (
                <span
                  key={member}
                  className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  {member}
                </span>
              ))}
              {memberNames.length > 2 ? (
                <CountWithTooltip
                  count={memberNames.length - 2}
                  items={memberNames.slice(2)}
                  headerLabel={`Members (${memberNames.length})`}
                  className="self-center"
                />
              ) : null}
            </div>
          );
        }
      },
      {
        field: "description",
        flex: 1.2,
        headerName: t("description"),
        minWidth: 260,
        cellRenderer: (params: ICellRendererParams<AssignmentGroup>) => (
          <div className="line-clamp-2 py-1.5 text-sm text-gray-600 dark:text-gray-300">
            {params.data?.description || "-"}
          </div>
        )
      },
      {
        field: "isActive",
        flex: 0,
        headerName: t("status"),
        minWidth: 170,
        maxWidth: 190,
        cellRenderer: (params: ICellRendererParams<AssignmentGroup>) => {
          const data = params.data;
          if (!data) return null;

          return (
            <div className="py-1.5">
              <Switch
                label={data.isActive ? t("active") : t("inactive")}
                checked={data.isActive}
                onChange={() => handleStatusChange(data)}
              />
            </div>
          );
        }
      }
    ],
    [handleStatusChange, t]
  );

  return (
    <>
      <div className="flex flex-col lg:h-[calc(100dvh-132px)] lg:min-h-0">
        <AppDataTable<AssignmentGroup>
          actionsColumnHeader={t("actions")}
          bulkActions={bulkActions}
          columnDefs={columnDefs}
          defaultColDef={{ flex: 1, minWidth: 180 }}
          emptyMessage="No assignment groups found"
          enableSelection
          errorMessage={paginatedAssignmentGroups.error}
          fillAvailableHeight
          fitContentHeight
          fitContentHeightMaxRows={8}
          fontSize={13}
          getRowId={(group) => group._id}
          headerHeight={46}
          loading={paginatedAssignmentGroups.isLoading}
          maxInlineRowActions={2}
          rowActions={rowActions}
          rowData={assignmentGroups}
          rowHeight={64}
          searchAccessor={(group) =>
            [
              group.groupName,
              group.manager?.name,
              getMemberNames(group).join(" "),
              group.description,
              group.isActive ? "active" : "inactive"
            ]
              .filter(Boolean)
              .join(" ")
          }
          searchPlaceholder="Search assignment groups..."
          tableName={t("gxpAssignmentGroups")}
          titleExtra={titleExtra}
          {...paginatedAssignmentGroups.tablePaginationProps}
          toolbarActions={toolbarActions}
        />
      </div>

      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        className="max-w-[900px] max-h-[100rem] m-4 overflow-y-auto bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
      >
        <CreateAssignmentGroupModal
          onClose={handleCloseModal}
          onSubmit={handleSave}
          initialData={activeAssignmentGroup || undefined}
          mode={assignmentGroupModalMode}
        />
      </Modal>

      <Modal
        isOpen={pendingDeleteAssignmentGroups.length > 0}
        onClose={() => setPendingDeleteAssignmentGroups([])}
        className="max-w-[500px] min-h-[150px] m-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
        showCloseButton={false}
      >
        <div className="h-full p-5 flex flex-col justify-between">
          <div className="py-2 text-gray-800 dark:text-gray-300">
            {pendingDeleteAssignmentGroups.length > 1
              ? `Are you sure you want to delete these ${pendingDeleteAssignmentGroups.length} assignment groups?`
              : `${t("deleteEntityPrompt", {
                  entityName: pendingDeleteAssignmentGroups[0]?.groupName
                })} ?`}
          </div>

          {pendingDeleteAssignmentGroups.length ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
              {pendingDeleteAssignmentGroups.slice(0, 5).map((group) => (
                <div key={group._id} className="truncate py-0.5">
                  {group.groupName}
                </div>
              ))}
              {pendingDeleteAssignmentGroups.length > 5 ? (
                <div className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  + {pendingDeleteAssignmentGroups.length - 5} more
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setPendingDeleteAssignmentGroups([])}
              className="flex items-center px-4 py-2 text-white"
            >
              {t("cancel")}
            </Button>
            <Button
              startIcon={<CheckLineIcon className="h-4 w-4" />}
              onClick={() => void handleDeleteConfirmed()}
              className="flex items-center px-4 py-2"
            >
              {t("confirm")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AssignmentGroups;
