# Ezra QA Take-Home Assessment - Cameron Steinburg

---

## Question 1 — Booking Flow Test Cases

### Part 1 — 15 test cases (highest to lowest priority)

1. End-to-end booking with successful payment
2. Declined payment blocks booking
3. Double-submit does not create duplicate charge
4. Continue button disabled without required selections
5. Switching scans updates the price
6. Add-on persists through navigation
7. Changing location updates available dates/times
8. Times display in the correct time zone
9. Back navigation preserves state
10. Slot taken by another user after selection
11. Promo code validation
12. Alternative payment methods do not dead-end
13. Booking without selecting a scan is blocked
14. Network interruption during payment does not corrupt state
15. Keyboard-only accessibility

---

**1. End-to-end booking with successful payment**  
Preconditions: User is logged in. At least one location has available slots.


| Step | Action                                                                                     | Expected Result                                                                                                                                                                                                                                   |
| ---- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Navigate to dashboard and click "Book a Scan"                                              | Scan selection page loads with scan cards and prices as well as what's included and not included. Heart CT and Lung CT scans are disabled because test use falls outside the eligible date range for those imaging types — info icon with tooltip |
| 2    | Select a scan card (e.g., "MRI Scan")                                                      | Card is highlighted; price appears in summary. Add-ons are shown but are disabled because test use falls outside the eligible date range for those imaging types — info icon with tooltip. Continue enables because no add-ons can be chosen      |
| 3    | Click Continue                                                                             | Location selection page loads with facility list. State dropdown is set to All Available by default. The recommended facility should be AMRIC in New York.                                                                                        |
| 4    | Select the Recommended facility                                                            | Facility is highlighted; the app automatically scrolls to the bottom of the page and loads an up-to-date scheduling tool.                                                                                                                         |
| 5    | Choose a valid date and time                                                               | This location only requests a single date/time as opposed to 3 at some locations. Continue button enables when a date/time is chosen                                                                                                              |
| 6    | Click Continue                                                                             | Payment page loads with order summary and Stripe form                                                                                                                                                                                             |
| 7    | Verify the total matches the selected scan price                                           | Total displays correctly (e.g., $999)                                                                                                                                                                                                             |
| 8    | Enter valid Stripe test card (4242 4242 4242 4242), any future expiry, and any 3-digit CVC | Fields accept input without error. The user sees a new modal to save information for faster checkout next time.                                                                                                                                   |
| 9    | Click Pay / Complete Booking, do not save information for faster checkout                  | Payment processes; confirmation screen appears with appointment details                                                                                                                                                                           |


---

**2. Declined payment blocks booking**  
Preconditions: User is logged in. Scan selection, add-ons, location, and scheduling completed.


| Step | Action                                                                                           | Expected Result                                                                            |
| ---- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 1    | Complete scan selection, add-ons, location, and scheduling; enter valid info everywhere required | Arrive at payment page with order summary                                                  |
| 2    | Enter Stripe declined test card (4000 0000 0000 0002), any future expiry, and any 3-digit CVC    | Fields accept input                                                                        |
| 3    | Click Pay / Complete Booking                                                                     | Payment is declined; error shown on or near the card field and/or inside the Stripe iframe |
| 4    | Verify user remains on payment step                                                              | Page still shows payment form; no confirmation shown                                       |
| 5    | Verify no booking was created                                                                    | No confirmation email; no appointment in dashboard                                         |


---

**3. Double-submit does not create duplicate charge**  
Preconditions: User is logged in. Scan selection, add-ons, location, and scheduling completed.


| Step | Action                                                     | Expected Result                                                                               |
| ---- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1    | Complete scan selection, add-ons, location, and scheduling | Arrive at payment page                                                                        |
| 2    | Enter valid Stripe test card details                       | Fields accept input                                                                           |
| 3    | Click Pay / Complete Booking                               | Payment begins processing                                                                     |
| 4    | Immediately click Pay again before response returns        | Second click is ignored or button is disabled                                                 |
| 5    | Wait for payment to complete                               | Exactly one booking confirmation is shown                                                     |
| 6    | Check Stripe dashboard or network responses                | Only one charge was created. Only one payment confirmation email and API/DB record is present |


---

**4. Continue disabled without required selections**  
Preconditions: User is logged in.


| Step | Action                                                                                               | Expected Result                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 1    | Click "Book a Scan" to reach scan selection                                                          | Page loads with Continue button visible but disabled                                                                |
| 2    | Select an enabled scan card that requires an add-on                                                  | Scan highlighted. Add-ons shown but Continue not yet enabled                                                        |
| 3    | Select an enabled add-on                                                                             | Add-on highlighted. Continue is now enabled                                                                         |
| 4    | Click Continue, select a location that needs 1 appointment and 1 time, continue to date/time picker  | Date/time picker loads with Continue still disabled. Continue disabled when a location is chosen but not a time     |
| 5    | Pick a time                                                                                          | Continue becomes enabled                                                                                            |
| 6    | Change location to 1 that needs 2 locations and 3 times                                              | Continue becomes disabled                                                                                           |
| 7    | Select 2 valid locations with 3 valid times each                                                     | Only when all dates and times are chosen does Continue enable again                                                 |
| 8    | Click Continue                                                                                       | Chosen times and dates appear in the corner along with the selected scan name and price. Continue is disabled       |
| 9    | On the payment page, leave all Stripe card fields empty (or leave one or more required fields blank) | Complete Booking stays disabled. Form validation indicates incomplete input as applicable                           |
| 10   | Enter an incomplete or invalid card number (e.g., too few digits); move focus out of the field       | Inline validation shows an error or invalid state. Complete Booking stays disabled                                  |
| 11   | Fill card number, expiry, and CVC with valid Stripe test values and ZIP/postal                       | Each field accepts input; no red/error state on the card fields once values are valid                               |
| 12   | Observe Pay / Complete Booking enablement                                                            | Continue does not enable until all required CC fields are populated and visible validation shows no blocking errors |
| 13   | Click Continue                                                                                       | Payment successful, summary accurate to price and selections                                                        |


*Manual charter:* Steps 1–13 explore Continue / gating across add-ons, locations, times, and payment. They are **not** all covered by the Playwright suite in this repo — see **Automation → What’s automated in this repo** below (only the plan-step slice for case 4).

---

**5. Switching scans updates the price**  
Preconditions: User is logged in.


| Step | Action                                                        | Expected Result                                                                   |
| ---- | ------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 1    | Click "Book a Scan" to reach scan selection                   | Scan cards displayed with prices                                                  |
| 2    | Select "MRI Scan" and note the displayed price                | Price shown (e.g., $999)                                                          |
| 3    | Switch selection to "Heart CT Scan"                           | Card selection updates; price changes to Heart CT price (e.g., $249)              |
| 4    | Continue through add-ons, location, and scheduling to payment | Order summary on payment page reflects the Heart CT Scan price, not the MRI price |


---

**6. Add-on persists through navigation**  
Preconditions: User is logged in. Scan selected.


| Step | Action                                                                    | Expected Result                                          |
| ---- | ------------------------------------------------------------------------- | -------------------------------------------------------- |
| 1    | On the add-ons page, select an add-on (e.g., "Heart CT Scan")             | Add-on is checked; total updates to include add-on price |
| 2    | Click Continue to location selection                                      | Location page loads                                      |
| 3    | Click Back to return to add-ons page                                      | Add-ons page loads                                       |
| 4    | Verify add-on is still selected                                           | Heart CT add-on remains checked; total still includes it |
| 5    | Click Back again to scan selection, then Continue forward through add-ons | Add-on selection is still preserved                      |


---

**7. Changing location updates available dates/times**  
Preconditions: User is logged in. Scan selection and add-ons completed. Multiple locations exist.


| Step | Action                                                                       | Expected Result                                                            |
| ---- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| 1    | On location selection page, choose Facility A and continue to date/time page | Calendar loads with available dates for Facility A                         |
| 2    | Note available dates and times                                               | Dates and times recorded                                                   |
| 3    | Click Back to return to location selection                                   | Location page loads                                                        |
| 4    | Choose a different Facility B and continue to date/time page                 | Calendar refreshes for Facility B                                          |
| 5    | Verify available dates/times differ or update appropriately                  | Calendar shows Facility B availability; previous time selection is cleared |


---

**8. Times display in the correct time zone**  
Preconditions: User is logged in. Scan selection, add-ons, and location completed.


| Step | Action                                                                       | Expected Result                                                                          |
| ---- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1    | On the date/time page, select a date for Appointment 1                       | Time chips appear with a time zone note (e.g., "Pacific Standard Time")                  |
| 2    | Select 3 preferred times                                                     | Times are highlighted                                                                    |
| 3    | Complete Appointment 2 selections, continue to payment, and complete booking | Confirmation page appears                                                                |
| 4    | Verify appointment times on confirmation                                     | Times match selected times and time zone; no off-by-one-hour error or time zone mismatch |


---

**9. Back navigation preserves state**  
Preconditions: User is logged in.


| Step | Action                                                          | Expected Result               |
| ---- | --------------------------------------------------------------- | ----------------------------- |
| 1    | Select a scan, continue to add-ons page                         | Add-ons page loads            |
| 2    | Click Back                                                      | Return to scan selection page |
| 3    | Verify scan is still selected                                   | Previous selection retained   |
| 4    | Navigate forward through add-ons and location to date/time page | Date/time page loads          |
| 5    | Select dates and times for both appointments                    | Selections applied            |
| 6    | Click Back                                                      | Return to location selection  |
| 7    | Verify selected facility is still highlighted                   | Location selection retained   |


---

**10. Slot taken by another user after selection**  
Preconditions: Two browser sessions logged in as different users. Both have completed scan selection, add-ons, and location.


| Step | Action                                                                        | Expected Result                                            |
| ---- | ----------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1    | In Session A: on date/time page, select dates and times for both appointments | Selections applied                                         |
| 2    | In Session B: select the same dates and times                                 | Selections applied                                         |
| 3    | In Session A: complete payment                                                | Booking confirmed                                          |
| 4    | In Session B: attempt to complete payment                                     | Clear error message indicating slot is no longer available |
| 5    | Verify Session B can go back and reselect different times                     | Calendar/time chips update; user can pick new slots        |


---

**11. Promo code validation**  
Preconditions: User is logged in. Scan selection, add-ons, location, and scheduling completed. On payment page with promo code field visible.


| Step | Action                                                                               | Expected Result                                  |
| ---- | ------------------------------------------------------------------------------------ | ------------------------------------------------ |
| 1    | Enter an invalid promo code (e.g., "FAKECODE123")                                    | Error message displayed (e.g., "Invalid code")   |
| 2    | Clear the field and enter a valid promo code (if one exists in the test environment) | Code accepted; total adjusts to reflect discount |
| 3    | Verify the discounted total is correct                                               | Math checks out (original price minus discount)  |
| 4    | Complete payment with discounted total                                               | Charge matches the discounted amount             |


---

**12. Alternative payment methods do not dead-end**  
Preconditions: User is logged in. Scan selection, add-ons, location, and scheduling completed. On payment page with Stripe element showing multiple payment options.


| Step | Action                                                                      | Expected Result                                                      |
| ---- | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1    | On payment page, observe available methods (Card, Google Pay, Bank, Affirm) | Multiple payment options visible                                     |
| 2    | Select Google Pay (or another alt method)                                   | UI responds — either opens the payment flow or shows a clear message |
| 3    | If not supported in test mode, cancel and switch back to Card               | Card form reappears without errors; no stuck state                   |
| 4    | Complete payment via Card                                                   | Payment succeeds normally                                            |


---

**13. Booking without selecting a scan is blocked**  
Preconditions: User is logged in.


| Step | Action                                      | Expected Result                             |
| ---- | ------------------------------------------- | ------------------------------------------- |
| 1    | Click "Book a Scan" to reach scan selection | Page loads with scan cards                  |
| 2    | Do not select any scan card                 | Continue button is disabled / not clickable |
| 3    | Select a scan card                          | Continue becomes enabled                    |
| 4    | Deselect the scan card (if possible)        | Continue returns to disabled                |


---

**14. Network interruption during payment does not corrupt state**  
Preconditions: User is logged in. Scan selection, add-ons, location, and scheduling completed. On payment page. Browser DevTools available.


| Step | Action                                              | Expected Result                                                                    |
| ---- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 1    | Enter valid card details on payment page            | Fields populated                                                                   |
| 2    | Open DevTools Network tab and prepare to go offline | Ready                                                                              |
| 3    | Click Pay / Complete Booking                        | Payment request fires                                                              |
| 4    | Immediately toggle network to offline               | Request is interrupted                                                             |
| 5    | Re-enable network and refresh the page              | Page recovers; either shows confirmation (if payment went through) or allows retry |
| 6    | Verify no duplicate charges exist                   | At most one charge in Stripe                                                       |


---

**15. Keyboard-only accessibility**  
Preconditions: User is logged in. Mouse is not used.


| Step | Action                                                                   | Expected Result                     |
| ---- | ------------------------------------------------------------------------ | ----------------------------------- |
| 1    | Tab to scan card and press Enter/Space                                   | Scan is selected                    |
| 2    | Tab to Continue and press Enter                                          | Navigates to add-ons page           |
| 3    | Tab to Skip/Continue and press Enter                                     | Navigates to location selection     |
| 4    | Tab to facility tile and press Enter                                     | Facility is selected                |
| 5    | Tab to Continue and press Enter                                          | Navigates to date/time page         |
| 6    | Tab to calendar days and press Enter for both appointment dates          | Days are selected                   |
| 7    | Tab to time chips and press Enter for all 6 time preferences             | Times are selected                  |
| 8    | Tab to Continue and press Enter                                          | Navigates to payment page           |
| 9    | Tab through payment fields (card, expiry, CVC) and fill via keyboard     | Fields accept keyboard input        |
| 10   | Tab to Pay / Complete Booking and press Enter                            | Payment submits                     |
| 11   | Verify focus order throughout was logical (left-to-right, top-to-bottom) | No focus traps; no skipped controls |


### Part 2 — Why the top 3 matter most

1. **Happy path** — this is the money path. If it's broken, nothing else matters. It also touches all three steps, so it's a good integration smoke test.
2. **Declined card** — a payment failure that silently creates a booking (or shows no error) is a support nightmare and erodes user trust. I've seen this happen when the frontend optimistically updates state before the payment response comes back.
3. **Double-submit protection** — double charges are one of the highest-severity bugs you can ship. They cause chargebacks, support tickets, and reputational damage. This is the kind of thing that's easy to miss in manual testing because you have to be fast or use tooling to trigger it. Verifying that submit buttons disable (or ignore extra clicks) after the first submission is as fundamental as tests get.

---

## Question 2 — Privacy and Endpoint Security

*The API paths and JSON bodies below are **illustrative examples** for the write-up*

### Part 1 — Integration test: preventing cross-member questionnaire access

The medical questionnaire flow creates resources tied to a specific member, and those resources are probably referenced by some kind of ID in the API. If the backend doesn't verify ownership, any authenticated user could read or modify another member's medical data just by swapping that ID.

Preconditions: Two test accounts (User A and User B) exist. Network inspection available (DevTools or proxy).


| Step | Action                                                                                                              | Expected Result                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1    | Log in as User A                                                                                                    | Authenticated; access token obtained                                                      |
| 2    | Start the medical questionnaire and submit at least one answer                                                      | Questionnaire created; grab resource IDs from network traffic (memberId, questionnaireId) |
| 3    | Confirm User A can read their own questionnaire via API (`GET /api/medical-questionnaire/{qA}` with User A's token) | `200 OK` with questionnaire data                                                          |
| 4    | Log in as User B                                                                                                    | Authenticated; separate access token obtained                                             |
| 5    | Using User B's token, attempt to read User A's questionnaire (`GET /api/medical-questionnaire/{qA}`)                | `403` or `404`; no personal health info leaked in the response body                       |
| 6    | Using User B's token, attempt to modify User A's questionnaire (`PATCH /api/medical-questionnaire/{qA}`)            | `403` or `404`; User A's data unchanged                                                   |
| 7    | Attempt the same GET with no Authorization header at all                                                            | `401 Unauthorized`                                                                        |
| 8    | Log back in as User A and verify questionnaire data is intact                                                       | Data matches what was submitted in step 2; no mutations from User B's attempts            |


### Part 2 — HTTP requests

Preconditions: Two test accounts exist. API client available (cURL, Postman, or Playwright `request` context).


| Step | Method  | Endpoint                           | Body                                                                  | Expected                                          |
| ---- | ------- | ---------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------- |
| 1    | `POST`  | `/api/auth/login`                  | `{ "email": "user.a@example.com", "password": "StrongPassword123!" }` | `200`; grab `access_token` as `tokenA`            |
| 2    | `POST`  | `/api/medical-questionnaire/start` | `{ "memberId": "memberA" }`                                           | `200`; grab `questionnaireId` as `qA`             |
| 3    | `GET`   | `/api/medical-questionnaire/{qA}`  | —                                                                     | `200`; questionnaire data returned (sanity check) |
| 4    | `PATCH` | `/api/medical-questionnaire/{qA}`  | `{ "answers": [{ "questionId": "q1", "value": "yes" }] }`             | `200`; answer persisted                           |
| 5    | `POST`  | `/api/auth/login`                  | `{ "email": "user.b@example.com", "password": "StrongPassword123!" }` | `200`; grab `access_token` as `tokenB`            |
| 6    | `GET`   | `/api/medical-questionnaire/{qA}`  | —                                                                     | `403` or `404`; no PHI in response body           |
| 7    | `PATCH` | `/api/medical-questionnaire/{qA}`  | `{ "answers": [{ "questionId": "q1", "value": "tamper" }] }`          | `403` or `404`; User A's data unchanged           |
| 8    | `GET`   | `/api/medical-questionnaire/{qA}`  | —                                                                     | `401 Unauthorized`                                |


### Part 3 — Managing security quality across 100+ sensitive endpoints

Realistically, you can't test every endpoint with the same depth. Here's how I'd approach it:

**Start with an inventory.** Use your OpenAPI/Swagger (or similar) spec so you can see every route in one place. Tag each endpoint with what kind of data it touches. This gives you a prioritised list and doubles as audit documentation.

**Build an authorisation matrix.** For the high-risk endpoints, define who should and shouldn't have access:


| Caller        | Resource       | Expected |
| ------------- | -------------- | -------- |
| Owner         | Own data       | 200      |
| Other member  | Owner's data   | 403/404  |
| No token      | Any data       | 401      |
| Expired token | Any data       | 401      |
| Wrong role    | Admin endpoint | 403      |


Turn that into automated API tests that run in CI on any PR touching routes or middleware. You don't need to do this for every endpoint on day one — start with the personal health info and payment ones and expand over time.

**Prevent gaps at the code level.** Use linting rules to enforce that new endpoints always have auth middleware attached. That way a missing access check gets caught in code review, not in production.

**The trade-offs:**

- This approach front-loads effort into the inventory and matrix, but it pays off fast because you're not guessing about coverage anymore.
- Authorisation tests need isolated test data (multiple users, distinct roles). That's annoying to set up in shared environments but necessary — if your tests share a user account, you can't actually verify ownership boundaries.

---

## Automation

For **manual** exploratory testing, a fresh member account can surface more flows (DOB/gender, questionnaires, age gates). The Playwright tests here use **one shared** staging login defined in `[fixtures/testData.ts](fixtures/testData.ts)` on every run, with the suite configured **serial** so concurrent bookings do not fight over the same user state.

To build stable selectors for automation, I swept each page for existing `data-testid` attributes using a quick console command:

```javascript
document.querySelectorAll('[data-testid]').forEach(el =>
  console.log(el.getAttribute('data-testid'), '→', el.tagName, el.textContent?.trim().slice(0, 50))
);
```

This turned up usable test IDs on the scan selection page — I wired these into the Page Objects directly. Where test IDs weren't present I fell back to role-based locators or whatever seemed the least brittle.

I used Playwright with a Page Object Model structure to automate 3 of the test cases from Question 1.

### What’s automated in this repo


| Question 1 case           | Playwright test (in `booking.spec.ts`)                    | What it asserts                                                                                                                                           |
| ------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** — Happy path        | `1 end-to-end booking with successful payment happy path` | Login → book flow → pay (success card) → order summary visible; total matches `bookingDefaults.expectedTotal`; confirmation includes scheduled date/time. |
| **2** — Declined          | `2 declined payment blocks booking`                       | Same navigation to payment; declined card; decline message visible (host or Stripe iframe); stays off confirmation.                                       |
| **4** — Continue disabled | `3 continue disabled without required selections`         | Opens Book a scan, plan step: **Continue disabled** until a scan is selected — **only** this slice of case 4; not the full manual table (steps 2–13).     |


### Which tests and why

1. **Happy path through payment** — if this breaks, the business isn't making money. It exercises all three steps end-to-end, so it catches integration issues between scan selection, scheduling, and payment.
2. **Declined card** — I've seen bugs in other checkout flows where a declined payment still creates a pending booking, or where the error message is swallowed. This test makes sure the user stays on the payment step and sees a clear error.
3. **Step gating (Continue disabled)** — this is cheap to automate and catches a whole class of regressions where required fields get accidentally removed or the button state logic breaks.

I didn't automate the duplicate-submit case because it's harder to be deterministic in a take-home setting — it depends on timing and backend behaviour that I can't fully control without more access to the DB. In a real project, I'd tackle that next.

### Trade-offs and assumptions

- I only have access to some `data-testid` attributes in the DOM and cannot presently add more to the FE myself, so I have to use other locators in those cases. These are stable enough for a take-home but I'd want to harden them with test IDs in a real codebase. The Page Objects are structured so swapping selectors is a one-line change per action.
- Many checks had to be put in place for situational elements that can interfere with the tests, such as the cookie banner or the time zone modal.
- I first tried a fixture-driven approach to scheduling (fixed dates/times in the fixture). That made repeat runs brittle—the tester would constantly have to change dates and times because earlier runs had already consumed those slots. To stabilise the happy path, I tried taking the first enabled date/time in the UI; when that was not reliable enough, I used a brute-force flow: walk the calendar from the bottom, try each day against a bank of candidate times, and pick the first slot that is present and enabled. It is inelegant but consistent. With broader environment access, I would call an API for calendar availability and select the next open slot instead.
- The automated happy path uses no add-ons and a single location. Mapping which locations require one appointment versus two, and how many time slots each needs, had many combinations; for scope I kept a simple path to demonstrate the flow without getting stuck on every variant. The same is true of add-ons, some need questionnaires filled out, and many of these things mentioned are gated behind user age checks, which also adds to the complexity.
- Only way I control state is by using a test user that I know already does not have any appointments booked
- Expected disabled test case is mostly a poc as checking every use case where complete must remain disabled is very involved. Is dob and gender present or not for example, how many appts does the location need and is the button still disabled when only some times are chosen but not all, etc
- Don't have entire list of addons and where they are available
- Excessive regex, made some text selectors broad but would naturally add data-testids in the future

### Scalability and what I'd implement next

- Wire up API-level assertions (check that the booking actually exists in the backend after payment, not just that the UI shows a confirmation) as well as DB-level data checks if possible
- Add the duplicate-submit test
- Add more Stripe card scenarios (insufficient funds, expired, etc.)
- Integrate into CI with trace/video artifacts on failure
- Fixture test data for each environment instead of one set of data used for all

### Setup

```bash
git clone <this-repo>
cd ezra-qa-takehome
npm ci                            # deterministic install via lockfile
npx playwright install --with-deps
npx playwright test               # headless; targets staging by default (see below)
```

No `.env` is required for the default run: login lives in `[fixtures/testData.ts](fixtures/testData.ts)`, and `[playwright.config.ts](playwright.config.ts)` resolves `baseURL` from `process.env.BASE_URL` or, if unset, from `TEST_ENV` → URL (default `staging` → `https://myezra-staging.ezra.com`).

**Optional `.env`:** copy `[.env.example](.env.example)` to `.env` to override `**BASE_URL`** (full origin under test), `**TEST_ENV`** (only used when `BASE_URL` is unset), or `**APPT1_TIMES**` (scheduling — see [Configurable test data](#configurable-test-data)). The `.env` file is gitignored so local overrides are not committed.

### Choosing an environment

Set `**BASE_URL**` in `.env` when you need a non-default origin; otherwise the default is staging. Reference URLs (the same values `[playwright.config.ts](playwright.config.ts)` uses when deriving from `TEST_ENV`):


| `TEST_ENV` | URL                               | Command                |
| ---------- | --------------------------------- | ---------------------- |
| `local`    | `http://localhost:3000`           | `npm run test:local`   |
| `dev`      | `https://myezra-dev.ezra.com`     | `npm run test:dev`     |
| `qa`       | `https://myezra-qa.ezra.com`      | `npm run test:qa`      |
| `staging`  | `https://myezra-staging.ezra.com` | `npm run test:staging` |


Scripts such as `npm run test:staging` set `TEST_ENV` via `cross-env` only when you are **not** using a `.env` `BASE_URL`. **Prefer `BASE_URL` in `.env`** when you need an explicit origin (e.g. PR preview); otherwise the default staging URL applies.

### Choosing a run mode


| Command           | What it does                                           |
| ----------------- | ------------------------------------------------------ |
| `npm run test`    | Headless (default, CI-friendly)                        |
| `npm run test:ui` | Playwright's interactive UI mode — great for debugging |


### Configurable test data

Staging login email/password and Stripe test card numbers live in `[fixtures/testData.ts](fixtures/testData.ts)`. Staging-specific booking data (scan name, expected price, add-on card test id + label, postal code, DOB, default gender, scheduling time **bank**, etc.) lives in `[fixtures/bookingDefaults.ts](fixtures/bookingDefaults.ts)` — edit those files when staging data changes. Optional env vars are documented in `[.env.example](.env.example)`: e.g. `APPT1_TIMES` (comma-separated slot labels) narrows which time chips `pickSlot` tries before falling back to the default half-hour bank.

### Other commands

- `npm run test:list` — list all discovered tests without running them
- `npm run typecheck` — run TypeScript compiler checks

---

## Repository layout

Source and config as checked into version control (Playwright page objects, tests, fixtures, tooling). Generated folders (`node_modules/`, `playwright-report/`, `test-results/`, `blob-report/`, `artifacts/`) and optional local overrides (`.env`) are gitignored and omitted below.

```
ezra-qa-takehome/
├── fixtures/
│   ├── bookingDefaults.ts    # scan name, price, add-on, postal, DOB, scheduling time bank, gender default
│   └── testData.ts           # staging login, Stripe test card numbers
├── pages/
│   ├── LoginPage.ts
│   ├── OrderSummaryPage.ts   # post-payment confirmation / order details
│   ├── ReserveAppointmentPage.ts
│   ├── ReviewPlanPage.ts     # plan selection, DOB/gender if shown
│   └── ScheduleYourScanPage.ts
├── tests/
│   └── booking.spec.ts
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── playwright.config.ts
├── README.md
└── tsconfig.json
```

