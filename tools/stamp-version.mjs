/**
 * Stamp the release version and asset URLs into system.json during CI.
 * Reads VERSION and GITHUB_REPOSITORY from the environment.
 *   manifest -> /releases/latest/download/system.json  (so Foundry sees updates)
 *   download -> this exact release's pinned system.zip asset
 */
import { readFileSync, writeFileSync } from "node:fs";

const version = process.env.VERSION;
const repo = process.env.GITHUB_REPOSITORY;
if (!version || !repo) {
  console.error("Missing VERSION or GITHUB_REPOSITORY env.");
  process.exit(1);
}

const s = JSON.parse(readFileSync("system.json", "utf8"));
s.version = version;
s.manifest = `https://github.com/${repo}/releases/latest/download/system.json`;
s.download = `https://github.com/${repo}/releases/download/v${version}/system.zip`;
writeFileSync("system.json", JSON.stringify(s, null, 2) + "\n");
console.log(`Stamped system.json: v${version} for ${repo}`);
