/**
 * Jewellery ERP — E2E API helpers
 * All direct backend calls used by tests.
 */
import { type APIRequestContext } from "@playwright/test";

export const API_BASE = process.env.E2E_API_BASE_URL || "http://localhost:8001/api";
export const ADMIN_MOBILE = process.env.E2E_ADMIN_MOBILE || "9999999999";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type AuthSession = { access: string; mobile: string; userId?: string };

export async function loginByMobile(
  request: APIRequestContext,
  mobile: string,
): Promise<AuthSession> {
  const res = await request.post(`${API_BASE}/auth/login/`, {
    data: { mobile_number: mobile },
  });
  if (!res.ok()) throw new Error(`Login failed for ${mobile}: ${res.status()}`);
  const body = await res.json();
  return { access: body.access as string, mobile, userId: body.id };
}

export function authHeaders(access: string) {
  return { Authorization: `Bearer ${access}` };
}

// ─── Generators ───────────────────────────────────────────────────────────────

let _seq = 0;
export function uniq(prefix = "T"): string {
  _seq += 1;
  return `${prefix}-${Date.now()}-${_seq}`;
}

export function randomMobile(): string {
  return `9${Math.floor(100_000_000 + Math.random() * 900_000_000)}`;
}

function uniqToken(width: number): string {
  _seq += 1;
  const token = `${Date.now().toString(36)}${_seq.toString(36)}`.toUpperCase();
  return token.slice(-width).padStart(width, "0");
}

function genHuid(): string {
  // HUID validator expects exactly 6 uppercase alnum chars.
  return `H${uniqToken(5)}`;
}

function genBarcode(): string {
  return `B${uniqToken(8)}`;
}

// ─── Master data ──────────────────────────────────────────────────────────────

export type MasterRefs = {
  metalId: string;
  metalCode: string;
  purityId: string;
  purityCode: string;
  categoryId: string;
  designId: string;
};

export async function getMasterRefs(
  request: APIRequestContext,
  access: string,
): Promise<MasterRefs> {
  const metals = await request
    .get(`${API_BASE}/jwl/v1/metals/`, { headers: authHeaders(access) })
    .then((r) => r.json());
  const metalList = Array.isArray(metals) ? metals : metals?.results ?? [];
  const metal = metalList[0];
  if (!metal) throw new Error("No metals found — run seed_jewellery_defaults first");

  const purities = await request
    .get(`${API_BASE}/jwl/v1/purities/`, { headers: authHeaders(access) })
    .then((r) => r.json());
  const purityList = Array.isArray(purities) ? purities : purities?.results ?? [];
  const purity =
    purityList.find(
      (p: { metal_code?: string }) => p.metal_code === metal.code,
    ) ?? purityList[0];
  if (!purity) throw new Error("No purities found");

  const categories = await request
    .get(`${API_BASE}/jwl/v1/categories/`, { headers: authHeaders(access) })
    .then((r) => r.json());
  const catList = Array.isArray(categories) ? categories : categories?.results ?? [];
  let categoryId: string = catList[0]?.id;
  if (!categoryId) {
    const created = await request.post(`${API_BASE}/jwl/v1/categories/`, {
      headers: authHeaders(access),
      data: { name: "Rings" },
    });
    categoryId = (await created.json()).id;
  }

  const designs = await request
    .get(`${API_BASE}/jwl/v1/designs/`, { headers: authHeaders(access) })
    .then((r) => r.json());
  const designList = Array.isArray(designs) ? designs : designs?.results ?? [];
  let designId: string = designList[0]?.id;
  if (!designId) {
    const created = await request.post(`${API_BASE}/jwl/v1/designs/`, {
      headers: authHeaders(access),
      data: {
        category: categoryId,
        code: `D${Date.now().toString().slice(-6)}`,
        name: `Auto Design ${Date.now()}`,
      },
    });
    designId = (await created.json()).id;
  }

  return {
    metalId: metal.id,
    metalCode: metal.code,
    purityId: purity.id,
    purityCode: purity.code,
    categoryId,
    designId,
  };
}

// ─── Customer ─────────────────────────────────────────────────────────────────

export type CustomerPayload = {
  name?: string;
  mobile?: string;
  gstin?: string;
  state_code?: string;
  pan?: string;
};

export async function createCustomer(
  request: APIRequestContext,
  access: string,
  overrides: CustomerPayload = {},
) {
  const payload = {
    name: overrides.name ?? `Test Customer ${uniq("C")}`,
    mobile: overrides.mobile ?? randomMobile(),
    ...overrides,
  };
  const res = await request.post(`${API_BASE}/jwl/v1/sales/customers/`, {
    headers: authHeaders(access),
    data: payload,
  });
  if (!res.ok()) throw new Error(`createCustomer failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

// ─── Inventory item ───────────────────────────────────────────────────────────

export type ItemRefs = {
  id: string;
  sku: string;
  huid: string;
  barcode?: string;
  master: MasterRefs;
};

export async function createItem(
  request: APIRequestContext,
  access: string,
  master?: MasterRefs,
): Promise<ItemRefs> {
  const refs = master ?? (await getMasterRefs(request, access));
  let lastError = "";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const sku = `SK${uniq("").replaceAll("-", "").slice(-10)}`;
    const huid = genHuid();
    const barcode = genBarcode();

    const res = await request.post(`${API_BASE}/jwl/v1/items/`, {
      headers: { ...authHeaders(access), "X-Branch-Name": "Main" },
      data: {
        design: refs.designId,
        metal: refs.metalId,
        purity: refs.purityId,
        sku,
        huid,
        barcode,
        gross_wt: "12.5000",
        net_wt: "10.0000",
        stone_wt: "1.0000",
        less_wt: "1.5000",
        charge_wt: "10.0000",
      },
    });
    if (res.ok()) {
      const item = await res.json();
      return { id: item.id, sku, huid, barcode, master: refs };
    }

    const body = await res.text();
    lastError = `createItem failed: ${res.status()} ${body}`;
    const duplicateConstraint =
      body.includes("uniq_jwl_item_tenant_huid_nonempty") ||
      body.includes("duplicate key value violates unique constraint");
    if (!duplicateConstraint) break;
  }

  throw new Error(lastError || "createItem failed after retries");
}

// ─── Invoice ──────────────────────────────────────────────────────────────────

export type InvoiceOptions = {
  invoiceType?: string;
  referenceInvoice?: string;
  voucherDate?: string;
  customerId?: string;
  customerGstin?: string;
  sellerStateCode?: string;
  placeCode?: string;
  useItemId?: string;
  oldGold?: boolean;
  payments?: Array<{ mode: string; amount: string; reference?: string }>;
};

export async function createDraftInvoice(
  request: APIRequestContext,
  access: string,
  itemRef: ItemRefs,
  options: InvoiceOptions = {},
) {
  let customerId = options.customerId;
  if (!customerId) {
    const cust = await createCustomer(request, access, {
      ...(options.customerGstin
        ? { gstin: options.customerGstin, state_code: options.placeCode ?? "27" }
        : {}),
    });
    customerId = cust.id;
  }

  const body: Record<string, unknown> = {
    customer: customerId,
    invoice_type: options.invoiceType ?? "TAX_INVOICE",
    voucher_date: options.voucherDate ?? undefined,
    reference_invoice: options.referenceInvoice ?? null,
    seller_state_code: options.sellerStateCode ?? "27",
    place_of_supply_state_code: options.placeCode ?? "27",
    discount_amount: "0",
    lines: [
      {
        ...(options.useItemId ? { item: options.useItemId } : {}),
        description: "Test Ring",
        metal_code: itemRef.master.metalCode,
        purity_code: itemRef.master.purityCode,
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
    payments: options.payments ?? [{ mode: "CASH", amount: "5000" }],
  };

  if (options.oldGold) {
    body.old_gold = [
      {
        metal_code: itemRef.master.metalCode,
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
  if (!res.ok()) throw new Error(`createDraftInvoice failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

export async function issueInvoice(
  request: APIRequestContext,
  access: string,
  invoiceId: string,
) {
  const res = await request.post(
    `${API_BASE}/jwl/v1/sales/invoices/${invoiceId}/issue/`,
    { headers: authHeaders(access) },
  );
  if (!res.ok()) throw new Error(`issueInvoice failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

export async function cancelInvoice(
  request: APIRequestContext,
  access: string,
  invoiceId: string,
  reason = "Test cancellation",
) {
  const res = await request.post(
    `${API_BASE}/jwl/v1/sales/invoices/${invoiceId}/cancel/`,
    { headers: authHeaders(access), data: { reason } },
  );
  if (!res.ok()) throw new Error(`cancelInvoice failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

export async function getInvoice(
  request: APIRequestContext,
  access: string,
  invoiceId: string,
) {
  const res = await request.get(
    `${API_BASE}/jwl/v1/sales/invoices/${invoiceId}/`,
    { headers: authHeaders(access) },
  );
  if (!res.ok()) throw new Error(`getInvoice failed: ${res.status()}`);
  return res.json();
}

// ─── Outstanding ──────────────────────────────────────────────────────────────

export async function getOutstandingByCustomer(
  request: APIRequestContext,
  access: string,
  customerId: string,
): Promise<{ id: string; amount_balance: string }> {
  const res = await request.get(`${API_BASE}/jwl/v1/outstanding/`, {
    headers: authHeaders(access),
    params: { customer: customerId, include_zero: "true" },
  });
  if (!res.ok()) throw new Error(`getOutstanding failed: ${res.status()}`);
  const list = await res.json();
  const items = Array.isArray(list) ? list : list?.results ?? [];
  if (!items.length) throw new Error(`No outstanding record for customer ${customerId}`);
  return items[0];
}

export async function postAdjustment(
  request: APIRequestContext,
  access: string,
  balanceId: string,
  amountDelta: string,
  notes: string,
) {
  const res = await request.post(
    `${API_BASE}/jwl/v1/outstanding/${balanceId}/adjust/`,
    {
      headers: authHeaders(access),
      data: {
        movement_type: "MANUAL_ADJUSTMENT",
        amount_delta: amountDelta,
        metal_delta_grams: "0",
        notes,
      },
    },
  );
  if (!res.ok()) throw new Error(`postAdjustment failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

// ─── Transfers ────────────────────────────────────────────────────────────────

export async function createTransfer(
  request: APIRequestContext,
  access: string,
  fromBranch: string,
  toBranch: string,
  itemRef: ItemRefs,
) {
  const res = await request.post(`${API_BASE}/jwl/v1/transfers/`, {
    headers: { ...authHeaders(access), "X-Branch-Name": fromBranch },
    data: {
      from_branch: fromBranch,
      to_branch: toBranch,
      lines: [{ item: itemRef.id, qty: 1, weight: "10.0000" }],
    },
  });
  if (!res.ok()) throw new Error(`createTransfer failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

// ─── Rates ────────────────────────────────────────────────────────────────────

export async function setRateOverride(
  request: APIRequestContext,
  access: string,
  metalId: string,
  purityId: string,
  sellRate: string,
  buyRate: string,
) {
  const res = await request.post(`${API_BASE}/jwl/v1/rates/override/`, {
    headers: authHeaders(access),
    data: {
      metal: metalId,
      purity: purityId,
      sell_rate: sellRate,
      buy_rate: buyRate,
      reason: `E2E rate ${Date.now()}`,
    },
  });
  if (!res.ok()) throw new Error(`setRateOverride failed: ${res.status()} ${await res.text()}`);
  return res.json();
}
