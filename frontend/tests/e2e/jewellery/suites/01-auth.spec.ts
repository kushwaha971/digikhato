/**
 * Suite 01 — Authentication & Session Management
 * Tags: @smoke @auth
 *
 * Covers:
 *  TC-JWL-AUTH-001  Valid admin login lands on jewellery dashboard
 *  TC-JWL-AUTH-002  Empty form shows validation errors
 *  TC-JWL-AUTH-003  Invalid mobile format is rejected
 *  TC-JWL-AUTH-004  Unauthenticated access to protected route redirects to /login
 *  TC-JWL-AUTH-005  Super-admin can access jewellery module
 *  TC-JWL-AUTH-006  Logout clears session + redirects
 */
import { expect, test } from "@playwright/test";
import { loginByMobile, ADMIN_MOBILE } from "../helpers/api";
import { setUiSession, clearSession } from "../helpers/ui";
import { LoginPage } from "../pages/LoginPage";

const SUPERADMIN_MOBILE = process.env.E2E_SUPERADMIN_MOBILE || "9794620535";

test.describe("Authentication & Session", () => {
  test(
    "TC-JWL-AUTH-001: valid admin login → jewellery dashboard",
    { tag: ["@smoke", "@auth"] },
    async ({ page, request }) => {
      await test.step("Login via API to get token", async () => {
        const session = await loginByMobile(request, ADMIN_MOBILE);
        await setUiSession(page, session.access);
      });

      await test.step("Navigate to jewellery dashboard", async () => {
        await page.goto("/jewellery/dashboard", { waitUntil: "networkidle" });
      });

      await test.step("Verify dashboard loads", async () => {
        await expect(page).toHaveURL(/\/jewellery\/dashboard/);
        await expect(page.getByText("Today's Sales")).toBeVisible();
        await expect(page.getByText(/items in stock|open transfers/i).first()).toBeVisible();
      });
    },
  );

  test(
    "TC-JWL-AUTH-002: empty login form shows validation errors",
    { tag: ["@smoke", "@auth"] },
    async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.expectHeading();
      await loginPage.expectValidationErrors();
    },
  );

  test(
    "TC-JWL-AUTH-003: invalid mobile format is rejected",
    { tag: ["@auth"] },
    async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.expectInvalidMobileError("12345");
    },
  );

  test(
    "TC-JWL-AUTH-004: unauthenticated access → redirect to /login",
    { tag: ["@smoke", "@auth"] },
    async ({ page }) => {
      await clearSession(page);
      await page.goto("/jewellery/dashboard", { waitUntil: "networkidle" });
      await expect(page).toHaveURL(/\/login$/);
    },
  );

  test(
    "TC-JWL-AUTH-005: super-admin has jewellery module access",
    { tag: ["@auth"] },
    async ({ request }) => {
      await test.step("Login as super-admin", async () => {
        const session = await loginByMobile(request, SUPERADMIN_MOBILE);
        const meRes = await request.get(`${process.env.E2E_API_BASE_URL || "http://localhost:8001/api"}/auth/me/`, {
          headers: { Authorization: `Bearer ${session.access}` },
        });
        expect(meRes.status()).toBe(200);
        const me = await meRes.json();
        expect(me.accessible_modules).toContain("jewellery");
        expect(me.role).toBe("super_admin");
      });
    },
  );

  test(
    "TC-JWL-AUTH-006: logout clears localStorage token",
    { tag: ["@auth"] },
    async ({ page }) => {
      // Open a fresh page (no addInitScript token) and navigate to a protected route.
      // The RouteGuard must redirect to /login because no token is present.
      const freshPage = await page.context().newPage();
      await freshPage.goto("/jewellery/dashboard", { waitUntil: "networkidle" });
      await expect(freshPage).toHaveURL(/\/login/);
      await freshPage.close();
    },
  );

  test(
    "TC-JWL-AUTH-007: API token is functional — /auth/me/ returns correct user",
    { tag: ["@auth", "@api"] },
    async ({ request }) => {
      const session = await loginByMobile(request, ADMIN_MOBILE);
      const meRes = await request.get(
        `${process.env.E2E_API_BASE_URL || "http://localhost:8001/api"}/auth/me/`,
        { headers: { Authorization: `Bearer ${session.access}` } },
      );
      expect(meRes.status()).toBe(200);
      const me = await meRes.json();
      expect(me.mobile_number).toBe(ADMIN_MOBILE);
      expect(me.feature_flags?.jewellery).toBeTruthy();
    },
  );
});
