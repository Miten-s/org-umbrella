import { describe, expect, it } from "vitest";
import {
  addRepeat,
  parseSlot,
  runLabel,
  slotKey,
  slotOfPending
} from "./sampleTests";

const avgWt = { id: "tpl-avg", name: "Avg Wt" };

describe("slot keys", () => {
  it("keep the first run keyed by the plain template id", () => {
    expect(slotKey("tpl-avg")).toBe("tpl-avg");
    expect(slotKey("tpl-avg", 1)).toBe("tpl-avg");
    expect(slotKey("tpl-avg", 3)).toBe("tpl-avg#3");
    expect(parseSlot("tpl-avg#3")).toEqual({
      analysisId: "tpl-avg",
      repeatNumber: 3
    });
    expect(parseSlot("tpl-avg")).toEqual({
      analysisId: "tpl-avg",
      repeatNumber: 1
    });
  });
});

describe("addRepeat", () => {
  it("numbers the next run after saved and picked ones", () => {
    const existing = [
      { id: "t1", analysisId: "tpl-avg", repeatNumber: 1, status: "Open" }
    ];
    const first = addRepeat(existing, [], avgWt);
    expect(first.repeatNumber).toBe(2);
    const second = addRepeat(existing, first.pending, avgWt);
    expect(second.repeatNumber).toBe(3);
    expect(second.pending.map(slotOfPending)).toEqual([
      "tpl-avg#2",
      "tpl-avg#3"
    ]);
  });

  it("never reuses a cancelled run's number", () => {
    const existing = [
      { id: "t1", analysisId: "tpl-avg", repeatNumber: 1, status: "Open" },
      { id: "t2", analysisId: "tpl-avg", repeatNumber: 2, status: "Cancelled" }
    ];
    expect(addRepeat(existing, [], avgWt).repeatNumber).toBe(3);
  });
});

describe("runLabel", () => {
  it("numbers runs only once a template has repeats", () => {
    expect(runLabel("Avg Wt")).toBe("Avg Wt");
    expect(runLabel("Avg Wt", 1, true)).toBe("Avg Wt/1");
    expect(runLabel("Avg Wt", 2)).toBe("Avg Wt/2");
  });
});
