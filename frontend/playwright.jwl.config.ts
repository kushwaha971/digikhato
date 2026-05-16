/**
 * Jewellery ERP — Playwright Config
 *
 * Usage:
 *   npx playwright test -c playwright.jwl.config.ts              # all suites headless
 *   npx playwright test -c playwright.jwl.config.ts --headed     # visible browser
 *   npx playwright test -c playwright.jwl.config.ts --ui         # Playwright UI mode
 *   npx playwright test -c playwright.jwl.config.ts --debug      # step debugger
 *   SLOWMO=800 npx playwright test -c playwright.jwl.config.ts --headed
 *
 * Per-suite tags:
 *   npx playwright test -c playwright.jwl.config.ts --grep @smoke
 *   npx playwright test -c playwright.jwl.config.ts --grep @billing
 *   npx playwright test -c playwright.jwl.config.ts --grep @api
 */
import { defineConfig, devices } from "@playwright/test";

const SLOW_MO = process.env.SLOWMO ? Number.parseInt(process.env.SLOWMO) : 0;
const HEADED = process.env.HEADED === "true";

export default defineConfig({
  testDir: "./tests/e2e/jewellery/suites",
  timeout: 90_000,
  expect: { timeout: 12_000 },

  // Serial within each file — jewellery flows are stateful
  fullyParallel: false,
  workers: 1,

  // Retry once on flake
  retries: process.env.CI ? 2 : 1,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report/jwl", open: "never" }],
    ["json", { outputFile: "test-results/jwl-results.json" }],
  ],

  outputDir: "test-results/jwl",

  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3050",
    trace: "retain-on-failure",
    screenshot: "on",
    video: "retain-on-failure",
    launchOptions: {
      slowMo: SLOW_MO,
      headless: !HEADED,
    },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // Reuse the running Next.js dev server (port 3050)
  webServer: {
    command: "echo 'Using existing dev server'",
    url: process.env.E2E_BASE_URL || "http://localhost:3050",
    reuseExistingServer: true,
    timeout: 5_000,
  },

  projects: [
    {
      name: "chromium-jwl",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile-jwl",
      use: {
        ...devices["iPhone 14"],
      },
    },
    {
      name: "tablet-jwl",
      use: {
        ...devices["iPad Pro 11"],
      },
    },
  ],
});
