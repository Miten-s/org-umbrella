import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsTestGroup, LimsTestRow, LimsRef } from "./LimsTestGroup.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsTestGroupColumns = ({ t }: { t: TFunction }): ColDef<LimsTestGroup>[] => [
  {
    field: "testGroupId",
    headerName: t("limsTestGroupId"),
    flex: 0.9,
    minWidth: 190,
    cellRenderer: (params: ICellRendererParams<LimsTestGroup>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1,
    minWidth: 200,
    cellRenderer: (params: ICellRendererParams<LimsTestGroup>) =>
      params.data ? <AvatarCell label={params.data.name} fallbackInitial="P" /> : null
  },
  {
    colId: "tests",
    headerName: t("limsTestList"),
    flex: 1.4,
    minWidth: 260,
    sortable: false,
    // Rule from MIGRATION.md §3-6: multi-item arrays use TagListCell.
    cellRenderer: (params: ICellRendererParams<LimsTestGroup>) => (
      <TagListCell<LimsTestRow>
        items={params.data?.tests}
        getLabel={(row) => String(row.testName ?? "")}
        getKey={(row, index) => String(row.testName ?? index)}
        tooltipHeaderLabel={t("limsTestList")}
      />
    )
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.8,
    minWidth: 160,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsTestGroup>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsTestGroup>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
