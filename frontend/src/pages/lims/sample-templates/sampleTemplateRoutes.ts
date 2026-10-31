import { PageUrl } from "@/types/utils.types";

/** The id segment that opens a blank Sample Template page. */
export const NEW_SAMPLE_TEMPLATE = "new";

/** One template's page; add `?tab=`, `?mode=view` or (when new) `?copyFrom=`. */
export const sampleTemplateUrl = (id: string) =>
  PageUrl.LIMSSampleTemplateWorkspace.path.replace(":id", id);
