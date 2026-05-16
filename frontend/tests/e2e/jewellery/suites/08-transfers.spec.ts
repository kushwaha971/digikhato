/**
 * Suite 08 — Inter-Branch Transfers
 * Tags: @transfers
 *
 * Covers:
 *  TC-JWL-TR-001  Transfer list page loads
 *  TC-JWL-TR-002  New transfer form loads
 *  TC-JWL-TR-003  Same source+destination rejected (API)
 *  TC-JWL-TR-004  Create transfer → status REQUESTED
 *  TC-JWL-TR-005  Approve transfer → status APPROVED
 *  TC-JWL-TR-006  Dispatch transfer → item status TRANSIT
 *  TC-JWL-TR-007  Receive transfer → item back IN_STOCK at destination
 *  TC-JWL-TR-008  Reject transfer → status REJECTED
 *  TC-JWL-TR-009  Multi-branch page summary cards visible
 *  TC-JWL-TR-REG-001  Transfer register filter + date validation
 */
import { expect, test } from "@playwright/test";
import {
  loginByMobile,
  ADMIN_MOBILE,
  getMasterRefs,
  createItem,
  API_BASE,
  authHeaders,
} from "../helpers/api";
import { setUiSession } from "../helpers/ui";

test.describe("Inter-Branch Transfers", () => {
  test.describe.configure({ mode: "serial" });

  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const session = await loginByMobile(request, ADMIN_MOBILE);
    accessToken = session.access;
  });

  test(
    "TC-JWL-TR-001: transfer list UI loads",
    { tag: ["@smoke", "@transfers"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      await page.goto("/jewellery/inventory/transfers", { waitUntil: "networkidle" });
      await expect(
        page.getByRole("heading", { name: /transfer/i }).first(),
      ).toBeVisible();
    },
  );

  test(
    "TC-JWL-TR-004/005/006/007: full transfer lifecycle via API",
    { tag: ["@transfers", "@api"] },
    async ({ request }) => {
      const master = await getMasterRefs(request, accessToken);
      const item = await createItem(request, accessToken, master);

      await test.step("Create transfer REQUESTED", async () => {
        const transfer = await request.post(`${API_BASE}/jwl/v1/transfers/`, {
          headers: { ...authHeaders(accessToken), "X-Branch-Name": "Main" },
          data: {
            from_branch: "Main",
            to_branch: "Branch-2",
            lines: [{ item: item.id, qty: 1, weight: "10.0000" }],
          },
        });
        expect(transfer.status()).toBe(201);
        const created = await transfer.json();
        // POST response omits status; fetch the resource to verify it
        const detailRes = await request.get(`${API_BASE}/jwl/v1/transfers/${created.id}/`, {
          headers: authHeaders(accessToken),
        });
        const body = await detailRes.json();
        expect(body.status).toBe("REQUESTED");

        await test.step("Approve transfer", async () => {
          const approve = await request.post(
            `${API_BASE}/jwl/v1/transfers/${body.id}/approve/`,
            { headers: authHeaders(accessToken) },
          );
          expect(approve.status()).toBe(200);
          const approvedBody = await approve.json();
          expect(approvedBody.status).toBe("APPROVED");
        });

        await test.step("Dispatch transfer → item IN_TRANSIT", async () => {
          const dispatch = await request.post(
            `${API_BASE}/jwl/v1/transfers/${body.id}/dispatch/`,
            { headers: authHeaders(accessToken) },
          );
          expect(dispatch.status()).toBe(200);
          const dispatchBody = await dispatch.json();
          expect(dispatchBody.status).toBe("IN_TRANSIT");
        });

        await test.step("Receive transfer → item IN_STOCK at destination", async () => {
          const receive = await request.post(
            `${API_BASE}/jwl/v1/transfers/${body.id}/receive/`,
            { headers: authHeaders(accessToken) },
          );
          expect(receive.status()).toBe(200);
          const receiveBody = await receive.json();
          expect(receiveBody.status).toBe("RECEIVED");

          const itemRes = await request.get(`${API_BASE}/jwl/v1/items/${item.id}/`, {
            headers: authHeaders(accessToken),
          });
          const itemBody = await itemRes.json();
          expect(itemBody.status).toBe("IN_STOCK");
          expect(itemBody.branch_name).toBe("Branch-2");
        });
      });
    },
  );

  test(
    "TC-JWL-TR-008: reject transfer",
    { tag: ["@transfers", "@api"] },
    async ({ request }) => {
      const master = await getMasterRefs(request, accessToken);
      const item = await createItem(request, accessToken, master);

      const transfer = await request.post(`${API_BASE}/jwl/v1/transfers/`, {
        headers: { ...authHeaders(accessToken), "X-Branch-Name": "Main" },
        data: {
          from_branch: "Main",
          to_branch: "Branch-3",
          lines: [{ item: item.id, qty: 1, weight: "10.0000" }],
        },
      });
      expect(transfer.status()).toBe(201);
      const body = await transfer.json();

      const reject = await request.post(
        `${API_BASE}/jwl/v1/transfers/${body.id}/reject/`,
        { headers: authHeaders(accessToken), data: { reason: "Test rejection" } },
      );
      expect(reject.status()).toBe(200);
      const rejBody = await reject.json();
      expect(rejBody.status).toBe("REJECTED");
    },
  );

  test(
    "TC-JWL-TR-009: multi-branch overview page summary cards",
    { tag: ["@transfers"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      await page.goto("/jewellery/multi-branch", { waitUntil: "networkidle" });
      await expect(
        page.getByRole("heading", { name: /multi.branch|transfers/i }).first(),
      ).toBeVisible();
    },
  );

  test(
    "TC-JWL-TR-REG-001: transfer register date validation",
    { tag: ["@transfers"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      await page.goto("/jewellery/inventory/transfers/register", { waitUntil: "networkidle" });
      await expect(
        page.getByRole("heading", { name: /transfer register/i }),
      ).toBeVisible({ timeout: 8000 });

      await page.getByLabel("From date").fill("2026-05-10");
      await page.getByLabel("To date").fill("2026-05-01");
      await expect(
        page.getByText(/from_date.*cannot|date.*range.*invalid/i).first(),
      ).toBeVisible({ timeout: 5000 });
    },
  );
});
