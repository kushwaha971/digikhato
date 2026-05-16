/**
 * Suite 03 — Inventory Management
 * Tags: @smoke @inventory
 *
 * Covers:
 *  TC-JWL-INV-001  Item list loads with correct columns
 *  TC-JWL-INV-002  Create item via API — appears in list
 *  TC-JWL-INV-003  HUID format validation (API rejects bad format)
 *  TC-JWL-INV-004  Duplicate HUID rejected
 *  TC-JWL-INV-005  Item detail shows correct metadata
 *  TC-JWL-INV-006  Scan endpoint finds item by barcode
 *  TC-JWL-INV-007  Scan endpoint finds item by HUID
 *  TC-JWL-INV-008  Write-off changes item status to WRITTEN_OFF
 *  TC-JWL-INV-009  Item status IN_STOCK shown in list
 *  TC-JWL-INV-010  Barcode/RFID page loads and filters
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
import { InventoryPage } from "../pages/InventoryPage";

test.describe("Inventory Management", () => {
  test.describe.configure({ mode: "serial" });

  let accessToken: string;

  test.beforeAll(async ({ request }) => {
    const session = await loginByMobile(request, ADMIN_MOBILE);
    accessToken = session.access;
  });

  test(
    "TC-JWL-INV-001: item list UI loads with correct columns",
    { tag: ["@smoke", "@inventory"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.gotoList();
      await inventoryPage.expectListVisible();
    },
  );

  test(
    "TC-JWL-INV-002: create item via API and verify it appears in list",
    { tag: ["@inventory"] },
    async ({ page, request }) => {
      const master = await getMasterRefs(request, accessToken);
      const item = await createItem(request, accessToken, master);

      await setUiSession(page, accessToken);
      const inventoryPage = new InventoryPage(page);
      await inventoryPage.gotoList();
      await inventoryPage.expectItemInList(item.sku);
    },
  );

  test(
    "TC-JWL-INV-003/004: HUID validation — bad format and duplicate rejected",
    { tag: ["@inventory", "@api"] },
    async ({ request }) => {
      const master = await getMasterRefs(request, accessToken);

      await test.step("Bad HUID format (< 6 chars alphanumeric) rejected", async () => {
        const bad = await request.post(`${API_BASE}/jwl/v1/items/`, {
          headers: authHeaders(accessToken),
          data: {
            metal: master.metalId,
            purity: master.purityId,
            sku: `BAD-${Date.now()}`,
            huid: "abc",
            gross_wt: "10",
            net_wt: "9",
          },
        });
        expect(bad.status()).toBe(400);
      });

      await test.step("Duplicate HUID rejected", async () => {
        const item = await createItem(request, accessToken, master);
        const dup = await request.post(`${API_BASE}/jwl/v1/items/`, {
          headers: authHeaders(accessToken),
          data: {
            metal: master.metalId,
            purity: master.purityId,
            sku: `DUP-${Date.now()}`,
            huid: item.huid,
            gross_wt: "11",
            net_wt: "10",
          },
        });
        expect(dup.status()).toBe(400);
      });
    },
  );

  test(
    "TC-JWL-INV-005: item detail page shows metadata",
    { tag: ["@inventory"] },
    async ({ page, request }) => {
      const master = await getMasterRefs(request, accessToken);
      const item = await createItem(request, accessToken, master);

      await setUiSession(page, accessToken);
      await page.goto(`/jewellery/inventory/${item.id}`, { waitUntil: "networkidle" });

      await expect(page.getByText(item.sku).first()).toBeVisible({ timeout: 8000 });
      // Scope to the header metadata card to avoid matching hidden sidebar links on mobile.
      const metaCard = page.locator("section.app-panel").first();
      await expect(metaCard.getByText(/in stock/i)).toBeVisible();
      await expect(
        metaCard.getByText(
          new RegExp(`${item.master.metalCode}\\s*\\/\\s*${item.master.purityCode}`, "i"),
        ),
      ).toBeVisible();
    },
  );

  test(
    "TC-JWL-INV-006/007: scan endpoint — barcode and HUID lookup",
    { tag: ["@inventory", "@api"] },
    async ({ request }) => {
      const master = await getMasterRefs(request, accessToken);
      const item = await createItem(request, accessToken, master);

      await test.step("Scan by HUID", async () => {
        const res = await request.get(`${API_BASE}/jwl/v1/items/scan/${item.huid}/`, {
          headers: authHeaders(accessToken),
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(item.id);
      });

      if (item.barcode) {
        await test.step("Scan by barcode", async () => {
          const res = await request.get(`${API_BASE}/jwl/v1/items/scan/${item.barcode}/`, {
            headers: authHeaders(accessToken),
          });
          expect(res.status()).toBe(200);
          const body = await res.json();
          expect(body.id).toBe(item.id);
        });
      }

      await test.step("Scan unknown code returns 404", async () => {
        const res = await request.get(`${API_BASE}/jwl/v1/items/scan/UNKNOWN-CODE-99999/`, {
          headers: authHeaders(accessToken),
        });
        expect(res.status()).toBe(404);
      });
    },
  );

  test(
    "TC-JWL-INV-008: write-off changes item status to WRITTEN_OFF",
    { tag: ["@inventory", "@api"] },
    async ({ request }) => {
      const master = await getMasterRefs(request, accessToken);
      const item = await createItem(request, accessToken, master);

      const writeOff = await request.post(
        `${API_BASE}/jwl/v1/items/${item.id}/write-off/`,
        {
          headers: authHeaders(accessToken),
          data: { reason: "Damaged in transport" },
        },
      );
      expect(writeOff.status()).toBe(200);

      const detail = await request.get(`${API_BASE}/jwl/v1/items/${item.id}/`, {
        headers: authHeaders(accessToken),
      });
      const body = await detail.json();
      expect(body.status).toBe("WRITTEN_OFF");
    },
  );

  test(
    "TC-JWL-INV-009: write-off rejects already-sold item",
    { tag: ["@inventory", "@api"] },
    async ({ request }) => {
      // Direct PATCH cannot change status to SOLD — use an existing SOLD item from the DB
      const listRes = await request.get(`${API_BASE}/jwl/v1/items/?status=SOLD&page_size=1`, {
        headers: authHeaders(accessToken),
      });
      const listBody = await listRes.json();
      const soldItems = listBody?.results ?? [];

      if (soldItems.length === 0) {
        test.skip(true, "No SOLD items in DB — skipping write-off rejection check");
        return;
      }

      const soldItemId = soldItems[0].id;
      const writeOff = await request.post(
        `${API_BASE}/jwl/v1/items/${soldItemId}/write-off/`,
        {
          headers: authHeaders(accessToken),
          data: { reason: "E2E: write-off sold item should fail" },
        },
      );
      expect(writeOff.status()).toBe(400);
    },
  );

  test(
    "TC-JWL-INV-010: barcode/RFID page loads and filters by HUID",
    { tag: ["@inventory"] },
    async ({ page, request }) => {
      const master = await getMasterRefs(request, accessToken);
      const item = await createItem(request, accessToken, master);

      await setUiSession(page, accessToken);
      await page.goto("/jewellery/barcode-rfid", { waitUntil: "networkidle" });
      await expect(
        page.getByRole("heading", { name: /barcode|rfid|tagged/i }).first(),
      ).toBeVisible();
      await expect(page.getByTestId("tagged-items-table")).toBeVisible({ timeout: 8000 });
      await expect(page.getByTestId("tagged-items-table").getByText(item.huid)).toBeVisible({
        timeout: 8000,
      });
    },
  );
});
