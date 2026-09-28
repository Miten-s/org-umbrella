import { test as setup, expect } from "@playwright/test";

const STATE = "e2e/.auth/state.json";
const TOKEN_KEY = "auth_access_token";

/** Signs in once and saves the session. Either E2E_EMAIL + E2E_PASSWORD (the real Sign In
 * page), or a ready-made E2E_TOKEN. The app keeps the token in sessionStorage, which saved
 * state doesn't capture — it's copied to localStorage, which the app also reads. */
setup("sign in", async ({ page }) => {
  const token = process.env.E2E_TOKEN;
  if (token) {
    await page.goto("/sign-in");
    await page.evaluate(
      ([key, value]) => localStorage.setItem(key, value),
      [TOKEN_KEY, token]
    );
  } else {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    if (!email || !password)
      throw new Error(
        "Set E2E_EMAIL and E2E_PASSWORD (or E2E_TOKEN) to run the E2E suite."
      );
    await page.goto("/sign-in");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
    await page.waitForURL(/\/dashboard/);
    await page.evaluate((key) => {
      const value = sessionStorage.getItem(key);
      if (value) localStorage.setItem(key, value);
    }, TOKEN_KEY);
  }
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: STATE });
});
