import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon } from "@/public/icons";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import Button from "@/components/ui/button/Button";
import { toast } from "@/lib/toast";

/**
 * The module's own `Lims<Entity>Form`, rendered in `mode: "bulk-edit"` —
 * same editable render `mode: "edit"` already uses, against the record's
 * REAL current data (unlike CopyStepper, nothing is blanked). `onUnchanged`
 * fires instead of `onSubmit` when the step's own no-op-skip check
 * (`isPayloadEqual` against its initial values) finds nothing to save —
 * see the component doc comment for why that distinction matters here.
 */
export interface EditStepperFormProps<TRecord, TPayload> {
  mode: "bulk-edit";
  initialData: TRecord;
  onClose: () => void;
  onUnchanged?: () => void;
  onSubmit: (payload: TPayload, files?: File[]) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  /** True on the last step — its own button has nowhere left to advance
   * to; the real save lives in the bottom bar's Save-all instead. */
  disabled?: boolean;
  formId?: string;
  stepLabel?: string;
}

export interface EditStepperProps<TRecord, TPayload> {
  /** IDs of the records the user selected for Bulk Edit. */
  ids: string[];
  /** Fetches ONE full-detail record — the same fetch the Edit modal already uses. */
  fetchById: (id: string, signal?: AbortSignal) => Promise<TRecord>;
  FormComponent: React.ComponentType<EditStepperFormProps<TRecord, TPayload>>;
  /**
   * Fires once, on Save-all, with only the records that actually changed —
   * paired with their id, since (unlike Copy) this isn't a flat array of
   * full payloads. A record never opened, or opened and left untouched, is
   * never in this array at all.
   */
  onSaveAll: (updates: { id: string; payload: TPayload }[]) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
  entityLabel: string;
}

/**
 * Bulk Edit review flow: select N existing records → step through each one's
 * own Edit form, in any order → Save-all sends only whatever actually
 * changed, together, in one request.
 *
 * The key difference from CopyStepper: Copy needs a payload for EVERY
 * record (even an untouched one still has to become a new row), so its
 * Save-all sweeps and force-submits everything. Bulk Edit only cares about
 * records the user actually opened AND changed — a never-opened record is
 * simply never fetched, and an opened-but-untouched one resolves via
 * `onUnchanged` (not `onSubmit`) and is excluded from the batch entirely,
 * no fallback substitution. If nothing in the whole selection ends up
 * changed, Save-all closes with no network call at all.
 *
 * Cancel (each step's own Cancel button) closes the whole review, same as
 * Copy/View — nothing has been saved to the server yet at that point (only
 * `onSaveAll` ever hits the network), so this is non-destructive, just a
 * "start over" if the user wants to resume.
 *
 * Source records are fetched lazily, one GET per record, only when a step
 * is first shown — selecting 10 and only opening 2 costs 2 GETs, not 10.
 * Every step a user has opened stays mounted (CSS-hidden, not unmounted)
 * for the rest of the session, same flicker/reuse fix CopyStepper documents.
 */
function EditStepper<TRecord, TPayload>({
  ids,
  fetchById,
  FormComponent,
  onSaveAll,
  onClose,
  saving = false
  // entityLabel: kept in props (every call site passes it) but not read
  // here — same convention CopyStepper follows.
}: EditStepperProps<TRecord, TPayload>) {
  const { t } = useTranslation();
  const formId = useId();
  const total = ids.length;

  const [sources, setSources] = useState<Array<TRecord | undefined>>(() =>
    new Array(total).fill(undefined)
  );
  const sourcesRef = useRef<Array<TRecord | undefined>>(sources);
  // `undefined` = not yet resolved for this step. `null` = resolved,
  // reviewed, and confirmed UNCHANGED (excluded from the batch). A
  // `TPayload` = resolved and confirmed CHANGED (included in the batch).
  const [payloads, setPayloads] = useState<Array<TPayload | null | undefined>>(
    new Array(total).fill(undefined)
  );
  const payloadsRef = useRef<Array<TPayload | null | undefined>>(payloads);
  const generationRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);
  const sweepRef = useRef<number[] | null>(null);
  const sweepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  const [sweepProgress, setSweepProgress] = useState<{ current: number; total: number } | null>(null);

  const clearSweep = () => {
    sweepRef.current = null;
    if (sweepTimeoutRef.current) {
      clearTimeout(sweepTimeoutRef.current);
      sweepTimeoutRef.current = null;
    }
    setAutoSubmitting(false);
    setSweepProgress(null);
  };

  // Same `flushSync` reasoning as CopyStepper's `loadSource` — the sweep's
  // `requestSubmit()` needs `sources[i]` to have actually committed, not
  // just be scheduled, or it finds no mounted `<form>` and hangs.
  const loadSource = async (i: number) => {
    if (sourcesRef.current[i] !== undefined) return sourcesRef.current[i] as TRecord;
    const generation = generationRef.current;
    const record = await fetchById(ids[i]);
    if (generation !== generationRef.current) return record;
    const next = [...sourcesRef.current];
    next[i] = record;
    sourcesRef.current = next;
    flushSync(() => setSources(next));
    return record;
  };

  useEffect(() => {
    generationRef.current += 1;
    const emptySources = new Array(total).fill(undefined);
    sourcesRef.current = emptySources;
    setSources(emptySources);
    const emptyPayloads = new Array(total).fill(undefined);
    payloadsRef.current = emptyPayloads;
    setPayloads(emptyPayloads);
    setIndex(0);
    setDisplayIndex(0);
    setVisited([0]);
    clearSweep();
    // Re-fetch only when the actual set of selected ids changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  useEffect(() => {
    loadSource(index);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, ids.join(",")]);

  useEffect(() => {
    if (sources[index] !== undefined) setDisplayIndex(index);
  }, [index, sources]);

  useEffect(() => () => clearSweep(), []);

  const isMulti = total > 1;
  const isLast = index === total - 1;
  const busy = saving || autoSubmitting;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(total - 1, next));
    setIndex(clamped);
    setVisited((prev) => (prev.includes(clamped) ? prev : [...prev, clamped]));
  };

  // Assembles whatever's actually changed so far and either saves it or,
  // if nothing qualifies, just closes — no network call for an empty batch.
  const finalize = async () => {
    const updates: { id: string; payload: TPayload }[] = [];
    payloadsRef.current.forEach((payload, i) => {
      if (payload !== null && payload !== undefined) updates.push({ id: ids[i], payload });
    });
    if (!updates.length) {
      toast(t("editNoChanges"), "info");
      onClose();
      return;
    }
    await onSaveAll(updates);
  };

  // Same display-before-submit reasoning as CopyStepper's `runSweepStep` —
  // `.requestSubmit()` on a `display:none` form is unreliable in some
  // browsers. Every swept step here was already visited (already loaded),
  // so unlike Copy there's no fetch to await first.
  const runSweepStep = (i: number) => {
    // Both `index` and `displayIndex` — not just the latter — or a swept
    // step other than the one the user started on renders dimmed
    // (`index !== displayIndex`) while it's actually the one being saved.
    flushSync(() => {
      setIndex(i);
      setDisplayIndex(i);
    });
    (document.getElementById(`${formId}-${i}`) as HTMLFormElement | null)?.requestSubmit();
    if (sweepTimeoutRef.current) clearTimeout(sweepTimeoutRef.current);
    sweepTimeoutRef.current = setTimeout(() => {
      clearSweep();
      goTo(i);
      toast(t("editAutoValidateFailed", { current: i + 1 }), "error");
    }, 4000);
  };

  // Records step `i`'s outcome (a real payload, or `null` for confirmed-
  // unchanged) and either advances the sweep to the next queued step, or —
  // once every queued step has resolved — finalizes.
  const commitStep = async (i: number, payload: TPayload | null) => {
    if (total === 1) {
      if (payload === null) {
        toast(t("editNoChanges"), "info");
        onClose();
      } else {
        await onSaveAll([{ id: ids[i], payload }]);
      }
      return;
    }

    const next = payloadsRef.current.map((p, pi) => (pi === i ? payload : p));
    payloadsRef.current = next;
    setPayloads(next);

    const sweep = sweepRef.current;
    if (sweep?.includes(i)) {
      const remaining = sweep.filter((si) => si !== i);
      sweepRef.current = remaining.length ? remaining : null;
      if (remaining.length === 0) {
        if (sweepTimeoutRef.current) {
          clearTimeout(sweepTimeoutRef.current);
          sweepTimeoutRef.current = null;
        }
        setSweepProgress(null);
        try {
          await finalize();
        } finally {
          setAutoSubmitting(false);
        }
      } else {
        setSweepProgress((prev) =>
          prev ? { current: Math.min(prev.total - remaining.length + 1, prev.total), total: prev.total } : prev
        );
        runSweepStep(remaining[0]);
      }
      return;
    }

    goTo(Math.min(i + 1, total - 1));
  };

  const handleStepSubmit = (i: number, values: TPayload, _files?: File[]) => commitStep(i, values);
  const handleStepUnchanged = (i: number) => commitStep(i, null);

  // The only save trigger. Every VISITED step is re-swept (the current one
  // unconditionally, to catch a live unsaved edit on screen) so its real
  // outcome is known; a never-visited step was never fetched and needs no
  // sweep at all — it's already excluded.
  const handleSaveAllClick = () => {
    if (busy) return;
    const uncommitted = visited.filter(
      (i) => i !== index && payloadsRef.current[i] === undefined
    );
    const toSubmit = [index, ...uncommitted];
    setAutoSubmitting(true);
    setSweepProgress({ current: 1, total: toSubmit.length });
    sweepRef.current = toSubmit;
    runSweepStep(toSubmit[0]);
  };

  return (
    <div className="relative">
      {isMulti && (
        <div className="absolute right-14 top-3 z-20 flex items-center gap-1 sm:right-20 sm:top-6">
          <button
            type="button"
            aria-label={t("previous")}
            disabled={index === 0 || busy}
            onClick={() => goTo(index - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={t("next")}
            disabled={isLast || busy}
            onClick={() => goTo(index + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
          >
            <ChevronLeftIcon className="h-4 w-4 rotate-180" />
          </button>
        </div>
      )}
      <div className="relative">
        {visited.map((i) => (
          <div
            key={i}
            className={
              i !== displayIndex
                ? "hidden"
                : index !== displayIndex
                  ? "pointer-events-none opacity-50 transition-opacity duration-150"
                  : "transition-opacity duration-150"
            }
          >
            {sources[i] === undefined ? (
              <div className="flex min-h-[300px] items-center justify-center p-10">
                <LoadingSpinner fullScreen={false} />
              </div>
            ) : (
              <FormComponent
                mode="bulk-edit"
                initialData={sources[i] as TRecord}
                onClose={onClose}
                onUnchanged={() => handleStepUnchanged(i)}
                onSubmit={(values, files) => handleStepSubmit(i, values, files)}
                submitting={(saving && total === 1) || (autoSubmitting && i === index)}
                submitLabel={isMulti ? t("next") : undefined}
                disabled={isMulti && i === total - 1}
                formId={`${formId}-${i}`}
                stepLabel={
                  isMulti
                    ? ` ${t("editStep", { current: i + 1, total })}`
                    : undefined
                }
              />
            )}
          </div>
        ))}
        {index !== displayIndex && sources[displayIndex] !== undefined && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <LoadingSpinner fullScreen={false} />
          </div>
        )}
      </div>
      {isMulti && (
        <div className="flex items-center justify-between gap-3 rounded-b-3xl border-t border-gray-100 bg-white px-10 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-14">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {Array.from({ length: total }, (_, i) => {
              const isCurrent = i === index;
              const isCommitted = payloads[i] !== undefined;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={t("editGoToStep", { current: i + 1, total })}
                  aria-current={isCurrent || undefined}
                  disabled={busy}
                  onClick={() => goTo(i)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    isCurrent
                      ? "bg-brand-500 text-white"
                      : isCommitted
                        ? "bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-300 hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400 dark:ring-brand-500/40"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <Button className="shrink-0" onClick={handleSaveAllClick} loading={busy} disabled={busy}>
            {sweepProgress ? t("editReviewingProgress", sweepProgress) : t("editSaveAll")}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EditStepper;
