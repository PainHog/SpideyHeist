/**
 * HEISTY SPIDEYS — Pre-commit / CI Validator
 * ------------------------------------------
 * Run before every commit and in CI:  node tools/validate.mjs
 *
 * Checks:
 *  1. Manifest sanity — semver version; every referenced esmodule/style/lang/
 *     pack path exists; declared packs match the build config.
 *  2. Pack integrity — every id is a unique 16-char [A-Za-z0-9]; and the
 *     COMPILED packs match the SOURCE semantically (LevelDB bytes are
 *     non-deterministic, so we compare extracted documents, not a git diff).
 *  3. Templates — every .hbs compiles, and every helper used is registered
 *     (renders each template so an unknown helper throws "Missing helper").
 *
 * Exits non-zero if anything fails.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ClassicLevel } from "classic-level";
import Handlebars from "handlebars";
import { ROOT, OUT, PACKS, makeId, readSource } from "./pack-config.mjs";

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
console.log("Packs (integrity + compiled-matches-source)…");
const allIds = new Map();
for (const def of PACKS) {
  const packPath = join(OUT, def.out);
  if (!existsSync(packPath)) { err(`compiled pack missing: packs/${def.out} — run: npm run build:packs`); continue; }
  const source = readSource(def.file);
  const db = new ClassicLevel(packPath, { keyEncoding: "utf8", valueEncoding: "json" });
  const primaries = new Map();
  const pageIds = new Set();
  for await (const [key, val] of db.iterator()) {
    const id = val?._id;
    if (!/^[A-Za-z0-9]{16}$/.test(id ?? "")) err(`${def.out}: malformed id "${id}" (key ${key})`);
    if (allIds.has(id)) err(`${def.out}: duplicate id ${id} (also in ${allIds.get(id)})`);
    else allIds.set(id, def.out);
    if (key.includes(".pages!")) pageIds.add(id);
    else primaries.set(id, val?.name);
  }
  await db.close();

  if (primaries.size !== source.length) err(`${def.out}: compiled ${primaries.size} docs != ${source.length} source — rebuild packs`);
  for (const raw of source) {
    const id = makeId(def.out, raw.key);
    if (!primaries.has(id)) err(`${def.out}: source "${raw.key}" (id ${id}) not in compiled pack — rebuild packs`);
    else if (primaries.get(id) !== raw.name) err(`${def.out}: id ${id} compiled name "${primaries.get(id)}" != source "${raw.name}" — rebuild packs`);
    for (const [p, page] of (raw.pages ?? []).entries()) {
      const pid = makeId(def.out, raw.key, page.key ?? String(p));
      if (!pageIds.has(pid)) err(`${def.out}: page "${page.key ?? p}" of "${raw.key}" not in compiled pack — rebuild packs`);
    }
  }
  if (!errors.some(e => e.startsWith(def.out + ":"))) pass(`pack ${def.out}: ${primaries.size} docs match source`);
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
