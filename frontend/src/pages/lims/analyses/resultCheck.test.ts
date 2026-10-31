import { describe, expect, it } from "vitest";
import { limitProblem, typeProblem, statusOf } from "./resultCheck";

describe("typeProblem", () => {
  it("allows only numbers in a Value", () => {
    expect(typeProblem("VALUE", "abc")).toMatch(/not a number/);
    expect(typeProblem("VALUE", "12.5")).toBeNull();
    expect(typeProblem("VALUE", "")).toBeNull();
  });

  it("allows only real dates and times in a Datetime", () => {
    expect(typeProblem("DATETIME", "2026-10-31T14:30")).toBeNull();
    expect(typeProblem("DATETIME", "2026-10-31")).toBeNull();
    expect(typeProblem("DATETIME", "2026-99-99")).toMatch(/not a valid/);
    expect(typeProblem("DATETIME", "2026-02-30")).toMatch(/not a valid/);
    expect(typeProblem("DATETIME", "2026-10-31T25:00")).toMatch(/not a valid/);
  });

  it("allows letters and numbers in Text", () => {
    expect(typeProblem("TEXT", "123")).toBeNull();
    expect(typeProblem("TEXT", "Lot 12")).toBeNull();
  });
});

describe("statusOf", () => {
  const limit = { min: "1", max: "10" };

  it("passes on the boundaries and fails outside them", () => {
    expect(statusOf("VALUE", limit, "1")).toBe("Pass");
    expect(statusOf("VALUE", limit, "10")).toBe("Pass");
    expect(statusOf("VALUE", limit, "0.9")).toBe("Fail");
    expect(statusOf("CALCULATION", limit, "10.1")).toBe("Fail");
  });

  it("works with only a min or only a max", () => {
    expect(statusOf("VALUE", { min: "5" }, "100")).toBe("Pass");
    expect(statusOf("VALUE", { max: "5" }, "6")).toBe("Fail");
  });

  it("treats a min of 0 as a real limit", () => {
    expect(statusOf("VALUE", { min: 0 }, "-1")).toBe("Fail");
  });

  it("compares expected answers", () => {
    expect(statusOf("BOOLEAN", { boolean: "true" }, "false")).toBe("Fail");
    expect(statusOf("LIST", { phrase: "A" }, "A")).toBe("Pass");
    expect(statusOf("TEXT", { text: "Clear" }, "clear ")).toBe("Pass");
  });

  it("reports a value with no limit, whether or not a Specification exists", () => {
    expect(statusOf("VALUE", undefined, "5")).toBe("Report");
    expect(statusOf("VALUE", {}, "5")).toBe("Report");
  });

  it("is Unentered without a value", () => {
    expect(statusOf("VALUE", limit, "")).toBe("Unentered");
    expect(statusOf("VALUE", undefined, " ")).toBe("Unentered");
  });
});

describe("limitProblem", () => {
  it("says which limit was missed", () => {
    expect(limitProblem("VALUE", { max: "10" }, "12")).toBe(
      "12 is above the maximum 10."
    );
    expect(limitProblem("VALUE", { min: "1" }, "0")).toBe(
      "0 is below the minimum 1."
    );
  });
});
