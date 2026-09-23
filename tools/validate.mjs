/**
 * HEISTY SPIDEYS — Pre-commit / CI Validator
 * ------------------------------------------
 * Run before every commit and in CI:  node tools/validate.mjs
 *
 * Checks:
 *  1. Manifest sanity — semver version; every referenced esmodule/style/lang/
 *     pack path exists; declared packs match the build config.
 *  2. Pack integrity — every id is a unique 16-char [A-Za-z0-9]; every
 *     journal's pages are actually attached to it; and each COMPILED document
 *     deep-equals what the build derives from SOURCE (extracted from a temp
 *     copy with the official foundryvtt-cli — LevelDB bytes are
 *     non-deterministic, and opening the repo packs would dirty them).
 *  3. Templates — every .hbs compiles, and every helper used is registered
 *     (renders each template so an unknown helper throws "Missing helper").
 *
 * Exits non-zero if anything fails.
 */

import { readFileSync, existsSync, readdirSync, mkdtempSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { extractPack } from "@foundryvtt/foundryvtt-cli";
import Handlebars from "handlebars";
import { ROOT, OUT, PACKS, readSource, toCliDoc } from "./pack-config.mjs";

const errors = [];
const err = m => errors.push(m);
const pass = m => console.log(`  ✓ ${m}`);

/* -------------------------------------------- 1. Manifest -- */
console.log("Manifest…");
const manifest = JSON.parse(readFileSync(join(ROOT, "system.json"), "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(manifest.version ?? "")) err(`system.json version "${manifest.version}" is not semver`);
const refs = [
  ...(manifest.esmodules ?? []),
  ...(manifest.styles ?? []),
  ...(manifest.languages ?? []).map(l => l.path)
];
for (const rel of refs) if (!existsSync(join(ROOT, rel))) err(`manifest references missing file: ${rel}`);
for (const p of (manifest.packs ?? [])) if (!existsSync(join(ROOT, p.path))) err(`manifest pack path missing: ${p.path}`);
const manifestPackNames = new Set((manifest.packs ?? []).map(p => p.name));
for (const def of PACKS) if (!manifestPackNames.has(def.out)) err(`build pack "${def.out}" not declared in system.json packs[]`);
for (const def of PACKS) {
  if (def.subtype && def.type === "Item" && !(def.subtype in (manifest.documentTypes?.Item ?? {}))) err(`Item subtype "${def.subtype}" not in documentTypes`);
  if (def.subtype && def.type === "Actor" && !(def.subtype in (manifest.documentTypes?.Actor ?? {}))) err(`Actor subtype "${def.subtype}" not in documentTypes`);
}
if (!errors.length) pass("manifest fields, referenced files, and pack declarations all resolve");

/* -------------------------------------------- 2. Packs -- */
// Opening LevelDB rotates its log/manifest files, so we NEVER open the committed
// packs directly: copy them to a temp dir and read the copy with Foundry's
// official extractor (which reassembles embedded documents such as journal
// pages exactly as Foundry will see them).
console.log("Packs (integrity + compiled-matches-source)…");
// Canonical form for comparison. `_stats` is provenance (it embeds the system
// version, so comparing it would force a pack rebuild on every version bump);
// it is checked separately for the right systemId.
const IGNORE = new Set(["_key", "_stats"]);
const stable = v => Array.isArray(v) ? v.map(stable)
  : (v && typeof v === "object") ? Object.fromEntries(Object.keys(v).filter(k => !IGNORE.has(k)).sort().map(k => [k, stable(v[k])]))
  : v;
const tmp = mkdtempSync(join(tmpdir(), "heisty-validate-"));
const allIds = new Map();
const claimId = (id, where) => {
  if (!/^[A-Za-z0-9]{16}$/.test(id ?? "")) err(`${where}: malformed id "${id}"`);
  else if (allIds.has(id)) err(`${where}: duplicate id ${id} (also ${allIds.get(id)})`);
  else allIds.set(id, where);
};
try {
  for (const def of PACKS) {
    const packPath = join(OUT, def.out);
    if (!existsSync(packPath)) { err(`compiled pack missing: packs/${def.out} — run: npm run build:packs`); continue; }
    const copy = join(tmp, def.out);
    cpSync(packPath, copy, { recursive: true });
    const compiled = new Map();
    await extractPack(copy, join(tmp, `${def.out}-out`), {
      log: false,
      transformEntry: doc => { compiled.set(doc._id, doc); return false; } // collect in memory, write nothing
    });

    const before = errors.length;
    const source = readSource(def.file);
    if (compiled.size !== source.length) err(`${def.out}: compiled ${compiled.size} docs != ${source.length} source — rebuild packs`);
    let pages = 0;
    source.forEach((raw, i) => {
      const want = toCliDoc(def, raw, i);
      const got = compiled.get(want._id);
      claimId(want._id, `${def.out}::${raw.key}`);
      for (const pg of want.pages ?? []) claimId(pg._id, `${def.out}::${raw.key}#${pg.name}`);
      if (!got) return err(`${def.out}: source "${raw.key}" (id ${want._id}) not in compiled pack — rebuild packs`);
      if (def.type === "JournalEntry") {
        // The regression that shipped once: pages stored but not referenced by the parent.
        pages += got.pages?.length ?? 0;
        if ((got.pages?.length ?? 0) !== want.pages.length)
          err(`${def.out}: journal "${raw.key}" has ${got.pages?.length ?? 0} attached pages, expected ${want.pages.length}`);
      }
      if (got._stats?.systemId !== manifest.id) err(`${def.out}: "${raw.key}" _stats.systemId is "${got._stats?.systemId}"`);
      if (JSON.stringify(stable(got)) !== JSON.stringify(stable(want)))
        err(`${def.out}: "${raw.key}" compiled document differs from source — rebuild packs`);
    });
    if (errors.length === before) pass(`pack ${def.out}: ${compiled.size} docs${pages ? ` (+${pages} attached pages)` : ""} match source`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

/* -------------------------------------------- 3. Templates -- */
console.log("Templates…");
const CUSTOM = ["heEq", "heNeq", "heGt", "heGte", "heLt", "heAdd", "heSub", "heAbs", "heSigned", "heRepeat", "heIncludes", "heCap", "hePct"];
for (const name of CUSTOM) {
  Handlebars.registerHelper(name, (...a) => (name === "heRepeat" ? [] : ""));
}
Handlebars.registerHelper("localize", s => String(s ?? "")); // Foundry builtin (stubbed)

const makeCtx = () => new Proxy(function () {}, {
  get: (t, prop) => (typeof prop === "symbol" || prop === "then" ? undefined : makeCtx()),
  apply: () => makeCtx()
});
const walk = dir => readdirSync(dir, { withFileTypes: true })
  .flatMap(e => e.isDirectory() ? walk(join(dir, e.name)) : (e.name.endsWith(".hbs") ? [join(dir, e.name)] : []));

let tplCount = 0;
for (const file of walk(join(ROOT, "templates"))) {
  const rel = file.slice(ROOT.length + 1);
  const src = readFileSync(file, "utf8");
  let tpl;
  try { tpl = Handlebars.compile(src); }
  catch (e) { err(`template ${rel}: compile error: ${e.message.split("\n")[0]}`); continue; }
  try { tpl(makeCtx(), { allowProtoPropertiesByDefault: true, allowProtoMethodsByDefault: true }); }
  catch (e) {
    const msg = e.message.split("\n")[0];
    if (/Missing helper|could not find|unknown/i.test(msg)) err(`template ${rel}: ${msg}`);
    // other render errors under the dummy context are not meaningful; ignore.
  }
  tplCount++;
}
if (!errors.some(e => e.startsWith("template "))) pass(`${tplCount} templates compile with only registered helpers`);

/* -------------------------------------------- Result -- */
console.log("");
if (errors.length) {
  console.error(`✗ ${errors.length} problem(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("✓ All checks passed.");
