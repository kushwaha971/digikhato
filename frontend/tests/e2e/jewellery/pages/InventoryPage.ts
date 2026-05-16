import { expect, type Page } from "@playwright/test";

export class InventoryPage {
  constructor(private page: Page) {}

  async gotoList() {
    await this.page.goto("/jewellery/inventory", { waitUntil: "networkidle" });
  }

  async gotoNew() {
    await this.page.goto("/jewellery/inventory/new", { waitUntil: "networkidle" });
  }

  async expectListVisible() {
    await expect(this.page.getByRole("heading", { name: /item master/i })).toBeVisible();
    const metalPurityLabel = this.page.getByText(/Metal\s*\/\s*Purity/i).first();
    const emptyState = this.page.getByText(/No inventory items/i).first();
    await expect(metalPurityLabel.or(emptyState)).toBeVisible();
  }

  async searchItem(query: string) {
    const searchInput = this.page.getByPlaceholder(/search.*sku|search.*barcode|scan/i).first();
    await searchInput.fill(query);
    await this.page.waitForTimeout(300);
  }

  async expectItemInList(sku: string) {
    await expect(this.page.getByText(sku).first()).toBeVisible({ timeout: 8000 });
  }

  async openItem(sku: string) {
    await this.page.getByText(sku).first().click();
    await expect(this.page).toHaveURL(/\/jewellery\/inventory\/[a-f0-9-]+/);
  }

  async gotoTransfers() {
    await this.page.goto("/jewellery/inventory/transfers", { waitUntil: "networkidle" });
  }

  async expectTransferListVisible() {
    await expect(
      this.page.getByRole("heading", { name: /transfer/i }).first(),
    ).toBeVisible();
  }

  async expectItemStatus(status: string) {
    await expect(this.page.getByText(status).first()).toBeVisible({ timeout: 5000 });
  }

  async gotoStockTake() {
    await this.page.goto("/jewellery/inventory/stock-take/new", { waitUntil: "networkidle" });
  }
}
