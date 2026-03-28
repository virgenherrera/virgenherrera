import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "@playwright/test";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, "server-config.json");
const serverConfig = JSON.parse(readFileSync(configPath, "utf-8")) as {
  port: number;
};

const BASE_URL = `http://localhost:${String(serverConfig.port)}`;

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
    command: "pnpm run serve:ssr -- --silent",
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 10_000,
  },
});
