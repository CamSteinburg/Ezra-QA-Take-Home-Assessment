import { expect, type Locator, Page } from "@playwright/test";

export class OrderSummaryPage {
  constructor(private readonly page: Page) {}

  scanConfirmDetailsContainer(): Locator {
    return this.page.locator(".scan-confirm__details-container");
  }

  async expectLoaded(): Promise<void> {
    const confirmation = this.scanConfirmDetailsContainer();
    await expect(confirmation.first()).toBeVisible();
  }

  async expectDetailsIncludeSchedule(picked: { time: string; dateLabel: string }): Promise<void> {
    const box = this.scanConfirmDetailsContainer().first();
    await expect(box).toContainText(picked.time);

    const dl = picked.dateLabel.trim();
    const m = dl.match(/^(.+?)\s+(\d{1,2}),\s*(\d{4})$/);
    if (m) {
      const month = m[1].trim();
      const day = m[2];
      const year = m[3];
      const monthPrefix = month.slice(0, 3);
      await expect(box).toContainText(monthPrefix);
      await expect(box).toContainText(year);
      await expect(box).toContainText(new RegExp(`\\b${day}\\b`));
    } else {
      await expect(box).toContainText(dl);
    }
  }
}
