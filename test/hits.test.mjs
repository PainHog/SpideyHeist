/**
 * WP-B pure Taking Hits logic (module/logic/hits.mjs) — rulebook v4.8 Ch 10.
 *   npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  TAYG_DIFFICULTY, shrugPool, resolveHit, stepVitality, applyVitalityDrop, taygPasses,
  hazardPool, fallPool, pickAttackIndex, shrugOutcome
} from "../module/logic/hits.mjs";

test("shrugPool: BODY + Endurance + Vitality penalty, never below 0", () => {
  assert.equal(shrugPool({ body: 3, endurance: 2 }), 5);
  assert.equal(shrugPool({ body: 2, endurance: 0, vitalityPenalty: -2 }), 0);
  assert.equal(shrugPool({ body: 1, endurance: 0, vitalityPenalty: -3 }), 0);
});

test("resolveHit: beat → shrug; tie or lose by 1–2 → drop 1; by 3+ → drop 2 (ties to the threat)", () => {
  assert.deepEqual(resolveHit(2, 3), { margin: -1, drop: 0, shrugged: true });
  assert.deepEqual(resolveHit(2, 2), { margin: 0, drop: 1, shrugged: false });
  assert.deepEqual(resolveHit(3, 2), { margin: 1, drop: 1, shrugged: false });
  assert.deepEqual(resolveHit(3, 1), { margin: 2, drop: 1, shrugged: false });
  assert.deepEqual(resolveHit(3, 0), { margin: 3, drop: 2, shrugged: false });
  assert.deepEqual(resolveHit(5, 0), { margin: 5, drop: 2, shrugged: false });
  // A 0-die shrug-off scores 0 and can't Botch: an attack of 0 Successes still ties.
  assert.deepEqual(resolveHit(0, 0), { margin: 0, drop: 1, shrugged: false });
});

test("stepVitality walks the ladder and never recovers from Out", () => {
  assert.equal(stepVitality("unharmed", 1), "rattled");
  assert.equal(stepVitality("unharmed", 2), "hurt");
  assert.equal(stepVitality("critical", 1), "out");
  assert.equal(stepVitality("hurt", 5), "out");
  assert.equal(stepVitality("hurt", -1), "rattled");
  assert.equal(stepVitality("unharmed", -1), "unharmed");
  assert.equal(stepVitality("out", -1), "out");
});

test("applyVitalityDrop: plain drops", () => {
  assert.deepEqual(applyVitalityDrop("unharmed", 0).to, "unharmed");
  assert.equal(applyVitalityDrop("unharmed", 1).to, "rattled");
  assert.equal(applyVitalityDrop("rattled", 2).to, "critical");
  const out = applyVitalityDrop("critical", 1);
  assert.equal(out.to, "out");
  assert.equal(out.out, true);
});

test("That All You Got?: asked only when a hit would drop you to Critical; a pass stops at Hurt", () => {
  const ask = applyVitalityDrop("hurt", 1, { tayg: null });
  assert.equal(ask.needsTayg, true);
  assert.equal(applyVitalityDrop("rattled", 2, { tayg: null }).needsTayg, true);
  assert.equal(applyVitalityDrop("unharmed", 2, { tayg: null }).needsTayg, false); // lands on Hurt
  assert.equal(applyVitalityDrop("hurt", 2, { tayg: null }).needsTayg, false);     // straight to Out
  const pass = applyVitalityDrop("hurt", 1, { tayg: true });
  assert.equal(pass.to, "hurt");
  assert.equal(pass.taygSaved, true);
  assert.equal(applyVitalityDrop("rattled", 2, { tayg: true }).to, "hurt");
  assert.equal(applyVitalityDrop("hurt", 1, { tayg: false }).to, "critical");
  assert.equal(TAYG_DIFFICULTY, 3);
  assert.equal(taygPasses([5, 6, 1], 3), true);  // Partial passes a pass-or-fail check
  assert.equal(taygPasses([5, 1, 1], 3), false);
  assert.equal(taygPasses([], 0), false);
});

test("glass, Exterminator and capture send a spider Out; a shrugged hit doesn't", () => {
  assert.equal(applyVitalityDrop("critical", 1, { critToOut: true }).cause, "glass");
  assert.equal(applyVitalityDrop("hurt", 1, { critToOut: true }).to, "critical");
  assert.equal(applyVitalityDrop("unharmed", 1, { outIfLands: true }).to, "out");
  assert.equal(applyVitalityDrop("unharmed", 1, { capture: true }).cause, "capture");
  assert.equal(applyVitalityDrop("unharmed", 0, { capture: true }).to, "unharmed");
  assert.equal(applyVitalityDrop("out", 2).to, "out");
});

test("hazard and fall pools (falls round up, N17)", () => {
  assert.equal(hazardPool(3), 3);
  assert.equal(hazardPool(-1), 0);
  assert.equal(fallPool(1), 1);
  assert.equal(fallPool(2), 1);
  assert.equal(fallPool(3), 2);
  assert.equal(fallPool(6), 3);
  assert.equal(fallPool(8), 4);
  assert.equal(fallPool(0), 0);
});

test("pickAttackIndex finds each creature's attack", () => {
  const cat = [{ label: "Perception", pool: 4 }, { label: "Pursuit", pool: 5, note: "Athletics" }, { label: "Pounce", pool: 4, note: "Brawl" }];
  assert.equal(pickAttackIndex(cat), 2);
  const vacuum = [{ label: "Navigation", pool: 2 }, { label: "Pursuit", pool: 3, note: "its attack: whatever it catches takes the hit" }];
  assert.equal(pickAttackIndex(vacuum), 1);
  const human = [{ label: "Swat", pool: 3, note: "its attack" }, { label: "Perception", pool: 3 }];
  assert.equal(pickAttackIndex(human), 0);
  const child = [{ label: "Spotting", pool: 4 }, { label: "Capture Attempt", pool: 3 }];
  assert.equal(pickAttackIndex(child), 1);
  const dog = [{ label: "Nose", pool: 5 }, { label: "Chase", pool: 4 }, { label: "Bark", pool: 5 }];
  assert.equal(pickAttackIndex(dog), 1);
  assert.equal(pickAttackIndex([{ label: "Perception", pool: 1 }]), -1);
});

test("shrugOutcome is idempotent from the stored Vitality before", () => {
  const a = shrugOutcome({ attackSuccesses: 2, faces: [5, 1, 1], vitalityBefore: "unharmed" });
  assert.equal(a.successes, 1);
  assert.equal(a.drop, 1);
  assert.equal(a.vitalityAfter, "rattled");
  const again = shrugOutcome({ attackSuccesses: 2, faces: [5, 6, 6], vitalityBefore: "unharmed" });
  assert.equal(again.vitalityAfter, "unharmed");
  assert.equal(again.shrugged, true);
  const zero = shrugOutcome({ attackSuccesses: 0, faces: [], vitalityBefore: "rattled" });
  assert.equal(zero.vitalityAfter, "hurt");
});
