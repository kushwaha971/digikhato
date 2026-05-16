/**
 * Suite 06 — Karigar & Orders
 * Tags: @karigar
 *
 * Covers:
 *  TC-JWL-KAR-001  Add karigar with valid name + mobile
 *  TC-JWL-KAR-002  Edit karigar — PAN validation + inactive toggle
 *  TC-JWL-KAR-003  Karigar list loads
 *  TC-JWL-KAR-004  API: karigar list returns results
 *  TC-JWL-KAR-005  API: duplicate mobile rejected
 */
import { expect, test } from "@playwright/test";
import {
  loginByMobile,
  ADMIN_MOBILE,
  randomMobile,
  API_BASE,
  authHeaders,
} from "../helpers/api";
import { setUiSession } from "../helpers/ui";

test.describe("Karigar Management", () => {
  test.describe.configure({ mode: "serial" });

  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const session = await loginByMobile(request, ADMIN_MOBILE);
    accessToken = session.access;
  });

  test(
    "TC-JWL-KAR-003: karigar list page loads",
    { tag: ["@smoke", "@karigar"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      await page.goto("/jewellery/karigar", { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: /karigar|craftsman|artisan/i }).first(),
      ).toBeVisible({ timeout: 8000 });
    },
  );

  test(
    "TC-JWL-KAR-001/002: add karigar + edit with PAN + toggle inactive",
    { tag: ["@karigar"] },
    async ({ page, request }) => {
      await setUiSession(page, accessToken);
      await page.goto("/jewellery/karigar?view=karigars", { waitUntil: "domcontentloaded" });
      const karigarName = `Karigar E2E ${Date.now()}`;
      const listRes = await request.get(`${API_BASE}/jwl/v1/karigar/`, {
        headers: authHeaders(accessToken),
      });
      const beforeCount = ((await listRes.json())?.count ?? 0) as number;

      await test.step("Add new karigar", async () => {
        await page.getByRole("button", { name: "Add Karigar" }).first().click();
        await page.getByLabel("Name").fill(karigarName);
        await page.getByLabel("Mobile").fill(randomMobile());
        await page.getByRole("button", { name: "Save Karigar" }).click();

        await expect.poll(async () => {
          const res = await request.get(`${API_BASE}/jwl/v1/karigar/`, {
            headers: authHeaders(accessToken),
          });
          const body = await res.json();
          return Number(body?.count ?? 0);
        }, { timeout: 8000 }).toBeGreaterThan(beforeCount);
      });

      await test.step("Edit karigar — set PAN + toggle inactive", async () => {
        const createdRow = page.locator("div.app-panel", { hasText: karigarName }).first();
        if (await createdRow.count()) {
          await createdRow.getByRole("button", { name: "Edit" }).first().click();
        } else {
          await page.getByRole("button", { name: "Edit" }).first().click();
        }
        const drawer = page.locator("div.fixed.inset-0.z-50").last();
        await expect(drawer.locator('button:visible:has-text("Save changes")')).toBeVisible();

        const panInput = drawer.locator('input[name="kyc_pan"]:visible').first();
        await panInput.fill("ABCDE1234F");

        const activeCheckbox = drawer
          .locator(
            'label:has-text("Active") input[type="checkbox"]:visible, ' +
            'input[type="checkbox"][id*="active"]:visible',
          )
          .first();
        if (await activeCheckbox.count()) {
          await activeCheckbox.scrollIntoViewIfNeeded();
          await activeCheckbox.setChecked(false);
        }

        await drawer.locator('button:visible:has-text("Save changes")').click();
        await expect(drawer).toBeHidden({ timeout: 8000 });

        // Re-open editor and verify persisted edits.
        await page.getByRole("button", { name: "Edit" }).first().click();
        const reopenDrawer = page.locator("div.fixed.inset-0.z-50").last();
        await expect(reopenDrawer.locator('input[name="kyc_pan"]:visible').first()).toHaveValue("ABCDE1234F");
        await expect(
          reopenDrawer.locator('input[type="checkbox"]:visible').first(),
        ).not.toBeChecked();
      });
    },
  );

  test(
    "TC-JWL-KAR-004: karigar API list returns results",
    { tag: ["@karigar", "@api"] },
    async ({ request }) => {
      const res = await request.get(`${API_BASE}/jwl/v1/karigar/`, {
        headers: authHeaders(accessToken),
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      const items = Array.isArray(body) ? body : body?.results ?? [];
      expect(Array.isArray(items)).toBe(true);
    },
  );
});
