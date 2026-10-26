import { describe, expect, it } from "vitest";
import { computeCalculations, evaluateFormula, formatResult } from "./formula";

const values: Record<string, number> = {
  TITRE: 12.5,
  FACTOR: 0.98,
  WEIGHT: 250
};
const valueOf = (id: string) => values[id] ?? null;

describe("evaluateFormula", () => {
  it("follows operator precedence and parentheses", () => {
    expect(evaluateFormula("2 + 3 * 4", valueOf)).toBe(14);
    expect(evaluateFormula("(2 + 3) * 4", valueOf)).toBe(20);
    expect(evaluateFormula("-2 * -(3)", valueOf)).toBe(6);
  });

  it("substitutes component references", () => {
    expect(
      evaluateFormula("{TITRE} * {FACTOR} / {WEIGHT} * 100", valueOf)
    ).toBeCloseTo(4.9);
  });

  it("returns null for missing inputs, division by zero and bad syntax", () => {
    expect(evaluateFormula("{MISSING} + 1", valueOf)).toBeNull();
    expect(evaluateFormula("1 / 0", valueOf)).toBeNull();
    expect(evaluateFormula("1 +", valueOf)).toBeNull();
    expect(evaluateFormula("(1 + 2", valueOf)).toBeNull();
    expect(evaluateFormula("1 2", valueOf)).toBeNull();
    expect(evaluateFormula("alert(1)", valueOf)).toBeNull();
    expect(evaluateFormula("", valueOf)).toBeNull();
  });
});

describe("formatResult", () => {
  it("drops float noise", () => {
    expect(formatResult(0.1 + 0.2)).toBe("0.3");
    expect(formatResult(4.9)).toBe("4.9");
  });
});

describe("computeCalculations", () => {
  it("computes Calculations that depend on other Calculations", () => {
    const result = computeCalculations([
      { componentId: "A", componentType: "VALUE", value: "10" },
      { componentId: "B", componentType: "VALUE", value: " 4 " },
      {
        componentId: "SUM",
        componentType: "CALCULATION",
        componentFormula: "{A} + {B}"
      },
      {
        componentId: "PCT",
        componentType: "CALCULATION",
        componentFormula: "{SUM} / {A} * 100"
      }
    ]);
    expect(result.get("SUM")).toBe("14");
    expect(result.get("PCT")).toBe("140");
  });

  it("leaves a Calculation empty until its inputs are numbers", () => {
    const result = computeCalculations([
      { componentId: "A", componentType: "VALUE", value: "" },
      {
        componentId: "C",
        componentType: "CALCULATION",
        componentFormula: "{A} * 2"
      }
    ]);
    expect(result.get("C")).toBe("");
  });

  it("does not loop on a cycle", () => {
    const result = computeCalculations([
      {
        componentId: "X",
        componentType: "CALCULATION",
        componentFormula: "{Y}"
      },
      {
        componentId: "Y",
        componentType: "CALCULATION",
        componentFormula: "{X}"
      }
    ]);
    expect(result.get("X")).toBe("");
  });
});
