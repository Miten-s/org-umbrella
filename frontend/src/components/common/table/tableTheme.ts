import { themeQuartz } from "ag-grid-community";

export interface AgTableThemeOptions {
  theme: "light" | "dark";
  fontSize?: number;
  headerHeight?: number;
  rowHeight?: number;
}

/**
 * Single source of truth for the ag-grid Quartz theme used by BOTH AppDataTable
 * (frozen) and the new DataTable. Extracted per the migration guardrail so the
 * two components never drift on styling. Behavior-preserving: identical params
 * to the original AppDataTable theme.
 */
export const createAgTableTheme = ({
  theme,
  fontSize = 14,
  headerHeight = 50,
  rowHeight = 68
}: AgTableThemeOptions) =>
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
  });
