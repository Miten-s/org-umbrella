/** The id segment that opens a blank record page. */
export const NEW_RECORD = "new";

/** A module's page for one record; add `?tab=`, `?mode=view` or (with NEW_RECORD) `?copyFrom=`. */
export const recordPageUrl = (pattern: string, id: string) =>
  pattern.replace(":id", id);

/** The id segment that opens several selected records on one page. */
export const SELECTED_RECORDS = "selected";

export type SelectedRecordsMode = "view" | "edit" | "copy";

/** Several records of a module on one page, stepped through one at a time. */
export const selectedRecordsUrl = (
  pattern: string,
  mode: SelectedRecordsMode,
  ids: string[]
) =>
  `${recordPageUrl(pattern, SELECTED_RECORDS)}?mode=${mode}&ids=${ids.join(",")}`;

/** Where View/Edit/Copy of the chosen rows goes: one row opens its own page, several open the
 * selected-records page. Either way it is a page, never a modal. */
export const recordsActionUrl = (
  pattern: string,
  mode: SelectedRecordsMode,
  ids: string[]
) => {
  if (ids.length > 1) return selectedRecordsUrl(pattern, mode, ids);
  if (mode === "copy")
    return `${recordPageUrl(pattern, NEW_RECORD)}?copyFrom=${ids[0]}`;
  const url = recordPageUrl(pattern, ids[0]);
  return mode === "view" ? `${url}?mode=view` : url;
};

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
