import { test, expect, type Locator, type Page } from "@playwright/test";
import { api, approvedStatusId, dropdown, field, gotoApp } from "./helpers";

/**
 * QA verification of the LIMS change set (items 1, 2, 4–6, 8–16): full CRUD, names instead of
 * ids, and parent/child relationships. Tests marked `test.fail()` pin a known open defect —
 * when one starts passing, Playwright reports it so the marker can be removed.
 */

const QA = `QA-${Date.now().toString(36).toUpperCase()}`;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const PICK_CODE = /\b[A-Z]+_[A-Z_]{2,}\b/;

const modal = (page: Page) =>
  page
    .locator("form")
    .filter({ has: page.locator("h2") })
    .last();

const popup = (page: Page) =>
  page.getByPlaceholder("Search…").last().locator("xpath=../..");

/** Picks from an async dropdown, scoped to the popup so a same-named trigger is never hit. */
const pick = async (
  page: Page,
  trigger: Locator,
  search: string,
  option = search
) => {
  await trigger.click();
  await page.getByPlaceholder("Search…").last().fill(search);
  const escaped = option.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await popup(page)
    .getByRole("button", { name: new RegExp(`^${escaped}`) })
    .first()
    .click();
};

const pickStatic = async (page: Page, trigger: Locator, option: string) => {
  await trigger.click();
  await page.getByText(option, { exact: true }).last().click();
};

/** Filters the grid and waits until its first row is a match (the search is debounced). */
const search = async (page: Page, text: string) => {
  await page.getByPlaceholder(/^Search (?!or type)/i).fill(text);
  await expect(
    page
      .locator('[role=row][row-index="0"]:not(.ag-opacity-zero)')
      .filter({ hasText: text })
      .first()
  ).toBeVisible();
};

/** The first displayed grid row — AG Grid's DOM order doesn't follow display order. */
const firstRow = (page: Page) =>
  page.locator('[role=row][row-index="0"]:not(.ag-opacity-zero)');

/** Saving an edit asks for a reason (GxP audit trail). */
const confirmReason = async (page: Page, reason = "QA verification") => {
  await page.getByPlaceholder("Enter your message").last().fill(reason);
  await page.getByRole("button", { name: "Confirm" }).click();
};

const formText = async (page: Page) =>
  [
    await modal(page).innerText(),
    ...(await modal(page)
      .locator("input, textarea")
      .evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value)))
  ].join("\n");

const expectNoRawIds = async (page: Page) => {
  const text = await formText(page);
  expect(text, "a raw UUID is shown").not.toMatch(UUID);
  expect(text, "a pick-list code is shown").not.toMatch(PICK_CODE);
};

const serverErrors: string[] = [];
test.beforeEach(async ({ page, request }) => {
  lims = api(request);
  page.on("response", (r) => {
    if (r.status() >= 500) serverErrors.push(`${r.status()} ${r.url()}`);
  });
});
test.afterAll(() => {
  expect(serverErrors, "no 5xx during the run").toEqual([]);
});

let lims: ReturnType<typeof api>;
let approved: string;
let allTypes: { id: string; name: string };
let phTpl: { id: string; name: string };
let group: { id: string; name: string };

test.beforeAll(async ({ request }) => {
  lims = api(request);
  approved = await approvedStatusId(lims);
  allTypes = await lims.post("/lims-analyses", {
    analysisId: `${QA}-TT1`,
    name: `${QA} All Types`,
    approvalStatus: approved,
    components: [
      {
        componentId: "V1",
        name: "Assay",
        description: "a",
        type: "VALUE",
        unit: "mg/mL",
        min: "98",
        max: "102"
      },
      {
        componentId: "C1",
        name: "Double",
        description: "c",
        type: "CALCULATION",
        unit: "mg/mL",
        formula: "{V1} * 2"
      },
      {
        componentId: "L1",
        name: "Appearance",
        description: "l",
        type: "LIST",
        list: "RATING",
        option: "RATING_PREFERRED"
      },
      {
        componentId: "B1",
        name: "Identity",
        description: "b",
        type: "BOOLEAN",
        option: "PASS_FAIL"
      },
      { componentId: "T1", name: "Remark", description: "t", type: "TEXT" },
      { componentId: "D1", name: "When", description: "d", type: "DATETIME" }
    ]
  });
  phTpl = await lims.post("/lims-analyses", {
    analysisId: `${QA}-TT2`,
    name: `${QA} pH`,
    approvalStatus: approved,
    components: [
      {
        componentId: "PH",
        name: "pH",
        description: "p",
        type: "VALUE",
        unit: "pH",
        min: "6.5",
        max: "7.5"
      }
    ]
  });
  group = await lims.post("/lims-test-groups", {
    testGroupId: `${QA}-TG`,
    name: `${QA} Group`,
    tests: [{ analysisId: allTypes.id }, { analysisId: phTpl.id }]
  });
});

test.describe("1 · GXP Assignment Groups", () => {
  test("create with a free-form name, edit, view shows names", async ({
    page
  }) => {
    await gotoApp(page, "/gxp-service/assignment-groups");
    await page.getByRole("button", { name: /Create Assignment Group/ }).click();
    await field(modal(page), "Group Name").fill(`${QA} any name / 123`);
    await dropdown(modal(page), "Manager").click();
    const manager = await popup(page).getByRole("button").first().innerText();
    await popup(page).getByRole("button").first().click();
    await modal(page).getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();

    await page.getByPlaceholder(/Search assignment groups/).fill(QA);
    await firstRow(page)
      .getByRole("button", { name: "Edit assignment group" })
      .click();
    await field(modal(page), "Group Name").fill(`${QA} renamed`);
    await modal(page).getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/updated successfully/i).first()).toBeVisible();

    await page
      .getByPlaceholder(/Search assignment groups/)
      .fill(`${QA} renamed`);
    await firstRow(page)
      .getByRole("button", { name: "View assignment group" })
      .click();
    await expect(modal(page)).toContainText(manager);
    await expectNoRawIds(page);
  });
});

test.describe("2 · Lab Users: Location", () => {
  test("list column and view say Location and show a name", async ({
    page
  }) => {
    await gotoApp(page, "/lims/users");
    await expect(
      page.getByRole("columnheader", { name: "Location", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: /Storage Location/ })
    ).toHaveCount(0);
    const grid = await page.getByRole("grid").innerText();
    expect(grid).not.toMatch(UUID);
    await firstRow(page).getByRole("button", { name: /^View/ }).click();
    await expect(
      modal(page).locator("label", { hasText: /^Location$/ })
    ).toBeVisible();
    await expectNoRawIds(page);
  });
});

test.describe("4 · Projects: unique code + copy suffix", () => {
  test("edit to an existing code (other case) is rejected; copy suffixes -(1)", async ({
    page
  }) => {
    const a = await lims.post("/lims-projects", {
      projectId: `${QA}-PA`,
      name: `${QA} Project A`,
      code: `${QA}-CODE`
    });
    await lims.post("/lims-projects", {
      projectId: `${QA}-PB`,
      name: `${QA} Project B`,
      code: `${QA}-OTHER`
    });

    await gotoApp(page, "/lims/projects");
    await search(page, `${QA} Project B`);
    await firstRow(page).getByRole("button", { name: /^Edit/ }).click();
    await field(modal(page), "Code").fill(` ${QA.toLowerCase()}-code `);
    await modal(page).getByRole("button", { name: "Save" }).click();
    await confirmReason(page);
    await expect(page.getByText(/already exists/i).first()).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).last().click();

    await search(page, `${QA} Project A`);
    await firstRow(page).getByRole("checkbox").click();
    await page.getByRole("button", { name: /^Copy$/ }).click();
    await modal(page).getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText(`saved as "${QA}-CODE-(1)"`).first()
    ).toBeVisible();
    const rows = await lims.get(
      `/lims-projects?search=${encodeURIComponent(`${QA} Project A`)}&limit=10`
    );
    expect(rows.map((r: { code: string }) => r.code).sort()).toEqual([
      `${QA}-CODE`,
      `${QA}-CODE-(1)`
    ]);
    expect(a.id).toBeTruthy();
  });

  test.fail(
    "known defect: a rejected edit keeps the form open with the user's changes",
    async ({ page }) => {
      await lims.post("/lims-projects", {
        projectId: `${QA}-PD`,
        name: `${QA} Project D`,
        code: `${QA}-TAKEN`
      });
      await lims.post("/lims-projects", {
        projectId: `${QA}-PC`,
        name: `${QA} Project C`,
        code: `${QA}-C`
      });
      await gotoApp(page, "/lims/projects");
      await search(page, `${QA} Project C`);
      await firstRow(page).getByRole("button", { name: /^Edit/ }).click();
      await field(modal(page), "Code").fill(`${QA}-TAKEN`);
      await modal(page).getByRole("button", { name: "Save" }).click();
      await confirmReason(page);
      await expect(page.getByText(/already exists/i).first()).toBeVisible();
      await expect(
        page.getByRole("heading", { name: /Update Project/ })
      ).toBeVisible({ timeout: 3000 });
    }
  );
});

test.describe("5/6 · Stock Items: unit + amounts", () => {
  test("unit picked from the UNIT list shows on list/edit; one-sided amount edits validated", async ({
    page,
    request
  }) => {
    await gotoApp(page, "/lims/stocks");
    await page.getByRole("button", { name: /Create Stock Item/ }).click();
    await field(modal(page), "Stock ID").fill(`${QA}-STK`);
    await field(modal(page), "Stock name").fill(`${QA} Stock`);
    await pick(page, dropdown(modal(page), "Unit"), "mg/mL");
    await field(modal(page), "Target amount").fill("100");
    await field(modal(page), "Low amount").fill("20");
    await field(modal(page), "Low percentage").fill("10");
    await modal(page).getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();

    await search(page, `${QA} Stock`);
    await expect(firstRow(page).first()).toContainText("mg/mL");
    await firstRow(page).getByRole("button", { name: /^Edit/ }).click();
    await expect(dropdown(modal(page), "Unit")).toContainText("mg/mL");
    await field(modal(page), "Low amount").fill("150");
    await modal(page).getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByText("Low amount must be less than the target amount")
    ).toBeVisible();

    const [stock] = await lims.get(
      `/lims-stocks?search=${encodeURIComponent(`${QA} Stock`)}&limit=1`
    );
    const res = await request.patch(`/lims/v1/api/lims-stocks/${stock.id}`, {
      headers: {
        Authorization: await page.evaluate(
          () => `Bearer ${localStorage.getItem("auth_access_token")}`
        )
      },
      data: { targetAmount: 10, changeReason: "qa" }
    });
    expect(res.status()).toBe(400);
  });

  test("UNIT pick list has 47 entries", async () => {
    const rows = await lims.get("/lims-phrases/entries?phrase=UNIT&limit=100");
    const list = Array.isArray(rows) ? rows : (rows.entries ?? rows.data);
    expect(list).toHaveLength(47);
  });
});

test.describe("8 · Instruments show their calibrations", () => {
  test("read-only table with names and Overdue / Due soon / In date", async ({
    page
  }) => {
    const inst = await lims.post("/lims-instruments", {
      instrumentId: `${QA}-INS`,
      name: `${QA} HPLC`
    });
    const soon = new Date(Date.now() + 5 * 86_400_000)
      .toISOString()
      .slice(0, 10);
    await lims.post("/lims-calibrations", {
      calibrationName: `${QA} overdue`,
      instrument: inst.id,
      nextMaintenanceDate: "2020-01-01"
    });
    await lims.post("/lims-calibrations", {
      calibrationName: `${QA} soon`,
      instrument: inst.id,
      nextMaintenanceDate: soon,
      leadTimeValue: 10,
      leadTimeUnit: "Day"
    });
    await lims.post("/lims-calibrations", {
      calibrationName: `${QA} later`,
      instrument: inst.id,
      nextMaintenanceDate: "2099-01-01"
    });

    await gotoApp(page, "/lims/calibrations");
    await search(page, `${QA} overdue`);
    await expect(firstRow(page).first()).toContainText(`${QA} HPLC`);

    await gotoApp(page, "/lims/instruments");
    await search(page, `${QA} HPLC`);
    await firstRow(page).getByRole("button", { name: /^Edit/ }).click();
    const form = modal(page);
    for (const h of [
      "Calibration ID",
      "Calibration name",
      "Calibration type",
      "Plan",
      "Status",
      "Last done",
      "Next due"
    ])
      await expect(
        form.locator("th", { hasText: new RegExp(`^${h}$`, "i") }).first()
      ).toBeVisible();
    const row = (name: string) => form.locator("tr", { hasText: name });
    await expect(row(`${QA} overdue`)).toContainText("Overdue");
    await expect(row(`${QA} soon`)).toContainText("Due soon");
    await expect(row(`${QA} later`)).toContainText("In date");
    await expect(row(`${QA} later`).locator("input, button")).toHaveCount(0);
    await expectNoRawIds(page);
  });
});

test.describe("9 · Inspection Plan personnel", () => {
  test("Person or Lab Role only; switching clears; saved plan shows names", async ({
    page
  }) => {
    await gotoApp(page, "/lims/inspection-plans");
    await page.getByRole("button", { name: /Create Inspection Plan/ }).click();
    await field(modal(page), "Inspection ID").fill(`${QA}-IP`);
    await field(modal(page), "Name").fill(`${QA} Plan`);
    const f = modal(page);
    await f.getByRole("button", { name: /Add row/i }).click();
    await f.getByRole("button", { name: /Add row/i }).click();
    const cell = (i: number, label: string) =>
      f
        .locator("div.min-w-0")
        .filter({
          has: page.locator(":scope > span", {
            hasText: new RegExp(`^${label}$`)
          })
        })
        .nth(i)
        .locator("button")
        .first();
    const firstOption = async () => {
      const o = popup(page).getByRole("button").first();
      const name = await o.innerText();
      await o.click();
      await f.locator("h2").click();
      return name;
    };

    await pickStatic(page, cell(0, "Entry type"), "Person");
    await cell(0, "Person").click();
    const person = await firstOption();
    await pickStatic(page, cell(0, "Entry type"), "Lab Role");
    await expect(cell(0, "Person")).toBeDisabled();
    await expect(cell(0, "Person")).not.toContainText(person);
    await pickStatic(page, cell(0, "Entry type"), "Person");
    await cell(0, "Person").click();
    await firstOption();
    await pickStatic(page, cell(1, "Entry type"), "Lab Role");
    await cell(1, "Lab Role").click();
    const role = await firstOption();
    await f.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();

    const [plan] = await lims.get(
      `/lims-inspection-plans?search=${encodeURIComponent(`${QA} Plan`)}&limit=1`
    );
    const detail = await lims.get(`/lims-inspection-plans/${plan.id}`);
    const rows = detail.personnel.map(
      (p: { personId: string | null; roleId: string | null }) => [
        !!p.personId,
        !!p.roleId
      ]
    );
    expect(rows).toEqual(
      expect.arrayContaining([
        [true, false],
        [false, true]
      ])
    );

    await search(page, `${QA} Plan`);
    await firstRow(page).getByRole("button", { name: /^View/ }).click();
    await expect(modal(page)).toContainText(person);
    await expect(modal(page)).toContainText(role);
    await expectNoRawIds(page);
  });
});

test.describe("10/11 · Test Templates", () => {
  test("saved components re-display names on edit and view", async ({
    page
  }) => {
    await gotoApp(page, "/lims/analyses");
    await search(page, allTypes.name);
    for (const mode of [/^View/, /^Edit/]) {
      await firstRow(page).getByRole("button", { name: mode }).click();
      const f = modal(page);
      for (const text of [
        "mg/mL",
        "Rating",
        "Preferred",
        "Pass / Fail",
        "Calculation",
        "Datetime"
      ])
        await expect(f.getByText(text, { exact: true }).first()).toBeVisible();
      await expect(f.getByLabel("Formula")).toHaveValue("{V1} * 2");
      await expectNoRawIds(page);
      await f.getByRole("button", { name: "Cancel" }).click();
    }
  });

  test("API rejects cycles, bad refs, missing description, untyped rows", async () => {
    const bad = [
      [
        {
          componentId: "A",
          name: "A",
          description: "a",
          type: "CALCULATION",
          formula: "{B}+1"
        },
        {
          componentId: "B",
          name: "B",
          description: "b",
          type: "CALCULATION",
          formula: "{A}*2"
        }
      ],
      [
        { componentId: "A", name: "A", description: "a", type: "TEXT" },
        {
          componentId: "B",
          name: "B",
          description: "b",
          type: "CALCULATION",
          formula: "{A}*2"
        }
      ],
      [{ componentId: "A", name: "A", type: "VALUE" }],
      [{ componentId: "A", name: "A", description: "a" }]
    ];
    for (const components of bad) {
      const res = await lims.raw("/lims-analyses", {
        name: `${QA} bad`,
        components
      });
      expect(res.status()).toBe(400);
    }
  });

  test.fail(
    "known defect: component IDs differing only by case are accepted",
    async () => {
      const res = await lims.raw("/lims-analyses", {
        name: `${QA} case dup`,
        components: [
          { componentId: "A", name: "A", description: "a", type: "TEXT" },
          { componentId: "a", name: "a", description: "a", type: "TEXT" }
        ]
      });
      expect(res.status()).toBe(400);
    }
  );

  test("Lab Role permissions say 'Test Templates', not 'Analysis'", async ({
    page
  }) => {
    await gotoApp(page, "/lims/roles");
    await firstRow(page).getByRole("button", { name: /^View/ }).click();
    await expect(
      modal(page)
        .getByText(/Test Template/)
        .first()
    ).toBeVisible({ timeout: 3000 });
    await expect(modal(page).getByText("All Analysis")).toHaveCount(0);
    await expect(modal(page).getByText("All All")).toHaveCount(0);
  });

  test("audit trail opens for a template", async ({ page }) => {
    await gotoApp(page, "/lims/analyses");
    await search(page, allTypes.name);
    await firstRow(page)
      .getByRole("button", { name: /More actions/ })
      .click();
    await page.getByText("Audit trail", { exact: true }).last().click();
    await expect(page.getByText(/Audit trail —/)).toBeVisible();
    await expect(page.getByText("CREATE").first()).toBeVisible();
  });
});

test.describe("12 · Test Groups", () => {
  test("names in list/view; duplicates and non-Approved rejected", async ({
    page
  }) => {
    const draft = await lims.post("/lims-analyses", {
      name: `${QA} Draft`,
      components: [
        { componentId: "X", name: "X", description: "x", type: "TEXT" }
      ]
    });
    expect(
      (
        await lims.raw("/lims-test-groups", {
          name: `${QA} bad`,
          tests: [{ analysisId: draft.id }]
        })
      ).status()
    ).toBe(400);
    expect(
      (
        await lims.raw("/lims-test-groups", {
          name: `${QA} bad`,
          tests: [{ analysisId: phTpl.id }, { analysisId: phTpl.id }]
        })
      ).status()
    ).toBe(400);

    await gotoApp(page, "/lims/test-groups");
    await search(page, group.name);
    const row = firstRow(page).first();
    await expect(row).toContainText(allTypes.name);
    await expect(row).toContainText(phTpl.name);
    await firstRow(page).getByRole("button", { name: /^View/ }).click();
    await expect(modal(page)).toContainText(allTypes.name);
    await expect(modal(page)).toContainText(phTpl.name);
    await expectNoRawIds(page);
  });
});

test.describe("13 · Specifications", () => {
  test("template then group (skips duplicates); limits by type; re-opens with names", async ({
    page
  }) => {
    await gotoApp(page, "/lims/specifications");
    await page.getByRole("button", { name: /Create Specification/ }).click();
    await field(modal(page), "Spec ID").fill(`${QA}-SPEC`);
    await field(modal(page), "Name").fill(`${QA} Spec`);
    const add = modal(page).getByRole("button", {
      name: /Search Test Templates or Test Groups/i
    });
    await pick(page, add, QA, allTypes.name);
    await pick(page, add, QA, group.name);
    const f = modal(page);
    await expect(f.getByText("Acceptable answer")).toBeVisible();
    await expect(f.getByText("Expected answer")).toBeVisible();
    await expect(f.getByLabel("Expected text")).toBeVisible();
    await expect(f.getByLabel("Min").first()).toHaveValue("98");
    await expect(f.getByText("pH", { exact: true }).first()).toBeVisible();
    await expect(f.getByText("Assay", { exact: true })).toHaveCount(1);
    await f.getByLabel("Min").first().fill("97");
    await f.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();

    await search(page, `${QA} Spec`);
    await expect(firstRow(page).first()).toContainText("7");
    await firstRow(page).getByRole("button", { name: /^View/ }).click();
    await expect(modal(page).getByLabel("Min").first()).toHaveValue("97");
    await expect(modal(page)).toContainText(allTypes.name);
    await expect(modal(page)).toContainText(phTpl.name);
    await expect(modal(page)).toContainText("Preferred");
    await expectNoRawIds(page);
  });
});

test.describe("14/15/16 · Sample Templates, Samples, Tests, Batches, Lots", () => {
  let tpl: { id: string; name: string };

  test("Sample Template: create in UI, view, copy, remove + restore", async ({
    page
  }) => {
    await gotoApp(page, "/lims/sample-templates");
    await page.getByRole("button", { name: /Create Sample Template/ }).click();
    await field(modal(page), "Sample Template ID").fill(`${QA}-ST`);
    await field(modal(page), "Name").fill(`${QA} Sample Template`);
    await field(modal(page), "Lot number").fill(`${QA}-LOT`);
    await field(modal(page), "Login by").fill("QA Analyst");
    await modal(page)
      .locator("div")
      .filter({ has: page.locator(":scope > label", { hasText: /^Comments/ }) })
      .last()
      .locator("textarea")
      .fill("QA comments");
    await pick(
      page,
      modal(page).getByRole("button", {
        name: /Search Test Templates or Test Groups/i
      }),
      QA,
      group.name
    );
    await modal(page).getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();

    await search(page, `${QA} Sample Template`);
    const row = firstRow(page).first();
    await expect(row).toContainText(allTypes.name);
    await expect(row).toContainText(phTpl.name);
    [tpl] = await lims.get(
      `/lims-sample-templates?search=${encodeURIComponent(`${QA}-ST`)}&limit=1`
    );

    await row.getByRole("checkbox").click();
    await page.getByRole("button", { name: /^Copy$/ }).click();
    await modal(page).getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/copied successfully/i).first()).toBeVisible();

    // The copy shares the original's name, so address it by its own generated ID — with two
    // same-named rows, which one sorts first is arbitrary.
    const copies = await lims.get(
      `/lims-sample-templates?search=${encodeURIComponent(`${QA} Sample Template`)}&limit=10`
    );
    const copyId = copies.find(
      (row: { sampleTemplateId: string }) => row.sampleTemplateId !== `${QA}-ST`
    ).sampleTemplateId;
    await search(page, copyId);
    await firstRow(page)
      .getByRole("button", { name: /More actions/ })
      .click();
    await page.getByText("Remove", { exact: true }).last().click();
    await confirmReason(page, "QA remove");
    await page.getByText(/Show removed/).click();
    await search(page, copyId);
    await firstRow(page)
      .getByRole("button", { name: /More actions/ })
      .click();
    await page.getByText("Restore", { exact: true }).last().click();
    await confirmReason(page, "QA restore");
    await expect(
      page.getByText(/restored successfully/i).first()
    ).toBeVisible();
  });

  test("2 samples from the template: prefilled, unique IDs, tests + components", async ({
    page
  }) => {
    await gotoApp(page, "/lims/samples");
    await page.getByRole("button", { name: /Create Sample$/ }).click();
    await page.getByLabel(/Number of Samples/i).fill("11");
    await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
    await page.getByLabel(/Number of Samples/i).fill("2");
    await pick(
      page,
      page.getByRole("button", { name: /Select Sample Template/i }),
      `${QA} Sample`,
      tpl.name
    );
    await page.getByRole("button", { name: "Continue" }).click();
    for (let i = 1; i <= 2; i += 1) {
      await expect(field(modal(page), "Lot number")).toHaveValue(`${QA}-LOT`);
      await expect(field(modal(page), "Login by")).toHaveValue("QA Analyst");
      await expect(modal(page)).toContainText(phTpl.name);
      await field(modal(page), "Sample name").fill(`${QA} Sample ${i}`);
      if (i < 2)
        await modal(page).getByRole("button", { name: "Next" }).click();
    }
    await page.getByRole("button", { name: /Save all/i }).click();
    await expect(
      page.getByText(/2 samples created successfully/i)
    ).toBeVisible();

    const rows = await lims.get(
      `/lims-samples?search=${encodeURIComponent(`${QA} Sample`)}&limit=10`
    );
    expect(
      new Set(rows.map((r: { sampleId: string }) => r.sampleId)).size
    ).toBe(2);
    const detail = await lims.get(`/lims-samples/${rows[0].id}`);
    expect(
      detail.tests.map((t: { testName: string }) => t.testName).sort()
    ).toEqual([allTypes.name, phTpl.name].sort());
    const ph = detail.tests.find(
      (t: { testName: string }) => t.testName === phTpl.name
    );
    expect(ph.testId).toMatch(/^TST-/);
    expect(ph.components[0]).toMatchObject({ componentName: "pH", unit: "pH" });

    await gotoApp(page, "/lims/tests");
    await search(page, ph.testId);
    const testRow = firstRow(page).first();
    await expect(testRow).toContainText(detail.sampleName);
    await expect(testRow).toContainText(phTpl.name);
  });

  test("copy one sample into 2 carries its tests with new IDs", async ({
    page
  }) => {
    await gotoApp(page, "/lims/samples");
    await search(page, `${QA} Sample 1`);
    await firstRow(page).getByRole("checkbox").click();
    await page.getByRole("button", { name: /^Copy$/ }).click();
    await page.getByLabel(/Number of copies/i).fill("2");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(modal(page)).toContainText(phTpl.name);
    await page.getByRole("button", { name: /Save all/i }).click();
    await expect(
      page.getByText(/2 records copied successfully/i)
    ).toBeVisible();
    const rows = await lims.get(
      `/lims-samples?search=${encodeURIComponent(`${QA} Sample 1`)}&limit=10`
    );
    expect(rows).toHaveLength(3);
    const testIds = new Set<string>();
    for (const r of rows)
      for (const t of (await lims.get(`/lims-samples/${r.id}`)).tests)
        testIds.add(t.testId);
    expect(testIds.size).toBe(6);
  });

  test("copying a Lot keeps the original lot's samples", async ({ page }) => {
    const sample = await lims.post("/lims-samples", {
      sampleName: `${QA} Lot Sample`
    });
    const lot = await lims.post("/lims-lots", {
      lotId: `${QA}-LOT1`,
      lotName: `${QA} Lot`,
      samples: [sample.id]
    });
    await gotoApp(page, "/lims/lots");
    await search(page, `${QA}-LOT1`);
    await firstRow(page).getByRole("checkbox").click();
    await page.getByRole("button", { name: /^Copy$/ }).click();
    await page.getByLabel(/Number of copies/i).fill("1");
    await page.getByRole("button", { name: "Continue" }).click();
    await modal(page).getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/copied successfully/i).first()).toBeVisible();
    const after = await lims.get(`/lims-samples/${sample.id}`);
    expect(after.lotId ?? after.lot?.id).toBe(lot.id);
  });

  test("copying a Batch keeps the original batch's lots", async ({ page }) => {
    const lot = await lims.post("/lims-lots", { lotName: `${QA} Batch Lot` });
    const batch = await lims.post("/lims-batches", {
      batchId: `${QA}-BAT1`,
      batchName: `${QA} Batch`,
      lots: [lot.id]
    });
    await gotoApp(page, "/lims/batches");
    await search(page, `${QA}-BAT1`);
    await firstRow(page).getByRole("checkbox").click();
    await page.getByRole("button", { name: /^Copy$/ }).click();
    await page.getByLabel(/Number of copies/i).fill("1");
    await page.getByRole("button", { name: "Continue" }).click();
    await modal(page).getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(/copied successfully/i).first()).toBeVisible();
    const after = await lims.get(`/lims-lots/${lot.id}`);
    expect(after.batchId ?? after.batch?.id).toBe(batch.id);
  });

  test("a bulk save can't take a lot that belongs to another batch", async () => {
    const lot = await lims.post("/lims-lots", { lotName: `${QA} Owned Lot` });
    await lims.post("/lims-batches", {
      batchName: `${QA} Owner`,
      lots: [lot.id]
    });
    const res = await lims.raw("/lims-batches/bulk-copy", {
      records: [{ batchName: `${QA} Thief`, lots: [lot.id] }]
    });
    expect(res.status()).toBe(400);
  });
});
