import type { LimsPhrase } from "@/pages/lims/phrases/LimsPhrase.types";
import { booleanLabels, type ComponentSpec } from "./componentValue";
import { typeProblem } from "./resultCheck";

type PickLists = { rows: LimsPhrase[] } | undefined;

const entriesOf = (pickLists: PickLists, list?: string | null) =>
  pickLists?.rows.find((row) => row.phrase === list)?.entries ?? [];

/** A stored result as the user reads it: "Pass", a pick-list answer's name, dd-mm-yyyy hh:mm, "99.4 %". */
export const displayValue = (
  spec: ComponentSpec,
  value: string,
  pickLists: PickLists
) => {
  if (!value) return "";
  if (spec.type === "BOOLEAN") {
    const { yes, no } = booleanLabels(spec.option, pickLists);
    return value === "true" ? yes : value === "false" ? no : value;
  }
  if (spec.type === "LIST")
    return (
      entriesOf(pickLists, spec.list).find(
        (entry) => String(entry.phraseEntryId) === value
      )?.name ?? value
    );
  if (spec.type === "DATETIME") {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?/.exec(value);
    return m ? `${m[3]}-${m[2]}-${m[1]}${m[4] ? ` ${m[4]}` : ""}` : value;
  }
  return spec.unit ? `${value} ${spec.unit}` : value;
};

/** Typed or pasted text → what the result stores: "Pass" → "true", a list answer's name → its
 * code, a day-first date (time optional) → YYYY-MM-DD[THH:mm]. `null` means "not a valid answer". */
export const parseValue = (
  spec: ComponentSpec,
  text: string,
  pickLists: PickLists
): string | null => {
  const value = text.trim();
  if (!value) return "";
  if (spec.type === "BOOLEAN") {
    const { yes, no } = booleanLabels(spec.option, pickLists);
    if ([yes.toLowerCase(), "true", "yes"].includes(value.toLowerCase()))
      return "true";
    if ([no.toLowerCase(), "false", "no"].includes(value.toLowerCase()))
      return "false";
    return null;
  }
  if (spec.type === "LIST") {
    const entry = entriesOf(pickLists, spec.list).find(
      (e) =>
        String(e.phraseEntryId) === value ||
        String(e.name ?? "").toLowerCase() === value.toLowerCase()
    );
    return entry ? String(entry.phraseEntryId) : null;
  }
  if (spec.type === "DATETIME") {
    const m =
      /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[ T](\d{1,2}):(\d{2}))?$/.exec(
        value
      );
    const iso = m
      ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` +
        (m[4] ? `T${m[4].padStart(2, "0")}:${m[5]}` : "")
      : value.replace(" ", "T");
    const year = Number(iso.slice(0, 4));
    return !typeProblem("DATETIME", iso) && year >= 1900 && year <= 2100
      ? iso
      : null;
  }
  return typeProblem(spec.type, value) ? null : value;
};
