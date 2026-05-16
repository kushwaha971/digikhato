/**
 * Jewellery ERP — Custom Playwright fixtures
 * Provides pre-authenticated sessions and seeded master data.
 */
import { test as base } from "@playwright/test";
import {
  ADMIN_MOBILE,
  loginByMobile,
  getMasterRefs,
  createItem,
  createCustomer,
  type AuthSession,
  type MasterRefs,
  type ItemRefs,
} from "../helpers/api";
import { setUiSession } from "../helpers/ui";

type JwlFixtures = {
  /** Authenticated admin session (token + mobile) */
  admin: AuthSession;
  /** Pre-seeded master data refs (metal / purity / category / design) */
  masterRefs: MasterRefs;
  /** A freshly created IN_STOCK item */
  freshItem: ItemRefs;
  /** Authenticated page (localStorage token set, on /jewellery/dashboard) */
  jwlPage: void;
};

export const test = base.extend<JwlFixtures>({
  admin: [async ({ request }, use) => {
    const session = await loginByMobile(request, ADMIN_MOBILE);
    await use(session);
  }, { scope: "worker" }],

  masterRefs: async ({ request, admin }, use) => {
    const refs = await getMasterRefs(request, admin.access);
    await use(refs);
  },

  freshItem: async ({ request, admin, masterRefs }, use) => {
    const item = await createItem(request, admin.access, masterRefs);
    await use(item);
  },

  jwlPage: async ({ page, admin }, use) => {
    await setUiSession(page, admin.access);
    await page.goto("/jewellery/dashboard", { waitUntil: "networkidle" });
    await use();
  },
});

export { expect } from "@playwright/test";

// ─── Shared seed used across serialized describe blocks ──────────────────────

export type SharedSeed = {
  admin: AuthSession;
  masterRefs: MasterRefs;
  freshItem: ItemRefs;
  customerId: string;
};

export async function buildSharedSeed(request: import("@playwright/test").APIRequestContext): Promise<SharedSeed> {
  const admin = await loginByMobile(request, ADMIN_MOBILE);
  const masterRefs = await getMasterRefs(request, admin.access);
  const freshItem = await createItem(request, admin.access, masterRefs);
  const customer = await createCustomer(request, admin.access);
  return { admin, masterRefs, freshItem, customerId: customer.id };
}
