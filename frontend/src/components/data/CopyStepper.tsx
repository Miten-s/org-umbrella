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
  /**
   * Fires exactly once, on Save-all, with every REVIEWED record (any step
   * the user actually opened — always includes at least whichever step
   * was on screen). When `onDuplicateUnreviewed` is provided, records the
   * user never opened are excluded here entirely — they went through that
   * instead.
   */
  onSaveAll: (payloads: TPayload[]) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
  entityLabel: string;
  /**
   * Optional fast path for records the user never actually opened during
   * review. A step that was never shown can't have been edited, so there's
   * no reason to fetch its full detail, mount its form, or flatten it
   * through react-hook-form just to hand `onSaveAll` back the exact same
   * shape the source already had — the module's plain "Duplicate" bulk
   * action already does this server-side from nothing but an id (see
   * crud-factory's `bulkDuplicate`; every module already has the frontend
   * call for it, e.g. `bulkClone<Entity>`, since "select-all-matching" Copy
   * uses it too). Wire that same call in here and Save-all sends every
   * never-opened record's id straight to it, in parallel with reviewing
   * whatever WAS opened, instead of paying a GET + form-mount per record
   * for copies nobody looked at. Omit to keep every record on the full
   * fetch+review path regardless of whether it was opened (the original,
   * always-correct-but-heavier behavior) — e.g. for a module this hasn't
   * been wired up for yet.
   */
  onDuplicateUnreviewed?: (ids: string[]) => Promise<void>;
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
 * (arrows + numbered chips) is separate, pure local state — EXCEPT during
 * Save-all's sweep, which drives it directly: each swept step is brought
 * on screen right before it submits itself (see `runSweepStep`), so the
 * user watches Save-all page through whatever records it still needs.
 *
 * Source records are fetched LAZILY, one GET per record, only when a step
 * is first shown or when Save-all's sweep reaches it — not all N upfront.
 * Selecting 10 and only ever opening 2 costs 2 GETs, not 10; Save-all
 * still fetches (and flattens through its own form) whichever of the
 * other 8 were never opened, right before the single batched save.
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
  saving = false,
  onDuplicateUnreviewed
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
  const total = ids.length;

  // One slot per record, filled in as each is fetched — starts all-empty,
  // never a single `Promise.all` for the whole selection (see doc comment).
  const [sources, setSources] = useState<Array<TRecord | undefined>>(() =>
    new Array(total).fill(undefined)
  );
  // Mirrors `sources` but read/written synchronously — the sweep below
  // needs the just-fetched record immediately after `await`, not the
  // stale array its own closure captured before the state update commits.
  const sourcesRef = useRef<Array<TRecord | undefined>>(sources);
  const [payloads, setPayloads] = useState<Array<TPayload | undefined>>(
    new Array(total).fill(undefined)
  );
  // Same synchronous-mirror reason as `sourcesRef` — `runSweep` fires
  // several forms' submits back-to-back, faster than React re-renders
  // `payloads` state in between, so each step must see the PREVIOUS
  // step's result immediately rather than the stale array its own render
  // closed over.
  const payloadsRef = useRef<Array<TPayload | undefined>>(payloads);
  // Bumped every time `ids` changes — lets a fetch started for a prior
  // selection recognize it's stale once it resolves, so it doesn't write
  // into what's now a different selection's array slot.
  const generationRef = useRef(0);
  const [index, setIndex] = useState(0);
  // The step actually shown on screen — lags one step behind `index` while
  // the target step's source is still being fetched, so the previously
  // visible (already-mounted) step stays on screen, dimmed, instead of the
  // modal collapsing to a bare spinner box mid-navigation. That collapse
  // (a ~800px form suddenly replaced by a 300px placeholder, inside a
  // vertically-centered modal) is what read as the whole modal flickering
  // closed and open again.
  const [displayIndex, setDisplayIndex] = useState(0);
  // Every index that has ever been the current step — once added, a step
  // stays mounted (see the component doc comment) even after the user
  // navigates away from it.
  const [visited, setVisited] = useState<number[]>([0]);
  // Indices a Save-all click still needs auto-submitted before it can
  // fire the real batch call — null when no sweep is running.
  const sweepRef = useRef<number[] | null>(null);
  const sweepTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Indices the current Save-all routed to `onDuplicateUnreviewed` instead
  // of the review sweep — never fetched, never given a real payload, so
  // they must be excluded when the sweep's results are assembled for
  // `onSaveAll`. The in-flight call itself, so Save-all can wait on both
  // it and the reviewed batch before treating the whole thing as done.
  const duplicatedIndicesRef = useRef<Set<number>>(new Set());
  const duplicatePromiseRef = useRef<Promise<void> | null>(null);
  // True from a Save-all click until the sweep above finishes (or its
  // safety-net timeout gives up) — distinct from `saving`, which only
  // reflects the real network request that follows.
  const [autoSubmitting, setAutoSubmitting] = useState(false);
  // Save-all progress, for the button label. `sweepProgress` is real,
  // per-record progress through the review sweep (each step is fetched,
  // flattened, and submitted one at a time, so "X of Y" is literally
  // true). `finalizingCount` covers the phase after that: the two batch
  // calls (`onDuplicateUnreviewed` + `onSaveAll`) are single atomic
  // requests each — there's no per-record progress observable INSIDE one
  // POST, so this is just how many records that request covers, not a
  // live counter. Both null when no Save-all is running.
  const [sweepProgress, setSweepProgress] = useState<{ current: number; total: number } | null>(null);
  const [finalizingCount, setFinalizingCount] = useState<number | null>(null);

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

  // Fetches record `i` and stores it, unless the selection has moved on
  // (a new `ids` array) by the time the request comes back.
  //
  // The `setSources` write is wrapped in `flushSync` on purpose: callers
  // that immediately act on the DOM once this resolves (`runSweepStep`
  // below, looking up the just-loaded step's `<form>` by id) need the
  // commit to have actually happened by then, not just be scheduled. A
  // plain `setSources` here left a window where `await loadSource(i)` had
  // returned but `sources[i]` hadn't committed yet — the step still
  // rendered its loading placeholder (no `<form>` in the DOM), so the
  // sweep's `requestSubmit()` call silently found nothing and the step
  // sat there until the 4s safety-net timeout wrongly reported it as a
  // validation failure. Retrying always "worked" because the second
  // attempt hit the cached-record early return below, with no race left
  // to lose.
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
    clearSweep();
    duplicatedIndicesRef.current = new Set();
    duplicatePromiseRef.current = null;
    // Re-fetch only when the actual set of selected ids changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  // Loads whichever step is currently on screen, if it hasn't been
  // fetched yet. Save-all's sweep loads every OTHER step itself.
  useEffect(() => {
    loadSource(index);
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

  // Loads step `i` if needed, force-mounts and DISPLAYS it, then
  // native-submits its own form (crossing the DOM to it by id, the same
  // trick `<Button form={id}>` uses) and arms a short safety-net timer. A
  // step's default values already form a valid payload on their own (the
  // same shape a lone, unedited Copy already saves successfully with) —
  // this should always resolve near-instantly once mounted. If it doesn't,
  // that record failed ITS OWN validation, so surface it instead of
  // hanging Save-all forever.
  //
  // Displaying the step (not just mounting it) before submitting is load
  // bearing, not cosmetic: `.requestSubmit()` on a form sitting inside a
  // `display:none` wrapper is unreliable — some browsers silently drop the
  // submit dispatch instead of firing it. An earlier version left every
  // step but the current one hidden while sweeping, which submitted fine
  // for whichever step the user happened to be looking at and silently
  // hung on every other one, one at a time, until this step's own 4s
  // timeout wrongly reported it as a validation failure.
  const runSweepStep = async (i: number) => {
    try {
      await loadSource(i);
    } catch {
      clearSweep();
      goTo(i);
      toast(t("copySourceLoadFailed", { current: i + 1 }), "error");
      return;
    }
    // Forces the newly-loaded step to actually mount AND display before the
    // id lookup below runs, in one synchronous flush instead of waiting on
    // React's own render timing.
    flushSync(() => {
      setVisited((prev) => (prev.includes(i) ? prev : [...prev, i]));
      setIndex(i);
      setDisplayIndex(i);
    });
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
        // Stop the sweep's own bookkeeping here, but leave `autoSubmitting`
        // (and therefore `busy`) on through the `finally` below — two
        // network calls are still about to run, and `saving` (the `busy`
        // half the PARENT tracks) only ever reflects `onSaveAll`'s own
        // mutation, not `onDuplicateUnreviewed`'s independent one.
        sweepRef.current = null;
        if (sweepTimeoutRef.current) {
          clearTimeout(sweepTimeoutRef.current);
          sweepTimeoutRef.current = null;
        }
        // Records routed to `onDuplicateUnreviewed` (see `handleSaveAllClick`)
        // never went through their own form — `next[pi]` for one of them is
        // still `undefined`, and the OLD `?? sourcesRef.current[pi]` fallback
        // would smuggle the raw, un-flattened source record into `onSaveAll`
        // instead (exactly the shape the component doc comment warns fails
        // backend validation). Exclude them; that id already went to the
        // duplicate call instead.
        const duplicated = duplicatedIndicesRef.current;
        const reviewed: TPayload[] = [];
        next.forEach((p, pi) => {
          if (duplicated.has(pi)) return;
          reviewed.push(p ?? (sourcesRef.current[pi] as unknown as TPayload));
        });
        const duplicatePromise = duplicatePromiseRef.current;
        const duplicateCount = duplicated.size;
        duplicatedIndicesRef.current = new Set();
        duplicatePromiseRef.current = null;
        setSweepProgress(null);
        setFinalizingCount(reviewed.length + duplicateCount);
        try {
          // Run concurrently, not sequentially — they're two independent
          // network calls with nothing to hand off between them.
          await Promise.all([duplicatePromise, onSaveAll(reviewed)]);
        } finally {
          setAutoSubmitting(false);
          setFinalizingCount(null);
        }
      } else {
        // `remaining.length` counts what's LEFT, so `total - remaining` is
        // how many just finished; the one about to start is one past that.
        setSweepProgress((prev) =>
          prev ? { current: Math.min(prev.total - remaining.length + 1, prev.total), total: prev.total } : prev
        );
        runSweepStep(remaining[0]);
      }
      return;
    }

    goTo(i + 1);
  };

  // The only save trigger, reachable from any step in any order. A record
  // already confirmed via its own button is left as-is; the current step
  // (for any live, unconfirmed edit) is always re-swept through its own
  // form; every other never-committed step is either swept the same way
  // (if it's been opened — could hold a live, unsaved edit) or, when
  // `onDuplicateUnreviewed` is wired up and it was never opened at all,
  // routed straight to that instead — see the component doc comment.
  const handleSaveAllClick = () => {
    if (busy) return;
    const neverOpened = onDuplicateUnreviewed
      ? Array.from({ length: total }, (_, i) => i).filter(
          (i) => i !== index && !visited.includes(i) && payloadsRef.current[i] === undefined
        )
      : [];
    const uncommitted = Array.from({ length: total }, (_, i) => i).filter(
      (i) => i !== index && payloadsRef.current[i] === undefined && !neverOpened.includes(i)
    );
    const toSubmit = [index, ...uncommitted];
    duplicatedIndicesRef.current = new Set(neverOpened);
    duplicatePromiseRef.current = neverOpened.length
      ? onDuplicateUnreviewed!(neverOpened.map((i) => ids[i]))
      : null;
    setAutoSubmitting(true);
    setSweepProgress(toSubmit.length ? { current: 1, total: toSubmit.length } : null);
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
                // A fresh, STABLE instance per record (never re-keyed once
                // created) — mounted once from the pristine source, then left
                // alone for the rest of the session so its own edits/AsyncSelect
                // labels survive navigating away and back. See the component
                // doc comment for why this differs from keying by `index`.
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
          // Target step is still loading behind the scenes — shown as an
          // overlay on the still-visible previous step rather than
          // replacing it, so the modal's height never jumps.
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <LoadingSpinner fullScreen={false} />
          </div>
        )}
      </div>
      {isMulti && (
        // Bottom bar: numbered chips (jump to any record — a ring marks
        // one already confirmed via its own button, informational only,
        // never a gate) on the left, the actual save trigger on the right,
        // reachable from any step regardless of which one is on screen.
        // NORMAL FLOW, not absolute — an earlier version floated this on
        // top of the form's own content to avoid growing the modal, but
        // that meant it sat ON TOP of each form's own Cancel/Next button
        // rather than pushing it up, hiding it behind the bar.
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
