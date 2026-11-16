import ModuleWorkspacePage, {
  type ModuleWorkspaceConfig
} from "@/components/data/ModuleWorkspacePage";
import { withSelectedRecords } from "@/components/data/SelectedRecordsPage";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import {
  createLimsInspectionPlan,
  fetchLimsInspectionPlanById,
  updateLimsInspectionPlan
} from "./LimsInspectionPlan.api";
import type {
  LimsInspectionPlan,
  LimsInspectionPlanPayload
} from "./LimsInspectionPlan.types";
import LimsInspectionPlanForm from "./LimsInspectionPlanForm";
import {
  useBulkCloneLimsInspectionPlan,
  useBulkCopyLimsInspectionPlan,
  useBulkUpdateLimsInspectionPlan
} from "./LimsInspectionPlan.queries";

const config: ModuleWorkspaceConfig<
  LimsInspectionPlan,
  LimsInspectionPlanPayload
> = {
  entityKey: "limsInspectionPlan",
  listPath: PageUrl.LIMSInspectionPlans.path,
  pagePath: PageUrl.LIMSInspectionPlansWorkspace.path,
  apiRoute: "/lims-inspection-plans",
  queryKey: "limsInspectionPlan",
  fetchById: fetchLimsInspectionPlanById,
  create: createLimsInspectionPlan,
  update: updateLimsInspectionPlan,
  Form: LimsInspectionPlanForm as ModuleWorkspaceConfig<
    LimsInspectionPlan,
    LimsInspectionPlanPayload
  >["Form"],
  sections: ["limsPersonnel"],
  title: (record) =>
    [record.inspectionId, (record as { name?: string }).name]
      .filter(Boolean)
      .join(" · "),
  createPermission: LIMS_PERMISSIONS.CREATE_INSPECTION_PLAN,
  updatePermission: LIMS_PERMISSIONS.UPDATE_INSPECTION_PLAN,
  groupOf: (record) =>
    (record as { group?: { name?: string } | null }).group?.name
};

/** One record on its own page (Details plus a tab per sub-list), or several selected ones stepped through. */
const LimsInspectionPlanWorkspacePage = withSelectedRecords<
  LimsInspectionPlan,
  LimsInspectionPlanPayload
>(() => <ModuleWorkspacePage config={config} />, {
  ...config,
  entityPluralKey: "limsInspectionPlans",
  Form: LimsInspectionPlanForm,
  useBulkUpdate: useBulkUpdateLimsInspectionPlan,
  useBulkCopy: useBulkCopyLimsInspectionPlan,
  useBulkClone: useBulkCloneLimsInspectionPlan
});

export default LimsInspectionPlanWorkspacePage;
