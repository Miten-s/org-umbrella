import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon } from "@/public/icons";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import Button from "@/components/ui/button/Button";
import { toast } from "@/lib/toast";

/**
 * The module's own `Lims<Entity>Form`, rendered in `mode: "copy"` —
 * pointed at a source record instead of a blank one, ID field forced blank.
 */
export interface CopyStepperFormProps<TRecord, TPayload> {
  mode: "copy";
  initialData: TRecord;
  onClose: () => void;
  // `files` is accepted for type compat with attachment-bearing forms, but unused —
  // the batch save posts JSON only; those forms hide their attachments picker in copy mode.
  onSubmit: (payload: TPayload, files?: File[]) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  formId?: string;
  /** " (2 of 5)" appended to the form's own "Copy <Entity>" title when
   * there's more than one record — undefined for a single-record copy. */
  stepLabel?: string;
}

export interface CopyStepperProps<TRecord, TPayload> {
  /** IDs of the source records the user selected for Copy. */
  ids: string[];
  /** Fetches ONE full-detail source record — the same fetch the Edit modal already uses. */
  fetchById: (id: string, signal?: AbortSignal) => Promise<TRecord>;
  FormComponent: React.ComponentType<CopyStepperFormProps<TRecord, TPayload>>;
  // Fires once, on Save-all, with every REVIEWED record; never-opened records go through
  // `onDuplicateUnreviewed` (or are dropped, see `dropNeverOpened`) and are excluded here.
  onSaveAll: (payloads: TPayload[]) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
  entityLabel: string;
  // Fast path for never-opened records: skip fetch+form+flatten and send their ids straight
  // to the module's existing server-side bulkDuplicate instead. Omit to always fetch+review.
  onDuplicateUnreviewed?: (ids: string[]) => Promise<void>;
  // For a unique field that's actually a reference to something else (e.g. Lab User's
  // `userId`, a specific platform user) rather than a name — auto-suffixing it on Copy
  // produces a value that matches nothing real, so there is no safe unreviewed fast path.
  // A never-opened record is silently left out of the batch instead: not saved, not cloned,
  // not an error. Ignored (and `onDuplicateUnreviewed` takes over) if both are passed.
  dropNeverOpened?: boolean;
}

/**
 * Copy review flow: select N records → review/edit any subset → one Save sends all of them
 * together, each submitted through ITS OWN form first — a raw fetched source isn't a valid payload.
 */
function CopyStepper<TRecord, TPayload>({
  ids,
  fetchById,
  FormComponent,
  onSaveAll,
  onClose,
  saving = false,
  onDuplicateUnreviewed,
  dropNeverOpened = false
}: CopyStepperProps<TRecord, TPayload>) {
  const { t } = useTranslation();
  // Per-step id (`${formId}-${i}`): more than one step can be mounted at once, so a shared id would be invalid HTML.
  const formId = useId();
  const total = ids.length;

  // One slot per record, filled in as each is fetched lazily (never one upfront `Promise.all`).
  const [sources, setSources] = useState<Array<TRecord | undefined>>(() =>
    new Array(total).fill(undefined)
  );
  // Synchronous mirror of `sources` — the sweep needs the just-fetched record right after
  // `await`, not the stale array its closure captured before the state update commits.
  const sourcesRef = useRef<Array<TRecord | undefined>>(sources);
  const [payloads, setPayloads] = useState<Array<TPayload | undefined>>(
    new Array(total).fill(undefined)
  );
  // Same synchronous-mirror reason as `sourcesRef` — the sweep submits several forms
  // back-to-back, faster than `payloads` state re-renders in between.
  const payloadsRef = useRef<Array<TPayload | undefined>>(payloads);
  // Bumped when `ids` changes, so a stale in-flight fetch from a prior selection is ignored.
  const generationRef = useRef(0);
  const [index, setIndex] = useState(0);
  // Lags one step behind `index` while the target step's source is still loading, so the
  // previous step stays on screen (dimmed) instead of the modal collapsing to a spinner.
  const [displayIndex, setDisplayIndex] = useState(0);
  // Every index that's ever been the current step — once visited, a step stays mounted.
  const [visited, setVisited] = useState<number[]>([0]);
  // Indices a Save-all click still needs auto-submitted before the real batch call fires.
  const sweepRef = useRef<number[] | null>(null);
  const sweepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Indices routed to `onDuplicateUnreviewed` instead of the review sweep — excluded from
  // `onSaveAll`'s payload; the in-flight call itself, awaited alongside the reviewed batch.
  const duplicatedIndicesRef = useRef<Set<number>>(new Set());
  const duplicatePromiseRef = useRef<Promise<void> | null>(null);
  // Never-opened indices under `dropNeverOpened` — excluded from `onSaveAll` too, but with
  // no call of any kind made for them (contrast `duplicatedIndicesRef` above).
  const droppedIndicesRef = useRef<Set<number>>(new Set());
  // True from Save-all click until the sweep finishes — distinct from `saving`, which only
  // reflects the network request that follows.
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  // `sweepProgress` is real per-record sweep progress; `finalizingCount` is the record count
  // covered by the two batch calls that follow (no per-record progress inside one POST).
  const [sweepProgress, setSweepProgress] = useState<{ current: number; total: number } | null>(null);
  const [finalizingCount, setFinalizingCount] = useState<number | null>(null);
  // Indices whose `loadSource` rejected — rendered as an error state instead of
  // leaving the step spinning forever (see the plain per-step load effect below).
  const [sourceErrors, setSourceErrors] = useState<number[]>([]);

  const clearSweep = () => {
    sweepRef.current = null;
    if (sweepTimeoutRef.current) {
      clearTimeout(sweepTimeoutRef.current);
      sweepTimeoutRef.current = null;
    }
    setAutoSubmitting(false);
    setSweepProgress(null);
    setFinalizingCount(null);
  };

  // Fetches record `i` unless the selection has moved on. `flushSync` here: `runSweepStep`
  // looks up the just-loaded step's `<form>` right after and needs the commit to be real, not scheduled.
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
    const empty = new Array(total).fill(undefined);
    sourcesRef.current = empty;
    setSources(empty);
    payloadsRef.current = empty;
    setPayloads(empty);
    setIndex(0);
    setDisplayIndex(0);
    setVisited([0]);
    setSourceErrors([]);
    clearSweep();
    duplicatedIndicesRef.current = new Set();
    duplicatePromiseRef.current = null;
    droppedIndicesRef.current = new Set();
    // Re-fetch only when the actual set of selected ids changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  // Loads whichever step is currently on screen, if it hasn't been
  // fetched yet. Save-all's sweep loads every OTHER step itself.
  useEffect(() => {
    loadSource(index).catch(() => {
      setSourceErrors((prev) => (prev.includes(index) ? prev : [...prev, index]));
      toast(t("copySourceLoadFailed", { current: index + 1 }), "error");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, ids.join(",")]);

  // Advances the DISPLAYED step to the target step only once its source has
  // actually arrived — see `displayIndex` above.
  useEffect(() => {
    if (sources[index] !== undefined) setDisplayIndex(index);
  }, [index, sources]);

  // Don't leave a stray timer behind if the modal closes mid-sweep.
  useEffect(() => () => clearSweep(), []);

  const isMulti = total > 1;
  const isLast = index === total - 1;
  const busy = saving || autoSubmitting;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(total - 1, next));
    setIndex(clamped);
    setVisited((prev) => (prev.includes(clamped) ? prev : [...prev, clamped]));
  };

  // Loads step `i`, force-mounts and DISPLAYS it (a `display:none` form's `.requestSubmit()`
  // is unreliable), then native-submits it and arms a safety-net timeout.
  const runSweepStep = async (i: number) => {
    try {
      await loadSource(i);
    } catch {
      clearSweep();
      goTo(i);
      toast(t("copySourceLoadFailed", { current: i + 1 }), "error");
      return;
    }
    // Force the newly-loaded step to mount AND display before the id lookup below runs.
    flushSync(() => {
      setVisited((prev) => (prev.includes(i) ? prev : [...prev, i]));
      setIndex(i);
      setDisplayIndex(i);
    });
    (document.getElementById(`${formId}-${i}`) as HTMLFormElement | null)?.requestSubmit();
    if (sweepTimeoutRef.current) clearTimeout(sweepTimeoutRef.current);
    sweepTimeoutRef.current = setTimeout(() => {
      clearSweep();
      goTo(i);
      toast(t("copyAutoValidateFailed", { current: i + 1 }), "error");
    }, 4000);
  };

  // Bound to step `i` at render time, not the live `index` — normally commits and advances;
  // during a sweep it feeds the next queued step, or fires the batch call once all resolve.
  const handleStepSubmit = async (i: number, values: TPayload, _files?: File[]) => {
    const next = payloadsRef.current.map((p, pi) => (pi === i ? values : p));
    payloadsRef.current = next;
    setPayloads(next);

    if (total === 1) {
      await onSaveAll(
        next.map((p, pi) => p ?? (sourcesRef.current[pi] as unknown as TPayload))
      );
      return;
    }

    const sweep = sweepRef.current;
    if (sweep?.includes(i)) {
      const remaining = sweep.filter((si) => si !== i);
      sweepRef.current = remaining.length ? remaining : null;
      if (remaining.length === 0) {
        // Stop sweep bookkeeping here, but leave `autoSubmitting`/`busy` on through `finally` —
        // two network calls are still running, and `saving` only reflects `onSaveAll`'s own.
        sweepRef.current = null;
        if (sweepTimeoutRef.current) {
          clearTimeout(sweepTimeoutRef.current);
          sweepTimeoutRef.current = null;
        }
        // Records routed to `onDuplicateUnreviewed` never went through their own form, so
        // `next[pi]` is still `undefined` for them — exclude, don't fall back to raw source.
        // Dropped (never-opened, under `dropNeverOpened`) records are excluded the same way.
        const duplicated = duplicatedIndicesRef.current;
        const dropped = droppedIndicesRef.current;
        const reviewed: TPayload[] = [];
        next.forEach((p, pi) => {
          if (duplicated.has(pi) || dropped.has(pi)) return;
          reviewed.push(p ?? (sourcesRef.current[pi] as unknown as TPayload));
        });
        const duplicatePromise = duplicatePromiseRef.current;
        const duplicateCount = duplicated.size;
        const droppedCount = dropped.size;
        duplicatedIndicesRef.current = new Set();
        duplicatePromiseRef.current = null;
        droppedIndicesRef.current = new Set();
        setSweepProgress(null);

        // Everything selected was dropped (never opened) — nothing to send at all; an empty
        // `records[]` would itself fail the batch endpoint's own non-empty validation.
        if (!reviewed.length && !duplicatePromise) {
          setAutoSubmitting(false);
          toast(t("copyNothingReviewed"), "info");
          return;
        }

        setFinalizingCount(reviewed.length + duplicateCount);
        try {
          // Run concurrently — two independent network calls, nothing to hand off between them.
          await Promise.all([duplicatePromise, reviewed.length ? onSaveAll(reviewed) : null]);
          if (droppedCount) toast(t("copySkippedUnreviewed", { count: droppedCount }), "info");
        } finally {
          setAutoSubmitting(false);
          setFinalizingCount(null);
        }
      } else {
        // `remaining.length` is what's left, so `total - remaining` just finished.
        setSweepProgress((prev) =>
          prev ? { current: Math.min(prev.total - remaining.length + 1, prev.total), total: prev.total } : prev
        );
        runSweepStep(remaining[0]);
      }
      return;
    }

    goTo(i + 1);
  };

  // The only save trigger: current step always re-swept; every other never-committed step is
  // swept too, or excluded if never opened (routed to `onDuplicateUnreviewed`, or under
  // `dropNeverOpened`, just left out of the batch entirely).
  const handleSaveAllClick = () => {
    if (busy) return;
    const skipsNeverOpened = Boolean(onDuplicateUnreviewed) || dropNeverOpened;
    const neverOpened = skipsNeverOpened
      ? Array.from({ length: total }, (_, i) => i).filter(
          (i) => i !== index && !visited.includes(i) && payloadsRef.current[i] === undefined
        )
      : [];
    const uncommitted = Array.from({ length: total }, (_, i) => i).filter(
      (i) => i !== index && payloadsRef.current[i] === undefined && !neverOpened.includes(i)
    );
    const toSubmit = [index, ...uncommitted];
    if (onDuplicateUnreviewed) {
      duplicatedIndicesRef.current = new Set(neverOpened);
      duplicatePromiseRef.current = neverOpened.length
        ? onDuplicateUnreviewed(neverOpened.map((i) => ids[i]))
        : null;
      droppedIndicesRef.current = new Set();
    } else if (dropNeverOpened) {
      droppedIndicesRef.current = new Set(neverOpened);
      duplicatedIndicesRef.current = new Set();
      duplicatePromiseRef.current = null;
    } else {
      duplicatedIndicesRef.current = new Set();
      duplicatePromiseRef.current = null;
      droppedIndicesRef.current = new Set();
    }
    setAutoSubmitting(true);
    setSweepProgress(toSubmit.length ? { current: 1, total: toSubmit.length } : null);
    sweepRef.current = toSubmit;
    runSweepStep(toSubmit[0]);
  };

  return (
    <div className="relative">
      {isMulti && (
        // Prev/Next chevrons, styled like the Modal's own close button; jumping to a
        // specific record lives in the numbered row down by Save all instead.
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
              sourceErrors.includes(i) ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 p-10 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("copySourceLoadFailed", { current: i + 1 })}
                  </p>
                  <Button variant="outline" onClick={onClose}>
                    {t("cancel")}
                  </Button>
                </div>
              ) : (
                <div className="flex min-h-[300px] items-center justify-center p-10">
                  <LoadingSpinner fullScreen={false} />
                </div>
              )
            ) : (
              <FormComponent
                // A fresh, STABLE instance per record, never re-keyed — so its own edits and
                // AsyncSelect labels survive navigating away and back.
                mode="copy"
                initialData={sources[i] as TRecord}
                onClose={onClose}
                onSubmit={(values, files) => handleStepSubmit(i, values, files)}
                submitting={(saving && total === 1) || (autoSubmitting && i === index)}
                submitLabel={isMulti ? t("next") : undefined}
                formId={`${formId}-${i}`}
                stepLabel={
                  isMulti
                    ? ` ${t("copyStep", { current: i + 1, total })}`
                    : undefined
                }
              />
            )}
          </div>
        ))}
        {index !== displayIndex && sources[displayIndex] !== undefined && (
          // Target step is still loading; overlaid on the still-visible previous step so
          // the modal's height never jumps.
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <LoadingSpinner fullScreen={false} />
          </div>
        )}
      </div>
      {isMulti && (
        // Numbered chips (ring = already confirmed) on the left, Save all on the right.
        // Normal flow, not absolute, so it pushes each form's Cancel/Next button up.
        <div className="flex items-center justify-between gap-3 rounded-b-3xl border-t border-gray-100 bg-white px-10 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-14">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {Array.from({ length: total }, (_, i) => {
              const isCurrent = i === index;
              const isCommitted = payloads[i] !== undefined;
              return (
                <button
                  key={i}
                  type="button"
                  aria-label={t("copyGoToStep", { current: i + 1, total })}
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
            {sweepProgress
              ? t("copyReviewingProgress", sweepProgress)
              : finalizingCount !== null
                ? t("copyFinalizing", { count: finalizingCount })
                : t("copySaveAll", { count: total })}
          </Button>
        </div>
      )}
    </div>
  );
}

export default CopyStepper;
