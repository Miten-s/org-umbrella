import Input from "@/components/common/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { Dropdown } from "@/components/ui/dropdown/Dropdown";
import { DropdownItem } from "@/components/ui/dropdown/DropdownItem";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ChevronLeftIcon, CloseLineIcon, MoreDotIcon } from "@/public/icons";
import type { AuthenticatedUser } from "@/types/common.types";
import { hasPermission } from "@/utils/permissions";
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  ModuleRegistry,
  SelectionChangedEvent,
  themeQuartz
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  ComponentType,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  SVGProps,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

type SvgIconComponent = ComponentType<SVGProps<SVGSVGElement>>;
type PermissionInput = string | string[];
type ButtonVariant = "primary" | "outline" | "secondary" | "destructive";
type ResolvableText<T> = string | ((context: T) => string);

export interface AppDataTableActionContext<T> {
  activeTabKey: string;
  filteredRows: T[];
  selectedRows: T[];
}

export interface AppDataTableTab<T> {
  key: string;
  label: string;
  predicate?: (row: T) => boolean;
  disabled?: boolean;
  tooltip?: string;
}

export interface AppDataTableToolbarAction<T> {
  key: string;
  label: ResolvableText<AppDataTableActionContext<T>>;
  tooltip?: ResolvableText<AppDataTableActionContext<T>>;
  icon?: SvgIconComponent;
  onClick: (context: AppDataTableActionContext<T>) => void | Promise<void>;
  permission?: PermissionInput;
  permissionLogic?: "all" | "any";
  disabled?: boolean | ((context: AppDataTableActionContext<T>) => boolean);
  variant?: ButtonVariant;
  className?: string;
}

export interface AppDataTableBulkAction<T> {
  key: string;
  label: ResolvableText<T[]>;
  tooltip?: ResolvableText<T[]>;
  icon?: SvgIconComponent;
  onClick: (rows: T[]) => void | Promise<void>;
  permission?: PermissionInput;
  permissionLogic?: "all" | "any";
  disabled?: boolean | ((rows: T[]) => boolean);
  variant?: ButtonVariant;
  className?: string;
}

export interface AppDataTableServerPagination {
  currentPage: number;
  pageSize: number;
  totalRows: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export interface AppDataTableRowAction<T> {
  key: string;
  label: ResolvableText<T>;
  tooltip?: ResolvableText<T>;
  icon: SvgIconComponent;
  onClick: (row: T) => void | Promise<void>;
  placement?: "inline" | "menu";
  permission?: PermissionInput;
  permissionLogic?: "all" | "any";
  disabled?: boolean | ((row: T) => boolean);
  hidden?: boolean | ((row: T) => boolean);
  tone?: "default" | "danger";
}

interface AppDataTableProps<T> {
  tableName: string;
  titleExtra?: ReactNode;
  rowData: T[];
  columnDefs: ColDef<T>[];
  getRowId: (row: T) => string;
  searchAccessor?: (row: T) => string;
  searchPlaceholder?: string;
  toolbarActions?: AppDataTableToolbarAction<T>[];
  bulkActions?: AppDataTableBulkAction<T>[];
  rowActions?: AppDataTableRowAction<T>[];
  tabs?: AppDataTableTab<T>[];
  defaultTabKey?: string;
  totalLabel?: string;
  emptyMessage?: string;
  loading?: boolean;
  errorMessage?: string | null;
  enableSelection?: boolean;
  defaultColDef?: ColDef<T>;
  pageSize?: number;
  pageSizeOptions?: number[] | false;
  paginateChildRows?: boolean;
  serverPagination?: AppDataTableServerPagination;
  onSearchChange?: (searchTerm: string) => void;
  gridHeight?: number;
  rowHeight?: number;
  headerHeight?: number;
  fontSize?: number;
  fitContentHeight?: boolean;
  fitContentHeightMaxRows?: number;
  fillAvailableHeight?: boolean;
  actionsColumnHeader?: string;
  maxInlineRowActions?: number;
}

const resolveBoolean = <T,>(
  value: boolean | ((context: T) => boolean) | undefined,
  context: T
) => {
  if (typeof value === "function") {
    return value(context);
  }

  return value ?? false;
};

const resolveText = <T,>(value: ResolvableText<T>, context: T) => {
  if (typeof value === "function") {
    return value(context);
  }

  return value;
};

const canUseAction = (
  user: AuthenticatedUser,
  permission?: PermissionInput,
  logic: "all" | "any" = "all"
) => {
  if (!permission) {
    return true;
  }

  if (Array.isArray(permission)) {
    const results = permission.map((item) => hasPermission(user, item));
    return logic === "all" ? results.every(Boolean) : results.some(Boolean);
  }

  return hasPermission(user, permission);
};

interface RowActionsCellProps<T> {
  row: T;
  rowActions: AppDataTableRowAction<T>[];
  maxInlineRowActions: number;
  user: AuthenticatedUser;
}

const RowActionsCell = <T extends object>({
  row,
  rowActions,
  maxInlineRowActions,
  user
}: RowActionsCellProps<T>) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });

  const visibleActions = rowActions.filter(
    (action) => !resolveBoolean(action.hidden, row)
  );
  const preferredInlineActions = visibleActions.filter(
    (action) => action.placement !== "menu"
  );
  const preferredMenuActions = visibleActions.filter(
    (action) => action.placement === "menu"
  );
  const inlineActions = preferredInlineActions.slice(0, maxInlineRowActions);
  const menuActions = [
    ...preferredMenuActions,
    ...preferredInlineActions.slice(maxInlineRowActions)
  ];

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleViewportChange = () => {
      setIsMenuOpen(false);
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [isMenuOpen]);

  if (!visibleActions.length) {
    return <span className="text-sm text-gray-400 dark:text-gray-500">-</span>;
  }

  const openMenu = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!triggerRef.current) {
      setIsMenuOpen((current) => !current);
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPosition({
      left: Math.max(16, rect.right - 196),
      top: rect.bottom + 8
    });
    setIsMenuOpen((current) => !current);
  };

  return (
    <div
      className="app-data-table__actions-wrap flex items-center justify-end gap-2 py-2"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {inlineActions.map((action) => {
        const label = resolveText(action.label, row);
        const tooltip = resolveText(action.tooltip ?? action.label, row);
        const actionAllowed = canUseAction(
          user,
          action.permission,
          action.permissionLogic
        );
        const actionDisabled =
          !actionAllowed || resolveBoolean(action.disabled, row);
        const Icon = action.icon;

        return (
          <button
            key={action.key}
            type="button"
            className={[
              "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
              action.tone === "danger"
                ? "border-error-200 text-error-600 hover:bg-error-50 dark:border-error-900 dark:text-error-300 dark:hover:bg-error-950/30"
                : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800",
              actionDisabled
                ? "cursor-not-allowed opacity-50"
                : "shadow-theme-xs"
            ].join(" ")}
            disabled={actionDisabled}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              void action.onClick(row);
            }}
            aria-label={label}
            title={tooltip}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}

      {menuActions.length ? (
        <div className="relative overflow-visible">
          <button
            ref={triggerRef}
            type="button"
            className="dropdown-toggle inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 shadow-theme-xs transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={openMenu}
            aria-label="More actions"
            title="More actions"
          >
            <MoreDotIcon className="h-4 w-4" />
          </button>

          <Dropdown
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            portal
            position="fixed"
            style={{
              left: `${menuPosition.left}px`,
              top: `${menuPosition.top}px`
            }}
            className="mt-0 min-w-[196px] rounded-xl p-1"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {menuActions.map((action) => {
              const label = resolveText(action.label, row);
              const tooltip = action.tooltip
                ? resolveText(action.tooltip, row)
                : undefined;
              const actionAllowed = canUseAction(
                user,
                action.permission,
                action.permissionLogic
              );
              const actionDisabled =
                !actionAllowed || resolveBoolean(action.disabled, row);
              const Icon = action.icon;

              return (
                <DropdownItem
                  key={action.key}
                  title={tooltip}
                  className={[
                    "rounded-lg px-3 py-2 font-medium",
                    action.tone === "danger"
                      ? "text-error-600 hover:bg-error-50 dark:text-error-300 dark:hover:bg-error-950/30"
                      : "",
                    actionDisabled ? "cursor-not-allowed opacity-50" : ""
                  ].join(" ")}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={() => {
                    if (actionDisabled) {
                      return;
                    }
                    setIsMenuOpen(false);
                    void action.onClick(row);
                  }}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </DropdownItem>
              );
            })}
          </Dropdown>
        </div>
      ) : null}
    </div>
  );
};

const AppDataTable = <T extends object>({
  tableName,
  titleExtra,
  rowData,
  columnDefs,
  getRowId,
  searchAccessor,
  searchPlaceholder = "Search...",
  toolbarActions = [],
  bulkActions = [],
  rowActions = [],
  tabs = [],
  defaultTabKey,
  totalLabel,
  emptyMessage = "No records found",
  loading = false,
  errorMessage,
  enableSelection = false,
  defaultColDef: defaultColDefInput,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  paginateChildRows = true,
  serverPagination,
  onSearchChange,
  gridHeight = 440,
  rowHeight = 68,
  headerHeight = 50,
  fontSize = 14,
  fitContentHeight = false,
  fitContentHeightMaxRows = Number.POSITIVE_INFINITY,
  fillAvailableHeight = false,
  actionsColumnHeader = "Actions",
  maxInlineRowActions = 3
}: AppDataTableProps<T>) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [gridApi, setGridApi] = useState<GridApi<T> | null>(null);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const hasServerPagination = Boolean(serverPagination);
  const initialTabKey = defaultTabKey ?? tabs[0]?.key ?? "all";
  const [activeTabKey, setActiveTabKey] = useState(initialTabKey);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim().toLowerCase());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    onSearchChange?.(debouncedSearchTerm);
  }, [debouncedSearchTerm, onSearchChange]);

  const tabMap = useMemo(
    () =>
      new Map(
        tabs.map((tab) => [
          tab.key,
          {
            ...tab,
            predicate: tab.predicate ?? (() => true)
          }
        ])
      ),
    [tabs]
  );

  const currentTab = tabMap.get(activeTabKey);

  const filteredRows = useMemo(() => {
    const shouldUseClientSearch =
      !onSearchChange &&
      Boolean(debouncedSearchTerm) &&
      Boolean(searchAccessor);

    return rowData.filter((row) => {
      const matchesTab = currentTab?.predicate
        ? currentTab.predicate(row)
        : true;
      if (!matchesTab) {
        return false;
      }

      if (!shouldUseClientSearch || !searchAccessor) {
        return true;
      }

      return searchAccessor(row).toLowerCase().includes(debouncedSearchTerm);
    });
  }, [
    currentTab,
    debouncedSearchTerm,
    onSearchChange,
    rowData,
    searchAccessor
  ]);

  const tableActionContext = useMemo<AppDataTableActionContext<T>>(
    () => ({
      activeTabKey,
      filteredRows,
      selectedRows
    }),
    [activeTabKey, filteredRows, selectedRows]
  );

  const totalCountLabel = totalLabel ?? `${rowData.length} total`;
  const shouldFitContentHeight =
    fitContentHeight && filteredRows.length <= fitContentHeightMaxRows;
  const serverTotalPages = serverPagination
    ? Math.max(
        1,
        serverPagination.totalPages ??
          Math.ceil(serverPagination.totalRows / serverPagination.pageSize)
      )
    : 1;
  const serverCurrentPage = serverPagination
    ? Math.min(Math.max(1, serverPagination.currentPage), serverTotalPages)
    : 1;
  const serverFirstRow =
    serverPagination && serverPagination.totalRows
      ? (serverCurrentPage - 1) * serverPagination.pageSize + 1
      : 0;
  const serverLastRow = serverPagination
    ? Math.min(
        serverCurrentPage * serverPagination.pageSize,
        serverPagination.totalRows
      )
    : 0;

  useEffect(() => {
    if (!gridApi) {
      return;
    }

    gridApi.deselectAll();
    gridApi.paginationGoToFirstPage();
    setSelectedRows([]);
  }, [activeTabKey, debouncedSearchTerm, gridApi]);

  useEffect(() => {
    if (!gridApi) {
      return;
    }

    if (loading) {
      gridApi.showLoadingOverlay();
      return;
    }

    if (!filteredRows.length) {
      gridApi.showNoRowsOverlay();
      return;
    }

    gridApi.hideOverlay();
  }, [filteredRows.length, gridApi, loading]);

  useEffect(() => {
    if (!gridApi || !hasServerPagination) {
      return;
    }

    gridApi.deselectAll();
    setSelectedRows([]);
  }, [
    gridApi,
    hasServerPagination,
    serverPagination?.currentPage,
    serverPagination?.pageSize
  ]);

  const tableTheme = useMemo(
    () =>
      themeQuartz.withParams({
        accentColor: "#465fff",
        backgroundColor: theme === "dark" ? "#101828" : "#ffffff",
        borderColor: theme === "dark" ? "#344054" : "#e4e7ec",
        browserColorScheme: theme,
        cellHorizontalPadding: 16,
        fontFamily: "Outfit, sans-serif",
        fontSize,
        foregroundColor: theme === "dark" ? "#f3f4f6" : "#101828",
        headerBackgroundColor: theme === "dark" ? "#0f172a" : "#f8fafc",
        headerHeight,
        oddRowBackgroundColor: theme === "dark" ? "#101828" : "#fcfcfd",
        rowHeight,
        selectedRowBackgroundColor:
          theme === "dark" ? "rgba(70,95,255,0.18)" : "rgba(70,95,255,0.08)",
        wrapperBorderRadius: 16
      }),
    [fontSize, headerHeight, rowHeight, theme]
  );

  const mergedDefaultColDef = useMemo<ColDef<T>>(
    () => ({
      cellClass: "app-data-table__plain-cell",
      flex: 1,
      minWidth: 190,
      resizable: true,
      sortable: true,
      suppressHeaderMenuButton: true,
      wrapHeaderText: true,
      ...defaultColDefInput
    }),
    [defaultColDefInput]
  );

  const computedColumnDefs = useMemo<ColDef<T>[]>(() => {
    const configuredInlineActions = rowActions.filter(
      (action) => action.placement !== "menu"
    ).length;
    const configuredMenuActions =
      rowActions.filter((action) => action.placement === "menu").length +
      Math.max(0, configuredInlineActions - maxInlineRowActions);
    const visibleActionSlots =
      Math.min(configuredInlineActions, maxInlineRowActions) +
      (configuredMenuActions > 0 ? 1 : 0);

    const actionsColumn: ColDef<T>[] = rowActions.length
      ? [
          {
            cellClass:
              "app-data-table__plain-cell app-data-table__actions-cell",
            colId: "__actions__",
            filter: false,
            flex: 0,
            headerName: actionsColumnHeader,
            maxWidth: Math.max(196, visibleActionSlots * 44 + 28),
            minWidth: Math.max(196, visibleActionSlots * 44 + 28),
            pinned: "right",
            resizable: false,
            sortable: false,
            suppressHeaderMenuButton: true,
            width: Math.max(196, visibleActionSlots * 44 + 28),
            cellRenderer: (params: ICellRendererParams<T>) =>
              params.data ? (
                <RowActionsCell
                  maxInlineRowActions={maxInlineRowActions}
                  row={params.data}
                  rowActions={rowActions}
                  user={user}
                />
              ) : null
          }
        ]
      : [];

    return [...columnDefs, ...actionsColumn];
  }, [actionsColumnHeader, columnDefs, maxInlineRowActions, rowActions, user]);

  return (
    <div
      className={[
        "rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900",
        fillAvailableHeight ? "flex h-full min-h-0 flex-col" : ""
      ].join(" ")}
    >
      <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {tableName}
            </h2>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {totalCountLabel}
            </span>
            {titleExtra}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
            {searchAccessor ? (
              <div className="w-full min-w-[220px] sm:w-[280px]">
                <Input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder={searchPlaceholder}
                />
              </div>
            ) : null}

            {toolbarActions.map((action) => {
              const label = resolveText(action.label, tableActionContext);
              const tooltip = action.tooltip
                ? resolveText(action.tooltip, tableActionContext)
                : undefined;
              const disabled = resolveBoolean(
                action.disabled,
                tableActionContext
              );
              const Icon = action.icon;

              return (
                <Button
                  key={action.key}
                  className={action.className}
                  disabled={disabled}
                  permission={action.permission}
                  permissionLogic={action.permissionLogic}
                  size="sm"
                  startIcon={Icon ? <Icon className="h-4 w-4" /> : undefined}
                  title={tooltip}
                  variant={action.variant ?? "outline"}
                  onClick={() => void action.onClick(tableActionContext)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        {tabs.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isActive = tab.key === activeTabKey;
              const count = rowData.filter((row) =>
                (tab.predicate ?? (() => true))(row)
              ).length;
              const tooltip = tab.disabled ? tab.tooltip : undefined;

              return (
                <span key={tab.key} className="inline-flex" title={tooltip}>
                  <button
                    type="button"
                    className={[
                      "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "border-brand-500 bg-brand-500 text-white"
                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800",
                      tab.disabled ? "cursor-not-allowed opacity-50" : ""
                    ].join(" ")}
                    disabled={tab.disabled}
                    onClick={() => setActiveTabKey(tab.key)}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      ].join(" ")}
                    >
                      {count}
                    </span>
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      {enableSelection && selectedRows.length ? (
        <div className="border-b border-gray-200 bg-gradient-to-r from-brand-50/60 via-white to-gray-50 px-4 py-2 dark:border-gray-800 dark:from-brand-500/10 dark:via-gray-900 dark:to-gray-950">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-100 bg-white/90 px-3 py-1.5 shadow-sm backdrop-blur-sm dark:border-brand-500/20 dark:bg-gray-900/90">
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-brand-500 px-2 text-xs font-semibold text-white">
                {selectedRows.length}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                selected
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 ">
              {bulkActions.map((action) => {
                const label = resolveText(action.label, selectedRows);
                const tooltip = action.tooltip
                  ? resolveText(action.tooltip, selectedRows)
                  : label;
                const disabled = resolveBoolean(action.disabled, selectedRows);
                const Icon = action.icon;

                return (
                  <Button
                    key={action.key}
                    className={[
                      "h-9 w-9  shadow-none ring-0",
                      action.className ?? ""
                    ].join(" ")}
                    disabled={disabled}
                    permission={action.permission}
                    permissionLogic={action.permissionLogic}
                    size="sm"
                    startIcon={
                      Icon ? <Icon className="h-[18px] w-[18px]" /> : undefined
                    }
                    title={tooltip}
                    variant={action.variant ?? "outline"}
                    onClick={() => void action.onClick(selectedRows)}
                  >
                    <span className="sr-only">{label}</span>
                  </Button>
                );
              })}

              <Button
                className="h-9 w-9  shadow-none ring-0"
                size="sm"
                title="Clear selection"
                variant="outline"
                startIcon={<CloseLineIcon className="h-[18px] w-[18px]" />}
                onClick={() => {
                  gridApi?.deselectAll();
                  setSelectedRows([]);
                }}
              >
                <span className="sr-only">Clear selection</span>
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="border-b border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-900 dark:bg-error-950/30 dark:text-error-300">
          {errorMessage}
        </div>
      ) : null}

      <div
        className={[
          "px-3 pb-3 pt-3",
          fillAvailableHeight ? "flex min-h-0 flex-1 flex-col" : ""
        ].join(" ")}
      >
        <div
          className={[
            "app-data-table",
            serverPagination && fillAvailableHeight ? "min-h-0 flex-1" : ""
          ].join(" ")}
          style={
            shouldFitContentHeight
              ? undefined
              : serverPagination && fillAvailableHeight
                ? undefined
                : { height: fillAvailableHeight ? "100%" : gridHeight }
          }
        >
          <AgGridReact<T>
            animateRows
            columnDefs={computedColumnDefs}
            defaultColDef={mergedDefaultColDef}
            domLayout={shouldFitContentHeight ? "autoHeight" : "normal"}
            enableBrowserTooltips
            getRowId={({ data }) => (data ? getRowId(data) : "")}
            loading={loading}
            noRowsOverlayComponentParams={{}}
            overlayNoRowsTemplate={`<span class="app-data-table__empty-message">${emptyMessage}</span>`}
            paginateChildRows={paginateChildRows}
            pagination={!serverPagination}
            paginationPageSize={pageSize}
            paginationPageSizeSelector={pageSizeOptions}
            rowData={filteredRows}
            rowHeight={rowHeight}
            rowSelection={
              enableSelection
                ? {
                    checkboxLocation: "selectionColumn",
                    checkboxes: true,
                    headerCheckbox: true,
                    mode: "multiRow",
                    enableClickSelection: false
                  }
                : undefined
            }
            selectionColumnDef={
              enableSelection
                ? {
                    cellClass: "app-data-table__plain-cell",
                    flex: 0,
                    lockPosition: true,
                    maxWidth: 56,
                    minWidth: 56,
                    pinned: "left",
                    resizable: false,
                    sortable: false,
                    suppressHeaderMenuButton: true,
                    suppressMovable: true,
                    width: 56
                  }
                : undefined
            }
            suppressCellFocus
            suppressDragLeaveHidesColumns
            theme={tableTheme}
            onGridReady={(event: GridReadyEvent<T>) => setGridApi(event.api)}
            onSelectionChanged={(event: SelectionChangedEvent<T>) =>
              setSelectedRows(event.api.getSelectedRows())
            }
          />
        </div>

        {serverPagination ? (
          <div className="flex min-h-16 flex-col gap-3  px-4 py-3 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-300 sm:flex-row sm:items-center sm:justify-end">
            {pageSizeOptions !== false && serverPagination.onPageSizeChange ? (
              <label className="flex items-center justify-end gap-2">
                <span>Page Size:</span>
                <select
                  className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition-colors hover:bg-gray-50 focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                  value={serverPagination.pageSize}
                  onChange={(event) =>
                    serverPagination.onPageSizeChange?.(
                      Number(event.target.value)
                    )
                  }
                >
                  {pageSizeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <span className="text-right">
              {serverFirstRow} to {serverLastRow} of{" "}
              {serverPagination.totalRows}
            </span>

            <span className="text-right font-medium">
              Page {serverCurrentPage} of {serverTotalPages}
            </span>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                disabled={serverCurrentPage <= 1 || loading}
                onClick={() => serverPagination.onPageChange(1)}
                aria-label="First page"
                title="First page"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <ChevronLeftIcon className="-ml-2 h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                disabled={serverCurrentPage <= 1 || loading}
                onClick={() =>
                  serverPagination.onPageChange(serverCurrentPage - 1)
                }
                aria-label="Previous page"
                title="Previous page"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                disabled={serverCurrentPage >= serverTotalPages || loading}
                onClick={() =>
                  serverPagination.onPageChange(serverCurrentPage + 1)
                }
                aria-label="Next page"
                title="Next page"
              >
                <ChevronLeftIcon className="h-4 w-4 rotate-180" />
              </button>
              <button
                type="button"
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                disabled={serverCurrentPage >= serverTotalPages || loading}
                onClick={() => serverPagination.onPageChange(serverTotalPages)}
                aria-label="Last page"
                title="Last page"
              >
                <ChevronLeftIcon className="h-4 w-4 rotate-180" />
                <ChevronLeftIcon className="-ml-2 h-4 w-4 rotate-180" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AppDataTable;
