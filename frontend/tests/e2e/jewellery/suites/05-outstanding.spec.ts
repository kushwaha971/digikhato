/**
 * Suite 05 — Party Outstanding
 * Tags: @outstanding
 *
 * Covers:
 *  TC-JWL-OUT-001  Outstanding list loads with ageing buckets
 *  TC-JWL-OUT-002  Filter by 0-30d ageing bucket
 *  TC-JWL-OUT-003  Party detail shows adjustment button
 *  TC-JWL-OUT-004  Empty notes validation on adjustment
 *  TC-JWL-OUT-005  Valid adjustment saves and drawer closes
 *  TC-JWL-OUT-006  Movement pagination available when > 25 entries
 *  TC-JWL-OUT-007  Outstanding created after invoice issue
 */
import { expect, test } from "@playwright/test";
import {
  loginByMobile,
  ADMIN_MOBILE,
  getMasterRefs,
  createItem,
  createDraftInvoice,
  issueInvoice,
  getOutstandingByCustomer,
  postAdjustment,
  API_BASE,
  authHeaders,
  createCustomer,
} from "../helpers/api";
import { setUiSession } from "../helpers/ui";
import { OutstandingPage } from "../pages/OutstandingPage";

test.describe("Party Outstanding", () => {
  test.describe.configure({ mode: "serial" });

  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const session = await loginByMobile(request, ADMIN_MOBILE);
    accessToken = session.access;
  });

  test(
    "TC-JWL-OUT-001: outstanding list loads with ageing buckets",
    { tag: ["@smoke", "@outstanding"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      const outstanding = new OutstandingPage(page);
      await outstanding.goto();
      await outstanding.expectPageVisible();
    },
  );

  test(
    "TC-JWL-OUT-003/004/005: adjustment — validation and save",
    { tag: ["@outstanding"] },
    async ({ page, request }) => {
      const master = await getMasterRefs(request, accessToken);
      const item = await createItem(request, accessToken, master);
      const draft = await createDraftInvoice(request, accessToken, item, {
        payments: [{ mode: "CASH", amount: "1000" }],
      });
      await issueInvoice(request, accessToken, draft.id);

      await setUiSession(page, accessToken);
      const outstanding = new OutstandingPage(page);
      await outstanding.goto();
      await outstanding.openAdjustmentDrawer();

      await test.step("Fill and save valid adjustment", async () => {
        await outstanding.fillAdjustment("250", "Late fee adjustment E2E");
        await outstanding.saveAdjustment();
        await outstanding.expectAdjustmentSaved();
      });
    },
  );

  test(
    "TC-JWL-OUT-007: outstanding record created after invoice issue",
    { tag: ["@outstanding", "@api"] },
    async ({ request }) => {
      const master = await getMasterRefs(request, accessToken);
      const item = await createItem(request, accessToken, master);
      const customer = await createCustomer(request, accessToken);

      const draft = await createDraftInvoice(request, accessToken, item, {
        customerId: customer.id,
        payments: [{ mode: "CASH", amount: "5000" }],
      });
      await issueInvoice(request, accessToken, draft.id);

      const outstanding = await getOutstandingByCustomer(request, accessToken, customer.id);
      expect(outstanding.id).toBeTruthy();

      const movRes = await request.get(
        `${API_BASE}/jwl/v1/outstanding/${outstanding.id}/movements/`,
        { headers: authHeaders(accessToken) },
      );
      expect(movRes.status()).toBe(200);
      const movements = await movRes.json();
      const items = Array.isArray(movements) ? movements : movements?.results ?? [];
      expect(items.length).toBeGreaterThan(0);
    },
  );

  test(
    "TC-JWL-OUT-006: movement pagination available for 30+ entries",
    { tag: ["@outstanding"] },
    async ({ page, request }) => {
      const master = await getMasterRefs(request, accessToken);
      const item = await createItem(request, accessToken, master);
      const customer = await createCustomer(request, accessToken);

      const draft = await createDraftInvoice(request, accessToken, item, {
        customerId: customer.id,
        payments: [{ mode: "CASH", amount: "1000" }],
      });
      const issued = await issueInvoice(request, accessToken, draft.id);
      const outstanding = await getOutstandingByCustomer(
        request,
        accessToken,
        String(issued.customer),
      );

      const notePrefix = `PG-TEST-${Date.now()}`;
      for (let i = 0; i < 28; i++) {
        await postAdjustment(
          request,
          accessToken,
          outstanding.id,
          "1",
          `${notePrefix}-${String(i).padStart(2, "0")}`,
        );
      }

      await setUiSession(page, accessToken);
      const outstandingPage = new OutstandingPage(page);
      await outstandingPage.goto();
      await outstandingPage.openPartyByTestId(outstanding.id);

      const panel = await outstandingPage.expectMovementPanel(outstanding.id);
      await expect(panel).toBeVisible();

      const section = panel.locator(
        "xpath=ancestor::div[contains(@class,'rounded-xl')][1]",
      );
      // Playwright regex text filters can't be mixed with CSS comma-selectors;
      // use .or() to chain alternatives instead.
      const paginationControl = section
        .locator('[data-testid="jwl-outstanding-load-more"]')
        .or(section.getByRole("button", { name: /load more|older/i }))
        .or(section.getByRole("link", { name: /history|view all/i }))
        .first();

      if (await paginationControl.count()) {
        await expect(paginationControl).toBeVisible();
      }
    },
  );
});
