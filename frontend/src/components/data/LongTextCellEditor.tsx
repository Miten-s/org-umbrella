import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CustomCellEditorProps } from "ag-grid-react";
import Button from "@/components/ui/button/Button";
import { finishPopupEdit, useEscapeCancelsEdit } from "./finishPopupEdit";

const MIN_ROWS = 4;
const MAX_ROWS = 10;
const LINE_PX = 20;

/** Notes-style editor for long text cells: opens under the cell with its field and record
 * named, grows with the text, shows the length limit. Enter adds a line; Ctrl/⌘+Enter saves. */
const LongTextCellEditor = (
  props: CustomCellEditorProps & {
    label: string;
    recordLabel?: string;
    maxLength?: number;
  }
) => {
  const { t } = useTranslation();
  useEscapeCancelsEdit(props);
  const area = useRef<HTMLTextAreaElement>(null);
  const typed =
    props.eventKey && props.eventKey.length === 1 ? props.eventKey : null;
  const [value, setValue] = useState(typed ?? String(props.value ?? ""));

  const fit = () => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(Math.max(el.scrollHeight, MIN_ROWS * LINE_PX), MAX_ROWS * LINE_PX) + 12}px`;
  };
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    if (typed !== null) props.onValueChange(typed);
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    fit();
    // Runs once, when the editor opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const change = (next: string) => {
    setValue(next);
    props.onValueChange(next);
  };
  const over = props.maxLength !== undefined && value.length > props.maxLength;

  return (
    <div className="w-[26rem] max-w-[90vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-baseline justify-between gap-3 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {props.label}
        </span>
        {props.recordLabel ? (
          <span className="truncate text-xs text-gray-500">
            {props.recordLabel}
          </span>
        ) : null}
      </div>
      <div className="px-4 pt-3">
        <textarea
          ref={area}
          value={value}
          aria-label={props.label}
          maxLength={props.maxLength}
          onChange={(event) => {
            change(event.target.value);
            fit();
          }}
          onKeyDown={(event) => {
            // Plain Enter is a new line (the column keeps the grid off it); Ctrl/⌘+Enter saves.
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              finishPopupEdit(props);
            }
          }}
          className="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm leading-5 text-gray-900 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90"
        />
      </div>
      <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1.5">
        <span className="text-xs text-gray-500">
          {t("bulkLongTextKeys")}
          {props.maxLength !== undefined ? (
            <span className={`ml-2 ${over ? "text-error-600" : ""}`}>
              {value.length}/{props.maxLength}
            </span>
          ) : null}
        </span>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              props.api.stopEditing(true);
              if (props.node.rowIndex !== null)
                props.api.setFocusedCell(props.node.rowIndex, props.column);
            }}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => finishPopupEdit(props)}
          >
            {t("limsDone")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LongTextCellEditor;
