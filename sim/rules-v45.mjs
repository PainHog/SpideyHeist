/**
 * The v4.5 core rules, frozen for the simulator.
 *
 * module/logic/rules.mjs and HEISTY.getAlertState now carry the v4.6 rules
 * (Successes on 5–6, half-Difficulty Partials, Critical Alert drop at D3+,
 * Lockdown at any Full Alert). The simulator's default reading must stay the
 * v4.5 book it was built to measure; the v4.6 rules are its P4/P4H packages.
 */

import { HEISTY } from "../module/config.mjs";

/** A d6 face of 4, 5 or 6 is a Success (v4.5). */
export function countSuccesses(faces) {
  return (faces ?? []).reduce((n, f) => n + (Number(f) >= 4 ? 1 : 0), 0);
}

/** v4.5: any Success short of the Difficulty is a Partial. */
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

/**
 * The v4.5 results table's Alert column, frozen here: the live HEISTY.results
 * follows the current book (v4.8 made a clean failure +1), and the simulator's
 * default reading must not move with it.
 */
const V45_RESULT_ALERT = Object.freeze({ critical: -1, success: 0, partial: 1, failure: 1, botch: 2, cleanfail: 0 });

/** v4.5: a Critical lowers the Alert only at Difficulty 2+. */
export function alertForResult(resultKey, difficulty) {
  const d = Math.max(1, Number(difficulty) || 1);
  if (resultKey === "critical" && d < 2) return 0;
  return V45_RESULT_ALERT[resultKey] ?? 0;
}

/** v4.5 Alert state: band modifiers by value only; Full Alert adds no Lockdown below Alert 7. */
export function getAlertState(value, limit) {
  const v = Math.max(0, Number(value) || 0);
  const lim = Number(limit) || 8;
  const atLimit = v >= lim;
  let band = HEISTY.alertBands[HEISTY.alertBands.length - 1];
  for (const b of HEISTY.alertBands) {
    if (v >= b.min && v <= b.max) { band = b; break; }
  }
  return { key: atLimit ? "fullalert" : band.key, stealth: band.stealth, all: band.all, atLimit };
}
