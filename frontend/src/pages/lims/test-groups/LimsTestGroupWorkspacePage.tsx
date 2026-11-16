import ModuleWorkspacePage, {
  type ModuleWorkspaceConfig
} from "@/components/data/ModuleWorkspacePage";
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

/** One record on its own page: Details plus a tab per sub-list. */
const LimsTestGroupWorkspacePage = () => (
  <ModuleWorkspacePage config={config} />
);

export default LimsTestGroupWorkspacePage;
