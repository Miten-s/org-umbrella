import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { Location } from "./Location.types";

/** Column factory (STANDARDS.md §8) — preserves the pre-migration columns. */
export const getLocationColumns = ({ t }: { t: TFunction }): ColDef<Location>[] => [
  {
    field: "locationName",
    headerName: t("locationName"),
    flex: 1,
    minWidth: 260,
    cellRenderer: (params: ICellRendererParams<Location>) =>
      params.data ? <AvatarCell label={params.data.locationName} fallbackInitial="L" /> : null
  },
  {
    field: "description",
    headerName: t("description"),
    flex: 1.2,
    minWidth: 280,
    cellRenderer: (params: ICellRendererParams<Location>) => <TruncateCell value={params.value} />
  }
];
