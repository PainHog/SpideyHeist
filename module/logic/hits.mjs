/**
 * HEISTY SPIDEYS — Taking Hits (Chapter 10, rulebook v4.8)
 * --------------------------------------------------------
 * Pure, Foundry-free rules for an attack and its shrug-off (WP-B of
 * docs/AUTOMATION-DESIGN.md §3.8), unit-tested in test/hits.test.mjs.
 *
 *  - shrugPool: BODY + Endurance + the Vitality penalty (never below 0 dice).
 *  - resolveHit: beat the attack → shrug; tie or lose by 1–2 → drop 1; by 3+ → drop 2.
 *  - applyVitalityDrop: the new state, with That All You Got?, the human's
 *    glass (a hit on a Critical spider → Out), the Exterminator in the open and
 *    a capture (→ Out).
 *  - stepVitality: move along the ladder.
 *  - hazardPool / fallPool: pools for hits with no attack pool.
 */

import { HEISTY } from "../config.mjs";
import { countSuccesses, classifyResult } from "./rules.mjs";

const int = (v, d = 0) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : d; };

/** That All You Got?: BODY + Endurance at this Difficulty, a pass stops the drop at Hurt. */
export const TAYG_DIFFICULTY = 3;

/**
 * The shrug-off pool: BODY + Endurance + the Vitality penalty (pass the
 * penalty already adjusted for Unfazed). It never goes below 0 dice; a
 * shrug-off with no dice scores no Successes and can't Botch.
 */
export function shrugPool({ body = 0, endurance = 0, vitalityPenalty = 0 } = {}) {
  return Math.max(0, int(body) + int(endurance) + int(vitalityPenalty));
}

/**
 * Compare the attack's Successes with the shrug-off's (ties go to the threat).
 * @returns {{margin:number, drop:0|1|2, shrugged:boolean}}  margin = attack − defense.
 */
export function resolveHit(attackSuccesses, defenseSuccesses) {
  const margin = int(attackSuccesses) - int(defenseSuccesses);
  if (margin < 0) return { margin, drop: 0, shrugged: true };
  return { margin, drop: margin <= 2 ? 1 : 2, shrugged: false };
}

/**
 * Move along the Vitality ladder (unharmed → rattled → hurt → critical → out).
 * Positive `delta` is worse (a hit), negative recovers. Out never recovers by
 * stepping: a spider that is Out stays Out.
 */
export function stepVitality(fromKey, delta) {
  const order = HEISTY.vitalityOrder;
  const i = Math.max(0, order.indexOf(fromKey));
  const d = int(delta);
  if (fromKey === "out" && d < 0) return "out";
  return order[Math.min(order.length - 1, Math.max(0, i + d))];
}

/**
 * Apply a landed hit's drop.
 * @param {string} fromKey   Vitality before the hit.
 * @param {number} drop      0, 1 or 2 levels.
 * @param {object} [opts]
 * @param {boolean|null} [opts.tayg]  That All You Got?: null = the spider has it and hasn't rolled
 *                                    (→ needsTayg when the hit would drop it to Critical);
 *                                    true = passed (stop at Hurt); false/undefined = no effect.
 * @param {boolean} [opts.critToOut]  The human's glass: a landed hit on a Critical spider → Out.
 * @param {boolean} [opts.outIfLands] The Exterminator in the open: a landed hit → Out.
 * @param {boolean} [opts.capture]    A capture (the Curious Child): a landed hit → Out.
 * @returns {{to:string, out:boolean, needsTayg:boolean, cause:string, taygSaved:boolean}}
 */
export function applyVitalityDrop(fromKey, drop, { tayg = false, critToOut = false, outIfLands = false, capture = false } = {}) {
  const from = HEISTY.vitality[fromKey] ? fromKey : "unharmed";
  const d = Math.max(0, int(drop));
  const res = (to, cause = "hit", extra = {}) => ({ to, out: to === "out", needsTayg: false, cause, taygSaved: false, ...extra });
  if (from === "out") return res("out", "already");
  if (d === 0) return res(from, "shrugged");
  if (capture) return res("out", "capture");
  if (outIfLands) return res("out", "exterminator");
  if (critToOut && from === "critical") return res("out", "glass");
  const to = stepVitality(from, d);
  if (to === "critical" && from !== "critical") {
    if (tayg === null) return { to, out: false, needsTayg: true, cause: "hit", taygSaved: false };
    if (tayg === true) return res("hurt", "hit", { taygSaved: true });
  }
  return res(to);
}

/**
 * That All You Got? passes on a Partial or better (a pass-or-fail check) at
 * Difficulty 3; a pool of 0 or less is a Botch die and can only fail.
 */
export function taygPasses(faces, pool) {
  if (int(pool) <= 0) return false;
  const res = classifyResult(countSuccesses(faces), TAYG_DIFFICULTY);
  return res !== "failure";
}

/** A threat with no attack pool (a broom, a trap, a hazard) rolls its Ch 15 Difficulty in dice. */
export function hazardPool(difficulty) {
  return Math.max(0, int(difficulty));
}

/** A real fall is a hit of 1 die per 2 squares fallen, rounded up (N17). */
export function fallPool(squares) {
  return Math.ceil(Math.max(0, Number(squares) || 0) / 2);
}

/** Attack labels by priority, for threats whose stat block doesn't flag its attack. */
export const ATTACK_LABELS = Object.freeze(["pounce", "swat", "strike", "spray", "capture", "brawl", "chase", "pursuit"]);

/**
 * Which of a threat's listed pools is its attack: one whose note says "its
 * attack", else the first by ATTACK_LABELS priority, else the largest pool
 * that isn't a sense. Returns -1 when the threat has none.
 * @param {{label:string,pool:number,note?:string}[]} rolls
 */
export function pickAttackIndex(rolls) {
  const list = (rolls ?? []).map((r, i) => ({ i, label: String(r?.label ?? "").toLowerCase(), note: String(r?.note ?? "").toLowerCase(), pool: int(r?.pool) }))
    .filter(r => r.pool > 0);
  const flagged = list.find(r => r.note.includes("its attack"));
  if (flagged) return flagged.i;
  for (const lbl of ATTACK_LABELS) {
    const hit = list.find(r => r.label.includes(lbl));
    if (hit) return hit.i;
  }
  const senses = ["perception", "nose", "navigation", "spotting", "haggle", "mimicry", "stealth", "deception"];
  const rest = list.filter(r => !senses.some(s => r.label.includes(s))).sort((a, b) => b.pool - a.pool);
  return rest[0]?.i ?? -1;
}

/**
 * The full shrug-off outcome for a card: successes, margin, drop and the
 * Vitality after, from the stored Vitality before (so re-resolving after a
 * reroll is idempotent).
 * @param {object} args
 * @param {number} args.attackSuccesses
 * @param {number[]} args.faces        Shrug-off faces ([] for a 0-die shrug).
 * @param {string} args.vitalityBefore
 * @param {boolean|null} [args.tayg]
 * @param {boolean} [args.critToOut]
 * @param {boolean} [args.outIfLands]
 * @param {boolean} [args.capture]
 */
export function shrugOutcome({ attackSuccesses, faces = [], vitalityBefore = "unharmed", tayg = false, critToOut = false, outIfLands = false, capture = false }) {
  const successes = countSuccesses(faces);
  const hit = resolveHit(attackSuccesses, successes);
  const v = applyVitalityDrop(vitalityBefore, hit.drop, { tayg, critToOut, outIfLands, capture });
  return { successes, ...hit, vitalityBefore, vitalityAfter: v.to, out: v.out, needsTayg: v.needsTayg, cause: v.cause, taygSaved: v.taygSaved };
}
