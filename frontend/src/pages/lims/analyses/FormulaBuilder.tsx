import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import Button from "@/components/ui/button/Button";
import type { LimsComponentRow } from "./LimsAnalysis.types";
import { formulaProblem, formulaTargets } from "./componentTypes";

interface FormulaBuilderProps {
  formula: string;
  /** Component ID of the Calculation being edited. */
  selfId: string;
  selfName: string;
  rows: LimsComponentRow[];
  onApply: (formula: string) => void;
  onClose: () => void;
}

const OPERATORS = [
  { insert: " + ", label: "+" },
  { insert: " - ", label: "−" },
  { insert: " * ", label: "×" },
  { insert: " / ", label: "÷" },
  { insert: "(", label: "(" },
  { insert: ")", label: ")" }
];
const DIGITS = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", "."];

const keyClasses =
  "h-9 min-w-9 rounded-lg border border-gray-300 px-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5";

/** Builds a Calculation formula by clicking components and operators. Rendered at the page root
 * (not with Modal) so Escape closes only this, not the Test Template form underneath. */
const FormulaBuilder = ({
  formula,
  selfId,
  selfName,
  rows,
  onApply,
  onClose
}: FormulaBuilderProps) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(formula);
  const input = useRef<HTMLInputElement>(null);
  const targets = useMemo(() => formulaTargets(rows, selfId), [rows, selfId]);
  const nameById = useMemo(
    () =>
      new Map(
        targets.map((row) => [String(row.componentId), String(row.name)])
      ),
    [targets]
  );
  const problem = draft.trim()
    ? formulaProblem(draft, selfId, rows)
    : undefined;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  useEffect(() => input.current?.focus(), []);

  /** Inserts at the cursor, then puts the cursor after what was inserted. */
  const insert = (text: string) => {
    const el = input.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + text + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  /** Removes the component reference, operator or character just before the cursor. */
  const backspace = () => {
    const el = input.current;
    const start = el?.selectionStart ?? draft.length;
    const before = draft.slice(0, start).replace(/\s+$/, "");
    const ref = /\{[^{}]*\}$/.exec(before);
    const cut = ref
      ? before.length - ref[0].length
      : Math.max(before.length - 1, 0);
    const kept = draft.slice(0, cut).replace(/\s+$/, "");
    setDraft(kept + draft.slice(start));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(kept.length, kept.length);
    });
  };

  const apply = () => {
    if (problem) return;
    onApply(draft.trim().replace(/\s+/g, " "));
  };

  // `{ID}` shown as the component's name; anything else as typed.
  const preview = draft.split(/(\{[^{}]*\})/).map((part, i) => {
    const ref = /^\{([^{}]*)\}$/.exec(part);
    if (!ref) return <span key={i}>{part}</span>;
    const name = nameById.get(ref[1].trim());
    return (
      <span
        key={i}
        className={`mx-0.5 rounded px-1.5 py-0.5 text-xs font-medium ${
          name
            ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
            : "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
        }`}
      >
        {name ?? ref[1]}
      </span>
    );
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-gray-900/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("limsFormulaBuilderTitle", { name: selfName })}
        className="w-full max-w-2xl rounded-2xl bg-white p-6 text-gray-900 shadow-theme-xl dark:bg-gray-900 dark:text-gray-100"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold">
          {t("limsFormulaBuilderTitle", { name: selfName })}
        </h3>

        <input
          ref={input}
          aria-label={t("limsFormula")}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              apply();
            }
          }}
          className={`h-11 w-full rounded-lg border bg-transparent px-3 font-mono text-sm focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 ${
            problem
              ? "border-red-500"
              : "border-gray-300 focus:border-brand-300 dark:border-gray-700"
          }`}
        />
        <div className="mt-2 min-h-8 rounded-lg bg-gray-50 px-3 py-1.5 text-sm leading-6 dark:bg-gray-800">
          {draft.trim() ? (
            preview
          ) : (
            <span className="text-gray-400">{t("limsFormulaEmpty")}</span>
          )}
        </div>
        {problem ? (
          <p className="mt-1 text-xs text-red-500">{problem}</p>
        ) : null}

        <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("limsFormulaComponents")}
            </p>
            {targets.length ? (
              <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
                {targets.map((row) => (
                  <button
                    key={String(row.componentId)}
                    type="button"
                    onClick={() => insert(`{${String(row.componentId)}}`)}
                    className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-left text-xs text-brand-700 hover:bg-brand-100 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                  >
                    <span className="block font-medium">
                      {String(row.name)}
                    </span>
                    <span className="font-mono opacity-70">
                      {String(row.componentId)}
                      {row.unit ? ` · ${String(row.unit)}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                {t("limsFormulaNoTargets")}
              </p>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t("limsFormulaOperators")}
            </p>
            <div className="mb-2 flex gap-1.5">
              {OPERATORS.map((op) => (
                <button
                  key={op.label}
                  type="button"
                  aria-label={op.insert.trim()}
                  onClick={() => insert(op.insert)}
                  className={keyClasses}
                >
                  {op.label}
                </button>
              ))}
            </div>
            <div className="grid w-fit grid-cols-3 gap-1.5">
              {DIGITS.map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => insert(digit)}
                  className={keyClasses}
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                aria-label={t("limsFormulaBackspace")}
                title={t("limsFormulaBackspace")}
                onClick={backspace}
                className={keyClasses}
              >
                ⌫
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setDraft("")}
            disabled={!draft}
          >
            {t("limsFormulaClear")}
          </Button>
          <div className="flex gap-2">
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={apply}
              disabled={Boolean(problem)}
            >
              {t("limsFormulaApply")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FormulaBuilder;
