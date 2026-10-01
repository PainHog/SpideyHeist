/**
 * WP-A: carrying and Speed (Ch 3, Ch 12; v4.8 N20, §16 item 10).
 *   npm test    (node --test)
 */
import test from "node:test";
import assert from "node:assert/strict";
import { carryRule, effectiveSpeed, normTier, deriveVitality } from "../module/logic/speed.mjs";

test("carry table: Crumb/Trinket one at full; Prize one half, two full", () => {
  for (const t of ["crumb", "trinket"]) {
    assert.deepEqual(carryRule(t, 1), { canMove: true, half: false, fitsSqueeze: true, note: "" });
  }
  assert.equal(carryRule("prize", 1).half, true);
  assert.equal(carryRule("prize", 2).half, false);
  assert.equal(carryRule("prize", 3).half, false);
  assert.equal(carryRule("prize", 1).fitsSqueeze, false, "bigger than a Trinket won't fit a squeeze");
});

test("Treasure: a lone carrier stays put; two at half; a sled at full", () => {
  assert.equal(carryRule("treasure", 1).canMove, false);
  assert.match(carryRule("treasure", 1).note, /too heavy/i);
  assert.deepEqual([carryRule("treasure", 2).canMove, carryRule("treasure", 2).half], [true, true]);
  assert.deepEqual([carryRule("treasure", 1, true).canMove, carryRule("treasure", 1, true).half], [true, false]);
});

test("The Big Score moves at half Speed; not carrying = no effect", () => {
  assert.equal(carryRule("score", 4).half, true);
  assert.equal(carryRule("Big Score", 4).half, true);
  assert.equal(normTier("The Big Score"), "score");
  assert.deepEqual(carryRule("prize", 0), { canMove: true, half: false, fitsSqueeze: false, note: "" });
  assert.equal(carryRule("", 1).half, false);
});

test("effectiveSpeed: Hurt halves (round down); Critical and Out are 0", () => {
  assert.equal(effectiveSpeed({ base: 7, vitalityKey: "unharmed" }).speed, 7);
  assert.equal(effectiveSpeed({ base: 7, vitalityKey: "rattled" }).speed, 7);
  assert.equal(effectiveSpeed({ base: 7, vitalityKey: "hurt" }).speed, 3);
  assert.equal(effectiveSpeed({ base: 7, vitalityKey: "critical" }).speed, 0);
  assert.equal(effectiveSpeed({ base: 7, vitalityKey: "out" }).speed, 0);
  assert.match(effectiveSpeed({ base: 5, vitalityKey: "critical" }).notes[0], /adjacent crewmate/);
});

test("halvings don't stack: Hurt + a Prize alone is still half", () => {
  const r = effectiveSpeed({ base: 6, vitalityKey: "hurt", carry: { tier: "prize", carriers: 1 } });
  assert.equal(r.speed, 3);
  assert.ok(r.notes.includes("Halvings don't stack"));
  assert.equal(effectiveSpeed({ base: 6, vitalityKey: "unharmed", carry: { tier: "prize", carriers: 1 } }).speed, 3);
  assert.equal(effectiveSpeed({ base: 6, vitalityKey: "unharmed", carry: carryRule("prize", 2) }).speed, 6);
  assert.equal(effectiveSpeed({ base: 6, vitalityKey: "hurt", carry: carryRule("treasure", 2) }).speed, 3);
});

test("a lone Treasure carrier can't move; a sled carries it at full", () => {
  const r = effectiveSpeed({ base: 5, vitalityKey: "unharmed", carry: { tier: "treasure", carriers: 1 } });
  assert.equal(r.speed, 0);
  assert.equal(r.canMove, false);
  assert.equal(effectiveSpeed({ base: 5, carry: { tier: "treasure", carriers: 1, sled: true } }).speed, 5);
});

test("bringing a Critical crewmate: half Speed, or full with Passenger", () => {
  assert.equal(effectiveSpeed({ base: 6, carryingPassenger: true }).speed, 3);
  assert.equal(effectiveSpeed({ base: 6, carryingPassenger: true, perks: ["passenger"] }).speed, 6);
  assert.equal(effectiveSpeed({ base: 6, carry: { carryingPassenger: true } }).speed, 3, "via the carry lookup");
  assert.equal(effectiveSpeed({ base: 6, vitalityKey: "hurt", carryingPassenger: true, perks: ["passenger"] }).speed, 3,
    "Passenger doesn't cure Hurt");
});

test("deriveVitality: Unfazed ignores Rattled only", () => {
  assert.equal(deriveVitality("rattled").penalty, -1);
  assert.equal(deriveVitality("rattled", ["unfazed"]).penalty, 0);
  assert.equal(deriveVitality("rattled", ["unfazed"]).unfazed, true);
  assert.equal(deriveVitality("hurt", ["unfazed"]).penalty, -2);
  assert.equal(deriveVitality("bogus").key, "unharmed");
});
