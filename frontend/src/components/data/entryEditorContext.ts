import { createContext, useContext, useEffect, useId, useRef } from "react";

/** What one entry editor (an entry form + table) tells the page it sits on. */
export interface EntryEditorState {
  /** Rows added, changed or removed since the page last saved. */
  unsaved: number;
  /** Something is typed in the entry form but not added to the table yet. */
  pendingEntry: boolean;
  /** The list's name, e.g. "Components", for messages. */
  label: string;
  /** Brings the entry form into view. */
  focus: () => void;
  /** Throws away what is typed in the entry form. */
  clearEntry: () => void;
}

export interface EntryEditorRegistry {
  set: (id: string, state: EntryEditorState | null) => void;
}

export const EntryEditorContext = createContext<EntryEditorRegistry | null>(
  null
);

/** Reports this editor's state to the nearest page (RecordWorkspace); a no-op elsewhere. */
export const useEntryEditorState = (state: EntryEditorState) => {
  const id = useId();
  const registry = useContext(EntryEditorContext);
  const set = registry?.set;
  const latest = useRef(state);
  latest.current = state;
  const { unsaved, pendingEntry, label } = state;
  useEffect(() => {
    set?.(id, {
      unsaved,
      pendingEntry,
      label,
      focus: () => latest.current.focus(),
      clearEntry: () => latest.current.clearEntry()
    });
  }, [set, id, unsaved, pendingEntry, label]);
  useEffect(() => () => set?.(id, null), [set, id]);
};
