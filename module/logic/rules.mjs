/**
 * HEISTY SPIDEYS — Pure Rules Logic
 * ---------------------------------
 * Foundry-free functions for the parts of the engine worth testing in isolation:
 * counting Successes, classifying a result, the Botch, Alert suggestions, and
 * the character-builder point-buy math. No `game`, `ui`, `foundry`, or DOM here
 * — only `HEISTY` static data (itself Foundry-free) — so this is unit-tested
 * with `node:test` without a live Foundry (see test/rules.test.mjs).
 */

import { HEISTY } from "../config.mjs";

/** A d6 face of 4, 5, or 6 is a Success. */
export const SUCCESS_FACE = 4;

/** Count Successes in an array of die faces (numbers). */
export function countSuccesses(faces) {
  return (faces ?? []).reduce((n, f) => n + (Number(f) >= SUCCESS_FACE ? 1 : 0), 0);
}

/**
 * Classify a normal (non-Botch) roll against its Difficulty.
 * @returns {"critical"|"success"|"partial"|"failure"}
 */
export function classifyResult(successes, difficulty) {
  const s = Number(successes) || 0;
  const d = Math.max(1, Number(difficulty) || 1);
  if (s <= 0) return "failure";
  if (s >= d * 2) return "critical";
  if (s >= d) return "success";
  return "partial";
}

/** The Botch: pool at 0 rolls one die — 1–3 is a Botch, 4–6 a clean failure. */
export function classifyBotch(die) {
  return Number(die) <= 3 ? "botch" : "cleanfail";
}

/** A Critical lowers the Alert only on a roll of at least this Difficulty. */
export const CRITICAL_ALERT_MIN_DIFFICULTY = 2;

/**
 * Suggested Alert change for a result key (single source of truth: HEISTY.results).
 * A Critical drops the Alert by 1 only on a roll of Difficulty 2 or higher — no
 * farming the Alert off Trivial rolls — so at Difficulty 1 it suggests 0.
 * @param {string} resultKey   A HEISTY.results key.
 * @param {number} difficulty  The roll's final Difficulty (clamped to 1+, as classifyResult does).
 */
export function alertForResult(resultKey, difficulty) {
  const d = Math.max(1, Number(difficulty) || 1);
  if (resultKey === "critical" && d < CRITICAL_ALERT_MIN_DIFFICULTY) return 0;
  return HEISTY.results[resultKey]?.alert ?? 0;
}

/** Final Attribute values = point-buy base + species bonus. */
export function finalAttributes(base, bonuses = {}) {
  const out = {};
  for (const k of Object.keys(base ?? {})) {
    out[k] = (Number(base[k]) || 0) + (Number(bonuses[k]) || 0);
  }
  return out;
}

/** Total Attribute points spent (the book's budget is 10, including the minimums). */
export function attributesSpent(base) {
  return Object.values(base ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);
}

/**
 * Skill point accounting. 12 general points; the Role adds 3 that must land on
 * the two core skills. Core skills consume the role bonus first, then general.
 */
export function skillBudget(skills, coreSkills = []) {
  const total = Object.values(skills ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const coreSum = (coreSkills ?? []).reduce((a, k) => a + (Number(skills?.[k]) || 0), 0);
  const roleBonusUsed = Math.min(3, coreSum);
  const generalSpent = total - roleBonusUsed;
  return { total, coreSum, roleBonusUsed, generalSpent, generalMax: 12, roleBonusMax: 3 };
}
