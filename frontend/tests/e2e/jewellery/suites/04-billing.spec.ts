/**
 * Suite 04 — Billing & Invoice Workflows
 * Tags: @smoke @billing
 *
 * Covers:
 *  TC-JWL-BILL-001  New invoice form loads
 *  TC-JWL-BILL-002  Save draft — item transitions to SOLD on issue
 *  TC-JWL-BILL-003  Issue blocked for incomplete line
 *  TC-JWL-BILL-004  Cancel issued invoice → status CANCELLED + item back IN_STOCK
 *  TC-JWL-BILL-005  Credit note created from issued invoice
 *  TC-JWL-BILL-006  Estimate type does NOT move stock
 *  TC-JWL-BILL-007  Estimate → convert to Tax Invoice
 *  TC-JWL-BILL-008  GST split: intra-state → CGST+SGST; inter-state → IGST
 *  TC-JWL-BILL-009  Old gold deduction reduces balance payable
 *  TC-JWL-BILL-010  Split payment across Cash + UPI
 *  TC-JWL-BILL-011  Invoice list loads and supports search/filter
 *  TC-JWL-BILL-012  Print/share/download actions visible on issued invoice
 *  TC-JWL-BILL-013  B2B invoice with GSTIN accepted
 */
import { expect, test } from "@playwright/test";
import {
  loginByMobile,
  ADMIN_MOBILE,
  getMasterRefs,
  createItem,
  createCustomer,
  createDraftInvoice,
  issueInvoice,
  cancelInvoice,
  getInvoice,
  API_BASE,
  authHeaders,
  type ItemRefs,
  type MasterRefs,
} from "../helpers/api";
import { setUiSession } from "../helpers/ui";
import { BillingPage } from "../pages/BillingPage";

test.describe("Billing & Invoice Workflows", () => {
  test.describe.configure({ mode: "serial" });

  let accessToken: string;
  let masterRefs: MasterRefs;
  let seedItem: ItemRefs;
  let seedCustomerId: string;

  test.beforeAll(async ({ request }) => {
    const session = await loginByMobile(request, ADMIN_MOBILE);
    accessToken = session.access;
    masterRefs = await getMasterRefs(request, accessToken);
    seedItem = await createItem(request, accessToken, masterRefs);
    const customer = await createCustomer(request, accessToken);
    seedCustomerId = customer.id;
  });

  test(
    "TC-JWL-BILL-001: new invoice form loads correctly",
    { tag: ["@smoke", "@billing"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      const billing = new BillingPage(page);
      await billing.gotoNew();

      await expect(page.getByText(/basic details|new invoice/i).first()).toBeVisible();
      await expect(page.getByRole("button", { name: /add line/i })).toBeVisible();
    },
  );

  test(
    "TC-JWL-BILL-002: draft invoice created → issue → item becomes SOLD",
    { tag: ["@smoke", "@billing"] },
    async ({ request }) => {
      const item = await createItem(request, accessToken, masterRefs);

      await test.step("Create draft with item", async () => {
        const draft = await createDraftInvoice(request, accessToken, item, {
          useItemId: item.id,
        });
        expect(draft.status).toBe("DRAFT");
      });

      await test.step("Issue invoice and verify item is SOLD", async () => {
        const item2 = await createItem(request, accessToken, masterRefs);
        const draft = await createDraftInvoice(request, accessToken, item2, {
          useItemId: item2.id,
        });
        const issued = await issueInvoice(request, accessToken, draft.id);
        expect(issued.status).toBe("ISSUED");

        const itemDetail = await request.get(`${API_BASE}/jwl/v1/items/${item2.id}/`, {
          headers: authHeaders(accessToken),
        });
        const itemBody = await itemDetail.json();
        expect(itemBody.status).toBe("SOLD");
      });
    },
  );

  test(
    "TC-JWL-BILL-003: issue blocked for empty line (UI validation)",
    { tag: ["@billing"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      const billing = new BillingPage(page);
      await billing.gotoNew();
      await billing.addLineManual({});
      await billing.saveAndIssue();
      await expect(
        page.getByText(/add at least one line|description.*net weight/i).first(),
      ).toBeVisible({ timeout: 8000 });
    },
  );

  test(
    "TC-JWL-BILL-004: cancel issued invoice → CANCELLED + item back IN_STOCK",
    { tag: ["@billing"] },
    async ({ page, request }) => {
      const item = await createItem(request, accessToken, masterRefs);
      const draft = await createDraftInvoice(request, accessToken, item, { useItemId: item.id });
      const issued = await issueInvoice(request, accessToken, draft.id);

      await setUiSession(page, accessToken);
      const billing = new BillingPage(page);
      await billing.gotoDetail(issued.id);
      await billing.cancelInvoice("Wrong item entered during test");
      await billing.expectStatus("CANCELLED");

      await test.step("Verify item reverted to IN_STOCK", async () => {
        const itemRes = await request.get(`${API_BASE}/jwl/v1/items/${item.id}/`, {
          headers: authHeaders(accessToken),
        });
        const itemBody = await itemRes.json();
        expect(itemBody.status).toBe("IN_STOCK");
      });
    },
  );

  test(
    "TC-JWL-BILL-005: credit note from issued invoice",
    { tag: ["@billing"] },
    async ({ page, request }) => {
      const item = await createItem(request, accessToken, masterRefs);
      const draft = await createDraftInvoice(request, accessToken, item, { useItemId: item.id });
      const issued = await issueInvoice(request, accessToken, draft.id);

      await setUiSession(page, accessToken);
      const billing = new BillingPage(page);
      await billing.gotoDetail(issued.id);
      await billing.createCreditNote();

      await expect(page.getByRole("heading", { name: /credit note/i }).first()).toBeVisible();
      await page.getByRole("button", { name: "Add line" }).click();
      const itemSearch = page.getByLabel("Inventory item").first();
      await itemSearch.fill(item.sku.slice(0, 4));
      const btn = page.getByRole("button", { name: new RegExp(item.sku, "i") }).first();
      await expect(btn).toBeVisible({ timeout: 8000 });
      await btn.click();

      const sourceUrl = page.url();
      await billing.saveAndIssue();
      await expect(page).toHaveURL(/\/jewellery\/billing\/[a-f0-9-]+$/);
      await expect.poll(() => page.url()).not.toBe(sourceUrl);

      const creditNoteId = page.url().split("/").pop() as string;
      const cn = await getInvoice(request, accessToken, creditNoteId);
      expect(cn.invoice_type).toBe("CREDIT_NOTE");
      expect(cn.status).toBe("ISSUED");
      expect(cn.reference_invoice).toBe(issued.id);
    },
  );

  test(
    "TC-JWL-BILL-006: estimate does NOT move stock",
    { tag: ["@billing", "@api"] },
    async ({ request }) => {
      const item = await createItem(request, accessToken, masterRefs);

      await test.step("Item is IN_STOCK before estimate", async () => {
        const before = await request.get(`${API_BASE}/jwl/v1/items/${item.id}/`, {
          headers: authHeaders(accessToken),
        });
        expect((await before.json()).status).toBe("IN_STOCK");
      });

      const estimate = await createDraftInvoice(request, accessToken, item, {
        invoiceType: "ESTIMATE",
        useItemId: item.id,
      });
      const issued = await issueInvoice(request, accessToken, estimate.id);
      expect(issued.status).toBe("ISSUED");
      expect(issued.invoice_type).toBe("ESTIMATE");

      await test.step("Item still IN_STOCK after estimate issued", async () => {
        const after = await request.get(`${API_BASE}/jwl/v1/items/${item.id}/`, {
          headers: authHeaders(accessToken),
        });
        expect((await after.json()).status).toBe("IN_STOCK");
      });
    },
  );

  test(
    "TC-JWL-BILL-007: estimate → convert to Tax Invoice draft",
    { tag: ["@billing"] },
    async ({ page, request }) => {
      const estimate = await createDraftInvoice(request, accessToken, seedItem, {
        invoiceType: "ESTIMATE",
      });

      await setUiSession(page, accessToken);
      const billing = new BillingPage(page);
      await billing.gotoDetail(estimate.id);
      const sourceUrl = page.url();
      await billing.clickConvertToInvoice();

      await expect(page).toHaveURL(/\/jewellery\/billing\/[a-f0-9-]+$/);
      await expect.poll(() => page.url()).not.toBe(sourceUrl);

      const convertedId = page.url().split("/").pop() as string;
      const converted = await getInvoice(request, accessToken, convertedId);
      expect(converted.invoice_type).toBe("TAX_INVOICE");
      expect(converted.reference_invoice).toBeNull();
    },
  );

  test(
    "TC-JWL-BILL-008: GST split — intra-state vs inter-state",
    { tag: ["@billing", "@api"] },
    async ({ request }) => {
      await test.step("Same state → CGST + SGST, IGST = 0", async () => {
        const res = await request.post(`${API_BASE}/jwl/v1/sales/calculate/`, {
          headers: authHeaders(accessToken),
          data: {
            seller_state_code: "27",
            place_of_supply_state_code: "27",
            discount_amount: "0",
            lines: [{
              net_wt: "10",
              rate_per_gram: "6373",
              making_mode: "PCT_METAL",
              making_rate: "12",
              wastage_pct: "6",
              hallmarking_fee: "45",
              stone_value: "0",
              gst_rate_pct: "3",
            }],
          },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(Number(body.cgst)).toBeGreaterThan(0);
        expect(Number(body.sgst)).toBeGreaterThan(0);
        expect(Number(body.igst)).toBe(0);
        expect(Number(body.cgst)).toBeCloseTo(Number(body.sgst), 2);
      });

      await test.step("Different state → IGST, CGST + SGST = 0", async () => {
        const res = await request.post(`${API_BASE}/jwl/v1/sales/calculate/`, {
          headers: authHeaders(accessToken),
          data: {
            seller_state_code: "27",
            place_of_supply_state_code: "29",
            discount_amount: "0",
            lines: [{
              net_wt: "10",
              rate_per_gram: "6373",
              making_mode: "PCT_METAL",
              making_rate: "12",
              wastage_pct: "6",
              hallmarking_fee: "45",
              stone_value: "0",
              gst_rate_pct: "3",
            }],
          },
        });
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(Number(body.igst)).toBeGreaterThan(0);
        expect(Number(body.cgst)).toBe(0);
        expect(Number(body.sgst)).toBe(0);
      });
    },
  );

  test(
    "TC-JWL-BILL-009: old gold deduction in invoice",
    { tag: ["@billing", "@api"] },
    async ({ request }) => {
      const invoice = await createDraftInvoice(request, accessToken, seedItem, {
        oldGold: true,
      });
      expect(invoice.old_gold_purchases?.length).toBeGreaterThan(0);
      const og = invoice.old_gold_purchases[0];
      expect(Number(og.pure_grams)).toBeGreaterThan(0);
      expect(Number(og.deduction_value)).toBeGreaterThan(0);
    },
  );

  test(
    "TC-JWL-BILL-010: split payment across CASH + UPI",
    { tag: ["@billing", "@api"] },
    async ({ request }) => {
      const invoice = await createDraftInvoice(request, accessToken, seedItem, {
        payments: [
          { mode: "CASH", amount: "40000" },
          { mode: "UPI", amount: "18500", reference: `UPI-${Date.now()}` },
        ],
      });
      expect(Number(invoice.paid_amount)).toBeCloseTo(58500, 2);
      expect(invoice.payments.length).toBe(2);
    },
  );

  test(
    "TC-JWL-BILL-011: invoice list UI loads and filters",
    { tag: ["@billing"] },
    async ({ page }) => {
      await setUiSession(page, accessToken);
      const billing = new BillingPage(page);
      await billing.gotoList();
      await billing.expectListVisible();
    },
  );

  test(
    "TC-JWL-BILL-012: print/share/download actions visible on issued invoice",
    { tag: ["@billing"] },
    async ({ page, request }) => {
      const item = await createItem(request, accessToken, masterRefs);
      const draft = await createDraftInvoice(request, accessToken, item);
      const issued = await issueInvoice(request, accessToken, draft.id);

      await setUiSession(page, accessToken);
      const billing = new BillingPage(page);
      await billing.gotoDetail(issued.id);
      await billing.openMoreMenu();

      await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
      await expect(page.getByRole("button", { name: /download/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /share/i })).toBeVisible();
    },
  );

  test(
    "TC-JWL-BILL-013: B2B invoice with customer GSTIN accepted",
    { tag: ["@billing", "@api"] },
    async ({ request }) => {
      const customer = await createCustomer(request, accessToken, {
        gstin: "27AABCU9603R1ZX",
        state_code: "27",
      });
      const draft = await createDraftInvoice(request, accessToken, seedItem, {
        customerId: customer.id,
        customerGstin: "27AABCU9603R1ZX",
        placeCode: "27",
      });
      expect(draft.id).toBeTruthy();
      const issued = await issueInvoice(request, accessToken, draft.id);
      expect(issued.status).toBe("ISSUED");
    },
  );
});
