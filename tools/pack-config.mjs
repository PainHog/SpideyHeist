/**
 * Shared compendium pack configuration — the single source of truth for the
 * pack build (build-packs.mjs) and the validator (validate.mjs), so the two
 * can never drift on pack names, id derivation, or source layout.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const SRC = join(ROOT, "src", "packs");
export const OUT = join(ROOT, "packs");

/** file → output pack, document class & subtype. Must match system.json packs[]. */
export const PACKS = [
  { file: "species", out: "species", collection: "items", type: "Item", subtype: "species" },
  { file: "roles", out: "roles", collection: "items", type: "Item", subtype: "role" },
  { file: "perks", out: "perks", collection: "items", type: "Item", subtype: "perk" },
  { file: "flaws", out: "flaws", collection: "items", type: "Item", subtype: "flaw" },
  { file: "gadgets", out: "gadgets", collection: "items", type: "Item", subtype: "gadget" },
  { file: "creatures", out: "creatures", collection: "actors", type: "Actor", subtype: "threat" },
  { file: "heists", out: "heists", collection: "journal", type: "JournalEntry", subtype: null },
  { file: "rules", out: "rules", collection: "journal", type: "JournalEntry", subtype: null }
];

/** Deterministic 16-char alphanumeric id from a namespace + key (sha256 hex prefix). */
export function makeId(...parts) {
  return createHash("sha256").update(parts.join("::")).digest("hex").slice(0, 16);
}

export function readSource(file) {
  return JSON.parse(readFileSync(join(SRC, `${file}.json`), "utf8"));
}
