import { describe, expect, it } from "vitest";
import type { LimsPhrase } from "@/pages/lims/phrases/LimsPhrase.types";
import { splitBooleanPair } from "./componentTypes";
import { booleanLabels } from "./componentValue";
import { displayValue, parseValue } from "./componentValueText";

const pickLists = {
  rows: [
    {
      phrase: "BOOLEAN_ANSWERS",
      name: "Boolean Answers",
      entries: [
        { phraseEntryId: "BOOLEAN_ANSWERS_PASS_FAIL", name: "Pass / Fail" }
      ]
    } as LimsPhrase
  ]
};

describe("splitBooleanPair", () => {
  it("needs exactly two non-empty answers", () => {
    expect(splitBooleanPair(" Present / Absent ")).toEqual([
      "Present",
      "Absent"
    ]);
    expect(splitBooleanPair("Yes")).toBeNull();
    expect(splitBooleanPair("A / B / C")).toBeNull();
    expect(splitBooleanPair("Yes / ")).toBeNull();
  });
});

describe("booleanLabels", () => {
  it("reads the pair from the Boolean Answers pick list", () => {
    expect(booleanLabels("BOOLEAN_ANSWERS_PASS_FAIL", pickLists)).toEqual({
      yes: "Pass",
      no: "Fail"
    });
  });

  it("falls back to Yes / No for an unknown pair", () => {
    expect(booleanLabels("GONE", pickLists)).toEqual({ yes: "Yes", no: "No" });
  });

  it("round-trips a Boolean value through its labels", () => {
    const spec = { type: "BOOLEAN", option: "BOOLEAN_ANSWERS_PASS_FAIL" };
    expect(parseValue(spec, "fail", pickLists)).toBe("false");
    expect(displayValue(spec, "true", pickLists)).toBe("Pass");
  });
});

describe("DATETIME values", () => {
  const spec = { type: "DATETIME" };

  it("parses a day-first date with an optional time", () => {
    expect(parseValue(spec, "7-10-2026", undefined)).toBe("2026-10-07");
    expect(parseValue(spec, "07/10/2026 9:05", undefined)).toBe(
      "2026-10-07T09:05"
    );
    expect(parseValue(spec, "2026-10-07 14:30", undefined)).toBe(
      "2026-10-07T14:30"
    );
  });

  it("rejects impossible times and years", () => {
    expect(parseValue(spec, "07-10-2026 25:00", undefined)).toBeNull();
    expect(parseValue(spec, "07-10-1800", undefined)).toBeNull();
  });

  it("shows dates day-first, with the time when there is one", () => {
    expect(displayValue(spec, "2026-10-07", undefined)).toBe("07-10-2026");
    expect(displayValue(spec, "2026-10-07T09:05", undefined)).toBe(
      "07-10-2026 09:05"
    );
  });
});
