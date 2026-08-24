/**
 * Unit tests for the pure rules logic — run without a live Foundry:
 *   npm test    (node --test)
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  countSuccesses, classifyResult, classifyBotch, alertForResult,
  finalAttributes, attributesSpent, skillBudget
} from "../module/logic/rules.mjs";
import { HEISTY } from "../module/config.mjs";

test("countSuccesses counts 4/5/6 only", () => {
  assert.equal(countSuccesses([1, 2, 3, 4, 5, 6]), 3);
  assert.equal(countSuccesses([1, 2, 3]), 0);
  assert.equal(countSuccesses([4, 4, 4]), 3);
  assert.equal(countSuccesses([]), 0);
});

test("classifyResult honours the Difficulty ladder", () => {
  assert.equal(classifyResult(0, 3), "failure");
  assert.equal(classifyResult(1, 3), "partial");
  assert.equal(classifyResult(2, 3), "partial");
  assert.equal(classifyResult(3, 3), "success");
  assert.equal(classifyResult(5, 3), "success");
  assert.equal(classifyResult(6, 3), "critical"); // double the required
  assert.equal(classifyResult(7, 3), "critical");
  assert.equal(classifyResult(1, 1), "success");
  assert.equal(classifyResult(2, 1), "critical");
});

test("classifyBotch: 1-3 botch, 4-6 clean failure", () => {
  for (const d of [1, 2, 3]) assert.equal(classifyBotch(d), "botch");
  for (const d of [4, 5, 6]) assert.equal(classifyBotch(d), "cleanfail");
});

test("alertForResult is driven by the results table", () => {
  assert.equal(alertForResult("critical"), -1);
  assert.equal(alertForResult("botch"), 2);
  assert.equal(alertForResult("failure"), 1);
  assert.equal(alertForResult("success"), 0);
  assert.equal(alertForResult("partial"), HEISTY.results.partial.alert);
  assert.equal(alertForResult("nonsense"), 0);
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
});
