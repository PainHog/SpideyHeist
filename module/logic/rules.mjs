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

/** A d6 face of 5 or 6 is a Success (rulebook v4.6; it was 4+ before). */
export const SUCCESS_FACE = 5;

/** Count Successes in an array of die faces (numbers). */
export function countSuccesses(faces) {
  return (faces ?? []).reduce((n, f) => n + (Number(f) >= SUCCESS_FACE ? 1 : 0), 0);
}

/**
 * The fewest Successes that still make a Partial: half the Difficulty, rounded
 * up (so 1 at Difficulty 1–2, 2 at Difficulty 3–4, 3 at Difficulty 5–6).
 */
export function partialThreshold(difficulty) {
  const d = Math.max(1, Number(difficulty) || 1);
  return Math.ceil(d / 2);
}

/**
 * Classify a normal (non-Botch) roll against its Difficulty.
 *   Critical — at least double the Difficulty.
 *   Success  — at least the Difficulty.
 *   Partial  — at least half the Difficulty (round up), but short of it.
 *   Failure  — fewer than half (at Difficulty 1–2, zero).
 * @returns {"critical"|"success"|"partial"|"failure"}
 */
export function classifyResult(successes, difficulty) {
  const s = Number(successes) || 0;
  const d = Math.max(1, Number(difficulty) || 1);
  if (s < partialThreshold(d)) return "failure";
  if (s >= d * 2) return "critical";
  if (s >= d) return "success";
  return "partial";
}

/** The Botch: pool at 0 rolls one die — 1–3 is a Botch, 4–6 a clean failure. */
export function classifyBotch(die) {
  return Number(die) <= 3 ? "botch" : "cleanfail";
}

/** A Critical lowers the Alert only on a roll of at least this Difficulty. */
export const CRITICAL_ALERT_MIN_DIFFICULTY = 3;

/**
 * Suggested Alert change for a result key (single source of truth: HEISTY.results).
 * A Critical drops the Alert by 1 only on a roll of Difficulty 3 or higher — no
 * farming the Alert off easy rolls — so below Difficulty 3 it suggests 0.
 * At Full Alert the Alert is locked at the Limit (nothing raises or lowers it),
 * so every result suggests 0.
 * @param {string} resultKey   A HEISTY.results key.
 * @param {number} difficulty  The roll's final Difficulty (clamped to 1+, as classifyResult does).
 * @param {{atLimit?:boolean}} [alertState]  HEISTY.getAlertState(...) at the time of the roll.
 */
export function alertForResult(resultKey, difficulty, alertState = null) {
  if (alertState?.atLimit) return 0;
  const d = Math.max(1, Number(difficulty) || 1);
  if (resultKey === "critical" && d < CRITICAL_ALERT_MIN_DIFFICULTY) return 0;
  return HEISTY.results[resultKey]?.alert ?? 0;
}

/**
 * Full Alert lock. Once the Alert reaches the Limit it stays there for the rest
 * of the heist: nothing raises it past the Limit and nothing lowers it.
 * Below the Limit the value is simply clamped to 0…Limit.
 * @param {number} current    The Alert now.
 * @param {number} requested  The value someone wants to set.
 * @param {number} limit      The location's Alert Limit.
 * @returns {number}          The value the Alert actually takes.
 */
export function nextAlertValue(current, requested, limit) {
  const lim = Math.max(1, Math.round(Number(limit) || 8));
  const cur = Math.max(0, Math.round(Number(current) || 0));
  const want = Math.max(0, Math.round(Number(requested) || 0));
  if (cur >= lim) return lim;
  return Math.min(lim, want);
}

/** At most this many bonus dice on one roll from everything except Silk Points. */
export const BONUS_DICE_CAP = 2;

/**
 * Apply the bonus-dice limit. Assists, Perks, Signature Moves, intel and other
 * abilities together add at most +2 dice to one roll; Silk Point dice don't
 * count toward that limit.
 * @param {number} bonus  Non-Silk bonus dice claimed.
 * @param {number} [silk] Dice bought with Silk Points.
 * @returns {{bonus:number, silk:number, total:number, requested:number, capped:boolean}}
 */
export function capBonusDice(bonus, silk = 0) {
  const requested = Math.max(0, Math.round(Number(bonus) || 0));
  const s = Math.max(0, Math.round(Number(silk) || 0));
  const b = Math.min(BONUS_DICE_CAP, requested);
  return { bonus: b, silk: s, total: b + s, requested, capped: requested > b };
}

/**
 * Opposed rolls: a creature that actively resists rolls its pool first, and its
 * Successes + 1 become the spider's Difficulty (a tie still goes to the world).
 * Cover, the Alert band, Perks and Flaws then modify it as usual.
 */
export function opposedDifficulty(creatureSuccesses) {
  return Math.max(0, Math.round(Number(creatureSuccesses) || 0)) + 1;
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
