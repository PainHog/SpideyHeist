/**
 * HEISTY SPIDEYS — Compendium Pack Builder
 * ----------------------------------------
 * Compiles the per-document source JSON in packs/_source/<name>/ into Foundry
 * VTT v13/v14 LevelDB compendium packs in packs/<name>/. Deterministic 16-char
 * ids are derived from each document's `key`, so rebuilds are stable.
 *
 * Usage:  node tools/build-packs.mjs   |   node tools/build-packs.mjs --clean
 *
 * Key format (from the foundryvtt-cli source):
 *   Primary doc:  !<collection>!<id>
 *   Embedded doc: !<collection>.<embedded>!<parentId>.<childId>
 */

import { ClassicLevel } from "classic-level";
import { rmSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { OUT, PACKS, makeId, readSource } from "./pack-config.mjs";

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
      batch.put(`!journal!${id}`, { _id: id, name: raw.name, flags: {}, sort, ownership: { default: 0 } });
      count++;
      (raw.pages ?? []).forEach((page, p) => {
        const pid = makeId(def.out, raw.key, page.key ?? String(p));
        batch.put(`!journal.pages!${id}.${pid}`, {
          _id: pid,
          name: page.name,
          type: page.type ?? "text",
          title: page.title ?? { show: true, level: 1 },
          text: page.text ?? { format: 1, content: "" },
          sort: (p + 1) * 100,
          ownership: { default: -1 },
          flags: {}
        });
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
    readSource(def.file).forEach(raw => {
      const check = (id, where) => {
        if (seen.has(id)) throw new Error(`Duplicate id ${id}: ${where} collides with ${seen.get(id)}`);
        seen.set(id, where);
      };
      check(makeId(def.out, raw.key), `${def.out}::${raw.key}`);
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
