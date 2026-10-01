/**
 * Mid-Heist Complications (WP-C, Ch 20 + E14 + N22).
 */
import test from "node:test";
import assert from "node:assert/strict";
import { MID_HEIST, complicationEffect, clockDue } from "../module/logic/complications.mjs";

const ctx = {
  roundSerial: 7, sceneSerial: 3, obstacleId: "O2",
  creatures: [{ id: "cat", key: "house-cat", active: true }, { id: "dog", key: "house-dog", active: false }, { id: "vac", key: "vacuum", active: false }],
  intel: [{ id: "i1", revealed: true }, { id: "i2", revealed: false, unknown: true }, { id: "i3", revealed: false }],
  fearOfVacuums: ["a1"]
};

test("the table has six rows with text and effect", () => {
  for (let r = 1; r <= 6; r++) {
    assert.ok(MID_HEIST[r].text);
    assert.ok(MID_HEIST[r].effect);
  }
});

test("the clock: rolled as the crew starts round 3 at one obstacle", () => {
  assert.equal(clockDue(2), false);
  assert.equal(clockDue(3), true);
  assert.equal(clockDue(4), false);
});

test("1: the nearest sleeping creature wakes; nothing asleep → +1 Alert", () => {
  const a = complicationEffect(1, ctx).actions;
  assert.equal(a[0].type, "wakeCreature");
  assert.equal(a[0].creatureId, "dog");
  assert.deepEqual(a[0].choices, ["dog", "vac"]);
  const none = complicationEffect(1, { ...ctx, creatures: [{ id: "cat", active: true }] }).actions;
  assert.deepEqual([none[0].type, none[0].delta], ["alert", 1]);
});

test("2: one uncased detail, never the unknown; nothing left → +1 die on the next roll here (N22)", () => {
  const a = complicationEffect(2, ctx).actions;
  assert.deepEqual([a[0].type, a[0].intelId], ["revealIntel", "i3"]);
  const none = complicationEffect(2, { ...ctx, intel: [{ id: "i2", revealed: false, unknown: true }] }).actions;
  assert.equal(none[0].type, "effect");
  assert.equal(none[0].effect.kind, "dice");
  assert.equal(none[0].effect.value, 1);
  assert.equal(none[0].effect.once, true);
  assert.equal(none[0].effect.obstacleId, "O2");
});

test("3: Stealth +1 here this round and next (and the water-run procedure)", () => {
  const a = complicationEffect(3, ctx).actions;
  assert.deepEqual(a[0].effect.skills, ["stealth"]);
  assert.equal(a[0].effect.value, 1);
  assert.equal(a[0].effect.untilRoundSerial, 8);
  assert.deepEqual(a[1], { type: "procedure", trigger: "complication3" });
});

test("4: the vacuum's roar: Stealth −1 this round; Fear of Vacuums checks", () => {
  const a = complicationEffect(4, ctx).actions;
  assert.equal(a[0].effect.value, -1);
  assert.equal(a[0].effect.untilRoundSerial, 7);
  assert.ok(a.some(x => x.type === "activateCreature" && x.creatureId === "vac"));
  const f = a.find(x => x.type === "forcedRoll");
  assert.deepEqual([f.flaw, f.actors, f.attr, f.difficulty], ["fear-of-vacuums", ["a1"], "nerve", 3]);
});

test("5: no cover this round; 6: +1 Alert", () => {
  assert.equal(complicationEffect(5, ctx).actions[0].effect.kind, "noCover");
  const six = complicationEffect(6, ctx).actions[0];
  assert.deepEqual([six.type, six.delta, six.key], ["alert", 1, "complication"]);
});

test("out-of-range rolls clamp to the table", () => {
  assert.equal(complicationEffect(0, ctx).roll, 1);
  assert.equal(complicationEffect(9, ctx).roll, 6);
});
