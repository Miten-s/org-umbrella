import { BOOLEAN_OPTIONS } from "./componentTypes";

/** What a result row knows about its component — a snapshot taken when the test was assigned. */
export interface ComponentSpec {
  type?: string | null;
  /** Pick list code, for LIST. */
  list?: string | null;
  /** BOOLEAN wording (e.g. PASS_FAIL), or a LIST's default answer. */
  option?: string | null;
  unit?: string | null;
}

/** Types whose value is entered by hand; the rest are computed or carry no result. */
export const isEnterable = (type?: string | null) =>
  !type || ["VALUE", "LIST", "BOOLEAN", "TEXT", "DATETIME"].includes(type);

/** "Pass" / "Fail" etc. for a BOOLEAN component's stored "true" / "false". */
export const booleanLabels = (option?: string | null) => {
  const [yes, no] = (
    BOOLEAN_OPTIONS.find((o) => o.value === option)?.label ?? "Yes / No"
  ).split(" / ");
  return { yes, no };
};
