import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(__dirname, "../server-config.json");
const raw = readFileSync(configPath, "utf-8");
const config = JSON.parse(raw) as {
  root: string;
  port: number;
  dotfiles: boolean;
};

const silent = process.argv.includes("--silent");
const flags = [
  config.root,
  `-p ${String(config.port)}`,
  config.dotfiles ? "" : "--no-dotfiles",
  silent ? "-s" : "",
]
  .filter(Boolean)
  .join(" ");

execSync(`http-server ${flags}`, {
  stdio: "inherit",
  cwd: resolve(__dirname, ".."),
});
