import { useEffect } from "react";
import type { CustomCellEditorProps } from "ag-grid-react";

const refocus = (props: CustomCellEditorProps) => {
  if (props.node.rowIndex !== null)
    props.api.setFocusedCell(props.node.rowIndex, props.column);
};

/** Closes a picker editor after a choice and gives focus back to its cell, so the keyboard
 * (arrows, typing, Enter) keeps working without another click. */
export const finishPopupEdit = (props: CustomCellEditorProps) =>
  setTimeout(() => {
    props.stopEditing();
    refocus(props);
  }, 0);

/** Escape inside a picker (its menu may be portaled outside the grid) cancels the edit and
 * returns focus to the cell — the menu alone closing would leave the editor open and the
 * keyboard dead until the next click. */
export const useEscapeCancelsEdit = (props: CustomCellEditorProps) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setTimeout(() => {
        props.api.stopEditing(true);
        refocus(props);
      }, 0);
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
    // Bound once per open editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
