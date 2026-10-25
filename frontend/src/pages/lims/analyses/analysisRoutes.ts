import { PageUrl } from "@/types/utils.types";

/** The id segment that opens a blank Test Template page. */
export const NEW_ANALYSIS = "new";

/** One Test Template's page; add `?tab=`, `?mode=view` or (with NEW_ANALYSIS) `?copyFrom=`. */
export const analysisWorkspaceUrl = (id: string) =>
  PageUrl.LIMSAnalysisWorkspace.path.replace(":id", id);
