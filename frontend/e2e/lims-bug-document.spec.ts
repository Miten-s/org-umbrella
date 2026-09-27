import { test, expect, type Page } from "@playwright/test";
import {
  RUN,
  api,
  createApprovedTemplate,
  dropdown,
  field,
  gotoApp,
  openCreate,
  pickAsync,
  pickStatic
} from "./helpers";

/**
 * One block per item in bug/LIMS_24_Sept_Updated.docx. Items 3 and 7 are not built yet and
 * are marked `fixme`, so the report shows them as pending rather than passing.
 */

const modal = (page: Page) =>
  page
    .locator("form")
    .filter({ has: page.locator("h2") })
    .last();

const save = (page: Page) =>
  modal(page)
    .getByRole("button", { name: /^Save$/ })
    .click();

let template: { id: string; name: string };
let draftTemplate: { id: string; name: string };
let testGroup: { id: string; name: string };

test.beforeAll(async ({ request }) => {
  const lims = api(request);
  template = await createApprovedTemplate(lims, `${RUN} Assay Template`);
  draftTemplate = await lims.post("/lims-analyses", {
    name: `${RUN} Draft Template`,
    components: [
      { componentId: "X", name: "X", description: "x", type: "TEXT" }
    ]
  });
  testGroup = await lims.post("/lims-test-groups", {
    name: `${RUN} Release Panel`,
    tests: [{ analysisId: template.id, sortOrder: 0 }]
  });
});

test.describe("1 · Assignment Group name format", () => {
  test("accepts a free-form group name", async ({ page }) => {
    await openCreate(
      page,
      "/gxp-service/assignment-groups",
      "Assignment Group"
    );
    const name = field(modal(page), "Group Name");
    await name.fill(`e2e group ${RUN.toLowerCase()}`);
    await save(page);
    await expect(page.getByText(/must follow format/i)).toHaveCount(0);
    await expect(page.getByText("Format: RD-APP-GXP-BUS-ADMIN")).toHaveCount(0);
  });
});

test.describe("2 · Lab User location label", () => {
  test("shows 'Location', not 'Storage Location'", async ({ page }) => {
    await openCreate(page, "/lims/users", "Lab User");
    await expect(
      modal(page).locator("label", { hasText: /^Location$/ })
    ).toBeVisible();
    await expect(
      modal(page).locator("label", { hasText: "Storage Location" })
    ).toHaveCount(0);
  });
});

test.describe("3 · Bulk Edit/View as one table", () => {
  test.fixme("not built yet — pending", async () => {});
});

test.describe("4 · Project code is unique", () => {
  test("rejects a second project with the same code", async ({
    page,
    request
  }) => {
    const code = `${RUN}-CODE`;
    await api(request).post("/lims-projects", {
      name: `${RUN} Project A`,
      code
    });
    await openCreate(page, "/lims/projects", "Project");
    await field(modal(page), "Project ID").fill(`${RUN}-P2`);
    await field(modal(page), "Name").fill(`${RUN} Project B`);
    await field(modal(page), "Code").fill(code.toLowerCase());
    await save(page);
    await expect(page.getByText(/already exists/i).first()).toBeVisible();
  });
});

test.describe("5 · Stock Item unit from pick list", () => {
  test("Unit is a dropdown of pharma units", async ({ page }) => {
    await openCreate(page, "/lims/stocks", "Stock Item");
    await dropdown(modal(page), "Unit").click();
    await page.getByPlaceholder("Search…").last().fill("mg/mL");
    await expect(page.getByRole("button", { name: "mg/mL" })).toBeVisible();
  });
});

test.describe("6 · Stock Item amounts", () => {
  test("blocks % over 100 and low amount ≥ target", async ({ page }) => {
    await openCreate(page, "/lims/stocks", "Stock Item");
    await field(modal(page), "Stock ID").fill(`${RUN}-STK`);
    await field(modal(page), "Stock name").fill(`${RUN} Stock`);
    await field(modal(page), "Target amount").fill("100");
    await field(modal(page), "Low amount").fill("150");
    await field(modal(page), "Low percentage").fill("150");
    await save(page);
    await expect(
      page.getByText("Low amount must be less than the target amount")
    ).toBeVisible();
    await expect(
      page.getByText("Low percentage must be between 0 and 100")
    ).toBeVisible();
  });

  test("the API answers 400 (not a server error) for % over 100", async ({
    request
  }) => {
    const res = await api(request).raw("/lims-stocks", {
      stockName: `${RUN} Stock API`,
      lowPercentage: 150
    });
    expect(res.status()).toBe(400);
  });
});

test.describe("7 · Stock Batch consumption window", () => {
  test.fixme("not built yet — pending", async () => {});
});

test.describe("8 · Calibrations on the Instrument", () => {
  test("instrument view lists its calibrations", async ({ page, request }) => {
    const lims = api(request);
    const instrument = await lims.post("/lims-instruments", {
      name: `${RUN} HPLC`
    });
    await lims.post("/lims-calibrations", {
      calibrationName: `${RUN} Annual calibration`,
      instrument: instrument.id,
      nextMaintenanceDate: "2020-01-01"
    });
    await gotoApp(page, "/lims/instruments");
    await page.getByPlaceholder(/^Search (?!or type)/i).fill(`${RUN} HPLC`);
    await page
      .getByRole("row", { name: new RegExp(`${RUN} HPLC`) })
      .getByRole("checkbox")
      .check();
    // The bulk bar's View (row-level View buttons carry an aria-label; this one doesn't).
    await page
      .locator("button:not([aria-label])", { hasText: /^View$/ })
      .click();
    await expect(page.getByText(`${RUN} Annual calibration`)).toBeVisible();
    await expect(page.getByText("Overdue").first()).toBeVisible();
  });
});

test.describe("9 · Inspection Plan: Person or Lab Role", () => {
  test("picking one disables the other", async ({ page }) => {
    await openCreate(page, "/lims/inspection-plans", "Inspection Plan");
    await modal(page)
      .getByRole("button", { name: /Add row/i })
      .click();
    const entryType = modal(page).getByRole("button", { name: "Entry type" });
    const cell = (label: string) =>
      modal(page)
        .locator("div")
        .filter({
          has: page.locator(":scope > span", {
            hasText: new RegExp(`^${label}$`)
          })
        })
        .last()
        .locator("button")
        .first();
    const person = cell("Person");
    const role = cell("Lab Role");

    await pickStatic(page, entryType, "Person");
    await expect(person).toBeEnabled();
    await expect(role).toBeDisabled();

    await pickStatic(page, entryType, "Lab Role");
    await expect(role).toBeEnabled();
    await expect(person).toBeDisabled();
  });
});

test.describe("10 · Test Template components by Type", () => {
  test("sidebar and screens say Test Template", async ({ page }) => {
    await gotoApp(page, "/lims/analyses");
    await expect(
      page.getByRole("link", { name: "Test Templates" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Create Test Template/i })
    ).toBeVisible();
  });

  test("Type decides the fields; formulas are checked", async ({ page }) => {
    await openCreate(page, "/lims/analyses", "Test Template");
    await field(modal(page), "Test Template ID").fill(`${RUN}-TT1`);
    await field(modal(page), "Name").fill(`${RUN} UI Template`);
    await modal(page).getByRole("button", { name: "Add component" }).click();

    const typeButton = modal(page).getByRole("button", {
      name: "Type",
      exact: true
    });
    await typeButton.click();
    for (const type of [
      "Blank",
      "Description",
      "Text",
      "Value",
      "Calculation",
      "List",
      "Boolean",
      "Entity",
      "Datetime"
    ])
      await expect(page.getByText(type, { exact: true }).last()).toBeVisible();
    await page.getByText("Value", { exact: true }).last().click();
    await expect(modal(page).getByText("Unit", { exact: true })).toBeVisible();
    await expect(modal(page).getByLabel("Min")).toBeVisible();

    await pickStatic(page, typeButton, "Calculation");
    await expect(modal(page).getByLabel("Formula")).toBeVisible();
    await modal(page)
      .getByLabel(/Component ID/)
      .fill("C1");
    await modal(page)
      .getByLabel(/^Name \*$/)
      .fill("Calc");
    await modal(page)
      .getByLabel(/^Description \*$/)
      .fill("calc");
    await modal(page).getByLabel("Formula").fill("{C1} + 1");
    await save(page);
    await expect(page.getByText(/can't refer to itself/)).toBeVisible();
  });
});

test.describe("11 · Only ID, Name, Description are required", () => {
  test("Min/Max optional; missing Description is flagged", async ({ page }) => {
    await openCreate(page, "/lims/analyses", "Test Template");
    await field(modal(page), "Test Template ID").fill(`${RUN}-TT2`);
    await field(modal(page), "Name").fill(`${RUN} Minimal Template`);
    await modal(page).getByRole("button", { name: "Add component" }).click();
    await modal(page)
      .getByLabel(/Component ID/)
      .fill("PH");
    await modal(page)
      .getByLabel(/^Name \*$/)
      .fill("pH");
    await pickStatic(
      page,
      modal(page).getByRole("button", { name: "Type", exact: true }),
      "Value"
    );
    await save(page);
    await expect(page.getByText(/Description is required/)).toBeVisible();

    await modal(page)
      .getByLabel(/^Description \*$/)
      .fill("pH of solution");
    await save(page);
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();
  });
});

test.describe("12 · Test Group rows are Test Templates", () => {
  test("only Approved templates offered, with a ? hint", async ({ page }) => {
    await openCreate(page, "/lims/test-groups", "Test group");
    await expect(modal(page).getByText("Instrument category")).toHaveCount(0);
    await expect(modal(page).getByText("Replicate count")).toHaveCount(0);
    await modal(page)
      .getByRole("button", { name: /Add test template/i })
      .click();

    await modal(page)
      .getByRole("button", { name: "More information" })
      .first()
      .hover();
    await expect(page.getByRole("tooltip")).toContainText(
      "Only Approved Test Templates"
    );

    const picker = modal(page)
      .getByRole("button", { name: /Select Test Template/i })
      .first();
    await picker.click();
    await page.getByPlaceholder("Search…").last().fill(RUN);
    await expect(
      page.getByRole("button", { name: template.name })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: draftTemplate.name })
    ).toHaveCount(0);
  });
});

test.describe("13 · Specification limits from Test Template / Test Group", () => {
  test("adding a group adds its components; rows can be removed", async ({
    page
  }) => {
    await openCreate(page, "/lims/specifications", "Specification");
    await field(modal(page), "Spec ID").fill(`${RUN}-SPEC`);
    await field(modal(page), "Name").fill(`${RUN} Spec`);
    const add = modal(page).getByRole("button", {
      name: /Search Test Templates or Test Groups/i
    });
    await pickAsync(page, add, RUN, testGroup.name);
    for (const component of ["Assay", "Appearance", "Identification", "Note"])
      await expect(
        modal(page).getByText(component, { exact: true })
      ).toBeVisible();

    await modal(page)
      .getByRole("button", { name: /^Delete 4$/ })
      .click();
    await expect(modal(page).getByText("Note", { exact: true })).toHaveCount(0);
    await save(page);
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();
  });
});

test.describe("14 · Samples: create several, copy one into many, Sample Templates", () => {
  test("How many? → 3 forms → Save all", async ({ page, request }) => {
    await openCreate(page, "/lims/samples", "Sample");
    await page.getByLabel(/Number of Samples/i).fill("3");
    await page.getByRole("button", { name: "Continue" }).click();
    for (let i = 1; i <= 3; i += 1) {
      await expect(modal(page).locator("h2")).toContainText(`${i} of 3`);
      await field(modal(page), "Sample name").fill(`${RUN} Bulk ${i}`);
      if (i < 3)
        await modal(page).getByRole("button", { name: "Next" }).click();
    }
    await page.getByRole("button", { name: /Save all/i }).click();
    await expect(
      page.getByText(/3 samples created successfully/i)
    ).toBeVisible();
    const found = await api(request).get(
      `/lims-samples?search=${encodeURIComponent(`${RUN} Bulk`)}&limit=10`
    );
    expect(found).toHaveLength(3);
  });

  test("Sample Template pre-fills every form", async ({ page, request }) => {
    const tpl = await api(request).post("/lims-sample-templates", {
      name: `${RUN} Incoming`,
      lotNumber: `${RUN}-LOT`,
      tests: [{ analysisId: template.id, sortOrder: 0 }]
    });
    await openCreate(page, "/lims/samples", "Sample");
    await page.getByLabel(/Number of Samples/i).fill("2");
    await pickAsync(
      page,
      page.getByRole("button", { name: /Select Sample Template/i }),
      RUN,
      tpl.name
    );
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(field(modal(page), "Lot number")).toHaveValue(`${RUN}-LOT`);
    await expect(modal(page).getByText(template.name)).toBeVisible();
    await field(modal(page), "Sample name").fill(`${RUN} Tpl 1`);
    await modal(page).getByRole("button", { name: "Next" }).click();
    await field(modal(page), "Sample name").fill(`${RUN} Tpl 2`);
    await page.getByRole("button", { name: /Save all/i }).click();
    await expect(
      page.getByText(/2 samples created successfully/i)
    ).toBeVisible();

    const rows = await api(request).get(
      `/lims-samples?search=${encodeURIComponent(`${RUN} Tpl`)}&limit=10`
    );
    expect(rows).toHaveLength(2);
    const detail = await api(request).get(`/lims-samples/${rows[0].id}`);
    expect(detail.lotNumber).toBe(`${RUN}-LOT`);
    expect(detail.tests.map((t: { testName: string }) => t.testName)).toContain(
      template.name
    );
  });

  test("copy one sample into 2", async ({ page, request }) => {
    await api(request).post("/lims-samples", { sampleName: `${RUN} Source` });
    await gotoApp(page, "/lims/samples");
    await page.getByPlaceholder(/^Search (?!or type)/i).fill(`${RUN} Source`);
    await page
      .getByRole("row", { name: new RegExp(`${RUN} Source`) })
      .getByRole("checkbox")
      .check();
    await page.getByRole("button", { name: /^Copy$/ }).click();
    await page.getByLabel(/Number of copies/i).fill("2");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: /Save all/i }).click();
    await expect(
      page.getByText(/2 records copied successfully/i)
    ).toBeVisible();
  });
});

test.describe("15 · Batches and Lots: create several", () => {
  for (const [path, entity, plural, nameLabel] of [
    ["/lims/batches", "Batch", "Batches", "Batch name"],
    ["/lims/lots", "Lot", "Lots", "Lot name"]
  ] as const) {
    test(`${plural}: How many? → 2 forms → Save all`, async ({ page }) => {
      await openCreate(page, path, entity);
      await page.getByLabel(new RegExp(`Number of ${plural}`, "i")).fill("2");
      await page.getByRole("button", { name: "Continue" }).click();
      await field(modal(page), nameLabel).fill(`${RUN} ${entity} 1`);
      await modal(page).getByRole("button", { name: "Next" }).click();
      await field(modal(page), nameLabel).fill(`${RUN} ${entity} 2`);
      await page.getByRole("button", { name: /Save all/i }).click();
      await expect(
        page.getByText(new RegExp(`2 ${plural} created successfully`, "i"))
      ).toBeVisible();
    });
  }
});

test.describe("16 · Sample tests from Test Template / Test Group", () => {
  test("picked template becomes a Test with a row per component", async ({
    page,
    request
  }) => {
    await openCreate(page, "/lims/samples", "Sample");
    await page.getByRole("button", { name: "Continue" }).click();
    await field(modal(page), "Sample name").fill(`${RUN} With Tests`);
    const picker = modal(page).getByRole("button", {
      name: /Search Test Templates or Test Groups/i
    });
    await pickAsync(page, picker, RUN, template.name);
    await expect(modal(page).getByText("4 components")).toBeVisible();
    await save(page);
    await expect(page.getByText(/created successfully/i).first()).toBeVisible();

    const [sample] = await api(request).get(
      `/lims-samples?search=${encodeURIComponent(`${RUN} With Tests`)}&limit=5`
    );
    const detail = await api(request).get(`/lims-samples/${sample.id}`);
    expect(detail.tests).toHaveLength(1);
    expect(detail.tests[0].testId).toMatch(/^TST-/);
    expect(detail.tests[0].components).toHaveLength(4);
  });
});
