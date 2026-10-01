/**
 * WP-A: ability keys and the 1.8.0 migration planners.
 *   npm test    (node --test)
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { slugKey, itemAbilityKey, roleKeyOf, speciesKeyOf } from "../module/logic/keys.mjs";
import { planItemMigration, planActorMigration, threatKeyFor, THREAT_KEYS } from "../module/helpers/migration.mjs";
import { HEISTY } from "../module/config.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const readPack = name => readdirSync(join(ROOT, "packs", "_source", name)).filter(f => f.endsWith(".json")).sort()
  .map(f => JSON.parse(readFileSync(join(ROOT, "packs", "_source", name, f), "utf8")));

test("slugKey equals the pack key for all 42 Perks and 10 Flaws", () => {
  const perks = readPack("perks");
  const flaws = readPack("flaws");
  assert.equal(perks.length, 42);
  assert.equal(flaws.length, 10);
  for (const d of [...perks, ...flaws]) assert.equal(slugKey(d.name), d.key, d.name);
});

test("slugKey handles curly apostrophes, ellipses and punctuation", () => {
  assert.equal(slugKey("Spider-Sense… Sort Of"), "spider-sense-sort-of");
  assert.equal(slugKey("Don’t Look Down"), "dont-look-down");
  assert.equal(slugKey("That All You Got?"), "that-all-you-got");
  assert.equal(slugKey("Abort, Abort"), "abort-abort");
  assert.equal(slugKey("  Café  Crème "), "cafe-creme");
  assert.equal(slugKey(""), "");
  assert.equal(slugKey(null), "");
});

test("itemAbilityKey: perks/flaws by key or slug, roles sig:, species species:", () => {
  for (const d of readPack("perks")) assert.equal(itemAbilityKey({ type: "perk", name: d.name, system: d.system }), d.key);
  for (const d of readPack("flaws")) assert.equal(itemAbilityKey({ type: "flaw", name: d.name, system: d.system }), d.key);
  for (const d of readPack("roles")) {
    assert.equal(itemAbilityKey({ type: "role", name: d.name, system: d.system }), `sig:${d.system.roleKey}`);
    assert.ok(d.system.roleKey in HEISTY.roles, d.name);
  }
  for (const d of readPack("species")) {
    assert.equal(itemAbilityKey({ type: "species", name: d.name, system: d.system }), `species:${d.system.speciesKey}`);
    assert.ok(d.system.speciesKey in HEISTY.species, d.name);
  }
  // An explicit key wins over the name.
  assert.equal(itemAbilityKey({ type: "perk", name: "Renamed by the GM", system: { key: "soundless" } }), "soundless");
  // Gadgets aren't abilities.
  assert.equal(itemAbilityKey({ type: "gadget", name: "I Made a Thing", system: {} }), "");
  assert.equal(itemAbilityKey(null), "");
});

test("role and species keys fall back to the name when the key field is blank", () => {
  assert.equal(roleKeyOf({ name: "The Face", system: {} }), "face");
  assert.equal(roleKeyOf({ name: "The Wheelman", system: { roleKey: "" } }), "wheelman");
  assert.equal(roleKeyOf({ name: "Homebrew Role", system: {} }), "homebrew-role");
  assert.equal(speciesKeyOf({ name: "Orb Weaver", system: {} }), "orbweaver");
  assert.equal(speciesKeyOf({ name: "Wolf Spider", system: {} }), "wolf");
  assert.equal(speciesKeyOf({ name: "Something", system: { ability: "Contortionist" } }), "cellar");
  assert.equal(speciesKeyOf({ name: "Huntsman Spider", system: {} }), "huntsman");
});

test("migration 1.8.0: perk/flaw keys, spider slot, threat key — and it's idempotent", () => {
  const perk = { _id: "p1", type: "perk", name: "Spider-Sense… Sort Of", system: { key: "" } };
  const upd = planItemMigration(perk);
  assert.deepEqual(upd, { _id: "p1", "system.key": "spider-sense-sort-of" });
  const after = { ...perk, system: { key: upd["system.key"] } };
  assert.equal(planItemMigration(after), null);
  assert.equal(planItemMigration({ _id: "g", type: "gadget", name: "Paperclip", system: {} }), null);

  const spider = { _id: "A1", type: "spider", name: "Nook", system: { heist: { slot: "" } },
    items: [{ _id: "f1", type: "flaw", name: "Show-Off", system: { key: "" } }, { _id: "s1", type: "species", name: "Wolf Spider", system: {} }] };
  const plan = planActorMigration(spider);
  assert.deepEqual(plan.update, { "system.heist.slot": "A1" });
  assert.deepEqual(plan.items, [{ _id: "f1", "system.key": "show-off" }]);
  const spiderAfter = { ...spider, system: { heist: { slot: "A1" } },
    items: spider.items.map(i => i.type === "flaw" ? { ...i, system: { key: "show-off" } } : i) };
  const again = planActorMigration(spiderAfter);
  assert.equal(again.update, null);
  assert.deepEqual(again.items, []);

  // A slot already set (a replacement shares its original's) is left alone.
  assert.equal(planActorMigration({ _id: "B", type: "spider", system: { heist: { slot: "A1" } }, items: [] }).update, null);

  const rat = { _id: "T1", type: "threat", name: "The Rat", system: { automation: { key: "" } }, items: [] };
  assert.deepEqual(planActorMigration(rat).update, { "system.automation.key": "protection-rat" });
  assert.equal(planActorMigration({ ...rat, system: { automation: { key: "protection-rat" } } }).update, null);
  assert.equal(planActorMigration({ _id: "T2", type: "threat", name: "Mysterious Hamster", system: { automation: { key: "" } } }).update, null);
});

test("every creature pack name resolves to its own key", () => {
  const creatures = readPack("creatures");
  assert.deepEqual(creatures.map(c => c.key).sort(), [...THREAT_KEYS].sort());
  for (const c of creatures) assert.equal(threatKeyFor(c.name), c.key, c.name);
  assert.equal(threatKeyFor("House Cat"), "house-cat");
  // An injected resolver (WP-C's resolveCreatureKey) wins; a throwing one falls back.
  assert.equal(threatKeyFor("Cat", () => "house-cat"), "house-cat");
  assert.equal(threatKeyFor("The Rat", () => { throw new Error("x"); }), "protection-rat");
});
