import { useSearchParams } from "react-router-dom";

/** The workspace tab kept in the query string (?tab=); unknown or missing → `fallback`.
 * Switching replaces history, so Back leaves the page instead of stepping through tabs. */
export const useWorkspaceTab = (keys: string[], fallback = keys[0]) => {
  const [params, setParams] = useSearchParams();
  const tab = keys.includes(params.get("tab") ?? "")
    ? (params.get("tab") as string)
    : fallback;
  const setTab = (next: string) =>
    setParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        nextParams.set("tab", next);
        return nextParams;
      },
      { replace: true }
    );
  return [tab, setTab] as const;
};
