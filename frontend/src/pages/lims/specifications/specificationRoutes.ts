import { PageUrl } from "@/types/utils.types";

/** The id segment that opens a blank Specification page. */
export const NEW_SPECIFICATION = "new";

/** One Specification's page; add `?tab=`, `?mode=view` or (with NEW_SPECIFICATION) `?copyFrom=`. */
export const specificationWorkspaceUrl = (id: string) =>
  PageUrl.LIMSSpecificationWorkspace.path.replace(":id", id);
