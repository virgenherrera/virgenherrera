import { defineConfig } from "@playwright/test";

const PORT = 8080;
const BASE_URL = `http://localhost:${String(PORT)}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: BASE_URL,
  },
  webServer: {
    command: `pnpm run serve:ssr -- -s`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 10_000,
  },
});
