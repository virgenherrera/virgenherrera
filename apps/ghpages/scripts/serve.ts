import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

interface ServerConfig {
  root: string;
  port: number;
  dotfiles: boolean;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, "../server-config.json");
const config: ServerConfig = JSON.parse(
  readFileSync(configPath, "utf-8"),
) as ServerConfig;

const silent = process.argv.includes("--silent");
const flags = [
  config.root,
  `-p ${String(config.port)}`,
  config.dotfiles ? "" : "--no-dotfiles",
  silent ? "-s" : "",
]
  .filter(Boolean)
  .join(" ");

execSync(`pnpm exec http-server ${flags}`, {
  stdio: "inherit",
  cwd: resolve(__dirname, ".."),
});
