import { createContext, useContext, useEffect, useId, useRef } from "react";

export interface HeaderAction {
  label: string;
  title?: string;
  onClick: () => void;
}

export interface Registry {
  actions: [string, HeaderAction][];
  set: (id: string, action: HeaderAction | null) => void;
}

export const FormHeaderContext = createContext<Registry | null>(null);

/** Registers an Add button in the nearest FormHeader while mounted; null removes it.
 * Outside a FormHeaderProvider (e.g. a form shown on a page) it does nothing. */
export const useFormHeaderAction = (action: HeaderAction | null) => {
  const id = useId();
  const registry = useContext(FormHeaderContext);
  const set = registry?.set;
  const latest = useRef(action);
  latest.current = action;
  const active = Boolean(action);
  const label = action?.label;
  const title = action?.title;
  useEffect(() => {
    if (!set) return;
    set(
      id,
      active
        ? { label: label!, title, onClick: () => latest.current?.onClick() }
        : null
    );
    return () => set(id, null);
  }, [set, id, active, label, title]);
};
