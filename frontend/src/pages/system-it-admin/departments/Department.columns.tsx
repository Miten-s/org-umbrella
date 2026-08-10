import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { Department } from "./Department.types";

/** Column factory (STANDARDS.md §8) — preserves the pre-migration columns. */
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
    field: "description",
    headerName: t("description"),
    flex: 1.2,
    minWidth: 280,
    cellRenderer: (params: ICellRendererParams<Department>) => <TruncateCell value={params.value} />
  }
];
