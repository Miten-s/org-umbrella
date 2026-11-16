import ModuleWorkspacePage, {
  type ModuleWorkspaceConfig
} from "@/components/data/ModuleWorkspacePage";
import { withSelectedRecords } from "@/components/data/SelectedRecordsPage";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import {
  createLimsAliquot,
  fetchLimsAliquotById,
  updateLimsAliquot
} from "./LimsAliquot.api";
import type { LimsAliquot, LimsAliquotPayload } from "./LimsAliquot.types";
import LimsAliquotForm from "./LimsAliquotForm";
import {
  useBulkCloneLimsAliquot,
  useBulkCopyLimsAliquot,
  useBulkUpdateLimsAliquot
} from "./LimsAliquot.queries";

const config: ModuleWorkspaceConfig<LimsAliquot, LimsAliquotPayload> = {
  entityKey: "limsAliquot",
  listPath: PageUrl.LIMSAliquots.path,
  pagePath: PageUrl.LIMSAliquotsWorkspace.path,
  apiRoute: "/lims-aliquots",
  queryKey: "limsAliquot",
  fetchById: fetchLimsAliquotById,
  create: createLimsAliquot,
  update: updateLimsAliquot,
  Form: LimsAliquotForm as ModuleWorkspaceConfig<
    LimsAliquot,
    LimsAliquotPayload
  >["Form"],
  sections: ["limsAliquotsList"],
  title: (record) =>
    [record.aliquotSetId, (record as { name?: string }).name]
      .filter(Boolean)
      .join(" · "),
  createPermission: LIMS_PERMISSIONS.CREATE_ALIQUOT,
  updatePermission: LIMS_PERMISSIONS.UPDATE_ALIQUOT,
  groupOf: (record) =>
    (record as { group?: { name?: string } | null }).group?.name
};

/** One record on its own page (Details plus a tab per sub-list), or several selected ones stepped through. */
const LimsAliquotWorkspacePage = withSelectedRecords<
  LimsAliquot,
  LimsAliquotPayload
>(() => <ModuleWorkspacePage config={config} />, {
  ...config,
  entityPluralKey: "limsAliquots",
  Form: LimsAliquotForm,
  useBulkUpdate: useBulkUpdateLimsAliquot,
  useBulkCopy: useBulkCopyLimsAliquot,
  useBulkClone: useBulkCloneLimsAliquot
});

export default LimsAliquotWorkspacePage;
