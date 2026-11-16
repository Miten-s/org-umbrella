/** The id segment that opens a blank record page. */
export const NEW_RECORD = "new";

/** A module's page for one record; add `?tab=`, `?mode=view` or (with NEW_RECORD) `?copyFrom=`. */
export const recordPageUrl = (pattern: string, id: string) =>
  pattern.replace(":id", id);

/** Section value that shows every section of a page form, stacked. */
export const ALL_SECTIONS = "all";

/** Whether a page form hides `section`: only on a page, showing one other section. */
export const sectionHidden = (
  pageSection: string | undefined,
  section: string
) =>
  pageSection !== undefined &&
  pageSection !== ALL_SECTIONS &&
  pageSection !== section;
