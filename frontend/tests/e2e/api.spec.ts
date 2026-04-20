import { expect, test } from "@playwright/test";

const API_BASE = process.env.E2E_API_BASE_URL || "http://localhost:8001/api";
const ADMIN_PASSWORD = "abcdefgh";

test("API end-to-end: borrower onboarding login + payment mode + derived status + notifications", async ({ request }) => {
  const uniq = `${Date.now()}`;
  const adminMobile = `91${uniq.slice(-8)}`;
  const borrowerMobile = `98${uniq.slice(-8)}`;

  const signup = await request.post(`${API_BASE}/auth/signup/`, {
    data: {
      full_name: "E2E Admin",
      mobile_number: adminMobile,
      password: ADMIN_PASSWORD,
      role: "admin",
      branch_name: "Main",
    },
  });
  expect(signup.status()).toBe(201);

  const login = await request.post(`${API_BASE}/auth/login/`, {
    data: { mobile_number: adminMobile, password: ADMIN_PASSWORD },
  });
  expect(login.status()).toBe(200);
  const tokens = await login.json();
  const auth = { Authorization: `Bearer ${tokens.access}` };

  const me = await request.get(`${API_BASE}/auth/me/`, { headers: auth });
  expect(me.status()).toBe(200);

  const onboard = await request.patch(`${API_BASE}/onboarding/profile/`, {
    headers: auth,
    data: { business_name: "E2E Biz", area_name: "Area", currency: "INR", is_onboarded: true },
  });
  expect(onboard.status()).toBe(200);

  const borrower = await request.post(`${API_BASE}/borrowers/`, {
    headers: auth,
    data: {
      name: "E2E Borrower @ Village-1",
      mobile_number: borrowerMobile,
      address: "",
      status: "active",
      create_login: true,
    },
  });
  expect(borrower.status()).toBe(201);
  const borrowerJson = await borrower.json();
  expect(borrowerJson.user).toBeTruthy();
  expect(borrowerJson.must_reset_password).toBeTruthy();
  expect(typeof borrowerJson.temporary_password).toBe("string");

  const borrowerLogin = await request.post(`${API_BASE}/auth/login/`, {
    data: { mobile_number: borrowerMobile, password: borrowerJson.temporary_password },
  });
  expect(borrowerLogin.status()).toBe(200);
  const borrowerTokens = await borrowerLogin.json();
  expect(borrowerTokens.user.must_reset_password).toBeTruthy();

  const passwordReset = await request.post(`${API_BASE}/auth/change-password/`, {
    headers: { Authorization: `Bearer ${borrowerTokens.access}` },
    data: {
      old_password: borrowerJson.temporary_password,
      new_password: "borrower8",
    },
  });
  expect(passwordReset.status()).toBe(200);

  const borrowerMe = await request.get(`${API_BASE}/auth/me/`, {
    headers: { Authorization: `Bearer ${borrowerTokens.access}` },
  });
  expect(borrowerMe.status()).toBe(200);
  const borrowerMeJson = await borrowerMe.json();
  expect(borrowerMeJson.must_reset_password).toBeFalsy();

  expect((await request.get(`${API_BASE}/borrowers/`, { headers: auth })).status()).toBe(200);
  expect((await request.get(`${API_BASE}/borrowers/${borrowerJson.id}/`, { headers: auth })).status()).toBe(200);
  expect((await request.patch(`${API_BASE}/borrowers/${borrowerJson.id}/`, { headers: auth, data: { name: "E2E Borrower Updated" } })).status()).toBe(200);

  const loan = await request.post(`${API_BASE}/loans/`, {
    headers: auth,
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
  expect((await request.get(`${API_BASE}/loans/`, { headers: auth })).status()).toBe(200);
  expect((await request.get(`${API_BASE}/loans/${loanJson.id}/`, { headers: auth })).status()).toBe(200);
  expect((await request.patch(`${API_BASE}/loans/${loanJson.id}/`, { headers: auth, data: { principal: "1200.00" } })).status()).toBe(200);

  const collection = await request.post(`${API_BASE}/collections/`, {
    headers: auth,
    data: {
      loan: loanJson.id,
      borrower: borrowerJson.id,
      date: new Date().toISOString().slice(0, 10),
      amount_paid: "100.00",
      payment_mode: "gpay",
      reference_id: `UPI-${uniq}`,
      notes: "e2e",
    },
  });
  expect(collection.status()).toBe(201);
  const collectionJson = await collection.json();
  expect(collectionJson.payment_mode).toBe("gpay");
  expect((await request.get(`${API_BASE}/collections/`, { headers: auth })).status()).toBe(200);
  expect((await request.get(`${API_BASE}/collections/${collectionJson.id}/`, { headers: auth })).status()).toBe(200);

  const updateCollection = await request.patch(`${API_BASE}/collections/${collectionJson.id}/`, {
    headers: auth,
    data: { amount_paid: "300.00", payment_mode: "phonepe", reference_id: `PP-${uniq}` },
  });
  expect(updateCollection.status()).toBe(200);

  const closeLoanCollection = await request.post(`${API_BASE}/collections/`, {
    headers: auth,
    data: {
      loan: loanJson.id,
      borrower: borrowerJson.id,
      date: new Date().toISOString().slice(0, 10),
      amount_paid: "900.00",
      payment_mode: "cash",
    },
  });
  expect(closeLoanCollection.status()).toBe(201);
  const closeLoanCollectionJson = await closeLoanCollection.json();

  const loanAfterCollections = await request.get(`${API_BASE}/loans/${loanJson.id}/`, { headers: auth });
  expect(loanAfterCollections.status()).toBe(200);
  const loanAfterCollectionsJson = await loanAfterCollections.json();
  expect(loanAfterCollectionsJson.payment_status).toBe("paid");
  expect(loanAfterCollectionsJson.status).toBe("closed");

  expect((await request.get(`${API_BASE}/collections/today-due/`, { headers: auth })).status()).toBe(200);
  expect((await request.get(`${API_BASE}/loans/overdue/`, { headers: auth })).status()).toBe(200);
  expect((await request.get(`${API_BASE}/dashboard/summary/`, { headers: auth })).status()).toBe(200);
  const dailyReport = await request.get(`${API_BASE}/reports/daily/`, { headers: auth });
  expect(dailyReport.status()).toBe(200);
  const dailyReportJson = await dailyReport.json();
  if (dailyReportJson.collections?.length) {
    expect(dailyReportJson.collections[0]).toHaveProperty("payment_mode");
  }
  const loanReport = await request.get(`${API_BASE}/reports/loan/`, { headers: auth });
  expect(loanReport.status()).toBe(200);
  const loanReportJson = await loanReport.json();
  if (loanReportJson.accounts?.length) {
    expect(loanReportJson.accounts[0]).toHaveProperty("payment_status");
  }
  expect((await request.get(`${API_BASE}/reports/overdue/`, { headers: auth })).status()).toBe(200);

  const notifications = await request.get(`${API_BASE}/notifications/`, { headers: auth });
  expect(notifications.status()).toBe(200);
  const notificationsJson = await notifications.json();
  expect(Array.isArray(notificationsJson.results)).toBeTruthy();

  const markReadCandidate = notificationsJson.results?.find((n: Record<string, unknown>) => n.type === "loan_due_alert");
  if (markReadCandidate?.id) {
    const markRead = await request.patch(`${API_BASE}/notifications/${markReadCandidate.id}/read/`, { headers: auth });
    expect(markRead.status()).toBe(200);
  }

  expect((await request.delete(`${API_BASE}/collections/${closeLoanCollectionJson.id}/`, { headers: auth })).status()).toBe(204);
  expect((await request.delete(`${API_BASE}/collections/${collectionJson.id}/`, { headers: auth })).status()).toBe(204);
  expect((await request.delete(`${API_BASE}/loans/${loanJson.id}/`, { headers: auth })).status()).toBe(204);
  expect((await request.delete(`${API_BASE}/borrowers/${borrowerJson.id}/`, { headers: auth })).status()).toBe(204);

  expect((await request.post(`${API_BASE}/auth/logout/`, { headers: auth })).status()).toBe(200);
});

test("password policy: rejects < 8 chars and allows 8 chars without complexity constraints", async ({ request }) => {
  const uniq = `${Date.now()}`;
  const shortRes = await request.post(`${API_BASE}/auth/signup/`, {
    data: {
      full_name: "Short Password User",
      mobile_number: `92${uniq.slice(-8)}`,
      password: "short77",
      role: "collector",
      branch_name: "Main",
    },
  });
  expect(shortRes.status()).toBe(400);

  const validRes = await request.post(`${API_BASE}/auth/signup/`, {
    data: {
      full_name: "Min Eight User",
      mobile_number: `93${uniq.slice(-8)}`,
      password: "abcdefgh",
      role: "collector",
      branch_name: "Main",
    },
  });
  expect(validRes.status()).toBe(201);
});
