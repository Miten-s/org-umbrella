import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button/Button";
import UnsavedChangesGuard from "./UnsavedChangesGuard";
import { useWorkspaceTab } from "./useWorkspaceTab";

export interface WorkspaceTab {
  key: string;
  label: string;
  /** Small count next to the label, e.g. how many components. */
  count?: number;
}

interface RecordWorkspaceProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Where Back goes — usually the module's list. */
  backTo: string;
  tabs: WorkspaceTab[];
  /** Tab shown when the URL names none; the first tab otherwise. */
  defaultTab?: string;
  readOnly?: boolean;
  dirty: boolean;
  saving?: boolean;
  onSave: () => void;
  onDiscard: () => void;
  /** Every tab's content, given the active tab — keep them all mounted so no work is lost. */
  children: (tab: string) => ReactNode;
}

/** The page shell for a big form: Back, title, tabs in the query string (?tab=), one Save and
 * Discard for every tab, and a guard against leaving with unsaved changes. */
const RecordWorkspace = ({
  title,
  subtitle,
  backTo,
  tabs,
  defaultTab,
  readOnly = false,
  dirty,
  saving = false,
  onSave,
  onDiscard,
  children
}: RecordWorkspaceProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useWorkspaceTab(
    tabs.map((item) => item.key),
    defaultTab
  );

  return (
    <div className="space-y-4">
      <UnsavedChangesGuard when={dirty && !saving} />
      {/* Pinned under the app bar so Save and the tabs stay in reach while scrolling. */}
      <div className="sticky top-[var(--app-header-h,77px)] z-[8] -mx-4 -mt-4 space-y-3 bg-gray-50 px-4 pt-4 dark:bg-gray-900 md:-mx-6 md:-mt-6 md:px-6 md:pt-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(backTo)}
          >
            {t("bulkBack")}
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          {!readOnly ? (
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {dirty ? t("workspaceUnsaved") : t("workspaceAllSaved")}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={!dirty || saving}
                onClick={onDiscard}
              >
                {t("bulkDiscard")}
              </Button>
              <Button
                type="button"
                onClick={onSave}
                disabled={saving}
                loading={saving}
              >
                {t("save")}
              </Button>
            </div>
          ) : null}
        </div>

        <div
          role="tablist"
          className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700"
        >
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${
                tab === item.key
                  ? "border-brand-500 text-brand-600 dark:text-brand-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              {item.label}
              {item.count !== undefined ? (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {item.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {children(tab)}
    </div>
  );
};

export default RecordWorkspace;
