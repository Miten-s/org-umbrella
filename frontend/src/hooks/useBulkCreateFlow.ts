import { useCallback, useMemo, useRef, useState } from "react";

type Prompt = { kind: "create" } | { kind: "copy"; id: string; name: string };

const NEW_PREFIX = "new-";

/**
 * State for the "How many?" step in front of Create and single-record Copy (Samples, Batches,
 * Lots). Create-N feeds CopyStepper N starting records (blank or template-filled) under
 * synthetic ids; Copy-N feeds it the same source id N times.
 */
export const useBulkCreateFlow = <TRecord>(
  fetchById: (id: string, signal?: AbortSignal) => Promise<TRecord>
) => {
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [createRecords, setCreateRecords] = useState<TRecord[] | null>(null);
  const [copyIds, setCopyIds] = useState<string[] | null>(null);

  // Copy-N repeats one id; fetch that source once, not once per step.
  const cache = useRef(new Map<string, Promise<TRecord>>());
  const fetchSource = useCallback(
    (id: string) => {
      if (!cache.current.has(id)) {
        const pending = fetchById(id);
        pending.catch(() => cache.current.delete(id));
        cache.current.set(id, pending);
      }
      return cache.current.get(id)!;
    },
    [fetchById]
  );

  const createIds = useMemo(
    () => createRecords?.map((_, i) => `${NEW_PREFIX}${i}`) ?? null,
    [createRecords]
  );
  const fetchNew = useCallback(
    async (id: string) =>
      (createRecords ?? [])[Number(id.slice(NEW_PREFIX.length))],
    [createRecords]
  );

  const reset = useCallback(() => {
    setPrompt(null);
    setCreateRecords(null);
    setCopyIds(null);
    cache.current.clear();
  }, []);

  const askCreate = useCallback(() => setPrompt({ kind: "create" }), []);
  const askCopy = useCallback(
    (id: string, name: string) => setPrompt({ kind: "copy", id, name }),
    []
  );
  /** Opens N forms, each starting from `record` (a blank `{}` or template-filled one). */
  const startCreate = useCallback((count: number, record: TRecord) => {
    setPrompt(null);
    setCreateRecords(Array.from({ length: count }, () => record));
  }, []);
  const startCopy = useCallback((id: string, count: number) => {
    setPrompt(null);
    setCopyIds(Array.from({ length: count }, () => id));
  }, []);

  return {
    prompt,
    askCreate,
    askCopy,
    startCreate,
    startCopy,
    createIds,
    fetchNew,
    copyIds,
    fetchSource,
    reset
  };
};
