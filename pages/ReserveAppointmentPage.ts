import { expect, Page, type Frame } from "@playwright/test";

export class ReserveAppointmentPage {
  constructor(private readonly page: Page) {}

  /** Same pattern as `ScheduleYourScanPage.clickContinue` (step 2). */
  async clickContinue(): Promise<void> {
    await this.page.getByRole("button", { name: /continue/i }).click();
  }

  /**
   * Stripe often mounts several nested iframes (Payment Request, Elements, Link). A single
   * `frameLocator` with a broad selector hits strict mode. Walk every frame and fill the one
   * that exposes the card field (role/name matches the Stripe Elements snapshot).
   *
   * @param postalCode — optional; when set, fills postal/ZIP in the Stripe frame or on the host page.
   */
  async payByCard(
    cardNumber: string,
    exp = "01/28",
    cvc = "999",
    postalCode?: string
  ): Promise<void> {
    await this.waitForStripePaymentReady();

    let cardFrame: Frame | null = null;

    for (const frame of this.page.frames()) {
      const cardNumberInput = frame
        .getByRole("textbox", { name: /card number/i })
        .or(frame.locator("#payment-number-input"))
        .or(frame.getByPlaceholder("1234 1234 1234 1234"))
        .or(frame.locator('input[placeholder*="1234"][inputmode="numeric"]'));

      if ((await cardNumberInput.count()) === 0) {
        continue;
      }

      cardFrame = frame;

      const expInput = frame
        .getByRole("textbox", { name: /expiration/i })
        .or(frame.getByPlaceholder(/mm\s*\/\s*yy/i));
      const cvcInput = frame
        .getByRole("textbox", { name: /cvc|security/i })
        .or(frame.getByPlaceholder(/cvc/i));

      await cardNumberInput.first().fill(cardNumber);
      if ((await expInput.count()) > 0) {
        await expInput.first().fill(exp);
      }
      if ((await cvcInput.count()) > 0) {
        await cvcInput.first().fill(cvc);
      }
      break;
    }

    if (!cardFrame) {
      throw new Error(
        "Could not find Stripe card inputs in any frame. Ensure the Card tab is selected and fields are visible."
      );
    }

    if (postalCode) {
      await this.fillPostalCode(postalCode, cardFrame);
    } else {
      await this.blurLastPaymentField(cardFrame);
    }
  }

  /** Blur the last edited field so Stripe / the host app can finalize state before Continue. */
  private async blurLastPaymentField(cardFrame: Frame): Promise<void> {
    const cvc = cardFrame
      .getByRole("textbox", { name: /cvc|security/i })
      .or(cardFrame.getByPlaceholder(/cvc/i));
    if ((await cvc.count()) > 0) {
      await cvc.first().blur();
      return;
    }
    await cardFrame.getByRole("textbox", { name: /card number/i }).first().blur();
  }

  private async waitForStripePaymentReady(): Promise<void> {
    await this.page
      .locator('iframe[src*="stripe" i], iframe[name^="__privateStripeFrame"], iframe[title*="Secure" i]')
      .first()
      .waitFor({ state: "visible", timeout: 30_000 });

    await expect(async () => {
      for (const frame of this.page.frames()) {
        const card = frame.getByRole("textbox", { name: /card number/i });
        if ((await card.count()) === 0) {
          continue;
        }
        await expect(card.first()).toBeVisible({ timeout: 5_000 });
        return;
      }
      throw new Error("Stripe card field not mounted yet");
    }).toPass({ timeout: 30_000 });
  }

  /** Postal can render in the same Stripe iframe as the card or on the parent page. */
  private async fillPostalCode(postalCode: string, cardFrame: Frame): Promise<void> {
    const inFrame = cardFrame
      .getByRole("textbox", { name: /postal|zip/i })
      .or(cardFrame.getByPlaceholder(/postal|zip/i));

    if ((await inFrame.count()) > 0) {
      const field = inFrame.first();
      await field.fill(postalCode);
      await field.blur();
      return;
    }

    const onPage = this.page
      .getByRole("textbox", { name: /postal|zip/i })
      .or(this.page.getByLabel(/postal code/i));

    if ((await onPage.count()) > 0) {
      const field = onPage.first();
      await field.fill(postalCode);
      await field.blur();
      return;
    }

    throw new Error(
      "Could not find a postal / ZIP field in the Stripe frame or on the payment page."
    );
  }

  async expectTotal(expectedAmount: string): Promise<void> {
    const re = new RegExp(`\\$${expectedAmount}`);
    const totalSection = this.page.locator(".total_today, .pricing-detail").first();
    await expect(
      totalSection
        .locator('span:not([class*="original-price"])')
        .filter({ hasText: re })
        .first()
    ).toBeVisible();
  }

  async expectPaymentDeclined(): Promise<void> {
    const decline = /card was declined|your card was declined|declined|payment could not be processed|payment failed/i;

    await expect(async () => {
      const onHost = this.page.getByText(decline).first();
      if (await onHost.isVisible().catch(() => false)) {
        return;
      }
      for (const frame of this.page.frames()) {
        const inFrame = frame.getByText(decline).first();
        if (await inFrame.isVisible().catch(() => false)) {
          return;
        }
      }
      throw new Error("Decline message not visible on host page or in any frame (including Stripe)");
    }).toPass({ timeout: 45_000 });
  }
}

