import ModuleWorkspacePage, {
  type ModuleWorkspaceConfig
} from "@/components/data/ModuleWorkspacePage";
import { withSelectedRecords } from "@/components/data/SelectedRecordsPage";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import {
  createLimsStockBatch,
  fetchLimsStockBatchById,
  updateLimsStockBatch
} from "./LimsStockBatch.api";
import type {
  LimsStockBatch,
  LimsStockBatchPayload
} from "./LimsStockBatch.types";
import LimsStockBatchForm from "./LimsStockBatchForm";
import {
  useBulkCloneLimsStockBatch,
  useBulkCopyLimsStockBatch,
  useBulkUpdateLimsStockBatch
} from "./LimsStockBatch.queries";

const config: ModuleWorkspaceConfig<LimsStockBatch, LimsStockBatchPayload> = {
  entityKey: "limsStockBatch",
  listPath: PageUrl.LIMSStockBatches.path,
  pagePath: PageUrl.LIMSStockBatchesWorkspace.path,
  apiRoute: "/lims-stock-batches",
  queryKey: "limsStockBatch",
  fetchById: fetchLimsStockBatchById,
  create: createLimsStockBatch,
  update: updateLimsStockBatch,
  Form: LimsStockBatchForm as ModuleWorkspaceConfig<
    LimsStockBatch,
    LimsStockBatchPayload
  >["Form"],
  sections: ["limsParameters", "limsConsumptionRecords"],
  title: (record) =>
    [record.stockBatchId, (record as { name?: string }).name]
      .filter(Boolean)
      .join(" · "),
  createPermission: LIMS_PERMISSIONS.CREATE_STOCK_BATCH,
  updatePermission: LIMS_PERMISSIONS.UPDATE_STOCK_BATCH,
  groupOf: (record) =>
    (record as { group?: { name?: string } | null }).group?.name
};

/** One record on its own page (Details plus a tab per sub-list), or several selected ones stepped through. */
const LimsStockBatchWorkspacePage = withSelectedRecords<
  LimsStockBatch,
  LimsStockBatchPayload
>(() => <ModuleWorkspacePage config={config} />, {
  ...config,
  entityPluralKey: "limsStockBatches",
  Form: LimsStockBatchForm,
  useBulkUpdate: useBulkUpdateLimsStockBatch,
  useBulkCopy: useBulkCopyLimsStockBatch,
  useBulkClone: useBulkCloneLimsStockBatch
});

export default LimsStockBatchWorkspacePage;
