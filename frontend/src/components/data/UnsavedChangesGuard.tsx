import { useBlocker } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ConfirmDialog from "./ConfirmDialog";
import { useWarnBeforeUnload } from "./useWarnBeforeUnload";

interface UnsavedChangesGuardProps {
  when: boolean;
  /** Shown in the message when known, e.g. "3 unsaved changes will be lost". */
  count?: number;
}

/** Asks before leaving a page with unsaved work — in-app links and Back as well as reload/close.
 * Only a change of page is stopped; switching tabs (the query string) never is. */
const UnsavedChangesGuard = ({ when, count }: UnsavedChangesGuardProps) => {
  const { t } = useTranslation();
  useWarnBeforeUnload(when);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      when && currentLocation.pathname !== nextLocation.pathname
  );
  return (
    <ConfirmDialog
      isOpen={blocker.state === "blocked"}
      onClose={() => blocker.reset?.()}
      onConfirm={() => blocker.proceed?.()}
      title={t("bulkLeaveTitle")}
      description={
        count ? t("bulkLeaveBody", { count }) : t("unsavedLeaveBody")
      }
      confirmLabel={t("unsavedLeave")}
      cancelLabel={t("unsavedStay")}
      tone="danger"
    />
  );
};

export default UnsavedChangesGuard;
