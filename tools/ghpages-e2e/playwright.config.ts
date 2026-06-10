import { defineConfig } from "@playwright/test";

const PORT = 4200;
const BASE_URL = `http://localhost:${String(PORT)}`;
const ghpagesDist = "../../apps/ghpages/dist/app-ghpages/browser";

export default defineConfig({
  testDir: "./specs",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],
  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  outputDir: "test-results",
  webServer: {
    command: `npx http-server ${ghpagesDist} -p ${String(PORT)} --no-dotfiles -c-1 -s`,
    url: BASE_URL,
    reuseExistingServer: !process.env["CI"],
    timeout: 10_000,
  },
});
