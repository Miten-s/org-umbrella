import ModuleWorkspacePage, {
  type ModuleWorkspaceConfig
} from "@/components/data/ModuleWorkspacePage";
import { PageUrl } from "@/types/utils.types";
import { LIMS_PERMISSIONS } from "@/utils/permissions";
import {
  createLimsInstrument,
  fetchLimsInstrumentById,
  updateLimsInstrument
} from "./LimsInstrument.api";
import type {
  LimsInstrument,
  LimsInstrumentPayload
} from "./LimsInstrument.types";
import LimsInstrumentForm from "./LimsInstrumentForm";

const config: ModuleWorkspaceConfig<LimsInstrument, LimsInstrumentPayload> = {
  entityKey: "limsInstrument",
  listPath: PageUrl.LIMSInstruments.path,
  pagePath: PageUrl.LIMSInstrumentsWorkspace.path,
  apiRoute: "/lims-instruments",
  queryKey: "limsInstrument",
  fetchById: fetchLimsInstrumentById,
  create: createLimsInstrument,
  update: updateLimsInstrument,
  Form: LimsInstrumentForm as ModuleWorkspaceConfig<
    LimsInstrument,
    LimsInstrumentPayload
  >["Form"],
  sections: ["limsParameters", "limsMaintenance"],
  title: (record) =>
    [record.instrumentId, (record as { name?: string }).name]
      .filter(Boolean)
      .join(" · "),
  createPermission: LIMS_PERMISSIONS.CREATE_INSTRUMENT,
  updatePermission: LIMS_PERMISSIONS.UPDATE_INSTRUMENT,
  groupOf: (record) =>
    (record as { group?: { name?: string } | null }).group?.name
};

/** One record on its own page: Details plus a tab per sub-list. */
const LimsInstrumentWorkspacePage = () => (
  <ModuleWorkspacePage config={config} />
);

export default LimsInstrumentWorkspacePage;
