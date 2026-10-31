import { PageUrl } from "@/types/utils.types";

/** The id segment that opens a blank Entity Template page. */
export const NEW_ENTITY_TEMPLATE = "new";

/** One template's page; add `?tab=`, `?mode=view` or (when new) `?copyFrom=`. */
export const entityTemplateUrl = (id: string) =>
  PageUrl.LIMSEntityTemplateWorkspace.path.replace(":id", id);
