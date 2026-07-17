import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { Environment } from "./Environment.types";

/** Column factory (STANDARDS.md §8) — preserves the pre-migration columns. */
export const getEnvironmentColumns = ({ t }: { t: TFunction }): ColDef<Environment>[] => [
  {
    field: "environmentName",
    headerName: t("environmentName"),
    flex: 1,
    minWidth: 260,
    cellRenderer: (params: ICellRendererParams<Environment>) =>
      params.data ? <AvatarCell label={params.data.environmentName} fallbackInitial="E" /> : null
  },
  {
    field: "description",
    headerName: t("description"),
    flex: 1.2,
    minWidth: 280,
    cellRenderer: (params: ICellRendererParams<Environment>) => <TruncateCell value={params.value} />
  }
];
