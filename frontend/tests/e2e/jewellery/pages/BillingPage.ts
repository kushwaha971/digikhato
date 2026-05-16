import { expect, type Page } from "@playwright/test";

export class BillingPage {
  constructor(private page: Page) {}

  async gotoList() {
    await this.page.goto("/jewellery/billing", { waitUntil: "domcontentloaded" });
  }

  async gotoNew(queryParams = "") {
    await this.page.goto(`/jewellery/billing/new${queryParams}`, { waitUntil: "domcontentloaded" });
  }

  async gotoDetail(id: string) {
    await this.page.goto(`/jewellery/billing/${id}`, { waitUntil: "domcontentloaded" });
  }

  async expectListVisible() {
    await expect(this.page.getByRole("heading", { name: /billing|invoice/i }).first()).toBeVisible();
  }

  async selectCustomer(nameFragment: string) {
    await this.page.getByLabel("Customer").fill(nameFragment);
    await this.page
      .getByRole("button", { name: new RegExp(nameFragment, "i") })
      .first()
      .click();
  }

  async addLineWithItem(skuFragment: string) {
    await this.page.getByRole("button", { name: "Add line" }).click();
    const itemSearch = this.page.getByLabel("Inventory item").first();
    await itemSearch.fill(skuFragment);
    await this.page
      .getByRole("button", { name: new RegExp(skuFragment, "i") })
      .first()
      .click();
  }

  async addLineManual(opts: {
    description?: string;
    netWt?: string;
    ratePerGram?: string;
    makingMode?: string;
    makingRate?: string;
  }) {
    await this.page.getByRole("button", { name: "Add line" }).click();
    if (opts.description) {
      await this.page.getByLabel("Description").last().fill(opts.description);
    }
    if (opts.netWt) {
      await this.page.getByLabel(/net.*wt|net weight/i).last().fill(opts.netWt);
    }
    if (opts.ratePerGram) {
      await this.page.getByLabel(/rate.*gram|rate per gram/i).last().fill(opts.ratePerGram);
    }
  }

  async saveDraft() {
    await this.page.getByRole("button", { name: "Save draft" }).click();
  }

  async saveAndIssue() {
    await this.page.getByRole("button", { name: "Save & issue" }).click();
  }

  async issueInvoice() {
    await this.page.getByRole("button", { name: "Issue invoice" }).click();
  }

  async cancelInvoice(reason: string) {
    await this.page.getByRole("button", { name: "Cancel" }).click();
    await this.page.getByPlaceholder("Reason for cancellation").fill(reason);
    await this.page.getByRole("button", { name: "Confirm cancel" }).click();
  }

  async openMoreMenu() {
    await this.page.getByRole("button", { name: "More ▾" }).click();
  }

  async expectStatus(status: "DRAFT" | "ISSUED" | "CANCELLED") {
    await expect(this.page.getByText(status).last()).toBeVisible({ timeout: 10000 });
  }

  async expectDraftUrl() {
    await expect(this.page).toHaveURL(/\/jewellery\/billing\/[a-f0-9-]+$/);
  }

  async filterByType(type: string) {
    await this.page.getByLabel(/type|invoice type/i).selectOption(type);
  }

  async searchInvoice(query: string) {
    await this.page
      .getByPlaceholder(/search|voucher|customer/i)
      .first()
      .fill(query);
    await this.page.waitForTimeout(500);
  }

  async clickConvertToInvoice() {
    const btn = this.page.getByTestId("jwl-estimate-convert-button");
    await expect(btn).toBeVisible();
    await btn.click();
  }

  async createCreditNote() {
    await this.openMoreMenu();
    await this.page.getByRole("button", { name: "Create credit note" }).click();
  }
}
