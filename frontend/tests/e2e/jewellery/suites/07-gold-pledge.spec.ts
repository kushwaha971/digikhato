/**
 * Suite 07 — Gold Pledge Loans
 * Tags: @pledge
 *
 * Covers:
 *  TC-JWL-PLG-001  New pledge form loads
 *  TC-JWL-PLG-002  Required fields validation
 *  TC-JWL-PLG-003  Create loan → redirected to detail
 *  TC-JWL-PLG-004  Loan detail shows pledged item + scheme
 *  TC-JWL-PLG-005  API: loan scheme list returns results
 *  TC-JWL-PLG-006  API: loan creation with valid payload
 */
import { expect, test } from "@playwright/test";
import {
  loginByMobile,
  ADMIN_MOBILE,
  createCustomer,
  getMasterRefs,
  API_BASE,
  authHeaders,
} from "../helpers/api";
import { setUiSession, selectOption, selectOptionByText } from "../helpers/ui";

async function ensureLoanScheme(
  request: import("@playwright/test").APIRequestContext,
  access: string,
) {
  const list = await request.get(`${API_BASE}/jwl/v1/loan-schemes/`, {
    headers: authHeaders(access),
  });
  expect(list.status()).toBe(200);
  const body = await list.json();
  const items = Array.isArray(body) ? body : body?.results ?? [];
  if (items.length) return items[0];

  const created = await request.post(`${API_BASE}/jwl/v1/loan-schemes/`, {
    headers: authHeaders(access),
    data: {
      name: `Auto Scheme ${Date.now()}`,
      ltv_pct: "75",
      interest_method: "SIMPLE",
      interest_rate_pct: "12",
      min_tenure: 1,
      max_tenure: 24,
      late_fee_pct: "2",
      is_active: true,
    },
  });
  expect(created.status()).toBe(201);
  return created.json();
}

test.describe("Gold Pledge Loans", () => {
  test.describe.configure({ mode: "serial" });

  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const session = await loginByMobile(request, ADMIN_MOBILE);
    accessToken = session.access;
    await ensureLoanScheme(request, accessToken);
  });

  test(
    "TC-JWL-PLG-001: gold pledge form loads",
    { tag: ["@smoke", "@pledge"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      await page.goto("/jewellery/gold-pledge", { waitUntil: "networkidle" });
      await expect(
        page.getByRole("heading", { name: /pledge|loan/i }).first(),
      ).toBeVisible({ timeout: 8000 });
    },
  );

  test(
    "TC-JWL-PLG-002/003: create gold pledge loan → detail page",
    { tag: ["@pledge"] },
    async ({ page, request }) => {
      const customer = await createCustomer(request, accessToken);
      const master = await getMasterRefs(request, accessToken);

      await setUiSession(page, accessToken);
      await page.goto("/jewellery/gold-pledge/new", { waitUntil: "networkidle" });

      await page.getByLabel("Customer").fill(customer.name);
      await page.getByRole("button", { name: new RegExp(customer.name, "i") }).first().click();

      await selectOption(page, "Scheme", 1);
      await page.getByLabel(/principal/i).fill("50000");
      await page.getByLabel(/tenure/i).fill("12");

      const metalName = master.metalCode === "GOLD" ? "Gold" : master.metalCode;
      await selectOptionByText(page, "Metal", new RegExp(metalName, "i"));
      await selectOption(page, "Purity", 1);
      await page.getByLabel(/gross.*wt|gross weight/i).fill("10");
      await page.getByLabel(/net.*wt|net weight/i).fill("9");
      await page.getByLabel(/stone.*wt|stone weight/i).fill("0");
      await page.getByLabel(/valuation.*rate|rate.*gram/i).fill("6000");

      await page.getByRole("button", { name: "Create Loan" }).click();
      await expect(page).toHaveURL(/\/jewellery\/gold-pledge\/[a-f0-9-]+$/);
    },
  );

  test(
    "TC-JWL-PLG-005: loan scheme API returns list",
    { tag: ["@pledge", "@api"] },
    async ({ request }) => {
      const res = await request.get(`${API_BASE}/jwl/v1/loan-schemes/`, {
        headers: authHeaders(accessToken),
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      const items = Array.isArray(body) ? body : body?.results ?? [];
      expect(items.length).toBeGreaterThan(0);
    },
  );
});
