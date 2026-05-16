import { expect, type Page } from "@playwright/test";

export class AdminPage {
  constructor(private page: Page) {}

  async gotoRates() {
    await this.page.goto("/jewellery/settings/rates", { waitUntil: "networkidle" });
  }

  async gotoAdmin() {
    await this.page.goto("/jewellery/admin", { waitUntil: "networkidle" });
  }

  async gotoUsersRoles() {
    await this.page.goto("/jewellery/users-roles", { waitUntil: "networkidle" });
  }

  async expectRatesPageVisible() {
    await expect(
      this.page.getByRole("heading", { name: /rates|gold rate|rate/i }).first(),
    ).toBeVisible();
  }

  async expectLiveRateTable() {
    await expect(this.page.getByRole("columnheader", { name: /sell \(₹\/g\)|sell/i }).first()).toBeVisible({
      timeout: 8000,
    });
  }

  async expectAdminPageVisible() {
    await expect(
      this.page.getByRole("heading", { name: /admin|settings/i }).first(),
    ).toBeVisible();
  }

  async expectUsersRolesVisible() {
    await expect(
      this.page.getByRole("heading", { name: /users.*roles|team|access/i }).first(),
    ).toBeVisible();
  }

  async expectFeatureFlagToggle() {
    await expect(
      this.page.getByText(/feature.*flag|jewellery feature|enable/i).first(),
    ).toBeVisible({ timeout: 8000 });
  }
}
