import type { LimsPhrase } from "@/pages/lims/phrases/LimsPhrase.types";
import { BOOLEAN_ANSWERS_LIST, splitBooleanPair } from "./componentTypes";

/** What a result row knows about its component — a snapshot taken when the test was assigned. */
export interface ComponentSpec {
  type?: string | null;
  /** Pick list code, for LIST. */
  list?: string | null;
  /** BOOLEAN answer pair (a Boolean Answers entry), or a LIST's default answer. */
  option?: string | null;
  unit?: string | null;
  /** CALCULATION formula, e.g. {TITRE} * 100. */
  formula?: string | null;
}

/** Types whose value is entered by hand; the rest are computed or carry no result. */
export const isEnterable = (type?: string | null) =>
  !type || ["VALUE", "LIST", "BOOLEAN", "TEXT", "DATETIME"].includes(type);

/** "Pass" / "Fail" etc. for a BOOLEAN component's stored "true" / "false". */
export const booleanLabels = (
  option: string | null | undefined,
  pickLists: { rows: LimsPhrase[] } | undefined
) => {
  const entry = pickLists?.rows
    .find((list) => list.phrase === BOOLEAN_ANSWERS_LIST)
    ?.entries?.find((e) => String(e.phraseEntryId) === option);
  const [yes, no] = splitBooleanPair(String(entry?.name ?? "")) ?? [
    "Yes",
    "No"
  ];
  return { yes, no };
};
