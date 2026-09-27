import {
  expect,
  type APIRequestContext,
  type Locator,
  type Page
} from "@playwright/test";
import fs from "node:fs";

/** Unique per run, so records from repeated runs never collide. */
export const RUN = `E2E-${Date.now().toString(36).toUpperCase()}`;

const token = (): string => {
  const state = JSON.parse(fs.readFileSync("e2e/.auth/state.json", "utf8"));
  for (const origin of state.origins ?? [])
    for (const item of origin.localStorage ?? [])
      if (item.name === "auth_access_token") return item.value;
  throw new Error(
    "No auth token in e2e/.auth/state.json — did the setup project run?"
  );
};

/** Direct LIMS/GXP API calls for fixtures (through the dev server's proxy). */
export const api = (
  request: APIRequestContext,
  service: "lims" | "gxp" = "lims"
) => {
  const base = `/${service}/v1/api`;
  const headers = () => ({ Authorization: `Bearer ${token()}` });
  const unwrap = async (res: Awaited<ReturnType<APIRequestContext["get"]>>) => {
    const body: any = await res.json().catch(() => ({}));
    if (!res.ok())
      throw new Error(`${res.status()} ${res.url()}: ${JSON.stringify(body)}`);
    return body.data ?? body;
  };
  return {
    get: async (path: string) =>
      unwrap(await request.get(base + path, { headers: headers() })),
    post: async (path: string, data: unknown) =>
      unwrap(await request.post(base + path, { headers: headers(), data })),
    patch: async (path: string, data: unknown) =>
      unwrap(await request.patch(base + path, { headers: headers(), data })),
    raw: (path: string, data: unknown) =>
      request.post(base + path, { headers: headers(), data })
  };
};

type Api = ReturnType<typeof api>;

/** The "Approved" approval-status phrase entry id. */
export const approvedStatusId = async (lims: Api): Promise<string> => {
  const rows = await lims.get(
    "/lims-phrases/entries?phrase=APPROVAL_STATUS&limit=50"
  );
  const list = Array.isArray(rows) ? rows : (rows.entries ?? rows.data ?? []);
  const approved = list.find((e: { name?: string }) => e.name === "Approved");
  if (!approved)
    throw new Error("No 'Approved' entry in the APPROVAL_STATUS pick list");
  return approved.id;
};

/** An Approved Test Template with Value/List/Boolean/Text components, for later cases. */
export const createApprovedTemplate = async (lims: Api, name: string) =>
  lims.post("/lims-analyses", {
    name,
    approvalStatus: await approvedStatusId(lims),
    components: [
      {
        componentId: "ASSAY",
        name: "Assay",
        description: "Assay by HPLC",
        type: "VALUE",
        unit: "%",
        min: "98",
        max: "102",
        sortOrder: 0
      },
      {
        componentId: "APP",
        name: "Appearance",
        description: "Visual",
        type: "LIST",
        list: "RATING",
        sortOrder: 1
      },
      {
        componentId: "IR",
        name: "Identification",
        description: "IR",
        type: "BOOLEAN",
        option: "COMPLIES",
        sortOrder: 2
      },
      {
        componentId: "NOTE",
        name: "Note",
        description: "Remarks",
        type: "TEXT",
        sortOrder: 3
      }
    ]
  });

const pageOf = (scope: Page | Locator): Page =>
  "page" in scope && typeof scope.page === "function"
    ? scope.page()
    : (scope as Page);

/** The smallest block holding a label with this text (labels carry "*" and "?" suffixes). */
const labelled = (scope: Page | Locator, label: string): Locator =>
  scope
    .locator("div")
    .filter({
      has: pageOf(scope).locator(":scope > label", {
        hasText: new RegExp(`^${label}\\s*\\*?\\s*\\??$`)
      })
    })
    .last();

/** The input/textarea under a form label. */
export const field = (scope: Page | Locator, label: string): Locator =>
  labelled(scope, label).locator("input, textarea").first();

/** The dropdown trigger under a form label. */
export const dropdown = (scope: Page | Locator, label: string): Locator =>
  labelled(scope, label).locator("button").first();

/** Opens an async (server-searched) dropdown, searches, and picks the option. */
export const pickAsync = async (
  page: Page,
  trigger: Locator,
  search: string,
  option = search
) => {
  await trigger.click();
  const box = page.getByPlaceholder("Search…").last();
  await box.fill(search);
  await page.getByRole("button", { name: option }).first().click();
};

/** Picks from a static dropdown (SelectDropdown). */
export const pickStatic = async (
  page: Page,
  trigger: Locator,
  option: string
) => {
  await trigger.click();
  await page.getByText(option, { exact: true }).last().click();
};

/** In-app navigation. A hard load of a /lims/* or /gxp/* page is swallowed by the Vite dev
 * proxy (it forwards those prefixes to the APIs), so load the dashboard, then route client-side. */
export const gotoApp = async (page: Page, path: string) => {
  if (!/\/dashboard/.test(page.url())) await page.goto("/dashboard");
  await page.evaluate((to) => {
    window.history.pushState({}, "", to);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, path);
  await expect(page).toHaveURL(new RegExp(`${path}$`));
};

export const openCreate = async (page: Page, path: string, entity: string) => {
  await gotoApp(page, path);
  await page
    .getByRole("button", {
      name: new RegExp(`^\\+?\\s*Create ${entity}$`, "i")
    })
    .click();
};

export const expectToast = async (page: Page, text: string | RegExp) =>
  expect(page.getByText(text).first()).toBeVisible();
