import { useEffect, useRef } from "react";
import type { GridApi, GridReadyEvent } from "ag-grid-community";

/** Pastes a tab/newline block (as copied from Excel) from a cell rightwards and downwards,
 * into editable cells only. Each cell goes through its column's own value setter. */
export const pasteBlock = (
  api: GridApi,
  startRow: number,
  startColId: string,
  text: string
) => {
  const rows = text
    .replace(/\r/g, "")
    .replace(/\n$/, "")
    .split("\n")
    .map((line) => line.split("\t"));
  const columns = api.getAllDisplayedColumns();
  const first = columns.findIndex((c) => c.getColId() === startColId);
  let count = 0;
  rows.forEach((cells, r) => {
    const node = api.getDisplayedRowAtIndex(startRow + r);
    if (!node || first < 0) return;
    cells.forEach((value, c) => {
      const column = columns[first + c];
      if (!column || !column.isCellEditable(node)) return;
      node.setDataValue(column, value.trim());
      count += 1;
    });
  });
  return count;
};

/** Elements outside the grid that still belong to an open editor (portaled menus, pickers). */
const EDITOR_PORTALS =
  '.ag-popup, [class*="z-[9999]"], [class*="z-[1200]"], .react-datepicker, .react-datepicker-popper';

/**
 * Spreadsheet behaviour shared by the bulk grids: Ctrl+C / Ctrl+V on a selected cell (AG Grid
 * Community has no clipboard), and an open edit commits when the user clicks anywhere outside
 * the grid — otherwise a typed value isn't counted until the editor closes.
 */
export const useSpreadsheet = () => {
  const api = useRef<GridApi | null>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Element | null;
      if (!api.current || !api.current.getEditingCells().length || !target)
        return;
      if (container.current?.contains(target) || target.closest(EDITOR_PORTALS))
        return;
      api.current.stopEditing();
    };
    document.addEventListener("mousedown", onMouseDown, true);
    return () => document.removeEventListener("mousedown", onMouseDown, true);
  }, []);

  const focused = () => {
    const grid = api.current;
    const cell = grid?.getFocusedCell();
    if (!grid || !cell || grid.getEditingCells().length) return null;
    const node = grid.getDisplayedRowAtIndex(cell.rowIndex);
    return node ? { grid, cell, node } : null;
  };

  return {
    /** Commits an open edit, e.g. right before saving. */
    commit: () => api.current?.stopEditing(),
    containerProps: {
      ref: container,
      onCopy: (event: React.ClipboardEvent) => {
        const at = focused();
        if (!at) return;
        const text = at.grid.getCellValue({
          rowNode: at.node,
          colKey: at.cell.column,
          useFormatter: true
        });
        event.clipboardData.setData("text/plain", String(text ?? ""));
        event.preventDefault();
      },
      onPaste: (event: React.ClipboardEvent) => {
        const at = focused();
        if (!at) return;
        event.preventDefault();
        pasteBlock(
          at.grid,
          at.cell.rowIndex,
          at.cell.column.getColId(),
          event.clipboardData.getData("text/plain")
        );
      }
    },
    onGridReady: (event: GridReadyEvent) => {
      api.current = event.api;
    }
  };
};
