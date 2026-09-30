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

/**
 * Starting Silk Points (rulebook v4.7): WIT + NERVE + 1, counting only the
 * points the player placed — the species bonus doesn't count ("Silk is
 * practice, not anatomy"). After creation it uses the current WIT and NERVE,
 * still without the species bonus.
 * @param {{wit?:number, nerve?:number}} attributes  Final Attribute values (species bonus included).
 * @param {{wit?:number, nerve?:number}} [bonuses]  The species' Attribute bonuses.
 * @returns {number}
 */
export function startingSilk(attributes, bonuses = {}) {
  const placed = k => Math.max(0, (Number(attributes?.[k]) || 0) - (Number(bonuses?.[k]) || 0));
  return placed("wit") + placed("nerve") + 1;
}

/* -------------------------------------------- */
/*  Chapter 20 creation tables                  */
/* -------------------------------------------- */

/** Attributes (roll 1d6): six 10-point spreads, highest number first. */
export const ATTRIBUTE_SPREADS = {
  1: [4, 2, 2, 2],
  2: [3, 3, 2, 2],
  3: [4, 3, 2, 1],
  4: [3, 3, 3, 1],
  5: [5, 2, 2, 1],
  6: [4, 4, 1, 1]
};

/** Role (roll 1d6; on a 6, roll again: 1–3 Wheelman, 4–6 Grifter). */
export function roleFromRoll(first, second = 1) {
  const table = { 1: "face", 2: "ghost", 3: "tinkerer", 4: "bruiser", 5: "lookout" };
  const r = Math.min(6, Math.max(1, Math.round(Number(first) || 1)));
  if (r < 6) return table[r];
  return Number(second) <= 3 ? "wheelman" : "grifter";
}

/**
 * Place a Chapter 20 Attribute spread. The first number goes on `primary` (the
 * Attribute the Role's core skills use), the rest on the other three in the
 * given order. Then the species bonus: anything it would push past 5 moves to
 * the lowest Attribute. Returns the placed points (bonus not included) — they
 * still total 10.
 * @param {number[]} spread     Four numbers, e.g. ATTRIBUTE_SPREADS[3].
 * @param {string} primary      Attribute key for the first number.
 * @param {object} [bonuses]    Species bonuses by Attribute key.
 * @param {string[]} [others]   The other three keys, in the order to fill them.
 * @returns {{body:number, wit:number, nerve:number, grace:number}}
 */
export function placeAttributeSpread(spread, primary, bonuses = {}, others = null) {
  const keys = ["body", "wit", "nerve", "grace"];
  const rest = (others ?? keys).filter(k => k !== primary && keys.includes(k));
  for (const k of keys) if (k !== primary && !rest.includes(k)) rest.push(k);
  const base = {};
  base[primary] = spread[0];
  rest.slice(0, 3).forEach((k, i) => { base[k] = spread[i + 1]; });
  const bonus = k => Number(bonuses?.[k]) || 0;
  const final = k => base[k] + bonus(k);
  // Move each point of overflow, one at a time, to the lowest final Attribute.
  for (let guard = 0; guard < 20; guard++) {
    const over = keys.find(k => final(k) > 5 && base[k] > 1);
    if (!over) break;
    const lowest = keys.filter(k => k !== over && final(k) < 5)
      .sort((a, b) => final(a) - final(b))[0];
    if (!lowest) break;
    base[over] -= 1;
    base[lowest] += 1;
  }
  return base;
}

/**
 * Skills (Quick Pick): both core skills at 3 (the Role's 3 points plus 3 of
 * the 12), then the Role's fixed 3·2·2·2 package for the other 9.
 * @param {string[]} coreSkills  The Role's two core skills.
 * @param {object} quickPick     The Role's package, e.g. { stealth: 3, perception: 2, … }.
 * @returns {object}             Skill ratings for all twelve Skills.
 */
export function quickPickSkills(coreSkills, quickPick) {
  const out = Object.fromEntries(Object.keys(HEISTY.skills).map(k => [k, 0]));
  for (const k of coreSkills ?? []) if (k in out) out[k] = 3;
  for (const [k, v] of Object.entries(quickPick ?? {})) if (k in out) out[k] = Math.max(out[k], Number(v) || 0);
  return out;
}

/**
 * Perks: roll 1d6 twice on the Role's Perk table, counting down the list, and
 * reroll a repeat. `rollD6` supplies the dice (for tests).
 * @param {() => number} rollD6
 * @param {number} [count]  Perks to pick (2 at creation).
 * @returns {number[]}      Zero-based indices into the Role's Perk list.
 */
export function rollPerkIndices(rollD6, count = 2) {
  const picks = [];
  for (let guard = 0; picks.length < count && guard < 200; guard++) {
    const i = Math.min(6, Math.max(1, Math.round(Number(rollD6()) || 1))) - 1;
    if (!picks.includes(i)) picks.push(i);
  }
  return picks;
}
