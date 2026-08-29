import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon } from "@/public/icons";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import Button from "@/components/ui/button/Button";
import { toast } from "@/lib/toast";

/**
 * The module's own `Lims<Entity>Form`, rendered in `mode: "copy"` — same
 * component the Create/Edit modal already uses, just pointed at a source
 * record instead of a blank one, with its ID field forced blank.
 */
export interface CopyStepperFormProps<TRecord, TPayload> {
  mode: "copy";
  initialData: TRecord;
  onClose: () => void;
  /**
   * `files` is accepted for type compatibility with attachment-bearing
   * forms (`onSubmit(payload, files)`) but is never used here — the batch
   * save (`onSaveAll`) posts one JSON body for every reviewed record, and
   * that endpoint doesn't accept multipart uploads. Those forms hide their
   * attachments picker entirely in `mode="copy"` rather than silently
   * dropping whatever a user attaches.
   */
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
  /** Fires exactly once, with every reviewed record, when the batch is ready to save. */
  onSaveAll: (payloads: TPayload[]) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
  entityLabel: string;
}

/**
 * Copy review flow: select N records → this replaces an immediate clone
 * call → review/edit any subset, in any order → one Save sends all of
 * them together.
 *
 * Only ONE network call ever happens here — `onSaveAll`. Every record,
 * whether the user opened it or not, is submitted through ITS OWN form
 * first (auto-triggered for one never opened — see `runSweep` below).
 * That's not optional: a fetched source record's raw shape (relations as
 * nested objects, server-only fields like `_id`/`modifiedBy`) is NOT a
 * valid payload — only a form's own react-hook-form `defaultValues` know
 * how to flatten it. Sending the raw source straight through (an earlier
 * version did, straight to `onSaveAll`) passes the browser but fails
 * backend validation with things like "group must be a UUID". Navigation
 * (arrows + numbered chips) is separate, pure local state.
 *
 * Every step a user has ever opened stays MOUNTED for the rest of the
 * session — only CSS-hidden, never unmounted (`className="hidden"`, not a
 * conditional `&&` that drops it from the tree). This is deliberate: an
 * earlier version keyed the single rendered form by `index`, which fixed a
 * worse bug (every step silently showing/editing the FIRST step's data,
 * since React was reusing one component instance across different
 * records) but introduced this one — going back re-mounted the form from
 * the pristine source, throwing away whatever was mid-edit. Keeping each
 * visited step's own instance alive fixes both at once.
 */
function CopyStepper<TRecord, TPayload>({
  ids,
  fetchById,
  FormComponent,
  onSaveAll,
  onClose,
  saving = false
  // entityLabel: kept in CopyStepperProps (every call site still passes
  // it) but no longer read here — the "i of N" count now lives in each
  // form's own title instead of a separate header that needed the entity
  // name spelled out next to it.
}: CopyStepperProps<TRecord, TPayload>) {
  const { t } = useTranslation();
  // Each mounted step's own `<form>` gets a unique id (`${formId}-${i}`) —
  // more than one may be alive in the DOM at once now (see the component
  // doc comment), so a shared id would be invalid HTML.
  const formId = useId();
  const [sources, setSources] = useState<TRecord[] | null>(null);
  const [payloads, setPayloads] = useState<Array<TPayload | undefined>>([]);
  // Mirrors `payloads` but read/written synchronously — `runSweep` fires
  // several forms' submits back-to-back, faster than React re-renders
  // `payloads` state in between, so each step must see the PREVIOUS
  // step's result immediately rather than the stale array its own render
  // closed over.
  const payloadsRef = useRef<Array<TPayload | undefined>>([]);
  const [index, setIndex] = useState(0);
  // Every index that has ever been the current step — once added, a step
  // stays mounted (see the component doc comment) even after the user
  // navigates away from it.
  const [visited, setVisited] = useState<number[]>([0]);
  // Indices a Save-all click still needs auto-submitted before it can
  // fire the real batch call — null when no sweep is running.
  const sweepRef = useRef<number[] | null>(null);
  const sweepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // True from a Save-all click until the sweep above finishes (or its
  // safety-net timeout gives up) — distinct from `saving`, which only
  // reflects the real network request that follows.
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  const clearSweep = () => {
    sweepRef.current = null;
    if (sweepTimeoutRef.current) {
      clearTimeout(sweepTimeoutRef.current);
      sweepTimeoutRef.current = null;
    }
    setAutoSubmitting(false);
  };

  useEffect(() => {
    let cancelled = false;
    setSources(null);
    setPayloads([]);
    payloadsRef.current = [];
    setIndex(0);
    setVisited([0]);
    clearSweep();
    Promise.all(ids.map((id) => fetchById(id))).then((records) => {
      if (cancelled) return;
      const empty = new Array(records.length).fill(undefined);
      setSources(records);
      setPayloads(empty);
      payloadsRef.current = empty;
    });
    return () => {
      cancelled = true;
    };
    // Re-fetch only when the actual set of selected ids changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  // Don't leave a stray timer behind if the modal closes mid-sweep.
  useEffect(() => () => clearSweep(), []);

  if (!sources) {
    return (
      <div className="flex min-h-[300px] items-center justify-center p-10">
        <LoadingSpinner fullScreen={false} />
      </div>
    );
  }

  const total = sources.length;
  const isMulti = total > 1;
  const isLast = index === total - 1;
  const busy = saving || autoSubmitting;

  const goTo = (next: number) => {
    const clamped = Math.max(0, Math.min(total - 1, next));
    setIndex(clamped);
    setVisited((prev) => (prev.includes(clamped) ? prev : [...prev, clamped]));
  };

  // Native-submits one step's own form (crossing the DOM to it by id, the
  // same trick `<Button form={id}>` uses) and arms a short safety-net
  // timer. A step's default values already form a valid payload on their
  // own (the same shape a lone, unedited Copy already saves successfully
  // with) — this should always resolve near-instantly. If it doesn't,
  // that record failed ITS OWN validation, so surface it instead of
  // hanging Save-all forever.
  const runSweepStep = (i: number) => {
    // getElementById's return type is the generic HTMLElement —
    // requestSubmit only exists on HTMLFormElement, which is what this id
    // always actually is (see the form's `id={formId}` in each Lims*Form).
    (document.getElementById(`${formId}-${i}`) as HTMLFormElement | null)?.requestSubmit();
    if (sweepTimeoutRef.current) clearTimeout(sweepTimeoutRef.current);
    sweepTimeoutRef.current = setTimeout(() => {
      clearSweep();
      goTo(i);
      toast(t("copyAutoValidateFailed", { current: i + 1 }), "error");
    }, 4000);
  };

  // Bound to a specific step `i` at render time (not the live `index`
  // state) — a step submits itself, whichever one the user is actually
  // looking at, regardless of how they navigated there. Ordinarily this
  // just commits step `i` and advances. During a Save-all sweep it
  // instead feeds the next queued step, or — once every step has gone
  // through — fires the real batch call.
  const handleStepSubmit = async (i: number, values: TPayload, _files?: File[]) => {
    const next = payloadsRef.current.map((p, pi) => (pi === i ? values : p));
    payloadsRef.current = next;
    setPayloads(next);

    if (total === 1) {
      await onSaveAll(next.map((p, pi) => p ?? (sources[pi] as unknown as TPayload)));
      return;
    }

    const sweep = sweepRef.current;
    if (sweep?.includes(i)) {
      const remaining = sweep.filter((si) => si !== i);
      sweepRef.current = remaining.length ? remaining : null;
      if (remaining.length === 0) {
        clearSweep();
        await onSaveAll(next.map((p, pi) => p ?? (sources[pi] as unknown as TPayload)));
      } else {
        runSweepStep(remaining[0]);
      }
      return;
    }

    goTo(i + 1);
  };

  // The only save trigger, reachable from any step in any order. A record
  // already confirmed via its own button is left as-is; the current step
  // (for any live, unconfirmed edit) and every never-opened step are
  // swept through their own form first — see the component doc comment.
  const handleSaveAllClick = () => {
    if (busy) return;
    const uncommitted = sources
      .map((_, i) => i)
      .filter((i) => i !== index && payloadsRef.current[i] === undefined);
    const toSubmit = [index, ...uncommitted];
    setAutoSubmitting(true);
    // Forces the newly-added (never-opened) steps to actually mount
    // before `runSweepStep` looks them up by id, in one synchronous flush
    // instead of waiting on React's own render timing.
    flushSync(() => {
      setVisited((prev) => Array.from(new Set([...prev, ...toSubmit])));
    });
    sweepRef.current = toSubmit;
    runSweepStep(toSubmit[0]);
  };

  return (
    <div className="relative">
      {isMulti && (
        // Two small circular buttons, styled to match the Modal's own close
        // (X) button (same rounded/hover treatment, smaller) — same row as
        // the title and the X, so this adds no height of its own. Purely
        // "look at the next one"; jumping to a specific record lives in the
        // numbered row down by Save all instead.
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
      {visited.map((i) => (
        <div key={i} className={i === index ? undefined : "hidden"}>
          <FormComponent
            // A fresh, STABLE instance per record (never re-keyed once
            // created) — mounted once from the pristine source, then left
            // alone for the rest of the session so its own edits/AsyncSelect
            // labels survive navigating away and back. See the component
            // doc comment for why this differs from keying by `index`.
            mode="copy"
            initialData={sources[i]}
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
        </div>
      ))}
      {isMulti && (
        // Bottom bar: numbered chips (jump to any record — a ring marks
        // one already confirmed via its own button, informational only,
        // never a gate) on the left, the actual save trigger on the right,
        // reachable from any step regardless of which one is on screen.
        // ABSOLUTE, not flow content — like the top arrows, this adds no
        // height of its own. The form's own scroll box (each module's
        // `max-h-[calc(100dvh-5rem)]`) is tuned for the plain Update modal
        // with nothing else below it; a normal-flow bar here would stack
        // on top of that budget and push the whole modal past the
        // viewport. Floating it instead keeps the modal the same height
        // as an ordinary Edit dialog — it overlays the last slice of the
        // scrollable form, same tradeoff the Modal's own X already makes
        // at top.
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 rounded-b-3xl border-t border-gray-100 bg-white/95 px-10 py-3 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95 sm:px-14">
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto">
            {sources.map((_, i) => {
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
            {t("copySaveAll", { count: total })}
          </Button>
        </div>
      )}
    </div>
  );
}

export default CopyStepper;
