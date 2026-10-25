import { PageUrl } from "@/types/utils.types";

/** The id segment that opens a blank sample page. */
export const NEW_SAMPLE = "new";

/** One sample's workspace page; add `?tab=` to open a given tab. */
export const workspaceUrl = (id: string) =>
  PageUrl.LIMSSampleWorkspace.path.replace(":id", id);
