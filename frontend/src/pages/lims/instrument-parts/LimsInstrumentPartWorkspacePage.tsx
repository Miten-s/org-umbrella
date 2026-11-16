import ModuleWorkspacePage, {
  type ModuleWorkspaceConfig
} from "@/components/data/ModuleWorkspacePage";
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

/** One record on its own page: Details plus a tab per sub-list. */
const LimsInstrumentPartWorkspacePage = () => (
  <ModuleWorkspacePage config={config} />
);

export default LimsInstrumentPartWorkspacePage;
