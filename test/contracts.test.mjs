/**
 * WP-D: the cross-package contracts (docs/AUTOMATION-DESIGN.md §11 WP-D item 5).
 * Static checks over module/ plus the pure registries, so a package can't
 * silently drift from module/contracts.mjs:
 *   - every OPS value is registered by exactly one package (static grep);
 *   - every ability key referenced by the roll plan (rolls.mjs) and by the
 *     heist runtime's reactions exists in ABILITIES;
 *   - every CARD kind has exactly one renderer, and its template exists;
 *   - every SETTINGS key is registered once, and every visible setting has
 *     its name and hint in lang/en.json;
 *   - every HOOKS name is fired somewhere.
 *   npm test    (node --test)
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { OPS, CARD, SETTINGS, HOOKS, SYSTEM_ID } from "../module/contracts.mjs";
import { ABILITIES } from "../module/logic/abilities.mjs";
import { ABILITY_KEYS } from "../module/logic/rolls.mjs";
import { WPB_KINDS, CARD_TEMPLATES } from "../module/chat/card-flags.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Drop block comments and whole-line // comments (docs mention calls they don't make). */
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** Every .mjs under module/, as {path, src} (comments stripped). */
function moduleSources() {
  const out = [];
  const walk = dir => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".mjs")) out.push({ path: relative(ROOT, p), src: stripComments(readFileSync(p, "utf8")) });
    }
  };
  walk(join(ROOT, "module"));
  return out;
}
const SOURCES = moduleSources();
const OPS_NAME = Object.fromEntries(Object.entries(OPS).map(([k, v]) => [v, k]));

/* ------------------------------------------------------------------ OPS -- */

test("every OPS value is registered by exactly one package", () => {
  const found = new Map(Object.keys(OPS).map(k => [k, []]));
  for (const { path, src } of SOURCES) {
    // gm.register(OPS.x, …)  — WP-B, WP-C
    for (const m of src.matchAll(/\bregister\(\s*OPS\.(\w+)\s*,/g)) found.get(m[1])?.push(path);
    // { [OPS.x]: { check, apply } } handler tables registered in a loop — WP-A
    for (const m of src.matchAll(/\[\s*OPS\.(\w+)\s*\]\s*:\s*\{/g)) found.get(m[1])?.push(path);
  }
  for (const [key, where] of found) {
    assert.equal(where.length, 1, `OPS.${key} ("${OPS[key]}") is registered ${where.length} times: ${where.join(", ") || "nowhere"}`);
  }
  // …and only names that are in OPS are registered.
  for (const { path, src } of SOURCES) {
    if (path.endsWith("net/gm-ops.mjs")) continue;   // the registry itself
    for (const m of src.matchAll(/\bgm\??\.register\??\.?\(\s*([^,\n]+?)\s*,/g)) {
      // A loop over a { [OPS.x]: handler } table (WP-A) registers a variable.
      if (/^[a-z]\w*$/i.test(m[1]) && /\[\s*OPS\.\w+\s*\]\s*:\s*\{/.test(src)) continue;
      assert.match(m[1], /^OPS\.\w+$/, `${path} registers an op that isn't in OPS: ${m[1]}`);
      assert.ok(OPS[m[1].slice(4)], `${path}: ${m[1]} isn't defined in contracts.mjs`);
    }
  }
});

test("ops are always called by their OPS constant, never a string literal", () => {
  for (const { path, src } of SOURCES) {
    for (const m of src.matchAll(/\b(?:gm\.run|gm\.request|gm\.ask|gmRun)\(\s*(?:[\w.]+\s*,\s*)?(["'`])([\w.]+)\1/g)) {
      assert.fail(`${path} calls the op "${m[2]}" by a literal — use OPS.${OPS_NAME[m[2]] ?? "<add it to contracts.mjs>"}`);
    }
  }
});

/* ------------------------------------------------------------ abilities -- */

test("every ability key the roll plan uses exists in ABILITIES", () => {
  for (const [name, key] of Object.entries(ABILITY_KEYS)) {
    assert.ok(ABILITIES[key], `rolls.mjs ABILITY_KEYS.${name} = "${key}" is not in ABILITIES`);
  }
  // Literal keys tested inside rolls.mjs (has(keys, "…") / includes("…")).
  const src = readFileSync(join(ROOT, "module/logic/rolls.mjs"), "utf8");
  for (const m of src.matchAll(/\b(?:has\(\s*\w+\s*,|\.includes\()\s*"((?:species:|sig:)?[a-z][a-z0-9-]*)"\s*\)/g)) {
    if (["stealth", "acrobatics", "athletics", "brawl", "intimidation", "perception", "tactics", "engineering", "persuasion", "deception", "endurance", "squeeze", "height", "human"].includes(m[1])) continue;
    assert.ok(ABILITIES[m[1]], `rolls.mjs tests for "${m[1]}", which isn't in ABILITIES`);
  }
});

test("the heist runtime's reaction and Flaw keys exist in ABILITIES", () => {
  const auto = readFileSync(join(ROOT, "module/heist/automation.mjs"), "utf8");
  const block = auto.match(/const CANCEL_ABILITIES = \{([\s\S]*?)\n\};/)?.[1] ?? "";
  const keys = [...block.matchAll(/key:\s*"([^"]+)"/g)].map(m => m[1]);
  assert.ok(keys.length >= 3, "CANCEL_ABILITIES not found");
  for (const k of keys) assert.ok(ABILITIES[k], `CANCEL_ABILITIES uses "${k}", which isn't in ABILITIES`);
  const flaws = JSON.parse(auto.match(/const ST_FLAWS = (\[[^\]]*\])/)?.[1] ?? "[]");
  assert.ok(flaws.length, "ST_FLAWS not found");
  for (const k of flaws) {
    assert.ok(ABILITIES[k], `ST_FLAWS lists "${k}", which isn't in ABILITIES`);
    assert.ok(ABILITIES[k].stTriggered, `ST_FLAWS lists "${k}", which isn't an ST-triggered Flaw`);
  }
});

/* ---------------------------------------------------------------- cards -- */

test("every CARD kind has exactly one renderer and an existing template", () => {
  const auto = readFileSync(join(ROOT, "module/heist/automation.mjs"), "utf8");
  const heistKinds = [...(auto.match(/HEIST_CARD_KINDS = Object\.freeze\(\[([^\]]*)\]/)?.[1] ?? "").matchAll(/CARD\.(\w+)/g)].map(m => CARD[m[1]]);
  assert.ok(heistKinds.length, "HEIST_CARD_KINDS not found in automation.mjs");
  for (const kind of Object.values(CARD)) {
    const renderers = [WPB_KINDS.includes(kind) ? "WP-B" : null, heistKinds.includes(kind) ? "WP-C" : null].filter(Boolean);
    assert.equal(renderers.length, 1, `card kind "${kind}" has ${renderers.length} renderers (${renderers.join(", ") || "none"})`);
  }
  for (const kind of [...WPB_KINDS, ...heistKinds]) assert.ok(Object.values(CARD).includes(kind), `"${kind}" isn't a CARD kind`);

  // Templates: WP-B's table and WP-C's TEMPLATES map.
  for (const kind of WPB_KINDS) {
    const t = CARD_TEMPLATES[kind];
    assert.ok(t, `no template for WP-B card "${kind}"`);
    assert.ok(existsSync(join(ROOT, t.replace(`systems/${SYSTEM_ID}/`, ""))), `missing template ${t}`);
  }
  const dir = auto.match(/const TEMPLATE_DIR = "([^"]+)"/)?.[1];
  const entries = [...auto.matchAll(/\[CARD\.(\w+)\]:\s*`\$\{TEMPLATE_DIR\}\/([\w-]+\.hbs)`/g)];
  assert.deepEqual(entries.map(m => CARD[m[1]]).sort(), [...heistKinds].sort(), "WP-C's TEMPLATES must cover exactly its card kinds");
  for (const m of entries) {
    const p = join(ROOT, `${dir}/${m[2]}`.replace(`systems/${SYSTEM_ID}/`, ""));
    assert.ok(existsSync(p), `missing template ${dir}/${m[2]}`);
  }
});

/* ------------------------------------------------------------- settings -- */

test("every SETTINGS key is registered once, with lang keys for the visible ones", async () => {
  const registered = new Map();
  globalThis.game = {
    settings: {
      settings: new Map(),
      register(ns, key, data) {
        assert.equal(ns, SYSTEM_ID);
        const id = `${ns}.${key}`;
        registered.set(key, (registered.get(key) ?? 0) + 1);
        this.settings.set(id, data);
      }
    }
  };
  const { registerHeistSettings, SETTING_LANG_KEYS } = await import("../module/heist/settings.mjs");
  registerHeistSettings();
  registerHeistSettings();   // idempotent: a second call registers nothing
  const lang = JSON.parse(readFileSync(join(ROOT, "lang/en.json"), "utf8"));
  for (const key of Object.values(SETTINGS)) {
    assert.equal(registered.get(key), 1, `setting "${key}" registered ${registered.get(key) ?? 0} times`);
    const data = game.settings.settings.get(`${SYSTEM_ID}.${key}`);
    if (data.config) {
      for (const k of [data.name, data.hint]) {
        assert.match(String(k), /^HEISTY\.Settings\./, `setting "${key}" uses a literal label`);
        assert.ok(lang[k], `lang/en.json is missing ${k}`);
      }
      if (data.choices) for (const [v, label] of Object.entries(data.choices)) assert.ok(label, `setting "${key}" choice "${v}" has no label`);
    }
  }
  for (const k of SETTING_LANG_KEYS) assert.ok(lang[k], `lang/en.json is missing ${k}`);
  delete globalThis.game;
});

test("every setting a package reads by name is registered somewhere", () => {
  const registeredNames = new Set([...Object.values(SETTINGS), "alert", "alertLimit", "showAlertMeter", "alertMeterPosition", "systemMigrationVersion"]);
  for (const { path, src } of SOURCES) {
    for (const m of src.matchAll(/game\.settings\.(?:get|set)\(\s*(?:SYSTEM_ID|HEISTY\.id|"heisty-spideys")\s*,\s*"([\w]+)"/g)) {
      assert.ok(registeredNames.has(m[1]), `${path} reads the setting "${m[1]}", which nobody registers`);
    }
  }
});

/* ---------------------------------------------------------------- hooks -- */

test("every HOOKS name is fired somewhere", () => {
  const all = SOURCES.map(s => s.src).join("\n");
  for (const [k] of Object.entries(HOOKS)) {
    assert.match(all, new RegExp(`Hooks\\.call(?:All)?\\(\\s*HOOKS\\.${k}\\b`), `HOOKS.${k} is never fired`);
  }
});

test("system.json ships every package stylesheet", () => {
  const manifest = JSON.parse(readFileSync(join(ROOT, "system.json"), "utf8"));
  for (const css of ["styles/heisty-spideys.css", "styles/automation-sheets.css", "styles/cards.css", "styles/tracker.css"]) {
    assert.ok(manifest.styles.includes(css), `system.json styles is missing ${css}`);
    assert.ok(existsSync(join(ROOT, css)), `${css} doesn't exist`);
  }
});
