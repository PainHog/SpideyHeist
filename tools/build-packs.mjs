/**
 * HEISTY SPIDEYS — Compendium Pack Builder
 * ----------------------------------------
 * Compiles the human-readable source JSON in src/packs/ into Foundry VTT v13/v14
 * LevelDB compendium packs in packs/. Deterministic 16-char ids are derived from
 * each entry's `key`, so rebuilds are stable and re-runnable.
 *
 * Usage:  node tools/build-packs.mjs
 *
 * Key format (from the foundryvtt-cli source):
 *   Primary doc:     !<collection>!<id>
 *   Embedded doc:    !<collection>.<embedded>!<parentId>.<childId>
 */

import { ClassicLevel } from "classic-level";
import { createHash } from "node:crypto";
import { readFileSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src", "packs");
const OUT = join(ROOT, "packs");

/** Pack definitions: source file → output pack, document class & subtype. */
const PACKS = [
  { file: "species", out: "species", collection: "items", type: "Item", subtype: "species" },
  { file: "roles", out: "roles", collection: "items", type: "Item", subtype: "role" },
  { file: "perks", out: "perks", collection: "items", type: "Item", subtype: "perk" },
  { file: "flaws", out: "flaws", collection: "items", type: "Item", subtype: "flaw" },
  { file: "gadgets", out: "gadgets", collection: "items", type: "Item", subtype: "gadget" },
  { file: "creatures", out: "creatures", collection: "actors", type: "Actor", subtype: "threat" },
  { file: "heists", out: "heists", collection: "journal", type: "JournalEntry", subtype: null },
  { file: "rules", out: "rules", collection: "journal", type: "JournalEntry", subtype: null }
];

/** Deterministic 16-char alphanumeric id from a namespace + key. */
function makeId(...parts) {
  const hex = createHash("sha256").update(parts.join("::")).digest("hex");
  // sha256 hex is [0-9a-f]; first 16 chars are a valid Foundry id.
  return hex.slice(0, 16);
}

function readSource(file) {
  const path = join(SRC, `${file}.json`);
  return JSON.parse(readFileSync(path, "utf8"));
}

async function buildPack(def) {
  const outPath = join(OUT, def.out);
  if (existsSync(outPath)) rmSync(outPath, { recursive: true, force: true });
  mkdirSync(outPath, { recursive: true });

  const db = new ClassicLevel(outPath, { keyEncoding: "utf8", valueEncoding: "json" });
  const batch = db.batch();
  const raws = readSource(def.file);
  let count = 0;
  let pageCount = 0;

  raws.forEach((raw, i) => {
    const id = makeId(def.out, raw.key);
    const sort = (i + 1) * 100;

    if (def.type === "JournalEntry") {
      // Parent entry — embedded pages are written under their own keys, not inline.
      const entry = {
        _id: id,
        name: raw.name,
        flags: {},
        sort,
        ownership: { default: 0 }
      };
      batch.put(`!journal!${id}`, entry);
      count++;

      (raw.pages ?? []).forEach((page, p) => {
        const pid = makeId(def.out, raw.key, page.key ?? String(p));
        const pageDoc = {
          _id: pid,
          name: page.name,
          type: page.type ?? "text",
          title: page.title ?? { show: true, level: 1 },
          text: page.text ?? { format: 1, content: "" },
          sort: (p + 1) * 100,
          ownership: { default: -1 },
          flags: {}
        };
        batch.put(`!journal.pages!${id}.${pid}`, pageDoc);
        pageCount++;
      });
    } else {
      const doc = {
        _id: id,
        name: raw.name,
        type: def.subtype,
        img: raw.img,
        system: raw.system ?? {},
        effects: [],
        flags: {},
        sort,
        ownership: { default: 0 }
      };
      // Threats track no player resource, so disable the token's default
      // (silk) bar to avoid an empty bar rendering over creature tokens.
      if (def.type === "Actor") {
        doc.items = [];
        doc.prototypeToken = { bar1: { attribute: "" }, bar2: { attribute: "" } };
      }
      batch.put(`!${def.collection}!${id}`, doc);
      count++;
    }
  });

  await batch.write();
  // Flush the write-ahead log into stable .ldb sstables for a clean, shippable pack.
  try { await db.compactRange("!", "￿"); } catch (e) { /* older bindings: WAL ships instead */ }
  await db.close();
  const extra = pageCount ? ` (+${pageCount} pages)` : "";
  console.log(`  ✓ ${def.out.padEnd(10)} ${String(count).padStart(3)} docs${extra}`);
  return count;
}

/** Fail loudly if any two source entries would produce the same document id. */
function scanForDuplicateIds() {
  const seen = new Map();
  for (const def of PACKS) {
    const raws = readSource(def.file);
    raws.forEach(raw => {
      const check = (id, where) => {
        if (seen.has(id)) throw new Error(`Duplicate id ${id}: ${where} collides with ${seen.get(id)}`);
        seen.set(id, where);
      };
      const id = makeId(def.out, raw.key);
      check(id, `${def.out}::${raw.key}`);
      (raw.pages ?? []).forEach((page, p) =>
        check(makeId(def.out, raw.key, page.key ?? String(p)), `${def.out}::${raw.key}#${page.key ?? p}`));
    });
  }
  console.log(`  id scan: ${seen.size} unique ids, no collisions.`);
}

async function main() {
  if (process.argv.includes("--clean")) {
    if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
    console.log("Cleaned packs/.");
    return;
  }
  mkdirSync(OUT, { recursive: true });
  console.log("Building Heisty Spideys compendium packs…");
  scanForDuplicateIds();
  let total = 0;
  for (const def of PACKS) total += await buildPack(def);
  console.log(`Done. ${total} primary documents across ${PACKS.length} packs.`);
}

main().catch(err => { console.error(err); process.exit(1); });
