import { describe, expect, it } from "vitest";
import { validateComponentRows } from "./componentTypes";

const base = { description: "d" };

describe("validateComponentRows", () => {
  it("accepts a valid set of typed rows", () => {
    expect(
      validateComponentRows([
        {
          ...base,
          name: "TITRE",
          componentId: "TITRE",
          type: "VALUE",
          unit: "mL"
        },
        {
          ...base,
          name: "WEIGHT",
          componentId: "WEIGHT",
          type: "VALUE",
          min: "1",
          max: "2"
        },
        {
          ...base,
          name: "WATER",
          componentId: "WATER",
          type: "CALCULATION",
          formula: "({TITRE} * 5) / {WEIGHT} * 100"
        },
        {
          ...base,
          name: "APP",
          componentId: "APP",
          type: "LIST",
          list: "RATING"
        },
        {
          ...base,
          name: "ID",
          componentId: "ID",
          type: "BOOLEAN",
          option: "BOOLEAN_ANSWERS_COMPLIES_DOES_NOT_COMPLY"
        }
      ])
    ).toBeUndefined();
  });

  it("leaves saved untyped rows alone but needs a Type on new ones", () => {
    expect(
      validateComponentRows([{ id: "x", componentId: "OLD", type: "222" }])
    ).toBeUndefined();
    expect(
      validateComponentRows([{ ...base, name: "NEW", componentId: "NEW" }])
    ).toMatch(/pick a Type/);
  });

  it("rejects bad formulas and references", () => {
    const value = { ...base, name: "A", componentId: "A", type: "VALUE" };
    expect(
      validateComponentRows([
        value,
        {
          ...base,
          name: "C",
          componentId: "C",
          type: "CALCULATION",
          formula: "{C} + 1"
        }
      ])
    ).toMatch(/itself/);
    expect(
      validateComponentRows([
        value,
        {
          ...base,
          name: "C",
          componentId: "C",
          type: "CALCULATION",
          formula: "{B} + 1"
        }
      ])
    ).toMatch(/\{B\} must be/);
    expect(
      validateComponentRows([
        value,
        {
          ...base,
          name: "C",
          componentId: "C",
          type: "CALCULATION",
          formula: "{A}; drop"
        }
      ])
    ).toMatch(/may only use/);
  });

  it("checks ids, limits and per-type requirements", () => {
    expect(
      validateComponentRows([
        { ...base, name: "A", componentId: "A", type: "TEXT" },
        { ...base, name: "A", componentId: "A", type: "TEXT" }
      ])
    ).toMatch(/more than once/);
    expect(
      validateComponentRows([
        { ...base, name: "Assay", componentId: "A", type: "TEXT" },
        { ...base, name: "assay ", componentId: "B", type: "TEXT" }
      ])
    ).toMatch(/name "assay" is used more than once/);
    expect(
      validateComponentRows([
        {
          ...base,
          name: "A",
          componentId: "A",
          type: "VALUE",
          min: "5",
          max: "1"
        }
      ])
    ).toMatch(/Min can't be greater/);
    expect(
      validateComponentRows([
        { ...base, name: "A", componentId: "A", type: "BOOLEAN" }
      ])
    ).toMatch(/answer pair/);
    expect(validateComponentRows([{ componentId: "A", type: "TEXT" }])).toMatch(
      /Name is required/
    );
  });
});
