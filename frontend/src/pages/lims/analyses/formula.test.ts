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

describe("formula functions", () => {
  const ev = (f: string) => evaluateFormula(f, valueOf);
  it("aggregates and rounds", () => {
    expect(ev("Sum(10, 20, 30)")).toBe(60);
    expect(ev("Avg(10, 20, 30)")).toBe(20);
    expect(ev("Round(12.567, 2)")).toBe(12.57);
    expect(ev("Pow(2, 3) + Sqrt(25)")).toBe(13);
    expect(ev("Avg({TITRE}, {WEIGHT})")).toBeCloseTo(131.25);
  });
  it("supports scientific and statistical functions", () => {
    expect(ev("Factorial(5)")).toBe(120);
    expect(ev("Log10(1000)")).toBeCloseTo(3);
    expect(ev("Median(1, 9, 3)")).toBe(3);
    expect(ev("Mode(1, 2, 2, 3)")).toBe(2);
    expect(ev("StdDev(2, 4, 4, 4, 5, 5, 7, 9)")).toBeCloseTo(2.138, 3);
    expect(ev("Quartile(1, 2, 3, 4, 5, 2)")).toBe(3);
    expect(ev("Correlation(1, 2, 3, 2, 4, 6)")).toBeCloseTo(1);
    expect(ev("WeightedAvg(10, 20, 1, 3)")).toBe(17.5);
  });
  it("supports logic, with missing inputs and errors handled", () => {
    expect(ev("If(Avg(1, 3) >= 2, 10, 20)")).toBe(10);
    expect(ev("IfError(10 / 0, 0)")).toBe(0);
    expect(ev("Coalesce({MISSING}, 7)")).toBe(7);
    expect(ev("If(IsNull({MISSING}), 1, 2)")).toBe(1);
    expect(ev('SumIf(1, 5, 10, ">4")')).toBe(15);
    expect(ev('CountIf(1, 5, 10, ">4")')).toBe(2);
    expect(ev("And(1 > 0, Not(0 > 1))")).toBe(1);
  });
  it("supports text and dates", () => {
    expect(ev('Length(Concat("ab", "cd"))')).toBe(4);
    expect(ev('Contains(Upper("abc"), "B")')).toBe(1);
    expect(ev('DaysBetween("2026-01-01", "2026-01-11")')).toBe(10);
    expect(ev('Year("2026-06-15")')).toBe(2026);
    expect(ev('DateDiff("2026-01-15", "2026-04-15", "months")')).toBe(3);
  });
  it("rejects unknown functions and wrong argument counts", () => {
    expect(ev("Foo(1)")).toBeNull();
    expect(ev("Abs()")).toBeNull();
    expect(ev("Sqrt(-1)")).toBeNull();
  });
});
