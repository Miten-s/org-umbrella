import ModuleWorkspacePage, {
  type ModuleWorkspaceConfig
} from "@/components/data/ModuleWorkspacePage";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import {
  createLimsTest,
  fetchLimsTestById,
  updateLimsTest
} from "./LimsTest.api";
import type { LimsTest, LimsTestPayload } from "./LimsTest.types";
import LimsTestForm from "./LimsTestForm";

const config: ModuleWorkspaceConfig<LimsTest, LimsTestPayload> = {
  entityKey: "limsTest",
  listPath: PageUrl.LIMSTests.path,
  pagePath: PageUrl.LIMSTestsWorkspace.path,
  apiRoute: "/lims-tests",
  queryKey: "limsTest",
  fetchById: fetchLimsTestById,
  create: createLimsTest,
  update: updateLimsTest,
  Form: LimsTestForm as ModuleWorkspaceConfig<
    LimsTest,
    LimsTestPayload
  >["Form"],
  sections: ["limsComponents"],
  title: (record) =>
    [record.testId, record.testName].filter(Boolean).join(" · "),
  createPermission: LIMS_PERMISSIONS.CREATE_TEST,
  updatePermission: LIMS_PERMISSIONS.UPDATE_TEST,
  groupOf: (record) =>
    (record as { group?: { name?: string } | null }).group?.name
};

/** One record on its own page: Details plus a tab per sub-list. */
const LimsTestWorkspacePage = () => <ModuleWorkspacePage config={config} />;

export default LimsTestWorkspacePage;
