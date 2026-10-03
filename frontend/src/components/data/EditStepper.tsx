import { useEffect, useId, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeftIcon } from "@/public/icons";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { SelectDropdown } from "@/components/ui/dropdown/SelectDropdown";
import { toast } from "@/lib/toast";

/**
 * The module's own `Lims<Entity>Form`, in `mode: "bulk-edit"` — real current data, nothing
 * blanked. `onUnchanged` fires instead of `onSubmit` when the step's no-op-skip check finds nothing to save.
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
  headerControls?: React.ReactNode;
}

export interface EditStepperProps<TRecord, TPayload> {
  /** IDs of the records the user selected for Bulk Edit. */
  ids: string[];
  /** Pre-fetched titles of the records, matching the order of `ids`. Falls back to `Step N` if omitted. */
  titles?: string[];
  /** Fetches ONE full-detail record — the same fetch the Edit modal already uses. */
  fetchById: (id: string, signal?: AbortSignal) => Promise<TRecord>;
  FormComponent: React.ComponentType<EditStepperFormProps<TRecord, TPayload>>;
  // Fires once, on Save-all, with only records that actually changed, each paired with its
  // id — never opened, or opened-but-untouched records are excluded entirely.
  onSaveAll: (
    updates: { id: string; payload: TPayload }[]
  ) => void | Promise<void>;
  onClose: () => void;
  saving?: boolean;
  entityLabel: string;
}

/**
 * Bulk Edit: select N records → step through each one's own Edit form → Save-all sends only
 * whatever actually changed. Unlike Copy, an all-unchanged selection saves nothing.
 */
function EditStepper<TRecord, TPayload>({
  ids,
  titles,
  fetchById,
  FormComponent,
  onSaveAll,
  onClose,
  saving = false
}: EditStepperProps<TRecord, TPayload>) {
  const { t } = useTranslation();
  const formId = useId();
  const total = ids.length;

  const [sources, setSources] = useState<Array<TRecord | undefined>>(() =>
    new Array(total).fill(undefined)
  );
  const sourcesRef = useRef<Array<TRecord | undefined>>(sources);
  // undefined = not yet resolved; null = confirmed unchanged; TPayload = confirmed changed.
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

  const clearSweep = () => {
    sweepRef.current = null;
    if (sweepTimeoutRef.current) {
      clearTimeout(sweepTimeoutRef.current);
      sweepTimeoutRef.current = null;
    }
    setAutoSubmitting(false);
  };

  // Same `flushSync` reasoning as CopyStepper's `loadSource` — the sweep needs `sources[i]`
  // actually committed, not just scheduled, or it finds no mounted `<form>` and hangs.
  const loadSource = async (i: number) => {
    if (sourcesRef.current[i] !== undefined)
      return sourcesRef.current[i] as TRecord;
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
      if (payload !== null && payload !== undefined)
        updates.push({ id: ids[i], payload });
    });
    if (!updates.length) {
      toast(t("editNoChanges"), "info");
      onClose();
      return;
    }
    await onSaveAll(updates);
  };

  // Same display-before-submit reasoning as CopyStepper's `runSweepStep`; every swept step
  // here was already visited, so unlike Copy there's no fetch to await first.
  const runSweepStep = (i: number) => {
    // Set both `index` and `displayIndex`, or a swept step other than the one the
    // user started on renders dimmed while it's actually the one being saved.
    flushSync(() => {
      setIndex(i);
      setDisplayIndex(i);
    });
    (
      document.getElementById(`${formId}-${i}`) as HTMLFormElement | null
    )?.requestSubmit();
    if (sweepTimeoutRef.current) clearTimeout(sweepTimeoutRef.current);
    sweepTimeoutRef.current = setTimeout(() => {
      clearSweep();
      goTo(i);
      toast(t("editAutoValidateFailed", { current: i + 1 }), "error");
    }, 4000);
  };

  // Records step `i`'s outcome and advances the sweep, or finalizes once every step resolved.
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
        try {
          await finalize();
        } finally {
          setAutoSubmitting(false);
        }
      } else {
        runSweepStep(remaining[0]);
      }
      return;
    }

    if (i === total - 1) {
      const uncommitted = visited.filter(
        (vi) => vi !== i && payloadsRef.current[vi] === undefined
      );
      if (uncommitted.length > 0) {
        setAutoSubmitting(true);
        sweepRef.current = uncommitted;
        runSweepStep(uncommitted[0]);
      } else {
        setAutoSubmitting(true);
        try {
          await finalize();
        } finally {
          setAutoSubmitting(false);
        }
      }
      return;
    }

    goTo(Math.min(i + 1, total - 1));
  };

  const handleStepSubmit = (i: number, values: TPayload, _files?: File[]) =>
    commitStep(i, values);
  const handleStepUnchanged = (i: number) => commitStep(i, null);

  // Every VISITED step is re-swept (current one unconditionally, to catch a live unsaved
  // edit); a never-visited step was never fetched and needs no sweep at all.

  return (
    <div className="relative h-full flex flex-col">
      <div className="relative flex-1 min-h-0">
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
                submitting={
                  (saving && total === 1) || (autoSubmitting && i === index)
                }
                submitLabel={isMulti ? (i === total - 1 ? t("save") : "Save and Next") : undefined}
                disabled={busy}
                formId={`${formId}-${i}`}
                stepLabel={
                  isMulti
                    ? ` ${t("editStep", { current: i + 1, total })}`
                    : undefined
                }
                headerControls={
                  isMulti ? (
                    <>
                      <div className="w-48">
                        <SelectDropdown
                          options={Array.from({ length: total }, (_, optIndex) => ({
                            value: String(optIndex),
                            label: titles?.[optIndex] || (sources[optIndex] as any)?.name || `Step ${optIndex + 1}`
                          }))}
                          value={String(index)}
                          onChange={(val) => goTo(Number(val))}
                          placeholder="Select template"
                          ariaLabel="Select template"
                          disabled={busy}
                          portal
                        />
                      </div>
                      <div className="flex items-center gap-1">
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
                    </>
                  ) : undefined
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
    </div>
  );
}

export default EditStepper;
