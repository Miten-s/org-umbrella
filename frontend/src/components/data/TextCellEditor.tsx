import { useLayoutEffect, useRef, useState } from "react";
import type { CustomCellEditorProps } from "ag-grid-react";
import { pasteBlock } from "./spreadsheet";

/** Text cell editor: shows a caret straight away with the text selected, so typing replaces
 * and arrows/double-click edit in place. A typed first key starts the value; a pasted block
 * fills the cells below and to the right. */
const TextCellEditor = (props: CustomCellEditorProps) => {
  const input = useRef<HTMLInputElement>(null);
  const typed =
    props.eventKey && props.eventKey.length === 1 ? props.eventKey : null;
  const [value, setValue] = useState(typed ?? String(props.value ?? ""));
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.focus();
    if (typed !== null) {
      props.onValueChange(typed);
      el.setSelectionRange(typed.length, typed.length);
    } else el.select();
    // Runs once, when the editor opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <input
      ref={input}
      className="h-full w-full bg-white px-3 text-sm text-gray-900 outline-none dark:bg-gray-900 dark:text-white"
      value={value}
      onChange={(event) => {
        setValue(event.target.value);
        props.onValueChange(event.target.value);
      }}
      onPaste={(event) => {
        const text = event.clipboardData.getData("text/plain");
        if (!/[\t\n]/.test(text.replace(/\r?\n$/, ""))) return;
        event.preventDefault();
        const row = props.node.rowIndex;
        const colId = props.column.getColId();
        props.api.stopEditing(true);
        if (row !== null) pasteBlock(props.api, row, colId, text);
      }}
    />
  );
};

export default TextCellEditor;
