/**
 * WP-A: the ABILITIES registry against the compendium text, usage stamps
 * across the heist clock, pending bonuses, and the Abilities panel rows.
 *   npm test    (node --test)
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ABILITIES, getAbility, usageStatus, markUsage, blankUsage, statusLabel, abilityPhases,
  makePending, addPendingBonus, prunePending, applicablePending, consumePendingIds,
  abilityRows, SILK_MENU, FREEPLAY_CLOCK
} from "../module/logic/abilities.mjs";
import { itemAbilityKey } from "../module/logic/keys.mjs";
import { FREQ } from "../module/contracts.mjs";
import { HEISTY } from "../module/config.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const readPack = name => readdirSync(join(ROOT, "packs", "_source", name)).filter(f => f.endsWith(".json")).sort()
  .map(f => JSON.parse(readFileSync(join(ROOT, "packs", "_source", name, f), "utf8")));
const strip = html => String(html ?? "").replace(/<[^>]+>/g, " ").replace(/&mdash;|&ndash;/g, "—").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
const norm = s => String(s ?? "").replace(/[‘’]/g, "'").trim().toLowerCase();

/** The frequency the book text states. */
function freqFromText(text) {
  const t = strip(text);
  if (/once per round/i.test(t)) return FREQ.round;
  if (/once per scene/i.test(t)) return FREQ.scene;
  if (/during planning/i.test(t)) return FREQ.planning;
  if (/once per heist/i.test(t)) return FREQ.heist;
  return FREQ.always;
}

/** Every ability item in the compendium, as {item, key, text, name}. */
function compendiumAbilities() {
  const out = [];
  for (const d of readPack("perks")) out.push({ kind: "perk", key: itemAbilityKey({ type: "perk", name: d.name, system: d.system }), name: d.name, text: d.system.effect, role: d.system.role });
  for (const d of readPack("flaws")) out.push({ kind: "flaw", key: itemAbilityKey({ type: "flaw", name: d.name, system: d.system }), name: d.name, text: d.system.effect });
  for (const d of readPack("species")) out.push({ kind: "species", key: itemAbilityKey({ type: "species", name: d.name, system: d.system }), name: d.system.ability, text: d.system.abilityText });
  for (const d of readPack("roles")) out.push({ kind: "signature", key: itemAbilityKey({ type: "role", name: d.name, system: d.system }), name: d.system.signature, text: d.system.signatureText, role: d.system.roleKey });
  return out;
}

test("every Perk, Flaw, species and Role in the compendium resolves to an ABILITIES entry", () => {
  const all = compendiumAbilities();
  assert.equal(all.length, 42 + 10 + 6 + 7);
  for (const a of all) {
    const d = getAbility(a.key);
    assert.ok(d, `missing ABILITIES["${a.key}"] (${a.name})`);
    assert.equal(d.kind, a.kind, a.key);
    assert.equal(norm(d.name), norm(a.name), a.key);
    if (a.kind === "perk" || a.kind === "signature") assert.equal(d.role, a.role, a.key);
  }
  // Nothing in the registry that isn't in the compendium, except the crew-wide and everyone entries.
  const keys = new Set(all.map(a => a.key));
  const extra = Object.keys(ABILITIES).filter(k => !keys.has(k)).sort();
  assert.deepEqual(extra, ["assist", "damage-control", "not-part-of-the-plan"]);
});

test("each entry's frequency matches its current text (once per round / scene / heist, during Planning, or always)", () => {
  for (const a of compendiumAbilities()) {
    assert.equal(getAbility(a.key).freq, freqFromText(a.text), `${a.key}: "${strip(a.text).slice(0, 90)}…"`);
  }
  // Spot checks that the regexes really hit what the book says.
  assert.equal(ABILITIES["tactical-feed"].freq, FREQ.round);
  assert.equal(ABILITIES["species:wolf"].freq, FREQ.scene);
  assert.equal(ABILITIES["sig:face"].freq, FREQ.heist);
  assert.equal(ABILITIES["contingency"].freq, FREQ.planning);
  assert.equal(ABILITIES["species:crab"].freq, FREQ.always);
  assert.equal(ABILITIES["sig:ghost"].freq, FREQ.scene);
});

test("Silk costs and Flaw delays match the text", () => {
  for (const a of compendiumAbilities()) {
    const t = strip(a.text);
    const d = getAbility(a.key);
    const m = t.match(/spend (\d) (?:silk points?|sp)\b(.{0,20})/i);
    if (m && /to delay/i.test(m[2])) {
      assert.equal(d.delayCost, Number(m[1]), `${a.key} delay`);
      assert.equal(d.cost, 0, `${a.key} cost`);
    } else if (m) {
      assert.equal(d.cost, Number(m[1]), `${a.key} cost`);
    } else {
      assert.equal(d.cost, 0, `${a.key} should be free`);
      assert.equal(d.delayCost ?? 0, 0, `${a.key} no delay`);
    }
  }
  assert.equal(ABILITIES["sig:face"].cost, 2);
  assert.equal(ABILITIES["double-bluff"].cost, 1);
  assert.equal(ABILITIES["overclock"].cost, 1);
  assert.equal(ABILITIES["damage-control"].cost, 3);
  assert.equal(ABILITIES["not-part-of-the-plan"].cost, 4);
  assert.equal(ABILITIES["damage-control"].scope, "crew");
});

test("every entry is well formed; buttons have a handler", () => {
  const AUTO = new Set(["auto", "button", "reaction", "prompt", "text"]);
  for (const [k, d] of Object.entries(ABILITIES)) {
    assert.equal(d.key, k);
    assert.ok(Object.values(FREQ).includes(d.freq), k);
    assert.ok(AUTO.has(d.automation), k);
    assert.ok(["spider", "crew"].includes(d.scope), k);
    assert.ok(d.effect.length > 10, k);
    if (d.automation === "button") assert.ok(d.action, `${k} is a button with no action`);
    if (d.roll?.skill) assert.ok(d.roll.skill in HEISTY.skills, k);
    if (d.modes) assert.ok(d.modes.every(m => m.id && m.label), k);
  }
  // Once-per-heist ST-triggered Flaws (§3.12) are exactly these.
  const st = Object.values(ABILITIES).filter(d => d.stTriggered).map(d => d.key).sort();
  assert.deepEqual(st, ["allergic-to-dust", "butterfingers", "compulsive-planner", "dramatic", "easily-distracted", "overconfident", "show-off"]);
  // The ones the book lets you delay for 1 SP.
  const delay = Object.values(ABILITIES).filter(d => d.delayCost).map(d => d.key).sort();
  assert.deepEqual(delay, ["compulsive-planner", "dramatic", "overconfident", "show-off"]);
});

test("the keys WP-B's roll plan relies on all exist", () => {
  // Mirrors rolls.mjs ABILITY_KEYS (WP-D's contracts test checks the live table).
  for (const k of ["unfazed", "soundless", "dont-look-down", "i-was-never-here", "overclock", "smoke-and-mirrors",
    "silver-tongue", "method-actor", "the-long-con", "negotiating-position", "escape-routes", "plausible-deniability",
    "abort-abort", "take-the-hit", "that-all-you-got", "drafting", "contingency", "loud", "arachnophobe-magnet",
    "show-off", "species:wolf", "species:crab", "sig:face"]) assert.ok(ABILITIES[k], k);
});

/* -------------------------------------------- */
/*  Usage across the heist clock                */
/* -------------------------------------------- */

const clock = (o = {}) => ({ heistId: "H1", phase: "heist", sceneSerial: 3, roundSerial: 10, ...o });

test("per-scene uses reset when the scene changes — no writes needed", () => {
  const d = ABILITIES["species:jumping"];
  let u = blankUsage();
  assert.deepEqual(usageStatus(d, u, clock()), { available: true, reason: "ready", usedThis: false });
  u = markUsage(d, u, clock());
  assert.deepEqual(u, { heistId: "H1", sceneSerial: 3, roundSerial: 10, count: 1 });
  assert.equal(usageStatus(d, u, clock()).available, false);
  assert.equal(usageStatus(d, u, clock()).reason, "used-scene");
  assert.equal(usageStatus(d, u, clock({ roundSerial: 11 })).available, false, "a new round is the same scene");
  assert.equal(usageStatus(d, u, clock({ sceneSerial: 4 })).available, true, "a new obstacle is a new scene");
  assert.equal(usageStatus(d, u, clock({ heistId: "H2", sceneSerial: 3 })).available, true, "a new heist resets");
});

test("per-heist uses survive scenes and rounds, reset with the heist", () => {
  const d = ABILITIES["sig:face"];
  const u = markUsage(d, blankUsage(), clock());
  assert.equal(usageStatus(d, u, clock({ sceneSerial: 9, roundSerial: 40 })).reason, "used-heist");
  assert.equal(usageStatus(d, u, clock({ heistId: "H2" })).available, true);
  assert.equal(statusLabel(d, usageStatus(d, u, clock())), "Used this heist");
  assert.equal(statusLabel(d, usageStatus(d, blankUsage(), clock())), "Ready · 2 SP");
});

test("per-round uses reset each round", () => {
  const d = ABILITIES["tactical-feed"];
  const u = markUsage(d, blankUsage(), clock());
  assert.equal(usageStatus(d, u, clock()).reason, "used-round");
  assert.equal(usageStatus(d, u, clock({ roundSerial: 11 })).available, true);
  assert.equal(statusLabel(d, usageStatus(d, u, clock())), "Used this round");
});

test("always-on abilities are never used up; passives read 'Always on'", () => {
  const d = ABILITIES["unfazed"];
  const u = markUsage(d, blankUsage(), clock());
  const st = usageStatus(d, u, clock());
  assert.equal(st.available, true);
  assert.equal(st.reason, "passive");
  assert.equal(statusLabel(d, st), "Always on");
  assert.equal(usageStatus(ABILITIES["silk-grapple"], u, clock()).reason, "ready");
});

test("phase limits: I Know a Way in the Escape only; Planning Perks in Planning only; freeplay is ungated", () => {
  const ikaw = ABILITIES["sig:wheelman"];
  assert.equal(usageStatus(ikaw, blankUsage(), clock({ phase: "heist" })).reason, "phase");
  assert.equal(statusLabel(ikaw, usageStatus(ikaw, blankUsage(), clock({ phase: "heist" }))), "Escape only");
  assert.equal(usageStatus(ikaw, blankUsage(), clock({ phase: "escape" })).available, true);
  assert.equal(usageStatus(ikaw, blankUsage(), FREEPLAY_CLOCK).available, true);
  const cont = ABILITIES["contingency"];
  assert.deepEqual(abilityPhases(cont), ["planning"]);
  assert.equal(usageStatus(cont, blankUsage(), clock({ phase: "planning" })).available, true);
  assert.equal(usageStatus(cont, blankUsage(), clock({ phase: "heist" })).available, false);
  const used = markUsage(cont, blankUsage(), clock({ phase: "planning" }));
  assert.equal(usageStatus(cont, used, clock({ phase: "planning" })).reason, "used-planning");
  assert.equal(usageStatus(cont, used, clock({ phase: "planning", heistId: "H2" })).available, true);
});

test("markUsage counts repeat uses in the same window and restarts in a new one", () => {
  const d = ABILITIES["silk-grapple"];
  let u = markUsage(d, blankUsage(), clock());
  u = markUsage(d, u, clock());
  assert.equal(u.count, 2);
  u = markUsage(d, u, clock({ sceneSerial: 4 }));
  assert.equal(u.count, 1);
  // Garbage in, sensible out.
  assert.deepEqual(markUsage(d, null, null), { heistId: "freeplay", sceneSerial: 0, roundSerial: 0, count: 1 });
  assert.equal(usageStatus(null, null, null).reason, "unknown");
});

test("a copied usage stamp (a replacement's item) is still used this heist", () => {
  const d = ABILITIES["sig:lookout"];
  const original = markUsage(d, blankUsage(), clock());
  const copied = JSON.parse(JSON.stringify(original));
  assert.equal(usageStatus(d, copied, clock({ sceneSerial: 5 })).available, false);
});

/* -------------------------------------------- */
/*  Pending bonuses                             */
/* -------------------------------------------- */

test("pending bonuses: assists replace assists, expiry by round/scene, skill and job filters", () => {
  const c = clock();
  let list = [];
  list = addPendingBonus(list, { id: "a1", dice: 1, source: "assist", label: "Assist" }, c);
  list = addPendingBonus(list, { id: "a2", dice: 2, source: "assist", label: "Assist" }, c);
  assert.deepEqual(list.map(p => p.id), ["a2"], "only one Assist per roll — the latest wins");
  list = addPendingBonus(list, { id: "tf", dice: 1, source: "tactical-feed" }, c);
  list = addPendingBonus(list, { id: "bp", diff: -1, skills: ["engineering"], source: "sig:tinkerer" }, c);
  list = addPendingBonus(list, { id: "ms", dice: 2, expires: "round", source: "sig:bruiser" }, c);
  list = addPendingBonus(list, { id: "dc", dice: 1, jobOnly: true, expires: "scene", source: "sig:grifter" }, c);
  assert.equal(list.length, 5);
  assert.equal(list.find(p => p.id === "ms").serial, 10);
  assert.equal(list.find(p => p.id === "dc").serial, 3);
  assert.equal(list.find(p => p.id === "a2").capped, true);

  assert.deepEqual(applicablePending(list, { skill: "stealth", job: true }).map(p => p.id).sort(), ["a2", "dc", "ms", "tf"]);
  assert.deepEqual(applicablePending(list, { skill: "engineering", job: false }).map(p => p.id).sort(), ["a2", "bp", "ms", "tf"]);

  // A roll consumes next-roll bonuses; round/scene ones stay until they expire.
  const after = consumePendingIds(list, ["a2", "tf", "ms", "dc"]);
  assert.deepEqual(after.map(p => p.id).sort(), ["bp", "dc", "ms"]);
  assert.deepEqual(prunePending(after, clock({ roundSerial: 11 })).map(p => p.id).sort(), ["bp", "dc"]);
  assert.deepEqual(prunePending(after, clock({ roundSerial: 11, sceneSerial: 4 })).map(p => p.id), ["bp"]);

  const p = makePending({ dice: "2", expires: "bogus" }, c);
  assert.equal(p.dice, 2);
  assert.equal(p.expires, "nextRoll");
  assert.ok(p.id);
});

test("the Spend Silk menu: Silk Line 1, Web Structure 2, sled 1, Delay a Flaw 1", () => {
  const cost = Object.fromEntries(SILK_MENU.map(s => [s.key, s.cost]));
  assert.deepEqual(cost, { "silk-line": 1, "web-structure": 2, "silk-sled": 1, "delay-flaw": 1 });
  assert.match(SILK_MENU[0].text, /−1 Difficulty/);
  // The config's Silk spend table agrees on the shared costs.
  for (const s of SILK_MENU.filter(s => s.key !== "silk-sled" && s.key !== "delay-flaw")) {
    assert.equal(HEISTY.silkSpends.find(x => x.label === s.label)?.cost, s.cost, s.key);
  }
});

test("abilityRows: status chips, Use only for ready buttons, Fire for the GM on ST flaws", () => {
  const c = clock();
  const used = markUsage(ABILITIES["species:jumping"], blankUsage(), c);
  const rows = abilityRows([
    { id: "1", key: "species:jumping", name: "Jumping Spider", usage: used },
    { id: "2", key: "sig:face", name: "The Face", usage: blankUsage() },
    { id: "3", key: "fast-talk", name: "Fast Talk", usage: blankUsage() },
    { id: "4", key: "dramatic", name: "Dramatic", usage: blankUsage() },
    { id: "5", key: "homebrew", name: "Homebrew Perk", usage: blankUsage() },
    { id: "6", key: "unfazed", name: "Unfazed", usage: blankUsage() }
  ], c, { silk: 1, isGM: true });
  const by = Object.fromEntries(rows.map(r => [r.key, r]));
  assert.deepEqual(rows.map(r => r.kind), ["species", "signature", "perk", "perk", "flaw", "unknown"]);
  assert.equal(by["species:jumping"].status, "Used this scene");
  assert.equal(by["species:jumping"].canUse, false);
  assert.equal(by["sig:face"].canUse, false, "a reaction is used from a card, not the sheet");
  assert.equal(by["sig:face"].affordable, false, "2 SP with 1 in the pool");
  assert.equal(by["fast-talk"].canUse, true);
  assert.equal(by["dramatic"].canFire, true);
  assert.equal(by["dramatic"].canDelay, true);
  assert.equal(by["dramatic"].canUse, false);
  assert.equal(by["homebrew"].known, false);
  assert.equal(by["homebrew"].status, "Text only");
  assert.equal(by["unfazed"].statusClass, "passive");
  assert.equal(abilityRows([{ id: "4", key: "dramatic", usage: blankUsage() }], c, { isGM: false })[0].canFire, false);
});
