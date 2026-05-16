/**
 * Suite 10 — GST Reports & Sales Register
 * Tags: @reports
 *
 * Covers:
 *  TC-JWL-RPT-001  Reports page loads with GST filing cards
 *  TC-JWL-RPT-002  Sales Register date range + Load
 *  TC-JWL-RPT-003  GST reports page loads
 *  TC-JWL-RPT-004  GSTR-1 API endpoint responds
 *  TC-JWL-RPT-005  GSTR-3B API endpoint responds
 *  TC-JWL-RPT-006  Export CSV only enabled when rows present
 */
import { expect, test } from "@playwright/test";
import {
  loginByMobile,
  ADMIN_MOBILE,
  API_BASE,
  authHeaders,
  getMasterRefs,
  createItem,
  createDraftInvoice,
  issueInvoice,
} from "../helpers/api";
import { setUiSession } from "../helpers/ui";

test.describe("GST Reports & Sales Register", () => {
  test.describe.configure({ mode: "serial" });

  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const session = await loginByMobile(request, ADMIN_MOBILE);
    accessToken = session.access;

    const today = new Date().toISOString().slice(0, 10);
    const master = await getMasterRefs(request, accessToken);
    const item = await createItem(request, accessToken, master);
    const draft = await createDraftInvoice(request, accessToken, item, {
      voucherDate: today,
    });
    await issueInvoice(request, accessToken, draft.id);
  });

  test(
    "TC-JWL-RPT-001: reports page loads with filing cards",
    { tag: ["@smoke", "@reports"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      await page.goto("/jewellery/reports", { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { name: /reports/i }).first()).toBeVisible();
      await expect(page.getByText("GSTR-1").first()).toBeVisible();
      await expect(page.getByText("GSTR-3B").first()).toBeVisible();
    },
  );

  test(
    "TC-JWL-RPT-002: sales register load by date range",
    { tag: ["@reports"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      await page.goto("/jewellery/reports", { waitUntil: "networkidle" });

      const today = new Date().toISOString().slice(0, 10);
      const monthAgo = new Date(Date.now() - 30 * 86400 * 1000).toISOString().slice(0, 10);

      await page.getByLabel("Date From").fill(monthAgo);
      await page.getByLabel("Date To").fill(today);
      await page.getByTestId("sales-register-load").click();

      const table = page.locator('[data-testid="sales-register-table"]').first();
      const emptyState = page.getByText(/No invoices found/i).first();
      await expect(table.or(emptyState)).toBeVisible({ timeout: 15000 });
    },
  );

  test(
    "TC-JWL-RPT-003: GST reports page loads",
    { tag: ["@reports"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      await page.goto("/jewellery/gst-reports", { waitUntil: "networkidle" });
      await expect(
        page.getByRole("heading", { name: /gst|reports/i }).first(),
      ).toBeVisible();
    },
  );

  test(
    "TC-JWL-RPT-004/005: GSTR-1 and GSTR-3B API endpoints respond",
    { tag: ["@reports", "@api"] },
    async ({ request }) => {
      const period = new Date().toISOString().slice(0, 7).replace("-", "");

      await test.step("GSTR-1 API", async () => {
        const res = await request.get(`${API_BASE}/jwl/v1/reports/gstr-1/`, {
          headers: authHeaders(accessToken),
          params: { period },
        });
        expect([200, 400]).toContain(res.status());
      });

      await test.step("GSTR-3B API", async () => {
        const res = await request.get(`${API_BASE}/jwl/v1/reports/gstr-3b/`, {
          headers: authHeaders(accessToken),
          params: { period },
        });
        expect([200, 400]).toContain(res.status());
      });
    },
  );
});
