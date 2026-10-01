/**
 * WP-A: the Waiting Web replacement (Ch 10 Going Out).
 *   npm test    (node --test)
 */
import test from "node:test";
import assert from "node:assert/strict";
import { replacementStats, replacementActorData } from "../module/logic/waiting-web.mjs";
import { ABILITIES, usageStatus } from "../module/logic/abilities.mjs";

test("replacementStats: half starting SP rounded down, Rattled, same Attributes", () => {
  const r = replacementStats({ attributes: { body: 3, wit: 2, nerve: 3, grace: 2 }, oldBonuses: { body: 2 }, silkMax: 7 });
  assert.deepEqual(r, { attributes: { body: 3, wit: 2, nerve: 3, grace: 2 }, silk: 3, vitality: "rattled", speed: null });
  assert.equal(replacementStats({ attributes: {}, silkMax: 6 }).silk, 3);
  assert.equal(replacementStats({ attributes: {}, silkMax: 1 }).silk, 0);
});

test("species swap: old bonus off, new bonus on, no Attribute above 5, new Speed", () => {
  // A Wolf (+2 BODY) with BODY 5 and WIT 4 becomes an Orb Weaver (+2 WIT): BODY 3, WIT 6 → 5.
  const r = replacementStats({
    attributes: { body: 5, wit: 4, nerve: 2, grace: 1 },
    oldBonuses: { body: 2 }, newBonuses: { wit: 2 }, silkMax: 7, newSpeed: 5
  });
  assert.deepEqual(r.attributes, { body: 3, wit: 5, nerve: 2, grace: 1 });
  assert.equal(r.speed, 5);
  assert.equal(r.silk, 3, "starting Silk ignores the species bonus, so a swap doesn't change it");
  // Never below 1 either.
  assert.equal(replacementStats({ attributes: { grace: 1 }, oldBonuses: { grace: 2 }, newBonuses: {}, silkMax: 0 }).attributes.grace, 1);
});

const original = () => ({
  _id: "orig0000000000001",
  name: "Nook",
  type: "spider",
  img: "nook.png",
  ownership: { default: 0, user1: 3 },
  prototypeToken: { name: "Nook", actorLink: true },
  _stats: { systemVersion: "1.8.0" },
  system: {
    attributes: { body: { value: 4 }, wit: { value: 2 }, nerve: { value: 3 }, grace: { value: 1 } },
    skills: { stealth: { value: 3 } },
    speed: { value: 7 },
    silk: { value: 1, max: 6 },
    vitality: { state: "out", outCause: "jar" },
    advancement: { value: 4, earned: 9 },
    heist: { status: "out", slot: "", replacementOf: "", recoveredSerial: 2, camouflaged: true,
      methodActorTarget: "the cat", longConIdentity: "", pending: [{ id: "x", dice: 1 }] }
  },
  items: [
    { _id: "i1", type: "species", name: "Wolf Spider", system: { speciesKey: "wolf", speed: 7, bonuses: { body: 2, wit: 0, nerve: 0, grace: 0 },
      usage: { heistId: "H1", sceneSerial: 3, roundSerial: 9, count: 1 } } },
    { _id: "i2", type: "role", name: "The Lookout", system: { roleKey: "lookout", usage: { heistId: "H1", sceneSerial: 2, roundSerial: 5, count: 1 } } },
    { _id: "i3", type: "perk", name: "Tactical Feed", system: { key: "tactical-feed", usage: { heistId: "H1", sceneSerial: 3, roundSerial: 9, count: 1 } } },
    { _id: "i4", type: "flaw", name: "Loud", system: { key: "loud", usage: { heistId: "", sceneSerial: -1, roundSerial: -1, count: 0 } } }
  ],
  flags: {}
});

test("replacementActorData: same build, new name, Rattled, half SP, waiting, slot and usage stamps carried", () => {
  const src = original();
  const data = replacementActorData(src, { sourceId: src._id, name: "Pebbles", silkMax: 6, arrivesAtSerial: 4 });
  assert.equal(data._id, undefined);
  assert.equal(data._stats, undefined);
  assert.equal(data.name, "Pebbles");
  assert.equal(data.prototypeToken.name, "Pebbles");
  assert.deepEqual(data.ownership, src.ownership, "owned by the same player");
  assert.equal(data.system.vitality.state, "rattled");
  assert.equal(data.system.vitality.outCause, "");
  assert.equal(data.system.silk.value, 3);
  assert.equal(data.system.attributes.body.value, 4);
  assert.equal(data.system.speed.value, 7);
  assert.deepEqual(data.system.advancement, { value: 0, earned: 0 });
  assert.equal(data.system.heist.status, "waiting");
  assert.equal(data.system.heist.slot, src._id, "shares the original's player slot");
  assert.equal(data.system.heist.replacementOf, src._id);
  assert.equal(data.system.heist.camouflaged, false);
  assert.deepEqual(data.system.heist.pending, []);
  assert.equal(data.system.heist.methodActorTarget, "the cat");
  assert.deepEqual(data.flags["heisty-spideys"].replacement, { of: src._id, arrivesAtSerial: 4 });

  // Same Role, Perks, Flaw — with the uses its player has left.
  assert.deepEqual(data.items.map(i => i.name).sort(), ["Loud", "Tactical Feed", "The Lookout", "Wolf Spider"]);
  for (const it of data.items) {
    assert.equal(it._id, undefined);
    assert.deepEqual(it.system.usage, src.items.find(i => i.name === it.name).system.usage, it.name);
  }
  const sig = data.items.find(i => i.type === "role");
  assert.equal(usageStatus(ABILITIES["sig:lookout"], sig.system.usage, { heistId: "H1", sceneSerial: 4, roundSerial: 12 }).available, false,
    "the replacement can't use I Called It again this heist");
  // The source object isn't mutated.
  assert.equal(src.items[0]._id, "i1");
  assert.equal(src.name, "Nook");
});

test("replacementActorData: an existing slot is kept; a species swap replaces the item", () => {
  const src = original();
  src.system.heist.slot = "slotA";
  const orb = { _id: "sp2", type: "species", name: "Orb Weaver", folder: "f", system: { speciesKey: "orbweaver", speed: 5, bonuses: { body: 0, wit: 2, nerve: 0, grace: 0 } } };
  const data = replacementActorData(src, { sourceId: src._id, name: "", species: orb, silkMax: 6 });
  assert.equal(data.name, "Nook II", "a blank name gets a default");
  assert.equal(data.system.heist.slot, "slotA");
  const species = data.items.filter(i => i.type === "species");
  assert.equal(species.length, 1);
  assert.equal(species[0].name, "Orb Weaver");
  assert.equal(species[0]._id, undefined);
  assert.equal(species[0].folder, undefined);
  assert.equal(data.system.attributes.body.value, 2);
  assert.equal(data.system.attributes.wit.value, 4);
  assert.equal(data.system.speed.value, 5);
  assert.equal(data.system.silk.value, 3);
});

test("replacementActorData recomputes starting Silk when it isn't given", () => {
  // Placed WIT 2 + NERVE 3 + 1 = 6 → 3.
  const data = replacementActorData(original(), { sourceId: "x" });
  assert.equal(data.system.silk.value, 3);
  assert.equal(data.system.silk.max, 6);
});
