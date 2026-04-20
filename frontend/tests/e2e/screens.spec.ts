import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const API_BASE = process.env.E2E_API_BASE_URL || "http://localhost:8001/api";
type UserRole = "super_admin" | "admin" | "collector" | "borrower";

const randomMobile = (prefix: string) => `${prefix}${Math.floor(100000000 + Math.random() * 900000000)}`;

async function signupUser(request: APIRequestContext, role: UserRole, name: string) {
  const mobile = randomMobile("9");
  const password = "UI@12345";
  const signup = await request.post(`${API_BASE}/auth/signup/`, {
    data: {
      full_name: name,
      mobile_number: mobile,
      password,
      role,
      branch_name: "Main",
    },
  });
  expect(signup.status()).toBe(201);
  return { mobile, password };
}

async function loginViaUi(page: Page, mobile: string, password: string) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByLabel("Mobile Number").fill(mobile);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
}

test("Auth screens and session bootstrap", async ({ page, request }) => {
  const creds = await signupUser(request, "collector", "UI User");

  await page.goto("/login", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible({ timeout: 15000 });
  await page.goto("/signup", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible({ timeout: 15000 });
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Start for Free" })).toBeVisible({ timeout: 15000 });

  const login = await request.post(`${API_BASE}/auth/login/`, {
    data: { mobile_number: creds.mobile, password: creds.password },
  });
  expect(login.status()).toBe(200);
  const tokens = await login.json();

  await page.addInitScript((access: string) => {
    window.localStorage.setItem("accessToken", access);
  }, tokens.access);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("All required screens load", async ({ page, request }) => {
  const creds = await signupUser(request, "admin", "Screen Admin");

  const login = await request.post(`${API_BASE}/auth/login/`, {
    data: { mobile_number: creds.mobile, password: creds.password },
  });
  expect(login.status()).toBe(200);
  const tokens = await login.json();

  const borrower = await request.post(`${API_BASE}/borrowers/`, {
    headers: { Authorization: `Bearer ${tokens.access}` },
    data: { name: "Screen Borrower", mobile_number: randomMobile("95"), address: "Address", status: "active" },
  });
  expect(borrower.status()).toBe(201);
  const borrowerJson = await borrower.json();

  const loan = await request.post(`${API_BASE}/loans/`, {
    headers: { Authorization: `Bearer ${tokens.access}` },
    data: {
      borrower: borrowerJson.id,
      principal: "1000.00",
      interest_rate: "10.00",
      interest_type: "flat",
      tenure_days: 10,
      start_date: new Date().toISOString().slice(0, 10),
    },
  });
  expect(loan.status()).toBe(201);
  const loanJson = await loan.json();

  const collection = await request.post(`${API_BASE}/collections/`, {
    headers: { Authorization: `Bearer ${tokens.access}` },
    data: {
      loan: loanJson.id,
      borrower: borrowerJson.id,
      date: new Date().toISOString().slice(0, 10),
      amount_paid: "90.00",
      status: "partial",
    },
  });
  expect(collection.status()).toBe(201);
  const collectionJson = await collection.json();

  await page.addInitScript((access: string) => {
    window.localStorage.setItem("accessToken", access);
  }, tokens.access);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.locator("h1").first()).toBeVisible();

  const checks: string[] = [
    "/dashboard",
    "/onboarding",
    "/borrowers",
    "/borrowers/add",
    `/borrowers/${borrowerJson.id}`,
    `/borrowers/${borrowerJson.id}/edit`,
    "/loans",
    "/loans/create",
    `/loans/${loanJson.id}`,
    `/loans/${loanJson.id}/edit`,
    "/collections/today",
    "/collections/entry",
    `/collections/${collectionJson.id}/edit`,
    "/collections/history",
    "/overdue",
    "/reports",
    "/team",
    "/settings",
  ];

  for (const route of checks) {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(new RegExp(route.replace(/\//g, "\\/")));
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.locator("h1").first()).toBeVisible({ timeout: 15000 });
  }
});

test("role based post-login redirect routes users to their home", async ({ page, request }) => {
  const cases: Array<{ role: UserRole; expectedPath: string; name: string }> = [
    { role: "super_admin", expectedPath: "/super-admin/dashboard", name: "Super Admin Role Test" },
    { role: "admin", expectedPath: "/dashboard", name: "Admin Role Test" },
    { role: "collector", expectedPath: "/dashboard", name: "Collector Role Test" },
    { role: "borrower", expectedPath: "/portal", name: "Borrower Role Test" },
  ];

  for (const c of cases) {
    const creds = await signupUser(request, c.role, c.name);
    await page.context().clearCookies();
    await page.goto("/login");
    await page.evaluate(() => window.localStorage.clear());
    await loginViaUi(page, creds.mobile, creds.password);
    await expect(page).toHaveURL(new RegExp(`${c.expectedPath.replace(/\//g, "\\/")}$`), { timeout: 15000 });
  }
});

test("collector cannot access create-loan route and create action visibility is removed", async ({ page, request }) => {
  const creds = await signupUser(request, "collector", "Collector Role Restriction Test");
  await loginViaUi(page, creds.mobile, creds.password);
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto("/loans", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Loans" })).toBeVisible();
  await expect(page.getByRole("link", { name: /\+ Create Loan/i })).toHaveCount(0);

  await page.goto("/loans/create", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.locator("h1").first()).toBeVisible();
});

test("borrower portal should not send borrower query filter", async ({ page, request }) => {
  const creds = await signupUser(request, "borrower", "Borrower Query Scope Test");
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => window.localStorage.clear());

  const loansRequestPromise = page.waitForRequest(
    (req) => req.url().includes("/api/loans/"),
    { timeout: 15000 },
  );

  await loginViaUi(page, creds.mobile, creds.password);
  await expect(page).toHaveURL(/\/portal$/);

  const loansRequest = await loansRequestPromise;
  expect(loansRequest.url()).not.toContain("borrower=");
});

test("redirect protected routes to login when unauthenticated", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.evaluate(() => window.localStorage.clear());

  const protectedRoutes = ["/dashboard", "/borrowers", "/reports", "/portal", "/super-admin/dashboard", "/settings"];
  for (const route of protectedRoutes) {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page).toHaveURL(/\/login$/);
  }
});
