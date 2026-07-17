import { AvatarCell } from "@/components/data/cells/AvatarCell";
import { StatusPill, statusTone } from "@/components/data/cells/StatusPill";
import { TruncateCell } from "@/components/data/cells/TruncateCell";
import { TagListCell } from "@/components/data/cells/TagListCell";
import { LockIcon } from "@/public/icons";
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
    field: "roles",
    headerName: t("role"),
    minWidth: 180,
    maxWidth: 220,
    width: 190,
    sortable: false,
    valueGetter: ({ data }) => data?.roles?.map((role) => role.name).join(", ") ?? "",
    cellRenderer: (params: ICellRendererParams<User>) => (
      <TagListCell
        items={params.data?.roles ?? []}
        getKey={(role) => role.id}
        getLabel={(role) => role.name}
        tooltipHeaderLabel={`Roles (${params.data?.roles?.length ?? 0})`}
        renderItem={(role) => {
          const isDefault = role.type === "Built_In";
          return (
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                isDefault
                  ? "bg-warning-100 text-warning-800 dark:bg-warning-500/15 dark:text-warning-300"
                  : "bg-blue-light-100 text-blue-light-800 dark:bg-blue-light-500/15 dark:text-blue-light-300"
              ].join(" ")}
              title={isDefault ? "Default System Role" : "Custom Role"}
            >
              {isDefault ? <LockIcon className="h-3 w-3" /> : null}
              {role.name}
            </span>
          );
        }}
      />
    )
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
