import { Op } from "sequelize";
import { assertQuery, compileQuery, QueryGroup } from "./entity-query";
import { ENTITY_TABLES } from "../configs/entity-template-catalog";

const table = ENTITY_TABLES.STOCK_BATCH;
const id = "62419de2-b0e4-467a-a5ab-a01589c37572";

describe("assertQuery", () => {
  const ok = (query: unknown) => assertQuery(query as QueryGroup, table);

  it("accepts nested groups of known fields", () => {
    expect(() =>
      ok({
        combinator: "and",
        rules: [
          { field: "statusId", operator: "=", value: id },
          {
            combinator: "or",
            rules: [
              { field: "currentAmount", operator: ">", value: "5" },
              { field: "unit", operator: "contains", value: "mg" }
            ]
          }
        ]
      })
    ).not.toThrow();
  });

  it("allows no rules, meaning every record", () => {
    expect(() => ok({ combinator: "and", rules: [] })).not.toThrow();
  });

  it("rejects fields outside the list", () => {
    expect(() =>
      ok({
        combinator: "and",
        rules: [{ field: "password", operator: "=", value: "x" }]
      })
    ).toThrow(/Pick a field/);
  });

  it("rejects an operator the field type doesn't have", () => {
    expect(() =>
      ok({
        combinator: "and",
        rules: [{ field: "statusId", operator: ">", value: id }]
      })
    ).toThrow(/valid operator/);
  });

  it("rejects bad values", () => {
    const rule = (field: string, operator: string, value: string) => ({
      combinator: "and",
      rules: [{ field, operator, value }]
    });
    expect(() => ok(rule("unit", "=", " "))).toThrow(/enter a value/);
    expect(() => ok(rule("currentAmount", ">", "abc"))).toThrow(/a number/);
    expect(() => ok(rule("statusId", "=", "1 OR 1=1"))).toThrow(
      /from the list/
    );
    expect(() => ok(rule("expiryDate", "before", "soon"))).toThrow(
      /valid date/
    );
  });

  it("limits nesting", () => {
    const leaf = { field: "unit", operator: "=", value: "mg" };
    const deep = {
      combinator: "and",
      rules: [
        {
          combinator: "or",
          rules: [
            {
              combinator: "and",
              rules: [{ combinator: "or", rules: [leaf] }]
            }
          ]
        }
      ]
    };
    expect(() => ok(deep)).toThrow(/levels deep/);
  });
});

describe("compileQuery", () => {
  it("keeps AND / OR nesting", () => {
    const where = compileQuery(
      {
        combinator: "and",
        rules: [
          { field: "unit", operator: "=", value: "mg" },
          {
            combinator: "or",
            rules: [{ field: "currentAmount", operator: ">=", value: "5" }]
          }
        ]
      },
      table
    ) as any;
    expect(where[Op.and][0]).toEqual({ unit: "mg" });
    expect(where[Op.and][1][Op.or][0]).toEqual({
      currentAmount: { [Op.gte]: 5 }
    });
  });

  it("reaches a parent's field through its relation", () => {
    const where = compileQuery(
      {
        combinator: "and",
        rules: [{ field: "stockTypeId", operator: "=", value: id }]
      },
      table
    ) as any;
    expect(where[Op.and][0]).toEqual({ "$stock.stock_type_id$": id });
  });

  it("treats % in contains as plain text", () => {
    const where = compileQuery(
      {
        combinator: "and",
        rules: [{ field: "unit", operator: "contains", value: "5%" }]
      },
      table
    ) as any;
    expect(where[Op.and][0].unit[Op.iLike]).toBe("%5\\%%");
  });
});
