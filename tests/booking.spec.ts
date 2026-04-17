import { test } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ReviewPlanPage } from "../pages/ReviewPlanPage";
import { ScheduleYourScanPage } from "../pages/ScheduleYourScanPage";
import { OrderSummaryPage } from "../pages/OrderSummaryPage";
import { ReserveAppointmentPage } from "../pages/ReserveAppointmentPage";
import { stagingLogin, stripeTestCards } from "../fixtures/testData";
import { bookingDefaults } from "../fixtures/bookingDefaults";

test.describe("Booking flow", () => {
  // Same staging user / session — avoid parallel flows mutating booking state. 
  test.describe.configure({ mode: "serial" });

  let loginPage: LoginPage;
  let reviewPlan: ReviewPlanPage;
  let scheduleYourScan: ScheduleYourScanPage;
  let reserve: ReserveAppointmentPage;
  let orderSummary: OrderSummaryPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    reviewPlan = new ReviewPlanPage(page);
    scheduleYourScan = new ScheduleYourScanPage(page);
    reserve = new ReserveAppointmentPage(page);
    orderSummary = new OrderSummaryPage(page);
    await loginPage.goto();
    await loginPage.login(stagingLogin.email, stagingLogin.password);
  });

  async function navigateToPayment() {
    await reviewPlan.gotoUserDashboardBooking();
    await reviewPlan.expectOnPage();
    await reviewPlan.fillDobAndGenderIfPresent();
    await reviewPlan.chooseScan(bookingDefaults.scanName);
    await reviewPlan.expectAddOnsVisible();
    await reviewPlan.clickContinue();
    await scheduleYourScan.expectOnPage();
    await scheduleYourScan.chooseRecommendedLocation();
    await scheduleYourScan.expectCalendarVisible();
    const schedule = await scheduleYourScan.pickSlot(bookingDefaults.appt1TimeOptions);
    await scheduleYourScan.clickContinue();
    return schedule;
  }

  test("1 end-to-end booking with successful payment happy path", async () => {
    const schedule = await navigateToPayment();
    await reserve.expectTotal(bookingDefaults.expectedTotal);
    await reserve.payByCard(stripeTestCards.success, "01/28", "999", bookingDefaults.postalCode);
    await reserve.clickContinue();
    await orderSummary.expectLoaded();
    await orderSummary.expectDetailsIncludeSchedule(schedule);
  });

  test("2 declined payment blocks booking", async () => {
    await navigateToPayment();
    await reserve.payByCard(stripeTestCards.declined, "01/28", "999", bookingDefaults.postalCode);
    await reserve.clickContinue();
    await reserve.expectPaymentDeclined(); //staying on the same page after continue asserts no booking was created
  });

  test("3 continue disabled without required selections", async () => { //largely poc, would need to be expanded to cover every use case in all 3 steps of booking journey as there are many
    await reviewPlan.gotoUserDashboardBooking();
    await reviewPlan.expectOnPage();
    await reviewPlan.expectContinueDisabled();
  });
});
