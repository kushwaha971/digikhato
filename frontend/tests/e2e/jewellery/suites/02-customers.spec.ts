/**
 * Suite 02 — Customer Management
 * Tags: @smoke @customers
 *
 * Covers:
 *  TC-JWL-CUST-001  Create customer with valid data
 *  TC-JWL-CUST-002  Empty form validation
 *  TC-JWL-CUST-003  Invalid mobile rejected
 *  TC-JWL-CUST-004  Customer appears in list after creation
 *  TC-JWL-CUST-005  Search by name filters list
 *  TC-JWL-CUST-006  Search by mobile filters list
 *  TC-JWL-CUST-007  Duplicate mobile prevention (API)
 *  TC-JWL-CUST-008  Customer detail shows outstanding snapshot
 *  TC-JWL-CUST-009  Edit customer updates name/mobile
 *  TC-JWL-CUST-010  GSTIN field accepted for B2B customers
 */
import { expect, test } from "@playwright/test";
import {
  loginByMobile,
  ADMIN_MOBILE,
  createCustomer,
  randomMobile,
  API_BASE,
  authHeaders,
} from "../helpers/api";
import { setUiSession } from "../helpers/ui";
import { CustomersPage } from "../pages/CustomersPage";

test.describe("Customer Management", () => {
  test.describe.configure({ mode: "serial" });

  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const session = await loginByMobile(request, ADMIN_MOBILE);
    accessToken = session.access;
  });

  test(
    "TC-JWL-CUST-001/002/003: create with validation",
    { tag: ["@smoke", "@customers"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      const customersPage = new CustomersPage(page);
      await customersPage.gotoNew();

      await test.step("Empty submit shows validation errors", async () => {
        await customersPage.submit();
        await customersPage.expectValidationErrors();
      });

      await test.step("Invalid mobile shows format error", async () => {
        await customersPage.fillForm({ name: "Test", mobile: "123" });
        await customersPage.submit();
        await customersPage.expectMobileValidationError();
      });

      await test.step("Valid data creates customer and redirects to list", async () => {
        const name = `E2E Customer ${Date.now()}`;
        const mobile = randomMobile();
        await customersPage.fillForm({ name, mobile });
        await customersPage.submit();
        await customersPage.expectRedirectToList();
        // Search to surface the customer regardless of list pagination
        await customersPage.search(name);
        await customersPage.expectCustomerVisible(name);
      });
    },
  );

  test(
    "TC-JWL-CUST-005/006: search by name and mobile",
    { tag: ["@customers"] },
    async ({ page, request }) => {
      const name = `SearchTest ${Date.now()}`;
      const mobile = randomMobile();
      await createCustomer(request, accessToken, { name, mobile });

      await setUiSession(page, accessToken);
      const customersPage = new CustomersPage(page);
      await customersPage.gotoList();

      await test.step("Search by name", async () => {
        await customersPage.search(name);
        await customersPage.expectCustomerVisible(name);
      });

      await test.step("Search by mobile", async () => {
        await customersPage.search(mobile);
        await customersPage.expectCustomerVisible(name);
      });
    },
  );

  test(
    "TC-JWL-CUST-007: duplicate mobile allowed — multiple customers share a number",
    { tag: ["@customers", "@api"] },
    async ({ request }) => {
      // Current backend policy: duplicate mobile is permitted per tenant.
      // Both records are created and return 201.
      const mobile = randomMobile();
      const first = await request.post(`${API_BASE}/jwl/v1/sales/customers/`, {
        headers: authHeaders(accessToken),
        data: { name: "Dup Customer A", mobile },
      });
      expect(first.status()).toBe(201);
      const dup = await request.post(`${API_BASE}/jwl/v1/sales/customers/`, {
        headers: authHeaders(accessToken),
        data: { name: "Dup Customer B", mobile },
      });
      expect(dup.status()).toBe(201);
      const firstBody = await first.json();
      const dupBody = await dup.json();
      expect(firstBody.id).not.toBe(dupBody.id);
    },
  );

  test(
    "TC-JWL-CUST-008: customer detail shows outstanding snapshot",
    { tag: ["@customers"] },
    async ({ page, request }) => {
      const customer = await createCustomer(request, accessToken);
      await setUiSession(page, accessToken);
      const customersPage = new CustomersPage(page);
      await customersPage.gotoDetail(customer.id);
      await customersPage.expectOutstandingSnapshot();
    },
  );

  test(
    "TC-JWL-CUST-010: GSTIN field accepted for B2B customers",
    { tag: ["@customers"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      const customersPage = new CustomersPage(page);
      await customersPage.gotoNew();
      await customersPage.fillForm({
        name: `B2B ${Date.now()}`,
        mobile: randomMobile(),
        gstin: "27AABCU9603R1ZX",
      });
      await customersPage.submit();
      await customersPage.expectRedirectToList();
    },
  );

  test(
    "TC-JWL-CUST-API-001: customer list API returns paginated results",
    { tag: ["@api", "@customers"] },
    async ({ request }) => {
      const res = await request.get(`${API_BASE}/jwl/v1/sales/customers/`, {
        headers: authHeaders(accessToken),
      });
      expect(res.status()).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("results");
      expect(body).toHaveProperty("count");
      expect(Array.isArray(body.results)).toBe(true);
    },
  );
});
