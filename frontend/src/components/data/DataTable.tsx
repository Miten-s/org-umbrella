import Button from "@/components/ui/button/Button";
import Input from "@/components/common/form/input/InputField";
import {
  RowActionsCell,
  type AppDataTableRowAction,
  type AppDataTableToolbarAction
} from "@/components/common/table/AppDataTable";
import { EmptyState, ErrorState, TableSkeleton } from "./TableStates";
import { createAgTableTheme } from "@/components/common/table/tableTheme";
import { ServerPaginationFooter } from "@/components/common/table/ServerPaginationFooter";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import type { UseServerTableReturn } from "@/hooks/useServerTable";
import type { BulkSelection } from "@/lib/query/listTypes";
import { CloseLineIcon } from "@/public/icons";
import {
  AllCommunityModule,
  ColDef,
  GridApi,
  GridReadyEvent,
  ICellRendererParams,
  ModuleRegistry,
  SelectionChangedEvent,
  SortChangedEvent
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { ComponentType, ReactNode, SVGProps, useEffect, useMemo, useRef, useState } from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

type SvgIconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface DataTableBulkAction {
  key: string;
  /** Label may depend on how many rows are selected. */
  label: (count: number) => string;
  icon?: SvgIconComponent;
  variant?: "primary" | "outline" | "secondary" | "destructive";
  permission?: string | string[];
  permissionLogic?: "all" | "any";
  /** Receives the scalable BulkSelection (ids OR filter) + the selected count. */
  onClick: (selection: BulkSelection, count: number) => void | Promise<void>;
}

export interface DataTableTab {
  key: string;
  label: string;
  /** Filter patch applied when this tab is active (server-side). */
  filter: Record<string, string | number | boolean | undefined>;
}

interface DataTableProps<T> {
  /** The single source of truth from useServerTable. */
  table: UseServerTableReturn<T>;
  columnDefs: ColDef<T>[];
  tableName: string;
  titleExtra?: ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  toolbarActions?: AppDataTableToolbarAction<T>[];
  bulkActions?: DataTableBulkAction[];
  rowActions?: AppDataTableRowAction<T>[];
  /** Server-side tabs (each maps to a filter). Counts require canFacetCounts. */
  tabs?: DataTableTab[];
  defaultTabKey?: string;
  enableSelection?: boolean;
  emptyState?: { title?: string; message?: string; action?: { label: string; onClick: () => void } };
  defaultColDef?: ColDef<T>;
  pageSizeOptions?: number[];
  rowHeight?: number;
  headerHeight?: number;
  fontSize?: number;
  gridHeight?: number;
  fillAvailableHeight?: boolean;
  actionsColumnHeader?: string;
  maxInlineRowActions?: number;
  /** When true, disables toolbar + bulk-action buttons (S2 double-submit guard). */
  busy?: boolean;
}

/**
 * Standard server-driven table — see STANDARDS.md §7.
 * Consumes useServerTable; wires server sort/filter/selection behind capability
 * flags (unsupported affordances hidden, never faked). Row virtualization via
 * ag-grid. Replaces the leaky `searchAccessor` with an explicit `searchable`.
 */
export function DataTable<T extends { id: string }>({
  table,
  columnDefs,
  tableName,
  titleExtra,
  searchable = true,
  searchPlaceholder = "Search…",
  toolbarActions = [],
  bulkActions = [],
  rowActions = [],
  tabs = [],
  defaultTabKey,
  enableSelection = false,
  emptyState,
  defaultColDef,
  pageSizeOptions = [5, 10, 20, 50],
  rowHeight = 64,
  headerHeight = 46,
  fontSize = 13,
  gridHeight = 440,
  fillAvailableHeight = false,
  actionsColumnHeader = "Actions",
  maxInlineRowActions = 2,
  busy = false
}: DataTableProps<T>) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const caps = table.capabilities;
  const [gridApi, setGridApi] = useState<GridApi<T> | null>(null);
  const syncingRef = useRef(false);

  const [activeTab, setActiveTab] = useState(defaultTabKey ?? tabs[0]?.key ?? "");

  // Track the in-flight bulk action so its Button shows the loading spinner
  // (S2 / Rules 3-4) — automatic, no per-module wiring.
  const [runningBulkKey, setRunningBulkKey] = useState<string | null>(null);

  // --- server tabs → filters ---
  const onTabChange = (tab: DataTableTab) => {
    setActiveTab(tab.key);
    Object.entries(tab.filter).forEach(([key, value]) => table.setFilter(key, value));
  };

  // --- controlled selection sync: hook state -> ag-grid ---
  useEffect(() => {
    if (!gridApi) return;
    syncingRef.current = true;
    gridApi.forEachNode((node) => {
      const id = node.data ? table.getRowId(node.data) : "";
      const shouldSelect = table.allMatchingSelected || table.selectedIds.has(id);
      if (node.isSelected() !== shouldSelect) node.setSelected(shouldSelect);
    });
    syncingRef.current = false;
  }, [gridApi, table.rows, table.selectedIds, table.allMatchingSelected, table.getRowId]);

  const onSelectionChanged = (event: SelectionChangedEvent<T>) => {
    if (syncingRef.current) return;
    const pageIds = table.rows.map((row) => table.getRowId(row));
    const selectedPageIds = event.api.getSelectedRows().map((row) => table.getRowId(row));
    const selectedSet = new Set(selectedPageIds);
    table.setPageSelection(selectedPageIds, true);
    table.setPageSelection(
      pageIds.filter((id) => !selectedSet.has(id)),
      false
    );
  };

  // --- server sort (only when supported) ---
  const onSortChanged = (event: SortChangedEvent<T>) => {
    if (!caps.canSort) return;
    const sorted = event.api
      .getColumnState()
      .find((column) => column.sort);
    table.setSort(
      sorted?.sort ? { field: sorted.colId, dir: sorted.sort } : undefined
    );
  };

  const mergedDefaultColDef = useMemo<ColDef<T>>(
    () => ({
      flex: 1,
      minWidth: 180,
      resizable: true,
      sortable: caps.canSort, // no client-only sorting when server can't sort
      suppressHeaderMenuButton: true,
      ...defaultColDef
    }),
    [caps.canSort, defaultColDef]
  );

  const computedColumnDefs = useMemo<ColDef<T>[]>(() => {
    if (!rowActions.length) return columnDefs;
    const actionsColumn: ColDef<T> = {
      colId: "__actions__",
      headerName: actionsColumnHeader,
      pinned: "right",
      sortable: false,
      resizable: false,
      filter: false,
      minWidth: 140,
      maxWidth: 200,
      cellRenderer: (params: ICellRendererParams<T>) =>
        params.data ? (
          <RowActionsCell
            maxInlineRowActions={maxInlineRowActions}
            row={params.data}
            rowActions={rowActions}
            user={user}
          />
        ) : null
    };
    return [...columnDefs, actionsColumn];
  }, [columnDefs, rowActions, actionsColumnHeader, maxInlineRowActions, user]);

  const tableTheme = useMemo(
    () => createAgTableTheme({ theme, fontSize, headerHeight, rowHeight }),
    [fontSize, headerHeight, rowHeight, theme]
  );

  const firstLoading = table.isLoading && table.rows.length === 0;
  const showEmpty = !table.isLoading && !table.isError && table.rows.length === 0;

  // pagination window numbers
  const currentPage = Math.min(Math.max(1, table.page), Math.max(1, table.totalPages));

  // "select all matching" affordance
  const allPageSelected =
    table.rows.length > 0 &&
    table.rows.every((row) => table.selectedIds.has(table.getRowId(row)));
  const canOfferSelectAll =
    caps.canBulkByFilter &&
    enableSelection &&
    allPageSelected &&
    !table.allMatchingSelected &&
    table.total > table.rows.length;

  return (
    <div
      className={[
        "rounded-2xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-900",
        fillAvailableHeight ? "flex h-full min-h-0 flex-col" : ""
      ].join(" ")}
    >
      {/* header */}
      <div className="border-b border-gray-200 px-4 py-4 dark:border-gray-800 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {tableName}
            </h2>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {table.total} total
            </span>
            {titleExtra}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
            {searchable ? (
              <div className="w-full min-w-[220px] sm:w-[280px]">
                <Input
                  value={table.search}
                  onChange={(event) => table.setSearch(event.target.value)}
                  placeholder={searchPlaceholder}
                />
              </div>
            ) : null}

            {toolbarActions.map((action) => {
              const context = { activeTabKey: activeTab, filteredRows: table.rows, selectedRows: [] };
              const label = typeof action.label === "function" ? action.label(context) : action.label;
              const Icon = action.icon;
              return (
                <Button
                  key={action.key}
                  className={action.className}
                  disabled={busy}
                  permission={action.permission}
                  permissionLogic={action.permissionLogic}
                  size="sm"
                  startIcon={Icon ? <Icon className="h-4 w-4" /> : undefined}
                  variant={action.variant ?? "outline"}
                  onClick={() => void action.onClick(context)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* server tabs — only rendered when the server can actually filter
            (hide-don't-fake, STANDARDS.md §10). Counts require canFacetCounts. */}
        {tabs.length && caps.canFilter ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={[
                    "inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
                  ].join(" ")}
                  onClick={() => onTabChange(tab)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {/* bulk action bar */}
      {enableSelection && table.hasSelection ? (
        <div className="border-b border-gray-200 bg-brand-50/60 px-4 py-2 dark:border-gray-800 dark:bg-brand-500/10">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/90 px-3 py-1.5 text-sm dark:border-brand-500/20 dark:bg-gray-900/90">
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-500 px-2 text-xs font-semibold text-white">
                  {table.selectionCount}
                </span>
                selected
              </span>

              {canOfferSelectAll ? (
                <button
                  type="button"
                  className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-300"
                  onClick={table.selectAllMatching}
                >
                  Select all {table.total} matching
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {bulkActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.key}
                    size="sm"
                    disabled={busy}
                    loading={runningBulkKey === action.key}
                    permission={action.permission}
                    permissionLogic={action.permissionLogic}
                    startIcon={Icon ? <Icon className="h-[18px] w-[18px]" /> : undefined}
                    variant={action.variant ?? "outline"}
                    onClick={async () => {
                      setRunningBulkKey(action.key);
                      try {
                        await action.onClick(table.resolveBulkSelection(), table.selectionCount);
                      } finally {
                        setRunningBulkKey(null);
                      }
                    }}
                  >
                    {action.label(table.selectionCount)}
                  </Button>
                );
              })}
              <Button
                size="sm"
                variant="outline"
                startIcon={<CloseLineIcon className="h-[18px] w-[18px]" />}
                onClick={() => {
                  gridApi?.deselectAll();
                  table.clearSelection();
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* error banner (kept above grid, non-blocking when stale data exists) */}
      {table.isError && table.rows.length > 0 ? (
        <div className="border-b border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-900 dark:bg-error-950/30 dark:text-error-300">
          Failed to refresh. Showing the last loaded data.
        </div>
      ) : null}

      {/* body */}
      <div className={["px-3 pb-3 pt-3", fillAvailableHeight ? "flex min-h-0 flex-1 flex-col" : ""].join(" ")}>
        {firstLoading ? (
          <TableSkeleton rows={6} columns={Math.min(columnDefs.length + 1, 5)} />
        ) : table.isError && table.rows.length === 0 ? (
          <ErrorState message="Failed to load records." onRetry={() => void table.refetch()} />
        ) : showEmpty ? (
          <EmptyState
            title={emptyState?.title ?? "Nothing here yet"}
            message={emptyState?.message}
            action={emptyState?.action}
          />
        ) : (
          <div
            className={["dt-grid", fillAvailableHeight ? "min-h-0 flex-1" : ""].join(" ")}
            style={fillAvailableHeight ? undefined : { height: gridHeight }}
          >
            <AgGridReact<T>
              animateRows
              columnDefs={computedColumnDefs}
              defaultColDef={mergedDefaultColDef}
              getRowId={({ data }) => (data ? table.getRowId(data) : "")}
              pagination={false}
              rowData={table.rows}
              rowHeight={rowHeight}
              rowSelection={
                enableSelection
                  ? {
                      checkboxes: true,
                      headerCheckbox: true,
                      mode: "multiRow",
                      enableClickSelection: false
                    }
                  : undefined
              }
              suppressCellFocus
              theme={tableTheme}
              onGridReady={(event: GridReadyEvent<T>) => setGridApi(event.api)}
              onSelectionChanged={onSelectionChanged}
              onSortChanged={onSortChanged}
            />
          </div>
        )}

        {/* server pagination footer (shared with AppDataTable) */}
        {!firstLoading && !showEmpty && !(table.isError && table.rows.length === 0) ? (
          <ServerPaginationFooter
            currentPage={currentPage}
            totalPages={table.totalPages}
            pageSize={table.pageSize}
            totalRows={table.total}
            disabled={table.isFetching}
            pageSizeOptions={pageSizeOptions}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
          />
        ) : null}
      </div>
    </div>
  );
}

export default DataTable;
