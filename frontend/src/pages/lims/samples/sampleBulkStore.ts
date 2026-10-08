import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore
} from "react";
import type { LimsSampleTest } from "./LimsSample.types";
import type { PendingTemplate } from "./sampleTests";

export interface BulkStep {
  existing: LimsSampleTest[];
  pending: PendingTemplate[];
  /** Values typed for picked (not yet saved) tests, by `analysisId|componentId`. */
  values?: Record<string, string>;
}

/** Key of a picked test's value in `BulkStep.values`. */
export const valueKey = (analysisId: string, componentId: string) =>
  `${analysisId}|${componentId}`;

/** Every step's tests in one place, so the compare grid can edit samples the user never opened.
 * Subscribers re-render only when their own step changes. */
export const createBulkTestsStore = () => {
  let steps = new Map<number, BulkStep>();
  const listeners = new Set<() => void>();
  const labels = new Map<number, () => string>();
  const emit = () => listeners.forEach((listener) => listener());
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    getSteps: () => steps,
    getStep: (i: number) => steps.get(i),
    register: (i: number, step: BulkStep, label: () => string) => {
      labels.set(i, label);
      if (steps.has(i)) return;
      steps = new Map(steps).set(i, step);
      emit();
    },
    setPending: (updates: Map<number, PendingTemplate[]>) => {
      if (!updates.size) return;
      const next = new Map(steps);
      updates.forEach((pending, i) => {
        const step = next.get(i);
        if (step) next.set(i, { ...step, pending });
      });
      steps = next;
      emit();
    },
    setValue: (i: number, key: string, value: string) => {
      const step = steps.get(i);
      if (!step) return;
      const values = { ...(step.values ?? {}) };
      if (value) values[key] = value;
      else delete values[key];
      steps = new Map(steps).set(i, { ...step, values });
      emit();
    },
    /** Live label from each form (its current Sample name), read when the grid opens. */
    labelOf: (i: number) => labels.get(i)?.() || `#${i + 1}`
  };
};

export type BulkTestsStore = ReturnType<typeof createBulkTestsStore>;

export interface BulkTestsContextValue {
  store: BulkTestsStore;
  total: number;
  openCompare: () => void;
}

export const BulkTestsContext = createContext<BulkTestsContextValue | null>(
  null
);

export const useSampleBulkTests = () => useContext(BulkTestsContext);

/** One step's tests, falling back to the form's own state until it registers. */
export const useBulkStep = (
  ctx: BulkTestsContextValue | null,
  stepIndex: number | undefined
) => {
  const subscribe = useCallback(
    (listener: () => void) => ctx?.store.subscribe(listener) ?? (() => {}),
    [ctx]
  );
  return useSyncExternalStore(subscribe, () =>
    ctx && stepIndex !== undefined ? ctx.store.getStep(stepIndex) : undefined
  );
};
