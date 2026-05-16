import { expect, type Page } from "@playwright/test";

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login", { waitUntil: "domcontentloaded" });
  }

  async login(mobile: string) {
    await this.page.getByLabel("Mobile Number").fill(mobile);
    await this.page.getByRole("button", { name: "Sign In" }).click();
  }

  async expectValidationErrors() {
    await this.page.getByRole("button", { name: "Sign In" }).click();
    await expect(this.page.getByText("Mobile number is required")).toBeVisible();
  }

  async expectInvalidMobileError(mobile: string) {
    await this.page.getByLabel("Mobile Number").fill(mobile);
    await this.page.getByRole("button", { name: "Sign In" }).click();
    await expect(this.page.getByText(/10 to 15 digits|must be.*digit|invalid.*mobile|mobile.*invalid/i)).toBeVisible();
  }

  async expectHeading() {
    await expect(this.page.getByRole("heading", { name: /welcome/i })).toBeVisible();
  }
}
