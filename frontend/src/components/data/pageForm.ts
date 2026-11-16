import { useEffect } from "react";
import { sectionHidden } from "./recordPage";

/** Props a modal form takes so it can also sit on its own page (ModuleWorkspacePage). */
export interface PageFormProps {
  /** Set on a page: no modal frame or own buttons, and only this section shows. The others
   * stay mounted, so the page's single Save covers all of them. */
  pageSection?: string;
  onDirtyChange?: (dirty: boolean) => void;
  /** Save found a problem — the page switches to the section that holds it. */
  onInvalid?: (section: string) => void;
}

const MODAL_FRAME =
  "modal-scrollbar max-h-[calc(100dvh-5rem)] overflow-y-auto rounded-3xl bg-white p-6 pr-7 text-gray-900 dark:bg-gray-900 dark:text-gray-100";

/** Layout helpers for a form that renders both in a modal and on a page. */
export const usePageForm = (
  { pageSection, onDirtyChange }: PageFormProps,
  dirty: boolean
) => {
  const onPage = pageSection !== undefined;
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  return {
    onPage,
    frameClass: onPage ? "text-gray-900 dark:text-gray-100" : MODAL_FRAME,
    /** "hidden" for a section other than the page's current one. */
    hide: (section: string) =>
      sectionHidden(pageSection, section) ? "hidden" : ""
  };
};
