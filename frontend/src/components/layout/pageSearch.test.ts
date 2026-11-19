import { describe, expect, it } from "vitest";
import type { NavItem } from "./navConfig";
import { flattenNav, searchPages } from "./pageSearch";

const nav = [
  {
    name: "LIMS",
    service: "lims",
    icon: null,
    groups: [
      {
        name: "Lab Setup",
        icon: null,
        subItems: [
          { name: "Stock Items", path: "/lims/stocks" },
          { name: "Stock Batches", path: "/lims/stock-batches" },
          { name: "Inspection Plans", path: "/lims/inspection-plans" }
        ]
      },
      {
        name: "Lab Executions",
        icon: null,
        subItems: [{ name: "Tests", path: "/lims/tests" }]
      }
    ]
  }
] as NavItem[];

const names = (q: string) => searchPages(flattenNav(nav), q).map((p) => p.name);

describe("page search", () => {
  it("labels each page with its service and group", () => {
    expect(flattenNav(nav)[0].context).toBe("LIMS · Lab Setup");
  });

  it("matches by prefix, substring and abbreviation", () => {
    expect(names("insp")).toEqual(["Inspection Plans"]);
    expect(names("batch")).toEqual(["Stock Batches"]);
    expect(names("stk bat")).toEqual(["Stock Batches"]);
  });

  it("ranks prefix matches first and returns nothing for no match", () => {
    expect(names("st")[0]).toBe("Stock Items");
    expect(names("zzz")).toEqual([]);
  });
});
