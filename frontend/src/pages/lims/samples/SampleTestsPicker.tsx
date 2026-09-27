import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import Label from "@/components/common/form/Label";
import AsyncSelect from "@/components/data/AsyncSelect";
import { TrashBinIcon } from "@/public/icons";
import { toast } from "@/lib/toast";
import {
  expandToTemplates,
  useTestSourceOptions
} from "@/pages/lims/analyses/testSources";
import type { LimsSampleTest } from "./LimsSample.types";

const BADGE_TONES = {
  success:
    "bg-success-100 text-success-800 dark:bg-success-500/15 dark:text-success-300",
  error: "bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-300",
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
};

/** Inline status chip — StatusPill is a full-width table-cell wrapper, which squeezed the
 * template name next to it down to nothing. */
const Badge = ({
  tone,
  children
}: {
  tone: keyof typeof BADGE_TONES;
  children: React.ReactNode;
}) => (
  <span
    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${BADGE_TONES[tone]}`}
  >
    {children}
  </span>
);

/** A Test Template picked on this form, not yet saved as a Test. */
export interface PendingTemplate {
  id: string;
  name: string;
  /** Unknown when the row came back from a save (only the template's name is returned). */
  componentCount?: number;
}

interface SampleTestsPickerProps {
  /** Tests already on the sample — shown read-only. */
  existing: LimsSampleTest[];
  pending: PendingTemplate[];
  onChange: (pending: PendingTemplate[]) => void;
  disabled?: boolean;
  /** Tag picked templates as "New" — off where every row is just a list entry (Sample Template). */
  markNew?: boolean;
}

/** Sample login's test assignment: pick Test Templates and/or Test Groups; each template
 * becomes a Test with a result row per component when the sample is saved. */
const SampleTestsPicker = ({
  existing,
  pending,
  onChange,
  disabled = false,
  markNew = true
}: SampleTestsPickerProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);

  const add = async (value: string) => {
    setAdding(true);
    try {
      const { templates, skipped } = await expandToTemplates(
        queryClient,
        value
      );
      const taken = new Set([
        ...existing
          .filter((test) => test.status !== "Cancelled")
          .map((test) => String(test.analysisId ?? "")),
        ...pending.map((p) => p.id)
      ]);
      const fresh = templates.filter((tpl) => !taken.has(tpl.id));
      if (fresh.length)
        onChange([
          ...pending,
          ...fresh.map((tpl) => ({
            id: tpl.id,
            name: String(tpl.name ?? ""),
            componentCount: tpl.components?.length ?? 0
          }))
        ]);
      else if (templates.length)
        toast(
          t("limsAlreadyAssigned", { name: String(templates[0].name ?? "") }),
          "info"
        );
      if (skipped.length)
        toast(
          t("limsSkippedNotApproved", { names: skipped.join(", ") }),
          "info",
          { duration: 6000 }
        );
    } finally {
      setAdding(false);
    }
  };

  const rowClass =
    "flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700";

  return (
    <div className="min-w-0">
      <Label tooltip={t("limsSampleTestsHint")}>{t("limsSampleTests")}</Label>

      {!disabled ? (
        <div className="mb-3 max-w-md">
          <AsyncSelect
            useOptions={useTestSourceOptions}
            value=""
            onChange={() => undefined}
            onChangeOption={(option) => option && add(option.value)}
            disabled={adding}
            placeholder={t("limsAddTestsPlaceholder")}
          />
        </div>
      ) : null}

      {existing.length || pending.length ? (
        <div className="space-y-2">
          {existing.map((test) => (
            <details
              key={test.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <summary className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm">
                <span className="font-medium">{test.testId}</span>
                <span className="flex-1 truncate">{test.testName}</span>
                <span className="text-xs text-gray-500">
                  {t("limsComponentsCount", {
                    count: test.components?.length ?? 0
                  })}
                </span>
                <Badge tone={test.status === "Cancelled" ? "error" : "neutral"}>
                  {test.status}
                </Badge>
              </summary>
              <table className="w-full border-t border-gray-200 text-xs dark:border-gray-700">
                <tbody>
                  {(test.components ?? []).map((component) => (
                    <tr
                      key={component.id}
                      className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                    >
                      <td className="px-3 py-1.5 text-gray-500">
                        {component.componentId}
                      </td>
                      <td className="px-3 py-1.5">{component.componentName}</td>
                      <td className="px-3 py-1.5 text-gray-500">
                        {component.unit}
                      </td>
                      <td className="px-3 py-1.5">{component.value || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          ))}
          {pending.map((tpl) => (
            <div key={tpl.id} className={rowClass}>
              {markNew ? (
                <Badge tone="success">{t("limsNewTest")}</Badge>
              ) : null}
              <span className="flex-1 truncate">{tpl.name}</span>
              {tpl.componentCount !== undefined ? (
                <span className="text-xs text-gray-500">
                  {t("limsComponentsCount", { count: tpl.componentCount })}
                </span>
              ) : null}
              {!disabled ? (
                <button
                  type="button"
                  aria-label={`${t("delete")} ${tpl.name}`}
                  onClick={() =>
                    onChange(pending.filter((p) => p.id !== tpl.id))
                  }
                  className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                >
                  <TrashBinIcon className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          {t("limsNoSampleTests")}
        </div>
      )}
    </div>
  );
};

export default SampleTestsPicker;
