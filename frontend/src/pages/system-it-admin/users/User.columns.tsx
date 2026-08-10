import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill, statusTone } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import type { TFunction } from "i18next";
import type { User } from "./User.types";

export const getUserDisplayName = (user?: User | null) =>
  user?.fullName || user?.name || user?.email || "User";

/**
 * User column factory (STANDARDS.md §8) — shared cell renderers + the roles
 * "+N more" treatment. No inline cell JSX in the List.
 */
export const getUserColumns = ({ t }: { t: TFunction }): ColDef<User>[] => [
  {
    field: "fullName",
    headerName: t("fullName"),
    flex: 1.2,
    minWidth: 250,
    valueGetter: ({ data }) => getUserDisplayName(data),
    cellRenderer: (params: ICellRendererParams<User>) =>
      params.data ? (
        <AvatarCell label={getUserDisplayName(params.data)} fallbackInitial="U" size="sm" showAvatar />
      ) : null
  },
  {
    field: "email",
    headerName: t("email"),
    flex: 1.2,
    minWidth: 240,
    cellRenderer: (params: ICellRendererParams<User>) => <TruncateCell value={params.value} />
  },
  {
    field: "status",
    headerName: t("status"),
    minWidth: 128,
    maxWidth: 128,
    width: 128,
    valueGetter: ({ data }) => (data?.status === "active" ? t("active") : "Inactive"),
    cellRenderer: (params: ICellRendererParams<User>) => {
      const isActive = params.data?.status === "active";
      return <StatusPill label={isActive ? t("active") : "Inactive"} tone={statusTone(!!isActive)} />;
    }
  }
];
