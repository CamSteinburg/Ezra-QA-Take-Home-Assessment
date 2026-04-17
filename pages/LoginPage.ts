import { expect, Page } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  async dismissCookieBannerIfPresent(): Promise<void> {
    const accept = this.page.getByRole("button", {
      name: /^(accept( all)?|allow( all)?|i agree)$/i,
    });
    await accept.first().click({ timeout: 5000 }).catch(() => {});
  }

  async login(email: string, password: string): Promise<void> {
    await this.dismissCookieBannerIfPresent();
    await this.page.getByRole("textbox", { name: /email/i }).fill(email);
    await this.page.getByRole("textbox", { name: /password/i }).fill(password);
    await this.page.getByText("Submit").click();
    await expect(this.page.locator('[data-testid="book-scan-btn"]:visible')).toBeVisible({ timeout: 15_000 }); // the app renders 2 identical book-scan-btn elements with the same text and data-testids, so we need to use the locator to find the visible one as a workaround
  }

}
