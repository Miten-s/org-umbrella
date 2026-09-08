import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { Designation } from "./Designation.types";

/**
 * Column factory (STANDARDS.md §8) — uses shared cell renderers, testable in
 * isolation, no inline cell JSX in the List component.
 */
export const getDesignationColumns = ({
  t
}: {
  t: TFunction;
}): ColDef<Designation>[] => [
  {
    field: "designationName",
    headerName: t("designationName"),
    flex: 1,
    minWidth: 260,
    cellRenderer: (params: ICellRendererParams<Designation>) =>
      params.data ? (
        <AvatarCell label={params.data.designationName} fallbackInitial="D" />
      ) : null
  },
  {
    field: "description",
    headerName: t("description"),
    flex: 1.2,
    minWidth: 280,
    cellRenderer: (params: ICellRendererParams<Designation>) => (
      <TruncateCell value={params.value} />
    )
  }
];
