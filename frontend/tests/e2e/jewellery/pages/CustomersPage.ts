import { expect, type Page } from "@playwright/test";

export class CustomersPage {
  constructor(private readonly page: Page) {}

  async gotoList() {
    await this.page.goto("/jewellery/customers", { waitUntil: "networkidle" });
  }

  async gotoNew() {
    await this.page.goto("/jewellery/customers/new", { waitUntil: "networkidle" });
  }

  async gotoDetail(id: string) {
    await this.page.goto(`/jewellery/customers/${id}`, { waitUntil: "networkidle" });
  }

  async fillForm(opts: {
    name: string;
    mobile: string;
    email?: string;
    gstin?: string;
    pan?: string;
    address?: string;
  }) {
    await this.page.getByLabel("Name").fill(opts.name);
    await this.page.getByLabel("Mobile").fill(opts.mobile);
    if (opts.email) await this.page.getByLabel(/email/i).fill(opts.email);
    if (opts.gstin) await this.page.getByLabel(/gstin/i).fill(opts.gstin);
    if (opts.pan) await this.page.getByLabel(/pan/i).fill(opts.pan);
    if (opts.address) await this.page.getByLabel(/address/i).fill(opts.address);
  }

  async submit() {
    await this.page.getByRole("button", { name: /add customer|save/i }).click();
  }

  async expectRedirectToList() {
    await expect(this.page).toHaveURL(/\/jewellery\/customers$/);
  }

  async search(query: string) {
    await this.page
      .getByPlaceholder(/search.*name.*mobile|name.*mobile/i)
      .fill(query);
    await this.page.waitForTimeout(400);
  }

  async expectCustomerVisible(name: string) {
    await expect(this.page.getByText(name).first()).toBeVisible({ timeout: 8000 });
  }

  async expectValidationErrors() {
    await expect(this.page.getByText("Name is required")).toBeVisible();
    await expect(this.page.getByText("Mobile number is required")).toBeVisible();
  }

  async expectMobileValidationError() {
    await expect(
      this.page.getByText(/10-digit|10 to 15 digits|valid.*mobile|invalid.*mobile/i).first(),
    ).toBeVisible();
  }

  async expectOutstandingSnapshot() {
    await expect(
      this.page.getByTestId("jwl-customer-outstanding-card"),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      this.page.getByTestId("jwl-customer-outstanding-card").getByText(/amount balance/i),
    ).toBeVisible({ timeout: 8000 });
  }
}
