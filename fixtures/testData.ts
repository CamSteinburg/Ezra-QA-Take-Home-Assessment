/**
 * Shared staging member for `booking.spec` (serial). Checked in so reviewers can run
 * `npm ci && npx playwright install --with-deps && npx playwright test` with no `.env`.
 * In a real repo, inject via CI secrets instead of committing.
 */
export const stagingLogin = {
  email: "detoy83481@pmdeal.com",
  password: "S1lentnsweet!",
} as const;

export const stripeTestCards = {
  success: "4242424242424242",
  declined: "4000000000000002",
};
