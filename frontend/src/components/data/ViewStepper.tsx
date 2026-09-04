import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon } from "@/public/icons";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

/** The module's own `Lims<Entity>Form`, in `mode: "view"`. `onSubmit` is required only for
 * prop-type compat — never reachable, since view mode renders no submit button. */
export interface ViewStepperFormProps<TRecord> {
  mode: "view";
  initialData: TRecord;
  onClose: () => void;
  onSubmit: () => void;
  stepLabel?: string;
}

export interface ViewStepperProps<TRecord> {
  /** IDs of the rows selected for View. */
  ids: string[];
  fetchById: (id: string, signal?: AbortSignal) => Promise<TRecord>;
  FormComponent: React.ComponentType<ViewStepperFormProps<TRecord>>;
  onClose: () => void;
  entityLabel: string;
}

/** Multi-record View: step through N rows read-only. Nothing to save, so each record is
 * fetched lazily on first visit and cached — no upfront `Promise.all`. */
function ViewStepper<TRecord>({
  ids,
  fetchById,
  FormComponent,
  onClose
}: ViewStepperProps<TRecord>) {
  const { t } = useTranslation();
  const [records, setRecords] = useState<Array<TRecord | undefined>>(() =>
    new Array(ids.length).fill(undefined)
  );
  const [index, setIndex] = useState(0);
  // Last record rendered — kept on screen (dimmed) while the next step loads, instead of
  // collapsing to a bare spinner box mid-navigation, which read as the modal flickering.
  const lastShownRef = useRef<TRecord | undefined>(undefined);

  // Re-fetch only when the actual set of selected ids changes.
  useEffect(() => {
    setRecords(new Array(ids.length).fill(undefined));
    setIndex(0);
    lastShownRef.current = undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  useEffect(() => {
    if (records[index] !== undefined) return;
    let cancelled = false;
    fetchById(ids[index]).then((record) => {
      if (cancelled) return;
      setRecords((prev) => {
        const next = [...prev];
        next[index] = record;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, ids[index]]);

  const total = ids.length;
  const isMulti = total > 1;
  const isLast = index === total - 1;
  const current = records[index];
  if (current !== undefined) lastShownRef.current = current;
  // Falls back to the last-shown record while loading, so the form stays at its own height.
  const displayRecord = current ?? lastShownRef.current;
  const isLoadingCurrent = current === undefined;

  const goTo = (next: number) => setIndex(Math.max(0, Math.min(total - 1, next)));

  return (
    <div className="relative">
      {isMulti && (
        <div className="absolute right-14 top-3 z-20 flex items-center gap-1 sm:right-20 sm:top-6">
          <button
            type="button"
            aria-label={t("previous")}
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={t("next")}
            disabled={isLast}
            onClick={() => goTo(index + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          </button>
        </div>
      )}
      {displayRecord === undefined ? (
        <div className="flex min-h-[300px] items-center justify-center p-10">
          <LoadingSpinner fullScreen={false} />
        </div>
      ) : (
        <div className="relative">
          <div
            className={`transition-opacity duration-150 ${isLoadingCurrent ? "pointer-events-none opacity-50" : "opacity-100"}`}
          >
            <FormComponent
              mode="view"
              initialData={displayRecord}
              onClose={onClose}
              onSubmit={() => {}}
              stepLabel={isMulti ? ` ${t("viewStep", { current: index + 1, total })}` : undefined}
            />
          </div>
          {isLoadingCurrent && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <LoadingSpinner fullScreen={false} />
            </div>
          )}
        </div>
      )}
      {isMulti && (
        // NORMAL FLOW, not absolute — an overlay here would sit on top of
        // the form's own Cancel button instead of pushing it up, hiding it.
        <div className="flex items-center justify-center gap-3 rounded-b-3xl border-t border-gray-100 bg-white px-10 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-14">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {ids.map((_, i) => {
              const isCurrent = i === index;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={t("viewGoToStep", { current: i + 1, total })}
                  aria-current={isCurrent || undefined}
                  onClick={() => goTo(i)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                    isCurrent
                      ? "bg-brand-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewStepper;
