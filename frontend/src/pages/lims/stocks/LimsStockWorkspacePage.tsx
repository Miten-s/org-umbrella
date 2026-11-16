import ModuleWorkspacePage, {
  type ModuleWorkspaceConfig
} from "@/components/data/ModuleWorkspacePage";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import {
  createLimsStock,
  fetchLimsStockById,
  updateLimsStock
} from "./LimsStock.api";
import type { LimsStock, LimsStockPayload } from "./LimsStock.types";
import LimsStockForm from "./LimsStockForm";

const config: ModuleWorkspaceConfig<LimsStock, LimsStockPayload> = {
  entityKey: "limsStock",
  listPath: PageUrl.LIMSStocks.path,
  pagePath: PageUrl.LIMSStocksWorkspace.path,
  apiRoute: "/lims-stocks",
  queryKey: "limsStock",
  fetchById: fetchLimsStockById,
  create: createLimsStock,
  update: updateLimsStock,
  Form: LimsStockForm as ModuleWorkspaceConfig<
    LimsStock,
    LimsStockPayload
  >["Form"],
  sections: ["limsParameters"],
  title: (record) =>
    [record.stockId, (record as { name?: string }).name]
      .filter(Boolean)
      .join(" · "),
  createPermission: LIMS_PERMISSIONS.CREATE_STOCK,
  updatePermission: LIMS_PERMISSIONS.UPDATE_STOCK,
  groupOf: (record) =>
    (record as { group?: { name?: string } | null }).group?.name
};

/** One record on its own page: Details plus a tab per sub-list. */
const LimsStockWorkspacePage = () => <ModuleWorkspacePage config={config} />;

export default LimsStockWorkspacePage;
