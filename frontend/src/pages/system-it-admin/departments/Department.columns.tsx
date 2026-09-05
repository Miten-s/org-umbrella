import { AvatarCell } from "@/components/data/cells/AvatarCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { Department } from "./Department.types";

/** Column factory (STANDARDS.md §8). Manager + Location Group instead of Description
 * (rarely useful at a glance, and pushed the columns that matter off-screen). */
export const getDepartmentColumns = ({ t }: { t: TFunction }): ColDef<Department>[] => [
  {
    field: "departmentName",
    headerName: t("departmentName"),
    flex: 1,
    minWidth: 260,
    cellRenderer: (params: ICellRendererParams<Department>) =>
      params.data ? <AvatarCell label={params.data.departmentName} fallbackInitial="D" /> : null
  },
  {
    field: "departmentManager",
    headerName: t("departmentManager"),
    flex: 1,
    minWidth: 220,
    valueGetter: ({ data }) => data?.departmentManager?.name ?? "",
    cellRenderer: (params: ICellRendererParams<Department>) =>
      params.value || <span className="text-gray-400 dark:text-gray-500">—</span>
  },
  {
    field: "departmentGroupLocation",
    headerName: t("locationGroup"),
    flex: 1,
    minWidth: 220,
    valueGetter: ({ data }) => data?.departmentGroupLocation?.locationName ?? "",
    cellRenderer: (params: ICellRendererParams<Department>) =>
      params.value || <span className="text-gray-400 dark:text-gray-500">—</span>
  }
];
