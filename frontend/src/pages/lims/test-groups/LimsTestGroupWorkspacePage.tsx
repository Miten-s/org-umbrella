import ModuleWorkspacePage, {
  type ModuleWorkspaceConfig
} from "@/components/data/ModuleWorkspacePage";
import { withSelectedRecords } from "@/components/data/SelectedRecordsPage";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import {
  createLimsTestGroup,
  fetchLimsTestGroupById,
  updateLimsTestGroup
} from "./LimsTestGroup.api";
import type {
  LimsTestGroup,
  LimsTestGroupPayload
} from "./LimsTestGroup.types";
import LimsTestGroupForm from "./LimsTestGroupForm";
import {
  useBulkCloneLimsTestGroup,
  useBulkCopyLimsTestGroup,
  useBulkUpdateLimsTestGroup
} from "./LimsTestGroup.queries";

const config: ModuleWorkspaceConfig<LimsTestGroup, LimsTestGroupPayload> = {
  entityKey: "limsTestGroup",
  listPath: PageUrl.LIMSTestGroups.path,
  pagePath: PageUrl.LIMSTestGroupsWorkspace.path,
  apiRoute: "/lims-test-groups",
  queryKey: "limsTestGroup",
  fetchById: fetchLimsTestGroupById,
  create: createLimsTestGroup,
  update: updateLimsTestGroup,
  Form: LimsTestGroupForm as ModuleWorkspaceConfig<
    LimsTestGroup,
    LimsTestGroupPayload
  >["Form"],
  sections: ["limsTestList"],
  title: (record) => record.name,
  createPermission: LIMS_PERMISSIONS.CREATE_TEST_GROUP,
  updatePermission: LIMS_PERMISSIONS.UPDATE_TEST_GROUP,
  groupOf: (record) =>
    (record as { group?: { name?: string } | null }).group?.name
};

/** One record on its own page (Details plus a tab per sub-list), or several selected ones stepped through. */
const LimsTestGroupWorkspacePage = withSelectedRecords<
  LimsTestGroup,
  LimsTestGroupPayload
>(() => <ModuleWorkspacePage config={config} />, {
  ...config,
  entityPluralKey: "limsTestGroups",
  Form: LimsTestGroupForm,
  useBulkUpdate: useBulkUpdateLimsTestGroup,
  useBulkCopy: useBulkCopyLimsTestGroup,
  useBulkClone: useBulkCloneLimsTestGroup
});

export default LimsTestGroupWorkspacePage;
