import { expect, Locator, Page } from "@playwright/test";

/** Step 2 — Schedule your scan: location grid and calendar modal on the same page. */
export class ScheduleYourScanPage {
  constructor(private readonly page: Page) {}

  private calendarRoot(): Locator {
    return this.page.locator("calendar, .calendar").first();
  }

  async expectOnPage(): Promise<void> {
    await expect(
      this.page.getByText(/where would you like|select a location|choose a location/i)
    ).toBeVisible();
  }

  async expectCalendarVisible(): Promise<void> {
    await expect(this.calendarRoot()).toBeVisible();
    await expect(
      this.calendarRoot().locator('[data-testid*="cal-day-content"]').first()
    ).toBeVisible({ timeout: 60_000 });
  }

  async chooseRecommendedLocation(): Promise<void> {
    await this.page.getByText(/recommended/i).first().click();
  }

  private calendarDayCells(): Locator {
    return this.calendarRoot().locator('[data-testid*="cal-day-content"]');
  }

  private async isCalendarDayBookable(cell: Locator): Promise<boolean> {
    if ((await cell.count()) === 0) {
      return false;
    }
    const first = cell.first();
    if (!(await first.isVisible({ timeout: 1_000 }).catch(() => false))) {
      return false;
    }

    return first.evaluate((el) => {
        const disabledClass = /\b(disabled|unavailable|is-disabled|day-disabled|day--disabled|blocked|muted|out-of-range|inactive|not-available|text-muted|text-gray|opacity-\d|is-muted)\b/i;

        let node: Element | null = el;
        while (node) {
          if (node.getAttribute("aria-disabled") === "true") {
            return false;
          }
          if (node.getAttribute("data-disabled") === "true") {
            return false;
          }
          if (node.hasAttribute("disabled")) {
            return false;
          }
          const ds = node.getAttribute("data-available");
          if (ds === "false" || ds === "0") {
            return false;
          }
          const cls = (node as HTMLElement).className?.toString?.() ?? "";
          if (cls && disabledClass.test(cls)) {
            return false;
          }
          const tag = node.nodeName.toLowerCase();
          if ((tag === "button" || tag === "a") && (node as HTMLButtonElement).disabled) {
            return false;
          }
          node = node.parentElement;
        }

        const visCheck = (node: Element) => {
          const s = window.getComputedStyle(node);
          if (s.visibility === "hidden" || s.display === "none") {
            return false;
          }
          if (s.pointerEvents === "none") {
            return false;
          }
          if (s.cursor === "not-allowed") {
            return false;
          }
          const op = parseFloat(s.opacity);
          if (Number.isFinite(op) && op < 0.45) {
            return false;
          }
          return true;
        };

        if (!visCheck(el)) {
          return false;
        }

        // Day number is often a nested span; muted gray applies there while the wrapper stays default.
        const inner =
          el.querySelector<HTMLElement>("span, b, strong, [class*='day'], [class*='Day']") ?? el;
        const s = window.getComputedStyle(inner);
        const m = s.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) {
          const r = Number(m[1]);
          const g = Number(m[2]);
          const b = Number(m[3]);
          const avg = (r + g + b) / 3;
          const fw = parseInt(s.fontWeight, 10) || 400;
          if (avg > 158 && fw < 600) {
            return false;
          }
        }

        return true;
      })
      .catch(() => false);
  }

  private async visibleMonthYearFromCalendar(): Promise<string> {
    const raw = ((await this.calendarRoot().innerText()) ?? "").replace(/\s+/g, " ");
    const match = raw.match(
      /\b((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?))\s+(\d{4})\b/i
    );
    if (match) {
      return `${match[1]} ${match[2]}`;
    }
    return "";
  }

  private dayOfMonthFromCell(cell: Locator): Promise<number> {
    return cell.first().innerText().then((raw) => {
        const m = raw.replace(/\s/g, " ").trim().match(/\b([1-9]|[12]\d|3[01])\b/);
        return m ? parseInt(m[1], 10) : NaN;
      });
  }

  private buildDateLabel(monthYear: string, day: number): string {
    const my = monthYear.match(/^(.+?)\s+(\d{4})$/);
    if (my && Number.isFinite(day)) {
      return `${my[1].trim()} ${day}, ${my[2]}`;
    }
    if (Number.isFinite(day)) {
      return String(day);
    }
    return monthYear || "";
  }

  /**
   * Clicks the first calendar day that looks bookable (not merely the first node in the DOM).
   * @returns Human-readable date label (e.g. `May 8, 2026`) for assertions on confirmation.
   */
  async chooseFirstAvailableCalendarDay(): Promise<string> {
    const cells = this.calendarDayCells();
    const n = await cells.count();
    if (n === 0) {
      throw new Error("No calendar day cells found (.calendar has no *-cal-day-content).");
    }

    for (let i = 0; i < n; i++) {
      const cell = cells.nth(i);
      if (!(await this.isCalendarDayBookable(cell))) {
        continue;
      }
      const monthYear = await this.visibleMonthYearFromCalendar();
      const day = await this.dayOfMonthFromCell(cell);
      const dateLabel = this.buildDateLabel(monthYear, day);
      await cell.click();
      return dateLabel;
    }

    throw new Error("No bookable calendar day found — every *-cal-day-content cell looked disabled or non-interactive. Inspect disabled styling / data attributes in the app.");
  }

  /**
   * Clicks the first label in order that is visible within a short window (slots vary by env/day).
   * @returns the label that was chosen
   */
  async chooseFirstTimeFromBank(timeLabels: readonly string[]): Promise<string> {
    if (timeLabels.length === 0) {
      throw new Error("chooseFirstTimeFromBank: no candidate times provided");
    }

    for (const label of timeLabels) {
      const trimmed = label.trim();
      const loc = this.page.getByText(trimmed, { exact: true }).first();
      const visible = await loc.isVisible({ timeout: 1_500 }).catch(() => false);
      if (!visible) {
        continue;
      }
      await loc.click();
      return trimmed;
    }

    throw new Error(
      `No time slot matched from bank (${timeLabels.length} tried): ${timeLabels.join(", ")}`
    );
  }

  /**
   * First available day on the visible calendar, then first matching time from the bank.
   * @returns Chosen time label and date string for post-payment order-details assertions.
   */
  async pickSlot(
    times: string | readonly string[]
  ): Promise<{ time: string; dateLabel: string }> {
    const bank = typeof times === "string" ? [times] : [...times];
    const dateLabel = await this.chooseFirstAvailableCalendarDay();
    const time = await this.chooseFirstTimeFromBank(bank);
    return { time, dateLabel };
  }

  async clickContinue(): Promise<void> {
    await this.page.getByRole("button", { name: /continue/i }).click();
  }
}
