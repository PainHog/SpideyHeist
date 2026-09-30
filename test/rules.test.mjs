/**
 * Unit tests for the pure rules logic — run without a live Foundry:
 *   npm test    (node --test)
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  SUCCESS_FACE, CRITICAL_ALERT_MIN_DIFFICULTY, BONUS_DICE_CAP,
  countSuccesses, classifyResult, classifyBotch, alertForResult, partialThreshold,
  nextAlertValue, capBonusDice, opposedDifficulty,
  finalAttributes, attributesSpent, skillBudget
} from "../module/logic/rules.mjs";
import { HEISTY } from "../module/config.mjs";

test("countSuccesses counts 5/6 only (v4.6)", () => {
  assert.equal(SUCCESS_FACE, 5);
  assert.equal(countSuccesses([1, 2, 3, 4, 5, 6]), 2);
  assert.equal(countSuccesses([1, 2, 3]), 0);
  assert.equal(countSuccesses([4, 4, 4]), 0);
  assert.equal(countSuccesses([5, 6, 5]), 3);
  assert.equal(countSuccesses([]), 0);
});

test("classifyResult honours the Difficulty ladder", () => {
  assert.equal(classifyResult(0, 3), "failure");
  assert.equal(classifyResult(1, 3), "failure"); // fewer than half (round up) of 3
  assert.equal(classifyResult(2, 3), "partial");
  assert.equal(classifyResult(3, 3), "success");
  assert.equal(classifyResult(5, 3), "success");
  assert.equal(classifyResult(6, 3), "critical"); // double the required
  assert.equal(classifyResult(7, 3), "critical");
  assert.equal(classifyResult(1, 1), "success");
  assert.equal(classifyResult(2, 1), "critical");
});

test("a Partial needs at least half the Difficulty, rounded up (v4.6)", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(partialThreshold), [1, 1, 2, 2, 3, 3]);
  assert.equal(partialThreshold(0), 1);          // missing/invalid Difficulty reads as 1
  // Difficulty 1–2: zero is the only Failure.
  assert.equal(classifyResult(0, 1), "failure");
  assert.equal(classifyResult(0, 2), "failure");
  assert.equal(classifyResult(1, 2), "partial");
  assert.equal(classifyResult(2, 2), "success");
  // Difficulty 4: 1 fails, 2–3 are Partials, 4–7 Successes, 8 a Critical.
  assert.equal(classifyResult(1, 4), "failure");
  assert.equal(classifyResult(2, 4), "partial");
  assert.equal(classifyResult(3, 4), "partial");
  assert.equal(classifyResult(4, 4), "success");
  assert.equal(classifyResult(7, 4), "success");
  assert.equal(classifyResult(8, 4), "critical");
  // Difficulty 5: 2 fails, 3 is a Partial; Critical still 2× Difficulty.
  assert.equal(classifyResult(2, 5), "failure");
  assert.equal(classifyResult(3, 5), "partial");
  assert.equal(classifyResult(9, 5), "success");
  assert.equal(classifyResult(10, 5), "critical");
});

test("classifyBotch: 1-3 botch, 4-6 clean failure", () => {
  for (const d of [1, 2, 3]) assert.equal(classifyBotch(d), "botch");
  for (const d of [4, 5, 6]) assert.equal(classifyBotch(d), "cleanfail");
});

test("alertForResult is driven by the results table", () => {
  assert.equal(alertForResult("critical", 3), -1);
  assert.equal(alertForResult("botch", 3), 2);
  assert.equal(alertForResult("failure", 3), 1);
  assert.equal(alertForResult("success", 3), 0);
  assert.equal(alertForResult("partial", 3), HEISTY.results.partial.alert);
  assert.equal(alertForResult("nonsense", 3), 0);
});

test("a Critical lowers the Alert only at Difficulty 3 or higher (v4.6)", () => {
  assert.equal(CRITICAL_ALERT_MIN_DIFFICULTY, 3);
  // Difficulty 1 (Trivial): two Successes is a Critical, but no Alert farming.
  assert.equal(classifyResult(2, 1), "critical");
  assert.equal(alertForResult("critical", 1), 0);
  // Difficulty 2: four Successes is still a Critical, but no longer lowers the Alert.
  assert.equal(classifyResult(4, 2), "critical");
  assert.equal(alertForResult("critical", 2), 0);
  // Difficulty 3+: the Alert drops by 1.
  assert.equal(classifyResult(6, 3), "critical");
  assert.equal(alertForResult("critical", 3), -1);
  assert.equal(alertForResult("critical", 5), -1);
  // A missing/invalid Difficulty is treated as 1, as classifyResult does.
  assert.equal(alertForResult("critical"), 0);
  assert.equal(alertForResult("critical", 0), 0);
  // Other results are unaffected by a Difficulty of 1.
  assert.equal(alertForResult("failure", 1), 1);
  assert.equal(alertForResult("botch", 1), 2);
  assert.equal(alertForResult("success", 1), 0);
});

test("at Full Alert no result moves the Alert (C7)", () => {
  const full = HEISTY.getAlertState(8, 8);
  const below = HEISTY.getAlertState(7, 8);
  for (const k of ["critical", "success", "partial", "failure", "botch", "cleanfail"]) {
    assert.equal(alertForResult(k, 4, full), 0, k);
  }
  assert.equal(alertForResult("critical", 4, below), -1);
  assert.equal(alertForResult("failure", 4, below), 1);
});

test("Full Alert: the Alert clamps at the Limit and can't be lowered (C7)", () => {
  // Below the Limit: clamped to 0…Limit.
  assert.equal(nextAlertValue(3, 5, 8), 5);
  assert.equal(nextAlertValue(3, 2, 8), 2);
  assert.equal(nextAlertValue(3, -4, 8), 0);
  assert.equal(nextAlertValue(7, 10, 8), 8);     // a +3 spike stops at the Limit
  assert.equal(nextAlertValue(5, 9, 6), 6);
  // At the Limit: locked — nothing raises or lowers it.
  assert.equal(nextAlertValue(8, 7, 8), 8);
  assert.equal(nextAlertValue(8, 0, 8), 8);
  assert.equal(nextAlertValue(8, 10, 8), 8);
  assert.equal(nextAlertValue(6, 5, 6), 6);
  // A value left above the Limit (older worlds) is pulled back to it.
  assert.equal(nextAlertValue(11, 12, 8), 8);
  // A new, higher Limit releases the lock.
  assert.equal(nextAlertValue(8, 7, 10), 7);
});

test("bonus dice: at most +2 from everything except Silk (R5)", () => {
  assert.equal(BONUS_DICE_CAP, 2);
  assert.deepEqual(capBonusDice(0, 0), { bonus: 0, silk: 0, total: 0, requested: 0, capped: false });
  assert.deepEqual(capBonusDice(2, 0), { bonus: 2, silk: 0, total: 2, requested: 2, capped: false });
  assert.deepEqual(capBonusDice(5, 0), { bonus: 2, silk: 0, total: 2, requested: 5, capped: true });
  // Silk dice ride on top of the cap.
  assert.deepEqual(capBonusDice(4, 3), { bonus: 2, silk: 3, total: 5, requested: 4, capped: true });
  assert.deepEqual(capBonusDice(0, 6), { bonus: 0, silk: 6, total: 6, requested: 0, capped: false });
  // Junk input is treated as 0.
  assert.equal(capBonusDice(-3, undefined).total, 0);
  assert.equal(capBonusDice("x", "2").total, 2);
});

test("opposed rolls: the creature's Successes + 1 are the Difficulty (C3)", () => {
  assert.equal(opposedDifficulty(0), 1);
  assert.equal(opposedDifficulty(2), 3);
  assert.equal(opposedDifficulty(4), 5);
  // A tie goes to the world: matching its Successes is only a Partial or less.
  const d = opposedDifficulty(3);
  assert.equal(classifyResult(3, d), "partial");
  assert.equal(classifyResult(4, d), "success");
});

test("finalAttributes adds species bonuses", () => {
  assert.deepEqual(
    finalAttributes({ body: 2, wit: 2, nerve: 3, grace: 3 }, { body: 1, grace: 1 }),
    { body: 3, wit: 2, nerve: 3, grace: 4 }
  );
});

test("attributesSpent sums the base spread", () => {
  assert.equal(attributesSpent({ body: 2, wit: 2, nerve: 3, grace: 3 }), 10);
});

test("skillBudget: core skills consume the role bonus first", () => {
  const skills = Object.fromEntries(Object.keys(HEISTY.skills).map(k => [k, 0]));
  skills.stealth = 3;   // core
  skills.athletics = 5; // general
  const b = skillBudget(skills, ["stealth", "acrobatics"]);
  assert.equal(b.total, 8);
  assert.equal(b.coreSum, 3);
  assert.equal(b.roleBonusUsed, 3);
  assert.equal(b.generalSpent, 5);
});

test("skillBudget caps the role bonus at 3", () => {
  const b = skillBudget({ stealth: 3, acrobatics: 3 }, ["stealth", "acrobatics"]);
  assert.equal(b.roleBonusUsed, 3);
  assert.equal(b.generalSpent, 3);
});

test("getAlertState resolves bands and Full Alert", () => {
  assert.equal(HEISTY.getAlertState(0, 8).key, "calm");
  assert.equal(HEISTY.getAlertState(3, 8).key, "stirring");
  assert.equal(HEISTY.getAlertState(5, 8).key, "active");
  assert.equal(HEISTY.getAlertState(7, 10).key, "lockdown");
  assert.equal(HEISTY.getAlertState(8, 8).atLimit, true);
  assert.equal(HEISTY.getAlertState(8, 8).key, "fullalert");
  assert.equal(HEISTY.getAlertState(3, 8).stealth, 1); // Stirring: Stealth +1
  assert.equal(HEISTY.getAlertState(7, 10).all, 1);    // Lockdown: all +1
  assert.equal(HEISTY.getAlertState(9, 10).key, "lockdown"); // Lockdown is 7+
  assert.equal(HEISTY.getAlertState(9, 10).stealth, 2);
  assert.equal(HEISTY.getAlertState(10, 10).key, "fullalert");
  assert.equal(HEISTY.getAlertState(6, 6).key, "fullalert"); // low Limits skip Lockdown
});

test("Stealth +1 continues through Active (5–6) (C12)", () => {
  assert.equal(HEISTY.getAlertState(5, 10).stealth, 1);
  assert.equal(HEISTY.getAlertState(6, 10).stealth, 1);
  assert.equal(HEISTY.getAlertState(6, 10).all, 0);
});

test("Full Alert brings the Lockdown penalties whatever the Limit (C7)", () => {
  for (const limit of [2, 4, 6, 8, 10]) {
    const st = HEISTY.getAlertState(limit, limit);
    assert.equal(st.atLimit, true, `Limit ${limit}`);
    assert.equal(st.stealth, 2, `Limit ${limit} Stealth`);
    assert.equal(st.all, 1, `Limit ${limit} all`);
  }
  // Just below a low Limit, the ordinary band applies.
  assert.deepEqual([HEISTY.getAlertState(3, 4).stealth, HEISTY.getAlertState(3, 4).all], [1, 0]);
  assert.deepEqual([HEISTY.getAlertState(1, 2).stealth, HEISTY.getAlertState(1, 2).all], [0, 0]);
});

test("Alert Limits and AP awards match the book", () => {
  const limits = Object.fromEntries(Object.entries(HEISTY.alertLimits).map(([k, v]) => [k, v.value]));
  assert.deepEqual(limits, { easy: 10, standard: 8, hard: 6, absurd: 4, legendary: 2 });
  assert.deepEqual(HEISTY.advancement.awards, { easy: 2, standard: 3, hard: 5, absurd: 6, legendary: 8 });
});

test("Vitality: Hurt halves Speed; Critical must be assisted (ruling 2)", () => {
  assert.equal(HEISTY.vitality.hurt.halfSpeed, true);
  assert.equal(HEISTY.vitality.hurt.assisted, false);
  assert.equal(HEISTY.vitality.critical.assisted, true);
  assert.equal(HEISTY.vitality.critical.penalty, -3);
});
