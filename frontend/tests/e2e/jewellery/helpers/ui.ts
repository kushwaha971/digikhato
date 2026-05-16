/**
 * Jewellery ERP — E2E UI helpers
 * Reusable browser-interaction utilities.
 */
import { expect, type Page } from "@playwright/test";

// ─── Session ──────────────────────────────────────────────────────────────────

export async function setUiSession(page: Page, accessToken: string) {
  await page.addInitScript((token: string) => {
    window.localStorage.setItem("accessToken", token);
  }, accessToken);
}

export async function clearSession(page: Page) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
}

export async function uiLoginByToken(page: Page, accessToken: string, goto = "/jewellery/dashboard") {
  await setUiSession(page, accessToken);
  await page.goto(goto, { waitUntil: "networkidle" });
}

// ─── Custom Select / Dropdown ─────────────────────────────────────────────────

export async function selectOption(page: Page, label: string, optionIndex = 1) {
  const trigger = page.getByLabel(label).first();
  await trigger.click();

  const triggerRoot = trigger.locator("xpath=ancestor::div[1]");
  const dropdownBtns = triggerRoot.locator("div.absolute button:visible:not([disabled])");
  const count = await dropdownBtns.count();
  if (count) {
    await dropdownBtns.nth(Math.min(optionIndex, count - 1)).click();
    return;
  }

  const listbox = page.locator('[role="listbox"]:visible').last();
  await expect(listbox).toBeVisible();
  await listbox.getByRole("option").nth(optionIndex).click();
}

export async function selectOptionByText(page: Page, label: string, text: string | RegExp) {
  const trigger = page.getByLabel(label).first();
  await trigger.click();

  const triggerRoot = trigger.locator("xpath=ancestor::div[1]");
  const dropdownBtns = triggerRoot.locator("div.absolute button:visible:not([disabled])");
  if (await dropdownBtns.count()) {
    await dropdownBtns.filter({ hasText: text }).first().click();
    return;
  }

  const listbox = page.locator('[role="listbox"]:visible').last();
  await expect(listbox).toBeVisible();
  await listbox.getByRole("option", { name: text }).first().click();
}

// ─── Drawers ──────────────────────────────────────────────────────────────────

export function getDrawer(page: Page) {
  return page.locator("div.fixed.inset-0.z-50").last();
}

export async function closeDrawer(page: Page) {
  const drawer = getDrawer(page);
  const closeBtn = drawer.getByRole("button", { name: /close/i }).first();
  if (await closeBtn.isVisible()) await closeBtn.click();
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

export async function confirmDialog(page: Page, confirmLabel = /confirm/i) {
  const dialog = page.locator('[role="dialog"]:visible').last();
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await dialog.getByRole("button", { name: confirmLabel }).click();
}

// ─── Table helpers ────────────────────────────────────────────────────────────

export async function getTableRowCount(page: Page, tableTestId?: string): Promise<number> {
  const table = tableTestId
    ? page.getByTestId(tableTestId)
    : page.locator("table").first();
  return table.locator("tbody tr").count();
}

// ─── Toast / Notification ────────────────────────────────────────────────────

export async function expectSuccessToast(page: Page, text?: string | RegExp) {
  const toast = page.locator('[role="alert"], [data-testid*="toast"], .toast:visible').first();
  if (text) {
    await expect(toast).toContainText(text, { timeout: 8000 });
  } else {
    await expect(toast).toBeVisible({ timeout: 8000 });
  }
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export async function navigateJwl(page: Page, path: string) {
  await page.goto(`/jewellery/${path}`, { waitUntil: "networkidle" });
}

// ─── Screenshot ──────────────────────────────────────────────────────────────

export async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
}

// ─── Wait for API ─────────────────────────────────────────────────────────────

export async function waitForApiResponse(
  page: Page,
  urlContains: string,
  action: () => Promise<void>,
) {
  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().includes(urlContains) && res.status() < 400),
    action(),
  ]);
  return response;
}
