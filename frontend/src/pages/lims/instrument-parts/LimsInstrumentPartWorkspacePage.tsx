import ModuleWorkspacePage, {
  type ModuleWorkspaceConfig
} from "@/components/data/ModuleWorkspacePage";
import { withSelectedRecords } from "@/components/data/SelectedRecordsPage";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import {
  createLimsInstrumentPart,
  fetchLimsInstrumentPartById,
  updateLimsInstrumentPart
} from "./LimsInstrumentPart.api";
import type {
  LimsInstrumentPart,
  LimsInstrumentPartPayload
} from "./LimsInstrumentPart.types";
import LimsInstrumentPartForm from "./LimsInstrumentPartForm";
import {
  useBulkCloneLimsInstrumentPart,
  useBulkCopyLimsInstrumentPart,
  useBulkUpdateLimsInstrumentPart
} from "./LimsInstrumentPart.queries";

const config: ModuleWorkspaceConfig<
  LimsInstrumentPart,
  LimsInstrumentPartPayload
> = {
  entityKey: "limsInstrumentPart",
  listPath: PageUrl.LIMSInstrumentParts.path,
  pagePath: PageUrl.LIMSInstrumentPartsWorkspace.path,
  apiRoute: "/lims-instrument-parts",
  queryKey: "limsInstrumentPart",
  fetchById: fetchLimsInstrumentPartById,
  create: createLimsInstrumentPart,
  update: updateLimsInstrumentPart,
  Form: LimsInstrumentPartForm as ModuleWorkspaceConfig<
    LimsInstrumentPart,
    LimsInstrumentPartPayload
  >["Form"],
  sections: ["limsMaintenance"],
  title: (record) =>
    [record.partId, (record as { name?: string }).name]
      .filter(Boolean)
      .join(" · "),
  createPermission: LIMS_PERMISSIONS.CREATE_INSTRUMENT_PART,
  updatePermission: LIMS_PERMISSIONS.UPDATE_INSTRUMENT_PART,
  groupOf: (record) =>
    (record as { group?: { name?: string } | null }).group?.name
};

/** One record on its own page (Details plus a tab per sub-list), or several selected ones stepped through. */
const LimsInstrumentPartWorkspacePage = withSelectedRecords<
  LimsInstrumentPart,
  LimsInstrumentPartPayload
>(() => <ModuleWorkspacePage config={config} />, {
  ...config,
  entityPluralKey: "limsInstrumentParts",
  Form: LimsInstrumentPartForm,
  useBulkUpdate: useBulkUpdateLimsInstrumentPart,
  useBulkCopy: useBulkCopyLimsInstrumentPart,
  useBulkClone: useBulkCloneLimsInstrumentPart
});

export default LimsInstrumentPartWorkspacePage;
