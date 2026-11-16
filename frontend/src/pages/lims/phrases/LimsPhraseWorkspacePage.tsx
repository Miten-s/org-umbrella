import ModuleWorkspacePage, {
  type ModuleWorkspaceConfig
} from "@/components/data/ModuleWorkspacePage";
import { withSelectedRecords } from "@/components/data/SelectedRecordsPage";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import {
  createLimsPhrase,
  fetchLimsPhraseById,
  updateLimsPhrase
} from "./LimsPhrase.api";
import type { LimsPhrase, LimsPhrasePayload } from "./LimsPhrase.types";
import LimsPhraseForm from "./LimsPhraseForm";
import {
  useBulkCloneLimsPhrase,
  useBulkCopyLimsPhrase,
  useBulkUpdateLimsPhrase
} from "./LimsPhrase.queries";

const config: ModuleWorkspaceConfig<LimsPhrase, LimsPhrasePayload> = {
  entityKey: "limsPhrase",
  listPath: PageUrl.LIMSPhrases.path,
  pagePath: PageUrl.LIMSPhrasesWorkspace.path,
  apiRoute: "/lims-phrases",
  queryKey: "limsPhrase",
  fetchById: fetchLimsPhraseById,
  create: createLimsPhrase,
  update: updateLimsPhrase,
  Form: LimsPhraseForm as ModuleWorkspaceConfig<
    LimsPhrase,
    LimsPhrasePayload
  >["Form"],
  sections: ["limsPhraseEntries"],
  title: (record) =>
    [record.phrase, (record as { name?: string }).name]
      .filter(Boolean)
      .join(" · "),
  createPermission: LIMS_PERMISSIONS.CREATE_PHRASE,
  updatePermission: LIMS_PERMISSIONS.UPDATE_PHRASE,
  groupOf: (record) =>
    (record as { group?: { name?: string } | null }).group?.name
};

/** One record on its own page (Details plus a tab per sub-list), or several selected ones stepped through. */
const LimsPhraseWorkspacePage = withSelectedRecords<
  LimsPhrase,
  LimsPhrasePayload
>(() => <ModuleWorkspacePage config={config} />, {
  ...config,
  entityPluralKey: "limsPhrases",
  Form: LimsPhraseForm,
  useBulkUpdate: useBulkUpdateLimsPhrase,
  useBulkCopy: useBulkCopyLimsPhrase,
  useBulkClone: useBulkCloneLimsPhrase
});

export default LimsPhraseWorkspacePage;
