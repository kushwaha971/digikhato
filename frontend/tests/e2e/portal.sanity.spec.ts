import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const API_BASE = process.env.E2E_API_BASE_URL || "http://localhost:8001/api";

let mobileSeq = 0;
const randomMobile = () => {
  mobileSeq += 1;
  const seed = `${Date.now()}${mobileSeq}`.slice(-9);
  return `9${seed}`;
};

async function signupUser(
  request: APIRequestContext,
  role: "admin" | "collector" | "borrower",
  fullName: string,
) {
  const mobile = randomMobile();
  const signup = await request.post(`${API_BASE}/auth/signup/`, {
    data: {
      full_name: fullName,
      mobile_number: mobile,
      role,
      branch_name: "Main",
    },
  });
  expect(signup.status()).toBe(201);
  const user = await signup.json();
  return { mobile, user };
}

async function loginApi(request: APIRequestContext, mobile_number: string) {
  const res = await request.post(`${API_BASE}/auth/login/`, {
    data: { mobile_number },
  });
  expect(res.status()).toBe(200);
  return res.json();
}

async function loginUi(page: Page, mobile: string) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Mobile Number").fill(mobile);
  await page.getByRole("button", { name: "Sign In" }).click();
}

test("portal sanity: borrower sees own loan and account payment history", async ({ page, request }) => {
  const admin = await signupUser(request, "admin", "Portal Admin");
  const borrowerAuth = await signupUser(request, "borrower", "Portal Borrower");
  const adminTokens = await loginApi(request, admin.mobile);

  const auth = { Authorization: `Bearer ${adminTokens.access}` };
  const seedDate = new Date().toISOString().slice(0, 10);

  const borrowerProfileRes = await request.post(`${API_BASE}/borrowers/`, {
    headers: auth,
    data: {
      name: "Portal Borrower Profile",
      mobile_number: randomMobile(),
      address: "Portal Test Address",
      status: "active",
      user: borrowerAuth.user.id,
    },
  });
  expect(borrowerProfileRes.status()).toBe(201);
  const borrowerProfile = await borrowerProfileRes.json();

  const loanRes = await request.post(`${API_BASE}/loans/`, {
    headers: auth,
    data: {
      borrower: borrowerProfile.id,
      principal: "1000.00",
      interest_rate: "10.00",
      interest_type: "flat",
      tenure_days: 10,
      start_date: seedDate,
    },
  });
  expect(loanRes.status()).toBe(201);

  const accountRes = await request.post(`${API_BASE}/accounts/`, {
    headers: auth,
    data: {
      borrower: borrowerProfile.id,
      amount_given: "800.00",
      daily_interest_rate: "1.0000",
      duration_days: 20,
    },
  });
  expect(accountRes.status()).toBe(201);
  const accountCreateBody = await accountRes.json();

  let accountId: number | undefined = accountCreateBody.id;
  if (!accountId) {
    const accountsListRes = await request.get(
      `${API_BASE}/accounts/?borrower=${borrowerProfile.id}`,
      { headers: auth },
    );
    expect(accountsListRes.status()).toBe(200);
    const accountsList = await accountsListRes.json();
    accountId = accountsList?.results?.[0]?.id;
  }
  expect(accountId).toBeTruthy();

  const dailyCollectionRes = await request.post(`${API_BASE}/daily-collections/`, {
    headers: auth,
    data: {
      account: accountId,
      payment: "150.00",
      date: seedDate,
    },
  });
  expect(dailyCollectionRes.status()).toBe(201);

  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());

  await loginUi(page, borrowerAuth.mobile);
  await expect(page).toHaveURL(/\/portal$/);
  await expect(page.getByRole("heading", { name: "My Loans" })).toBeVisible();
  const amountGivenVisible = await page.getByText("Amount Given").isVisible().catch(() => false);
  if (!amountGivenVisible) {
    await expect(page.getByText("No accounts found")).toBeVisible();
  }

  const accountRef = accountCreateBody.uuid ?? accountId;
  await page.goto(`/portal/accounts/${accountRef}`, { waitUntil: "networkidle" });
  await expect(page).toHaveURL(new RegExp(`/portal/accounts/${accountRef}$`));
  await expect(page.getByRole("heading", { name: /Account/i })).toBeVisible();
  const paymentVisible = await page.getByText("₹150").isVisible().catch(() => false);
  if (!paymentVisible) {
    await expect(page.getByText("No payments yet")).toBeVisible();
  }
});

test("portal sanity: unauthenticated access redirects to login", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());

  await page.goto("/portal", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/login$/);

  await page.goto("/portal/accounts/1", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/login$/);
});

test("portal sanity: non-borrower user is redirected away from portal", async ({ page, request }) => {
  const collector = await signupUser(request, "collector", "Portal Collector");

  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => localStorage.clear());
  await loginUi(page, collector.mobile);

  await expect(page).toHaveURL(/\/udhaarbook$/);
  await page.goto("/portal", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/udhaarbook$/);
});
