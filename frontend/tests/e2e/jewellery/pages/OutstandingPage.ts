import { expect, type Page } from "@playwright/test";

export class OutstandingPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/jewellery/outstanding", { waitUntil: "networkidle" });
  }

  async expectPageVisible() {
    await expect(
      this.page.getByRole("heading", { name: /party outstanding/i }),
    ).toBeVisible();
    await expect(this.page.getByText(/0-30d/i)).toBeVisible();
  }

  async filterByAgeing(bucket: string) {
    await this.page.getByRole("button", { name: new RegExp(bucket, "i") }).click();
  }

  async openFirstParty() {
    await this.page.locator("button.app-panel").first().click();
  }

  async openPartyByTestId(balanceId: string) {
    const card = this.page.getByTestId(`jwl-outstanding-party-card-${balanceId}`);
    await expect(card).toBeVisible({ timeout: 15000 });
    await card.scrollIntoViewIfNeeded();
    await card.click();
  }

  async expectAdjustmentButtonVisible() {
    await expect(
      this.page.getByRole("button", { name: "Post Adjustment" }).first(),
    ).toBeVisible({ timeout: 8000 });
  }

  async openAdjustmentDrawer() {
    await this.page.getByRole("button", { name: "Manual Adjustment" }).first().click();
    await expect(this.page.getByRole("heading", { name: /manual adjustment/i })).toBeVisible({
      timeout: 8000,
    });
  }

  get drawer() {
    return this.page
      .locator("div.fixed.inset-0.z-50:visible")
      .filter({ has: this.page.getByRole("heading", { name: /manual adjustment/i }) })
      .first();
  }

  async fillAdjustment(amount: string, notes: string) {
    await this.drawer.locator("input[id^='amount-delta']:visible").fill(amount);
    await this.drawer.locator("textarea:visible").fill(notes);
  }

  async saveAdjustment() {
    await this.drawer
      .locator('button:visible:has-text("Save adjustment")')
      .click();
  }

  async expectAdjustmentSaved() {
    await expect(
      this.page.locator('button:visible:has-text("Save adjustment")'),
    ).toHaveCount(0, { timeout: 8000 });
  }

  async expectMovementPanel(balanceId: string) {
    const panel = this.page
      .locator('[data-testid="jwl-outstanding-movement-panel"]:visible')
      .first();
    await expect(panel).toBeVisible({ timeout: 30000 });
    return panel;
  }

  async clickLoadMore() {
    const btn = this.page
      .locator('[data-testid="jwl-outstanding-load-more"]:visible')
      .first();
    if (await btn.count()) await btn.click();
  }
}
