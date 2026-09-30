/**
 * Rulebook v4.7 (REVIEW Parts E and F): starting Silk, the Chapter 20
 * creation tables, and the compendium content that carries the new rulings.
 *   npm test    (node --test)
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  startingSilk, ATTRIBUTE_SPREADS, roleFromRoll, placeAttributeSpread,
  quickPickSkills, rollPerkIndices, skillBudget
} from "../module/logic/rules.mjs";
import { HEISTY } from "../module/config.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "packs", "_source");
const readPack = name => readdirSync(join(SRC, name)).filter(f => f.endsWith(".json"))
  .map(f => JSON.parse(readFileSync(join(SRC, name, f), "utf8")));
const byKey = (name, key) => readPack(name).find(d => d.key === key);
const norm = s => String(s ?? "").replace(/[‘’]/g, "'").trim().toLowerCase();
const pageText = (doc, key) => doc.pages.find(p => p.key === key)?.text?.content ?? "";

/* -------------------------------------------- */
/*  Starting Silk (E10)                         */
/* -------------------------------------------- */

test("starting Silk = WIT + NERVE + 1, not counting the species bonus (E10)", () => {
  // Spitting Spider (+2 WIT, +1 NERVE) with 2 placed in each: final 4/3, Silk 5.
  assert.equal(startingSilk({ wit: 4, nerve: 3 }, { wit: 2, nerve: 1 }), 5);
  // A Wolf Spider with the same placed points gets the same Silk.
  assert.equal(startingSilk({ wit: 2, nerve: 2 }, { body: 2 }), 5);
  // No species (or no bonus to WIT/NERVE): the plain +1.
  assert.equal(startingSilk({ wit: 3, nerve: 1 }), 5);
  // After advancement: current WIT/NERVE, still without the species bonus.
  assert.equal(startingSilk({ wit: 5, nerve: 3 }, { wit: 2 }), 7);
  // Every species gives the same Silk for the same placed points.
  for (const sp of Object.values(HEISTY.species)) {
    const final = { wit: 2 + (sp.bonuses.wit ?? 0), nerve: 3 + (sp.bonuses.nerve ?? 0) };
    assert.equal(startingSilk(final, sp.bonuses), 6, sp.label);
  }
});

test("the spider data model derives Silk from placed points (E10)", async () => {
  globalThis.foundry ??= { abstract: { TypeDataModel: class {} }, data: { fields: {} } };
  const { SpiderData } = await import("../module/data/actor-data.mjs");
  const make = speciesBonuses => {
    const sys = Object.create(SpiderData.prototype);
    Object.assign(sys, {
      attributes: { body: { value: 1 }, wit: { value: 4 }, nerve: { value: 3 }, grace: { value: 2 } },
      silk: { value: 5, max: 0 },
      speed: { value: 5 },
      vitality: { state: "unharmed" }
    });
    const items = speciesBonuses ? [{ type: "species", system: { speed: 5, bonuses: speciesBonuses } }] : [];
    Object.defineProperty(sys, "parent", { value: { items } });
    sys.prepareDerivedData();
    return sys;
  };
  assert.equal(make({ body: 0, wit: 2, nerve: 1, grace: 0 }).silk.max, 5); // Spitting: 2 + 2 + 1
  assert.equal(make({ body: 2, wit: 0, nerve: 0, grace: 0 }).silk.max, 8); // Wolf: 4 + 3 + 1
  assert.equal(make(null).silk.max, 8);                                     // no species item
});

/* -------------------------------------------- */
/*  Chapter 20 creation tables (E9, E31)        */
/* -------------------------------------------- */

test("Attribute spreads: six 10-point spreads (E9)", () => {
  assert.deepEqual(Object.keys(ATTRIBUTE_SPREADS), ["1", "2", "3", "4", "5", "6"]);
  for (const s of Object.values(ATTRIBUTE_SPREADS)) {
    assert.equal(s.length, 4);
    assert.equal(s.reduce((a, b) => a + b, 0), 10);
  }
});

test("placing a spread: first number on the Role's Attribute, overflow to the lowest (E9)", () => {
  // Orb Weaver (+2 WIT) rolls a 5 on a WIT Role: 5 + 2 = 7, so 2 points move to the lowest.
  const b = placeAttributeSpread([5, 2, 2, 1], "wit", { wit: 2 }, ["body", "nerve", "grace"]);
  assert.deepEqual(b, { wit: 3, body: 3, nerve: 2, grace: 2 }); // grace 1→2, then the first of the tied 2s
  // Every spread, species and primary: 10 placed points, 1+ each, 5 max with the bonus.
  const keys = ["body", "wit", "nerve", "grace"];
  for (const spread of Object.values(ATTRIBUTE_SPREADS)) {
    for (const sp of Object.values(HEISTY.species)) {
      for (const primary of keys) {
        const base = placeAttributeSpread(spread, primary, sp.bonuses);
        assert.equal(keys.reduce((n, k) => n + base[k], 0), 10);
        for (const k of keys) {
          assert.ok(base[k] >= 1, `${sp.label} ${primary} ${k}`);
          assert.ok(base[k] + (sp.bonuses[k] ?? 0) <= 5, `${sp.label} ${primary} ${k}`);
        }
      }
    }
  }
});

test("Role table: 1d6, and a 6 rolls again for Wheelman or Grifter", () => {
  assert.deepEqual([1, 2, 3, 4, 5].map(r => roleFromRoll(r)), ["face", "ghost", "tinkerer", "bruiser", "lookout"]);
  assert.equal(roleFromRoll(6, 1), "wheelman");
  assert.equal(roleFromRoll(6, 3), "wheelman");
  assert.equal(roleFromRoll(6, 4), "grifter");
  assert.equal(roleFromRoll(6, 6), "grifter");
});

test("Skills Quick Pick is a legal build for every Role (E9, E30)", () => {
  for (const [key, role] of Object.entries(HEISTY.roles)) {
    const skills = quickPickSkills(role.coreSkills, role.quickPick);
    const b = skillBudget(skills, role.coreSkills);
    assert.equal(b.roleBonusUsed, 3, key);
    assert.equal(b.generalSpent, 12, key);
    for (const k of role.coreSkills) assert.equal(skills[k], 3, `${key} ${k}`);
    for (const v of Object.values(skills)) assert.ok(v <= 3, key);
  }
});

test("Perk roll: 1d6 twice down the Role's list, rerolling a repeat", () => {
  const seq = [3, 3, 3, 6];
  assert.deepEqual(rollPerkIndices(() => seq.shift()), [2, 5]);
});

test("each Role's Perk table matches the Perks compendium, in book order", () => {
  const perks = readPack("perks");
  for (const [key, role] of Object.entries(HEISTY.roles)) {
    assert.equal(role.perks.length, 6, key);
    const names = perks.filter(p => p.system.role === key).map(p => norm(p.name)).sort();
    assert.deepEqual(role.perks.map(norm).sort(), names, key);
  }
});

/* -------------------------------------------- */
/*  Compendium content                          */
/* -------------------------------------------- */

test("Human stat block: Speed 10, Swat 3, Perception 3, no Alert of its own (E4)", () => {
  const h = byKey("creatures", "human");
  assert.ok(h, "Human creature exists");
  assert.equal(h.system.speed.value, 10);
  assert.equal(h.system.alertContribution, "none of its own");
  const pools = Object.fromEntries(h.system.rolls.map(r => [r.label, r.pool]));
  assert.deepEqual(pools, { Swat: 3, Perception: 3 });
  assert.match(h.system.notes, /confirmed alert \(\+2\)/);
  assert.match(h.system.notes, /under a glass: Out/);
  assert.ok(existsSync(join(ROOT, h.img.replace("systems/heisty-spideys/", ""))));
});

test("Guard Spider: senses, awareness and backup; no '+2 if it calls for backup' (E24, E33)", () => {
  const g = byKey("creatures", "guard-spider").system;
  assert.equal(g.alertContribution, "+1 per round aware");
  assert.match(g.senses, /6 squares in line of sight/);
  assert.match(g.escalation, /unless it's paid off/);
  assert.match(g.weakness, /calls for backup/);
  assert.match(g.notes, /Fast Talk and Deception still work/);
});

test("Silk Clutch only turns a Failure into a Success; rerolls keep Successes (E1, E7)", () => {
  const silk = byKey("rules", "silk-points");
  const spend = pageText(silk, "spending-silk-points");
  assert.match(spend, /After a Failure \(a Partial isn't one\)/);
  assert.match(spend, /reroll up to 3 dice that didn't succeed/);
  assert.match(pageText(silk, "silk-points-overview"), /WIT \+ NERVE \+ 1/);
  assert.match(HEISTY.silkSpends.find(s => s.label === "Silk Clutch").text, /After a Failure/);
});

test("each heist has a map, Roll (Difficulty) tables and two Escapes (F1–F4)", () => {
  const heists = readPack("heists").filter(d => d.key !== "reading-the-maps-and-tables");
  assert.equal(heists.length, 5);
  for (const h of heists) {
    const obstacles = pageText(h, "suggested-obstacles");
    assert.match(obstacles, /Roll \(Difficulty\)/, h.key);
    assert.match(obstacles, /<td>E1<\/td>/, h.key);
    assert.match(obstacles, /<td>E2<\/td>/, h.key);
    const src = pageText(h, "map").match(/src="systems\/heisty-spideys\/([^"]+)"/)?.[1];
    assert.ok(src && existsSync(join(ROOT, src)), `${h.key} map image`);
  }
  assert.match(pageText(byKey("heists", "heist-cookie-situation"), "st-prep-unknown-obstacle"), /roll a d6 in secret/);
  const rest = byKey("heists", "heist-restaurant-rush");
  assert.ok(rest.pages.some(p => p.name === "ST Prep — The Rat's Deal"));
  assert.match(pageText(rest, "overview"), /Loot:<\/strong> Treasure/);
});

test("the Mid-Heist Complication table carries its effects (E14)", () => {
  const t = pageText(byKey("rules", "random-tables"), "mid-heist-complication");
  assert.match(t, /third round at one obstacle/);
  assert.match(t, /Nothing asleep\? \+1 Alert/);
  assert.match(t, /Stealth &minus;1 Difficulty this round/);
});
