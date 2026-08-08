import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill } from "@/components/data/cells/StatusPill";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { LimsPhrase, LimsPhraseEntry, LimsRef } from "./LimsPhrase.types";

const refLabel = (ref: LimsRef | null | undefined) => ref?.name ?? "";

/** Column factory (STANDARDS.md §8). */
export const getLimsPhraseColumns = ({ t }: { t: TFunction }): ColDef<LimsPhrase>[] => [
  {
    field: "phrase",
    headerName: t("limsPhraseCode"),
    flex: 0.9,
    minWidth: 190,
    cellRenderer: (params: ICellRendererParams<LimsPhrase>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    field: "name",
    headerName: t("name"),
    flex: 1,
    minWidth: 200,
    cellRenderer: (params: ICellRendererParams<LimsPhrase>) =>
      params.data ? <AvatarCell label={params.data.name} fallbackInitial="P" /> : null
  },
  {
    colId: "entries",
    headerName: t("limsPhraseEntries"),
    flex: 1.4,
    minWidth: 260,
    sortable: false,
    // Rule from MIGRATION.md §3-6: multi-item arrays use TagListCell.
    cellRenderer: (params: ICellRendererParams<LimsPhrase>) => (
      <TagListCell<LimsPhraseEntry>
        items={params.data?.entries}
        getLabel={(entry) => String(entry.name ?? entry.phraseEntryId ?? "")}
        getKey={(entry, index) => String(entry.phraseEntryId ?? index)}
        tooltipHeaderLabel={t("limsPhraseEntries")}
      />
    )
  },
  {
    colId: "group",
    headerName: t("limsGroup"),
    flex: 0.8,
    minWidth: 160,
    valueGetter: (params) => refLabel(params.data?.group),
    cellRenderer: (params: ICellRendererParams<LimsPhrase>) => (
      <TruncateCell value={params.value} />
    )
  },
  {
    colId: "kind",
    headerName: t("limsPhraseKind"),
    flex: 0.6,
    minWidth: 140,
    sortable: false,
    valueGetter: (params) => (params.data?.isSystem ? t("limsSystem") : t("limsCustom")),
    cellRenderer: (params: ICellRendererParams<LimsPhrase>) =>
      params.data?.isSystem ? (
        <StatusPill label={t("limsSystem")} tone="warning" />
      ) : (
        <StatusPill label={t("limsCustom")} tone="neutral" />
      )
  },
  {
    field: "isRemoved",
    headerName: t("status"),
    flex: 0.6,
    minWidth: 130,
    sortable: false,
    cellRenderer: (params: ICellRendererParams<LimsPhrase>) =>
      params.data?.isRemoved ? (
        <StatusPill label={t("limsRemoved")} tone="error" />
      ) : (
        <StatusPill label={t("active")} tone="success" />
      )
  }
];
