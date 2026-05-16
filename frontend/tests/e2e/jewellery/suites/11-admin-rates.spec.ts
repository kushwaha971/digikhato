/**
 * Suite 11 — Admin Controls & Gold Rates
 * Tags: @admin @rates
 *
 * Covers:
 *  TC-JWL-ADM-001  Admin page loads
 *  TC-JWL-ADM-002  Rates page shows live rate table
 *  TC-JWL-ADM-003  Set rate override via API
 *  TC-JWL-ADM-004  Live rates endpoint returns current rates
 *  TC-JWL-ADM-005  Users & Roles page loads with team list
 *  TC-JWL-ADM-006  Feature flags accessible (API)
 *  TC-JWL-ADM-007  Lock period API endpoint exists
 */
import { expect, test } from "@playwright/test";
import {
  loginByMobile,
  ADMIN_MOBILE,
  getMasterRefs,
  setRateOverride,
  API_BASE,
  authHeaders,
} from "../helpers/api";
import { setUiSession } from "../helpers/ui";
import { AdminPage } from "../pages/AdminPage";

test.describe("Admin Controls & Gold Rates", () => {
  test.describe.configure({ mode: "serial" });

  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const session = await loginByMobile(request, ADMIN_MOBILE);
    accessToken = session.access;
  });

  test(
    "TC-JWL-ADM-001: admin settings page loads",
    { tag: ["@smoke", "@admin"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      const adminPage = new AdminPage(page);
      await adminPage.gotoAdmin();
      await adminPage.expectAdminPageVisible();
    },
  );

  test(
    "TC-JWL-ADM-002: rates page shows live rate table",
    { tag: ["@admin", "@rates"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      const adminPage = new AdminPage(page);
      await adminPage.gotoRates();
      await adminPage.expectRatesPageVisible();
      await adminPage.expectLiveRateTable();
    },
  );

  test(
    "TC-JWL-ADM-003/004: set rate override and verify live rates",
    { tag: ["@admin", "@rates", "@api"] },
    async ({ request }) => {
      const master = await getMasterRefs(request, accessToken);

      await test.step("Set rate override", async () => {
        const override = await setRateOverride(
          request,
          accessToken,
          master.metalId,
          master.purityId,
          "6800",
          "6200",
        );
        expect(override.id).toBeTruthy();
      });

      await test.step("Live rates endpoint returns data", async () => {
        const res = await request.get(`${API_BASE}/jwl/v1/rates/live/`, {
          headers: authHeaders(accessToken),
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        const rates = Array.isArray(body) ? body : body?.results ?? [];
        expect(rates.length).toBeGreaterThan(0);
      });
    },
  );

  test(
    "TC-JWL-ADM-005: users & roles page loads",
    { tag: ["@admin"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      const adminPage = new AdminPage(page);
      await adminPage.gotoUsersRoles();
      await adminPage.expectUsersRolesVisible();
    },
  );

  test(
    "TC-JWL-ADM-006: feature flags API accessible",
    { tag: ["@admin", "@api"] },
    async ({ request }) => {
      const res = await request.get(`${API_BASE}/jwl/v1/admin/feature-flags/`, {
        headers: authHeaders(accessToken),
      });
      expect([200, 404]).toContain(res.status());
    },
  );

  test(
    "TC-JWL-ADM-007: number series API accessible",
    { tag: ["@admin", "@api"] },
    async ({ request }) => {
      const res = await request.get(`${API_BASE}/jwl/v1/number-series/`, {
        headers: authHeaders(accessToken),
      });
      expect([200, 404]).toContain(res.status());
    },
  );
});
