import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";

const envUrls: Record<string, string> = { //easy to point tests to any environment, whatever envs the team is using
  local: "http://localhost:3000",
  dev: "https://myezra-dev.ezra.com",
  qa: "https://myezra-qa.ezra.com",
  staging: "https://myezra-staging.ezra.com",

};

const targetEnv = process.env.TEST_ENV || "staging";
const baseURL = process.env.BASE_URL || envUrls[targetEnv] || envUrls.staging; //staging always the fallback

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  timeout: 120_000,
  expect: { timeout: 120_000 },
  retries: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL,
    screenshot: "only-on-failure",
    /** Inspect Network / DOM when confirmation step fails (plan: diagnose timeout). */
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ]
});
