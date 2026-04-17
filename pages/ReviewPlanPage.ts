import { expect, Locator, Page } from "@playwright/test";
import { bookingDefaults, type BookingDob, type BookingGender } from "../fixtures/bookingDefaults";

const scanTestIds: Record<string, string> = {
  "MRI Scan": "FB30-encounter-card",
  "MRI Scan with Spine": "FB60-encounter-card",
  "MRI Scan with Skeletal and Neurological Assessment": "BLUEPRINTNR-encounter-card",
  "Heart CT Scan": "GATEDCAC-encounter-card",
  "Lungs CT Scan": "LUNG-encounter-card",
};

/** Step 1 — Review your plan: scan selection and add-ons on the same view. */
export class ReviewPlanPage {
  constructor(private readonly page: Page) {}

  private multiselect(): Locator {
    return this.page.locator(".multiselect");
  }

  private genderMultiselectOption(gender: BookingGender = bookingDefaults.gender): Locator {
    const pattern = gender === "male" ? /^Male$/i : /^Female$/i;
    return this.page.locator(".multiselect__element").filter({ hasText: pattern });
  }

  async gotoUserDashboardBooking(): Promise<void> {
    await this.page.goto("/");
    await this.dismissTimezoneModalIfPresent();
    await this.dismissCookieBannerIfPresent();
    await this.page.locator('[data-testid="book-scan-btn"]:visible').click();
  }

  // Full-screen “Confirm your time zone” blocks clicks on the dashboard (e.g. Book a scan)
  private async dismissTimezoneModalIfPresent(): Promise<void> {
    const modal = this.page.locator(".timezone-modal");
    if ((await modal.count()) === 0) {
      return;
    }
    const first = modal.first();
    if (!(await first.isVisible().catch(() => false))) {
      return;
    }
    await first.getByRole("button", { name: /^confirm$/i }).click();
    await expect(first).toBeHidden({ timeout: 20_000 });
  }

  private continueSubmitButton() {
    return this.page.getByTestId("select-plan-submit-btn");
  }

  async clickContinue(): Promise<void> {
    await this.dismissCookieBannerIfPresent();
    const btn = this.continueSubmitButton();
    await expect(btn).toBeEnabled({ timeout: 25_000 });
    await btn.click();
  }

  async expectOnPage(): Promise<void> {
    await expect(this.page.getByTestId("select-plan-submit-btn")).toBeVisible();
  }

  // Brand-new accounts may need DOB and gender on the plan step; returning users already have them on profile so these controls stay hidden. No-op when not shown.
  async fillDobAndGenderIfPresent(
    gender: BookingGender = bookingDefaults.gender,
    dob: BookingDob = bookingDefaults.dob
  ): Promise<void> {
    const short = { timeout: 2_500 } as const;

    const dateEl = this.page.locator('input[type="date"]').first();
    if (await dateEl.isVisible(short).catch(() => false)) {
      await dateEl.fill(dob.iso);
    } else {
      const dobText = this.page.getByRole("textbox", { name: /date of birth|dob|birthday|birth/i }).or(this.page.getByPlaceholder(/mm\s*\/\s*dd|dd\s*\/\s*mm|birth|dob/i)).first();
      if (await dobText.isVisible(short).catch(() => false)) {
        await dobText.fill(dob.usSlash);
      }
    }

    const sexRoot = this.multiselect();
    if (await sexRoot.isVisible(short).catch(() => false)) {
      await this.dismissCookieBannerIfPresent();
      await sexRoot.scrollIntoViewIfNeeded();
      await sexRoot.click({ force: true, timeout: 10_000 }).catch(async () => {
        await sexRoot.locator(".multiselect__tags").click({ force: true, timeout: 10_000 });
      });
      await this.genderMultiselectOption(gender).click({ force: true, timeout: 12_000 });
    }
  }

  async chooseScan(scanName: string): Promise<void> {
    await this.dismissCookieBannerIfPresent();
    const testId = scanTestIds[scanName];
    if (testId) {
      const card = this.page.getByTestId(testId);
      await card.scrollIntoViewIfNeeded();
      await card.click();
      // FE enables Continue only after selection state applies — don’t proceed until then.
      await expect(this.continueSubmitButton()).toBeEnabled({ timeout: 25_000 });
      return;
    }
    await this.page.getByRole("heading", { name: new RegExp(scanName, "i") }).click();
    await expect(this.continueSubmitButton()).toBeEnabled({ timeout: 25_000 });
  }

  async expectContinueDisabled(): Promise<void> {
    await expect(this.page.getByTestId("select-plan-submit-btn")).toBeDisabled();
  }

  async expectAddOnsVisible(
    addOn: { testId: string; label: string } = bookingDefaults.expectedAddOn
  ): Promise<void> {
    await expect(this.page.getByTestId(addOn.testId)).toContainText(addOn.label);
  }

  async dismissCookieBannerIfPresent(): Promise<void> {
    const accept = this.page.getByRole("button", {
      name: /^(accept( all)?|allow( all)?|i agree)$/i,
    });
    await accept.first().click({ timeout: 10000 }).catch(() => {});
  }

}
