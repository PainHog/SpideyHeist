/**
 * Regression: core's Actor#getRollData returns the LIVE system model, so the
 * system's override must never write into it (it once replaced system.skills
 * and system.silk with plain numbers, silently zeroing skill dice and Silk).
 * Runs the real document classes against minimal stand-ins for Foundry's bases.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

globalThis.Actor = class { getRollData() { return this.system; } };
globalThis.Item = class { getRollData() { return this.system; } };
const { HeistyActor } = await import("../module/documents/actor.mjs");
const { HeistyItem } = await import("../module/documents/item.mjs");

function makeSpider() {
  const actor = new HeistyActor();
  actor.type = "spider";
  actor.system = {
    attributes: { body: { value: 3 }, wit: { value: 2 } },
    skills: { stealth: { value: 2 }, climb: { value: 1 } },
    silk: { value: 4, max: 5 },
    vitality: { penalty: -1 }
  };
  return actor;
}

test("spider roll data is flattened for formulas", () => {
  const data = makeSpider().getRollData();
  assert.equal(data.body, 3);
  assert.deepEqual(data.skills, { stealth: 2, climb: 1 });
  assert.equal(data.silk, 4);
  assert.equal(data.vit, -1);
});

test("getRollData never mutates the actor's system data", () => {
  const actor = makeSpider();
  const before = structuredClone(actor.system);
  actor.getRollData();
  actor.getRollData();
  assert.deepEqual(actor.system, before);
});

test("item roll data layers the item over its owner without mutating either", () => {
  const actor = makeSpider();
  const item = new HeistyItem();
  item.system = { uses: 2 };
  item.actor = actor;
  const before = structuredClone(actor.system);
  const data = item.getRollData();
  assert.equal(data.item.uses, 2);
  assert.equal(data.skills.stealth, 2);
  assert.deepEqual(actor.system, before);
  assert.equal("item" in actor.system, false);
});
