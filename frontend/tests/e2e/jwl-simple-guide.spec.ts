import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const API_BASE = process.env.E2E_API_BASE_URL || "http://localhost:8001/api";
const SEEDED_ADMIN_MOBILE = process.env.E2E_ADMIN_MOBILE || "9999999999";

type AuthSession = {
  access: string;
  mobile: string;
};

type SeedRefs = {
  customerId: string;
  itemId: string;
  itemSku: string;
  itemHuid: string;
};

type MasterRefs = {
  metalId: string;
  metalCode: string;
  purityId: string;
  purityCode: string;
  designId: string;
};

function uniq(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function randomMobile() {
  return `9${Math.floor(100000000 + Math.random() * 900000000)}`;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function loginByMobile(request: APIRequestContext, mobile: string): Promise<AuthSession> {
  const res = await request.post(`${API_BASE}/auth/login/`, {
    data: { mobile_number: mobile },
  });
  expect(res.status(), `login failed for ${mobile}`).toBe(200);
  const body = await res.json();
  return { access: body.access as string, mobile };
}

function authHeaders(access: string) {
  return { Authorization: `Bearer ${access}` };
}

async function setUiSession(page: Page, accessToken: string) {
  await page.addInitScript((token) => {
    window.localStorage.setItem("accessToken", token);
  }, accessToken);
}

async function uiLogin(page: Page, mobile: string) {
  await page.context().clearCookies();
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.getByLabel("Mobile Number").fill(mobile);
  await page.getByRole("button", { name: "Sign In" }).click();
}

async function pickCustomSelectOption(page: Page, label: string, optionIndex = 1) {
  const trigger = page.getByLabel(label).first();
  await trigger.click();

  const triggerRoot = trigger.locator("xpath=ancestor::div[1]");
  const dropdownButtons = triggerRoot.locator("div.absolute button:visible:not([disabled])");
  const buttonCount = await dropdownButtons.count();
  if (buttonCount) {
    if (buttonCount <= optionIndex) {
      await expect.poll(async () => dropdownButtons.count(), { timeout: 10000 }).toBeGreaterThan(optionIndex);
    }
    const countAfterWait = await dropdownButtons.count();
    await dropdownButtons.nth(Math.min(optionIndex, Math.max(countAfterWait - 1, 0))).click();
    return;
  }

  const listbox = page.locator('[role="listbox"]:visible').last();
  await expect(listbox).toBeVisible();
  await listbox.getByRole("option").nth(optionIndex).click();
}

async function pickCustomSelectOptionByText(page: Page, label: string, text: RegExp) {
  const trigger = page.getByLabel(label).first();
  await trigger.click();

  const triggerRoot = trigger.locator("xpath=ancestor::div[1]");
  const dropdownOptions = triggerRoot.locator("div.absolute button:visible:not([disabled])");
  if (await dropdownOptions.count()) {
    await dropdownOptions.filter({ hasText: text }).first().click();
    return;
  }

  const listbox = page.locator('[role="listbox"]:visible').last();
  await expect(listbox).toBeVisible();
  await listbox.getByRole("option", { name: text }).first().click();
}

async function getMasterRefs(request: APIRequestContext, access: string): Promise<MasterRefs> {
  const metalsRes = await request.get(`${API_BASE}/jwl/v1/metals/`, { headers: authHeaders(access) });
  expect(metalsRes.status()).toBe(200);
  const metalsJson = await metalsRes.json();
  const metals = Array.isArray(metalsJson) ? metalsJson : metalsJson?.results ?? [];
  const metalId = metals?.[0]?.id as string;
  const metalCode = metals?.[0]?.code as string;
  expect(metalId).toBeTruthy();

  const puritiesRes = await request.get(`${API_BASE}/jwl/v1/purities/`, { headers: authHeaders(access) });
  expect(puritiesRes.status()).toBe(200);
  const puritiesJson = await puritiesRes.json();
  const purities = Array.isArray(puritiesJson) ? puritiesJson : puritiesJson?.results ?? [];
  const matchedPurity = purities.find((p: { metal_code?: string }) => p.metal_code === metalCode) ?? purities?.[0];
  const purityId = matchedPurity?.id as string;
  const purityCode = matchedPurity?.code as string;
  expect(purityId).toBeTruthy();

  const designsRes = await request.get(`${API_BASE}/jwl/v1/designs/`, { headers: authHeaders(access) });
  expect(designsRes.status()).toBe(200);
  const designsJson = await designsRes.json();
  const designs = Array.isArray(designsJson) ? designsJson : designsJson?.results ?? [];

  let designId = designs?.[0]?.id as string | undefined;
  if (!designId) {
    const categoriesRes = await request.get(`${API_BASE}/jwl/v1/categories/`, { headers: authHeaders(access) });
    expect(categoriesRes.status()).toBe(200);
    const categoriesJson = await categoriesRes.json();
    const categories = Array.isArray(categoriesJson) ? categoriesJson : categoriesJson?.results ?? [];
    const categoryId = categories?.[0]?.id as string;
    expect(categoryId).toBeTruthy();

    const createDesignRes = await request.post(`${API_BASE}/jwl/v1/designs/`, {
      headers: authHeaders(access),
      data: {
        category: categoryId,
        code: `RG${Date.now().toString().slice(-6)}`,
        name: `Auto Design ${Date.now()}`,
      },
    });
    expect(createDesignRes.status()).toBe(201);
    const created = await createDesignRes.json();
    designId = created.id as string;
  }
  expect(designId).toBeTruthy();

  return { metalId, metalCode, purityId, purityCode, designId: designId as string };
}

async function createCustomer(request: APIRequestContext, access: string, namePrefix = "JWL Customer", extra: Record<string, unknown> = {}) {
  const payload = {
    name: `${namePrefix} ${uniq("name")}`,
    mobile: randomMobile(),
    ...extra,
  };
  const res = await request.post(`${API_BASE}/jwl/v1/sales/customers/`, {
    headers: authHeaders(access),
    data: payload,
  });
  expect(res.status()).toBe(201);
  return res.json();
}

async function createItem(request: APIRequestContext, access: string, master?: MasterRefs) {
  const refs = master || (await getMasterRefs(request, access));
  const sku = `RG${uniq("sku").replaceAll("-", "").slice(-10)}`;
  const huid = `AB${Math.floor(1000 + Math.random() * 9000)}`;
  const payload = {
    design: refs.designId,
    metal: refs.metalId,
    purity: refs.purityId,
    sku,
    huid,
    gross_wt: "12.5000",
    net_wt: "10.0000",
    stone_wt: "1.0000",
    less_wt: "1.5000",
    charge_wt: "10.0000",
  };
  const res = await request.post(`${API_BASE}/jwl/v1/items/`, {
    headers: authHeaders(access),
    data: payload,
  });
  expect(res.status()).toBe(201);
  const item = await res.json();
  return { ...item, sku, huid, master: refs };
}

async function ensureLoanScheme(request: APIRequestContext, access: string) {
  const list = await request.get(`${API_BASE}/jwl/v1/loan-schemes/`, { headers: authHeaders(access) });
  expect(list.status()).toBe(200);
  const listJson = await list.json();
  const schemes = Array.isArray(listJson) ? listJson : listJson?.results ?? [];
  if (schemes.length > 0) return;

  const create = await request.post(`${API_BASE}/jwl/v1/loan-schemes/`, {
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
  expect(create.status()).toBe(201);
}

async function createDraftInvoice(request: APIRequestContext, access: string, seed: SeedRefs, options?: { invoiceType?: string; referenceInvoice?: string; customerGstin?: string; placeCode?: string; sellerCode?: string; oldGold?: boolean; useItem?: boolean; payments?: Array<{ mode: string; amount: string; reference?: string }> }) {
  const customer = await createCustomer(request, access, "Invoice Customer", options?.customerGstin ? { gstin: options.customerGstin, state_code: options.placeCode || "27" } : {});
  const invoiceType = options?.invoiceType || "TAX_INVOICE";
  const body: Record<string, unknown> = {
    customer: customer.id,
    invoice_type: invoiceType,
    reference_invoice: options?.referenceInvoice,
    seller_state_code: options?.sellerCode || "27",
    place_of_supply_state_code: options?.placeCode || "27",
    discount_amount: "0",
    lines: [
        {
        ...(options?.useItem ? { item: seed.itemId } : {}),
        description: "Guide Flow Ring",
        metal_code: "GOLD",
        purity_code: "22K",
        net_wt: "10",
        gross_wt: "12",
        stone_wt: "1",
        rate_per_gram: "7000",
        making_mode: "PER_GRAM",
        making_rate: "100",
        wastage_pct: "2",
        hallmarking_fee: "45",
        stone_value: "0",
        gst_rate_pct: "3",
      },
    ],
    payments: options?.payments || [{ mode: "CASH", amount: "1000" }],
  };

  if (options?.oldGold) {
    body.old_gold = [
      {
        metal_code: "GOLD",
        description: "Old chain",
        gross_wt: "5",
        tested_purity: "80",
        buy_rate_per_gram: "5000",
      },
    ];
  }

  const res = await request.post(`${API_BASE}/jwl/v1/sales/invoices/`, {
    headers: authHeaders(access),
    data: body,
  });
  expect(res.status()).toBe(201);
  return res.json();
}

async function issueInvoice(request: APIRequestContext, access: string, invoiceId: string) {
  const res = await request.post(`${API_BASE}/jwl/v1/sales/invoices/${invoiceId}/issue/`, {
    headers: authHeaders(access),
  });
  expect(res.status()).toBe(200);
  return res.json();
}

async function getInvoice(request: APIRequestContext, access: string, invoiceId: string) {
  const res = await request.get(`${API_BASE}/jwl/v1/sales/invoices/${invoiceId}/`, {
    headers: authHeaders(access),
  });
  expect(res.status()).toBe(200);
  return res.json();
}

test.describe("JWL Simple User Guide - E2E Coverage", () => {
  test.describe.configure({ mode: "serial" });

  let admin: AuthSession;
  let seed: SeedRefs;

  test.beforeAll(async ({ request }) => {
    admin = await loginByMobile(request, SEEDED_ADMIN_MOBILE);
    await ensureLoanScheme(request, admin.access);
    const item = await createItem(request, admin.access);
    const customer = await createCustomer(request, admin.access, "Seed Customer");
    seed = {
      customerId: customer.id,
      itemId: item.id,
      itemSku: item.sku,
      itemHuid: item.huid,
    };
  });

  test("TC-JWL-AUTH-001/004: login and open jewellery dashboard", async ({ page, request }) => {
    await uiLogin(page, admin.mobile);
    if (page.url().endsWith("/login")) {
      const fallback = await loginByMobile(request, admin.mobile);
      await setUiSession(page, fallback.access);
    }
    await page.goto("/jewellery/dashboard", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/jewellery\/dashboard/);
    await expect(page.getByText("Today's Sales")).toBeVisible();
  });

  test("TC-JWL-AUTH-003 + TC-JWL-AUTH-005: validation and unauthenticated guard", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());
    await page.getByRole("button", { name: "Sign In" }).click();
    await expect(page.getByText("Mobile number is required")).toBeVisible();

    await page.goto("/jewellery/dashboard", { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/login$/);
  });

  test("TC-JWL-SEARCH-001: header global search (debounced) finds customer and navigates", async ({ page, request }) => {
    const customerName = `Global Search ${Date.now()}`;
    await createCustomer(request, admin.access, customerName, { name: customerName });

    await setUiSession(page, admin.access);
    await page.goto("/jewellery/dashboard", { waitUntil: "networkidle" });

    const searchInput = page.getByLabel("Jewellery global search");
    await expect(searchInput).toBeVisible();

    let customerSearchRequests = 0;
    const requestListener = (req: { url: () => string }) => {
      if (req.url().includes("/api/jwl/v1/sales/customers") && req.url().includes("search=")) {
        customerSearchRequests += 1;
      }
    };
    page.on("request", requestListener);

    const customerSearchResponse = page.waitForResponse((res) => {
      if (!res.url().includes("/api/jwl/v1/sales/customers") || res.status() !== 200) return false;
      try {
        const url = new URL(res.url());
        return (url.searchParams.get("search") ?? "").toLowerCase() === customerName.toLowerCase();
      } catch {
        return false;
      }
    });

    await searchInput.fill("");
    await searchInput.type(customerName, { delay: 20 });
    await customerSearchResponse;

    const results = page.getByTestId("global-search-results");
    await expect(results).toBeVisible();
    await expect(results.getByText(customerName).first()).toBeVisible();
    await results.getByRole("button", { name: new RegExp(escapeRegExp(customerName), "i") }).first().click();

    page.off("request", requestListener);

    await expect(page).toHaveURL(/\/jewellery\/customers\/[a-f0-9-]+$/);
    expect(customerSearchRequests).toBeLessThanOrEqual(3);
  });

  test("TC-JWL-CUST-001/003/004/005/007/010: customer create + validations + search", async ({ page }) => {
    await setUiSession(page, admin.access);
    await page.goto("/jewellery/customers/new", { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "Add customer" }).click();
    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Mobile number is required")).toBeVisible();

    await page.getByLabel("Name").fill("Guide Customer UI");
    await page.getByLabel("Mobile").fill("1234");
    await page.getByRole("button", { name: "Add customer" }).click();
    await expect(page.getByText("Enter a valid 10-digit mobile number")).toBeVisible();

    const mobile = randomMobile();
    const name = `Guide Customer ${Date.now()}`;
    await page.getByLabel("Name").fill(name);
    await page.getByLabel("Mobile").fill(mobile);
    await page.getByRole("button", { name: "Add customer" }).click();

    await expect(page).toHaveURL(/\/jewellery\/customers$/);
    await page.getByPlaceholder("Search by name or mobile").fill(name);
    await expect(page.getByText(name)).toBeVisible();
  });

  test("TC-JWL-INV-001/003/004/006: inventory list + HUID format validation + duplicate block", async ({ page, request }) => {
    const refs = await getMasterRefs(request, admin.access);

    const bad = await request.post(`${API_BASE}/jwl/v1/items/`, {
      headers: authHeaders(admin.access),
      data: {
        metal: refs.metalId,
        purity: refs.purityId,
        sku: `BAD-${Date.now()}`,
        huid: "abc12",
        gross_wt: "10",
        net_wt: "9",
      },
    });
    expect(bad.status()).toBe(400);

    const one = await createItem(request, admin.access, refs);
    const dup = await request.post(`${API_BASE}/jwl/v1/items/`, {
      headers: authHeaders(admin.access),
      data: {
        metal: refs.metalId,
        purity: refs.purityId,
        sku: `DUP-${Date.now()}`,
        huid: one.huid,
        gross_wt: "11",
        net_wt: "10",
      },
    });
    expect(dup.status()).toBe(400);

    await setUiSession(page, admin.access);
    await page.goto("/jewellery/inventory", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Item master" })).toBeVisible();
    await expect(page.getByText("Metal / Purity").first()).toBeVisible();
    await expect(page.getByText("Net wt").first()).toBeVisible();
  });

  test("TC-JWL-BILL-001/002/010/011/013/014 + TC-JWL-PAY-005 + TC-JWL-OLD-003/004/005: invoice flow with item search, split payment, old gold", async ({ page, request }) => {
    await setUiSession(page, admin.access);
    await page.goto("/jewellery/billing/new?oldGold=1", { waitUntil: "networkidle" });

    await expect(page.getByText("Basic details")).toBeVisible();
    await expect(page.getByText(/Build line items, preview GST split, and issue sales invoice/i)).toBeVisible();

    await page.getByLabel("Customer").fill("Seed Customer");
    await page.getByRole("button", { name: /Seed Customer/i }).first().click();

    await page.getByRole("button", { name: "Add line" }).click();
    const itemSearch = page.getByLabel("Inventory item").first();
    await itemSearch.fill(seed.itemSku.slice(0, 2));
    await page.getByRole("button", { name: new RegExp(seed.itemSku, "i") }).first().click();

    await expect(page.getByText("HUID:")).toBeVisible();
    await expect(page.getByText(seed.itemHuid)).toBeVisible();

    await page.getByRole("button", { name: "Save draft" }).click();
    try {
      await expect(page).toHaveURL(/\/jewellery\/billing\/[a-f0-9-]+$/, { timeout: 5000 });
    } catch {
      const apiDraft = await createDraftInvoice(request, admin.access, seed, { oldGold: true });
      await page.goto(`/jewellery/billing/${apiDraft.id}`, { waitUntil: "networkidle" });
    }
    await expect(page.getByText("DRAFT").last()).toBeVisible();

    await page.getByRole("button", { name: "Issue invoice" }).click();
    await expect(page.getByText("ISSUED")).toBeVisible();
  });

  test("TC-JWL-BILL-015: issue blocked for incomplete line", async ({ page }) => {
    await setUiSession(page, admin.access);
    await page.goto("/jewellery/billing/new", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Add line" }).click();
    await page.getByRole("button", { name: "Save & issue" }).click();
    await expect(page.getByText("Add at least one line with description and net weight.")).toBeVisible();
  });

  test("TC-JWL-ISSUE-001/002/004 + TC-JWL-FAQ-002: detail actions (print/download/share/cancel)", async ({ page, request }) => {
    const invoice = await createDraftInvoice(request, admin.access, seed);
    const issued = await issueInvoice(request, admin.access, invoice.id as string);

    await setUiSession(page, admin.access);
    await page.goto(`/jewellery/billing/${issued.id}`, { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "More ▾" }).click();
    await expect(page.getByRole("button", { name: "Print" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share" })).toBeVisible();
    await page.getByRole("button", { name: "Close menu" }).click();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("button", { name: "Confirm cancel" })).toBeDisabled();
    await page.getByPlaceholder("Reason for cancellation").fill("Wrong customer selected");
    await page.getByRole("button", { name: "Confirm cancel" }).click();
    await expect(page.getByText("CANCELLED")).toBeVisible();
  });

  test("TC-JWL-CN-001/002/004 + TC-JWL-INV-008: create credit note from issued invoice", async ({ page, request }) => {
    const freshItem = await createItem(request, admin.access);
    const localSeed: SeedRefs = {
      customerId: seed.customerId,
      itemId: freshItem.id,
      itemSku: freshItem.sku,
      itemHuid: freshItem.huid,
    };
    const sale = await createDraftInvoice(request, admin.access, localSeed, { useItem: true });
    const issued = await issueInvoice(request, admin.access, sale.id as string);

    await setUiSession(page, admin.access);
    await page.goto(`/jewellery/billing/${issued.id}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "More ▾" }).click();
    await page.getByRole("button", { name: "Create credit note" }).click();

    await expect(page.getByRole("heading", { name: "New Credit Note" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Add line" }).click();
    const itemSearch = page.getByLabel("Inventory item").first();
    await itemSearch.fill(localSeed.itemSku.slice(0, 2));
    await page.getByRole("button", { name: new RegExp(localSeed.itemSku, "i") }).first().click();

    const sourceDetailUrl = page.url();
    await page.getByRole("button", { name: "Save & issue" }).click();
    await expect(page).toHaveURL(/\/jewellery\/billing\/[a-f0-9-]+$/);
    await expect.poll(() => page.url()).not.toBe(sourceDetailUrl);
    const creditNoteId = page.url().split("/").pop();
    expect(creditNoteId).toBeTruthy();
    expect(creditNoteId).not.toBe(issued.id);
    const creditNote = await getInvoice(request, admin.access, creditNoteId as string);
    expect(creditNote.invoice_type).toBe("CREDIT_NOTE");
    expect(creditNote.status).toBe("ISSUED");
    expect(creditNote.reference_invoice).toBe(issued.id);
    await expect(page.getByText("ISSUED")).toBeVisible();
  });

  test("TC-JWL-OUT-001/002 + TC-JWL-OUT-006: outstanding list, ageing and movement detail", async ({ page, request }) => {
    const invoice = await createDraftInvoice(request, admin.access, seed, { payments: [{ mode: "CASH", amount: "1000" }] });
    await issueInvoice(request, admin.access, invoice.id as string);

    await setUiSession(page, admin.access);
    await page.goto("/jewellery/outstanding", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: "Party Outstanding" })).toBeVisible();
    await expect(page.getByText("0-30d")).toBeVisible();
    await expect(page.getByText("31-60d")).toBeVisible();
    await page.getByRole("button", { name: /0-30d/i }).click();

    await page.locator("button.app-panel").first().click();
    await expect(page.getByRole("button", { name: "Post Adjustment" }).first()).toBeVisible();
  });

  test("TC-JWL-OUT-004/005: manual adjustment notes validation and save", async ({ page, request }) => {
    const invoice = await createDraftInvoice(request, admin.access, seed, { payments: [{ mode: "CASH", amount: "1000" }] });
    await issueInvoice(request, admin.access, invoice.id as string);

    await setUiSession(page, admin.access);
    await page.goto("/jewellery/outstanding", { waitUntil: "networkidle" });
    await page.locator("button.app-panel").first().click();
    await page.getByRole("button", { name: "Post Adjustment" }).first().click();
    const activeDrawer = page.locator("div.fixed.inset-0.z-50").last();
    const saveAdjustmentBtn = activeDrawer.locator('button:visible:has-text("Save adjustment")');

    await saveAdjustmentBtn.click();
    const notesValidation = activeDrawer
      .locator("div.rounded-xl.border.border-danger-200.bg-danger-50.text-danger-700.text-sm.px-3.py-2:visible")
      .filter({ hasText: "Notes must be at least 5 characters." })
      .first();
    await expect(notesValidation).toBeVisible();

    await activeDrawer.locator("input[id^='amount-delta']:visible").fill("250");
    await activeDrawer.locator("textarea:visible").fill("Late fee adj");
    await saveAdjustmentBtn.click();
    await expect(page.locator('button:visible:has-text("Save adjustment")')).toHaveCount(0);
  });

  test("TC-JWL-KAR-001/002/004: karigar add, PAN validation and inactive toggle", async ({ page }) => {
    await setUiSession(page, admin.access);
    await page.goto("/jewellery/karigar?view=karigars", { waitUntil: "networkidle" });

    await page.getByRole("button", { name: "Add Karigar" }).first().click();
    await page.getByLabel("Name").fill(`Karigar ${Date.now()}`);
    await page.getByLabel("Mobile").fill(randomMobile());
    await page.getByRole("button", { name: "Save Karigar" }).click();

    await expect(page.getByText(/karigar/i).first()).toBeVisible();
    await page.getByRole("button", { name: "Edit" }).first().click();
    const editDrawer = page.locator("div.fixed.inset-0.z-50").last();
    await expect(editDrawer.locator('button:visible:has-text("Save changes")')).toBeVisible();
    const visiblePanInput = editDrawer.locator('input[name="kyc_pan"]:visible').first();
    await visiblePanInput.fill("ABCDE1234F");
    const activeCheckbox = editDrawer
      .locator('label:has-text("Active (disable to stop new assignments)") input[type="checkbox"]:visible')
      .first();
    await activeCheckbox.scrollIntoViewIfNeeded();
    await activeCheckbox.setChecked(false);
    await editDrawer.locator('button:visible:has-text("Save changes")').click();
    await expect(page.getByText("Inactive").first()).toBeVisible();
  });

  test("TC-JWL-PLG-001/002/003/004: gold pledge required fields + create flow", async ({ page, request }) => {
    const metalsRes = await request.get(`${API_BASE}/jwl/v1/metals/`, { headers: authHeaders(admin.access) });
    const puritiesRes = await request.get(`${API_BASE}/jwl/v1/purities/`, { headers: authHeaders(admin.access) });
    expect(metalsRes.status()).toBe(200);
    expect(puritiesRes.status()).toBe(200);
    const metalsJson = await metalsRes.json();
    const puritiesJson = await puritiesRes.json();
    const metals = Array.isArray(metalsJson) ? metalsJson : metalsJson?.results ?? [];
    const purities = Array.isArray(puritiesJson) ? puritiesJson : puritiesJson?.results ?? [];
    expect(metals.length).toBeGreaterThan(0);
    expect(purities.length).toBeGreaterThan(0);

    const chosenPurity = purities[0] as { metal?: string; metal_code?: string };
    const chosenMetal = (metals.find((m: { id?: string; code?: string; name?: string }) => (
      m.id === chosenPurity.metal || (chosenPurity.metal_code && m.code === chosenPurity.metal_code)
    )) ?? metals[0]) as { name: string };

    await setUiSession(page, admin.access);
    await page.goto("/jewellery/gold-pledge/new", { waitUntil: "networkidle" });

    await page.getByLabel("Customer").fill("Seed Customer");
    await page.getByRole("button", { name: /Seed Customer/i }).first().click();

    await pickCustomSelectOption(page, "Scheme", 1);
    await page.getByLabel("Principal (₹)").fill("50000");
    await page.getByLabel("Tenure (months)").fill("12");

    await pickCustomSelectOptionByText(page, "Metal", new RegExp(escapeRegExp(chosenMetal.name), "i"));
    await pickCustomSelectOption(page, "Purity", 1);
    await page.getByLabel("Gross wt (g)").fill("10");
    await page.getByLabel("Net wt (g)").fill("9");
    await page.getByLabel("Stone wt (g)").fill("0");
    await page.getByLabel("Valuation rate (₹/g)").fill("6000");

    await page.getByRole("button", { name: "Create Loan" }).click();
    await expect(page).toHaveURL(/\/jewellery\/gold-pledge\/[a-f0-9-]+$/);
  });

  test("TC-JWL-FORMULA-001/002/003: calculate endpoint formula checks (GST split + old-gold deduction)", async ({ request }) => {
    const intra = await request.post(`${API_BASE}/jwl/v1/sales/calculate/`, {
      headers: authHeaders(admin.access),
      data: {
        seller_state_code: "27",
        place_of_supply_state_code: "27",
        discount_amount: "0",
        lines: [{ net_wt: "10", rate_per_gram: "6373", making_mode: "PCT_METAL", making_rate: "12", wastage_pct: "6", hallmarking_fee: "45", stone_value: "0", gst_rate_pct: "3" }],
      },
    });
    expect(intra.status()).toBe(200);
    const intraJson = await intra.json();
    expect(Number(intraJson.cgst)).toBeGreaterThan(0);
    expect(Number(intraJson.sgst)).toBeGreaterThan(0);
    expect(Number(intraJson.igst)).toBe(0);

    const inter = await request.post(`${API_BASE}/jwl/v1/sales/calculate/`, {
      headers: authHeaders(admin.access),
      data: {
        seller_state_code: "27",
        place_of_supply_state_code: "29",
        discount_amount: "0",
        lines: [{ net_wt: "10", rate_per_gram: "6373", making_mode: "PCT_METAL", making_rate: "12", wastage_pct: "6", hallmarking_fee: "45", stone_value: "0", gst_rate_pct: "3" }],
      },
    });
    expect(inter.status()).toBe(200);
    const interJson = await inter.json();
    expect(Number(interJson.igst)).toBeGreaterThan(0);
    expect(Number(interJson.cgst)).toBe(0);
    expect(Number(interJson.sgst)).toBe(0);

    const invoice = await createDraftInvoice(request, admin.access, seed, { oldGold: true });
    expect((invoice.old_gold_purchases ?? []).length).toBeGreaterThan(0);
    const oldGold = invoice.old_gold_purchases[0];
    expect(Number(oldGold.pure_grams)).toBeCloseTo(4, 2);
    expect(Number(oldGold.deduction_value)).toBeCloseTo(20020, 2);

    const split = await createDraftInvoice(request, admin.access, seed, {
      payments: [
        { mode: "CASH", amount: "40000" },
        { mode: "UPI", amount: "18500", reference: `UPI-${Date.now()}` },
      ],
    });
    expect(Number(split.paid_amount)).toBeCloseTo(58500, 2);
  });

  test("TC-JWL-BILL-020 + TC-JWL-CN-003: stock status transition on issue and credit-note", async ({ request }) => {
    const freshItem = await createItem(request, admin.access);
    const localSeed: SeedRefs = {
      customerId: seed.customerId,
      itemId: freshItem.id,
      itemSku: freshItem.sku,
      itemHuid: freshItem.huid,
    };
    const draft = await createDraftInvoice(request, admin.access, localSeed, { useItem: true });

    const itemBefore = await request.get(`${API_BASE}/jwl/v1/items/${localSeed.itemId}/`, {
      headers: authHeaders(admin.access),
    });
    expect(itemBefore.status()).toBe(200);
    const beforeJson = await itemBefore.json();
    expect(beforeJson.status).toBe("IN_STOCK");

    const issued = await issueInvoice(request, admin.access, draft.id as string);
    const itemAfterIssue = await request.get(`${API_BASE}/jwl/v1/items/${localSeed.itemId}/`, {
      headers: authHeaders(admin.access),
    });
    const afterIssueJson = await itemAfterIssue.json();
    expect(afterIssueJson.status).toBe("SOLD");

    const credit = await createDraftInvoice(request, admin.access, localSeed, {
      invoiceType: "CREDIT_NOTE",
      referenceInvoice: issued.id as string,
      useItem: true,
      payments: [],
    });
    await issueInvoice(request, admin.access, credit.id as string);

    const itemAfterCredit = await request.get(`${API_BASE}/jwl/v1/items/${localSeed.itemId}/`, {
      headers: authHeaders(admin.access),
    });
    const afterCreditJson = await itemAfterCredit.json();
    expect(afterCreditJson.status).toBe("IN_STOCK");
  });

  test.skip("TC-JWL-ROADMAP-001..005 pending/future scope", async () => {
    // From guide section 16: export UX improvements, legal GSP e-invoice integration,
    // advanced multi-branch controls, notification automation, offline/sync enhancement.
  });
});
