import { useEffect, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button/Button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

/**
 * The module's own `Lims<Entity>Form`, rendered in `mode: "copy"` — same
 * component the Create/Edit modal already uses, just pointed at a source
 * record instead of a blank one, with its ID field forced blank/disabled.
 */
export interface CopyStepperFormProps<TRecord, TPayload> {
  mode: "copy";
  initialData: TRecord;
  onClose: () => void;
  onSubmit: (payload: TPayload) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
  formId?: string;
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
 * Copy review flow (see the "Copy" plan): select N records → Copy shows
 * this instead of firing a clone API immediately → the user steps through
 * and edits each one locally → one Save sends everything together.
 *
 * Only ONE network call ever happens here — `onSaveAll`, from the last
 * step. Prev/Next are pure local navigation. Stepping chrome (the "i of N"
 * header, Prev) only renders when there's more than one record — a single
 * selected record shows the bare form, matching the plain Copy dialog.
 *
 * Simplification: going back to an earlier step re-shows that step's
 * ORIGINAL source data, not whatever was mid-edit there before advancing —
 * capturing a full draft round-trip through each module's own async-select
 * fields (which need the picked option's label, not just its id, to
 * redisplay) isn't something a generic stepper can safely do. Advancing
 * past a step is what actually locks its edited values in for the batch.
 */
function CopyStepper<TRecord, TPayload>({
  ids,
  fetchById,
  FormComponent,
  onSaveAll,
  onClose,
  saving = false,
  entityLabel
}: CopyStepperProps<TRecord, TPayload>) {
  const { t } = useTranslation();
  // Lets the header's Next/Save button submit the form rendered below it —
  // they're siblings, not nested, so a plain onClick can't reach RHF's
  // validated submit; the HTML `form` attribute can.
  const formId = useId();
  const [sources, setSources] = useState<TRecord[] | null>(null);
  const [payloads, setPayloads] = useState<Array<TPayload | undefined>>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setSources(null);
    setPayloads([]);
    setIndex(0);
    Promise.all(ids.map((id) => fetchById(id))).then((records) => {
      if (cancelled) return;
      setSources(records);
      setPayloads(new Array(records.length).fill(undefined));
    });
    return () => {
      cancelled = true;
    };
    // Re-fetch only when the actual set of selected ids changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

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

  const handleStepSubmit = async (values: TPayload) => {
    // Every position before `index` was already locked in by an earlier
    // step's submit; `sources[i]` is only ever a fallback for a position
    // that's never been visited, which linear forward-only navigation
    // means can't happen in practice — kept defensive, not load-bearing.
    const next = payloads.map((p, i) => (i === index ? values : p));
    if (!isLast) {
      setPayloads(next);
      setIndex((i) => i + 1);
      return;
    }
    await onSaveAll(next.map((p, i) => p ?? (sources[i] as unknown as TPayload)));
  };

  return (
    <div>
      {isMulti && (
        // pr- clears the Modal's own close button, which is absolutely
        // positioned at top-right (right-3/top-3, growing to right-6/top-6
        // + w-11 on sm+) OVER this content rather than pushing it — without
        // this the Previous button sits right underneath it.
        <div className="flex items-center justify-between gap-4 border-b border-gray-200 py-3 pl-6 pr-16 text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400 sm:pr-20">
          <span>
            {t("copyStep", { entity: entityLabel, current: index + 1, total })}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              disabled={index === 0 || saving}
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
            >
              {t("previous")}
            </Button>
            {/* Same submit as the form's own bottom button, reachable from
                up here via the `form` attribute — see the `formId` comment
                above. Keeps them in lockstep: one click either place runs
                the exact same validated submit, never two separate paths. */}
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form={formId}
              loading={saving && isLast}
            >
              {isLast ? t("save") : t("next")}
            </Button>
          </div>
        </div>
      )}
      <FormComponent
        // Forces a fresh mount per step — without this, React reuses the
        // SAME component instance across steps (same position in the
        // tree), so react-hook-form's `defaultValues` (only read on
        // mount) and each form's own local useState (Components/Limits
        // sub-grids, selectedUserName, ...) never re-initialize: every
        // step silently kept showing/editing whatever the FIRST step had.
        key={index}
        mode="copy"
        initialData={sources[index]}
        onClose={onClose}
        onSubmit={handleStepSubmit}
        submitting={saving && isLast}
        submitLabel={isLast ? undefined : t("next")}
        formId={formId}
      />
    </div>
  );
}

export default CopyStepper;
