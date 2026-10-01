/**
 * HEISTY SPIDEYS — Speed, carrying and derived Vitality (pure)
 * ------------------------------------------------------------
 * Chapter 3 and Chapter 12 (v4.8): Hurt halves Speed (round down); halvings
 * don't stack (Hurt and carrying a Prize alone is still half); at Critical you
 * can't move on your own — an adjacent crewmate brings you along at half their
 * Speed, or at full with Passenger. Loot moves only with the carriers its row
 * lists: a lone Treasure carrier stays put; a silk sled (1 SP) hauls a Treasure
 * at full Speed; the Big Score moves with everyone present at half Speed.
 * Foundry-free; unit-tested in test/speed.test.mjs and test/spider-derived.test.mjs.
 */

import { HEISTY } from "../config.mjs";

const TIERS = new Set(["crumb", "trinket", "prize", "treasure", "score"]);

/** Accept "Big Score", "bigScore", "score", … */
export function normTier(tier) {
  const t = String(tier ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (t === "bigscore" || t === "thebigscore") return "score";
  return TIERS.has(t) ? t : "";
}

/**
 * How loot of this tier moves with this many carriers.
 * @param {string} tier       crumb | trinket | prize | treasure | score
 * @param {number} carriers   Spiders carrying it.
 * @param {boolean} [sled]    A silk sled (Treasure, 1 SP).
 * @returns {{canMove:boolean, half:boolean, fitsSqueeze:boolean, note:string}}
 */
export function carryRule(tier, carriers, sled = false) {
  const t = normTier(tier);
  const c = Math.max(0, Math.trunc(Number(carriers) || 0));
  const fitsSqueeze = HEISTY.lootTiers[t]?.fitsSqueeze ?? true;
  if (!t || c === 0) return { canMove: true, half: false, fitsSqueeze, note: "" };
  switch (t) {
    case "crumb":
    case "trinket":
      return { canMove: true, half: false, fitsSqueeze, note: "" };
    case "prize":
      return c >= 2
        ? { canMove: true, half: false, fitsSqueeze, note: "Prize, two carriers: full Speed" }
        : { canMove: true, half: true, fitsSqueeze, note: "Prize, one carrier: half Speed" };
    case "treasure":
      if (sled) return { canMove: true, half: false, fitsSqueeze, note: "Treasure on a silk sled: full Speed" };
      return c >= 2
        ? { canMove: true, half: true, fitsSqueeze, note: "Treasure, two carriers: half Speed" }
        : { canMove: false, half: false, fitsSqueeze, note: "Treasure, one carrier: too heavy to move" };
    case "score":
      return { canMove: true, half: true, fitsSqueeze, note: "The Big Score: everyone, at half Speed" };
  }
  return { canMove: true, half: false, fitsSqueeze, note: "" };
}

/**
 * Resolve a carry descriptor: either a carryRule result ({canMove, half}) or
 * raw loot info ({tier, carriers, sled}). Anything else means "not carrying".
 */
function resolveCarry(carry) {
  if (!carry || typeof carry !== "object") return null;
  if (typeof carry.canMove === "boolean" || typeof carry.half === "boolean") {
    return { canMove: carry.canMove !== false, half: !!carry.half, note: carry.note ?? "" };
  }
  if (carry.tier) return carryRule(carry.tier, carry.carriers ?? 1, !!carry.sled);
  return null;
}

/**
 * A spider's effective Speed.
 * @param {object} p
 * @param {number} p.base                Species Speed.
 * @param {string} p.vitalityKey         unharmed | rattled | hurt | critical | out
 * @param {object|null} [p.carry]        Loot carried (see resolveCarry); may also hold `carryingPassenger`.
 * @param {boolean} [p.carryingPassenger] Bringing a Critical crewmate along.
 * @param {string[]} [p.perks]           Ability keys (only "passenger" matters).
 * @returns {{speed:number, notes:string[], half:boolean, canMove:boolean}}
 */
export function effectiveSpeed({ base, vitalityKey = "unharmed", carry = null, carryingPassenger = false, perks = [] } = {}) {
  const b = Math.max(0, Math.trunc(Number(base) || 0));
  const v = HEISTY.vitality[vitalityKey] ?? HEISTY.vitality.unharmed;
  const notes = [];
  if (v.out) return { speed: 0, notes: ["Out"], half: false, canMove: false };
  if (v.assisted) {
    return { speed: 0, notes: ["Critical: an adjacent crewmate brings you along at half their Speed"], half: false, canMove: false };
  }
  const c = resolveCarry(carry);
  if (c && !c.canMove) return { speed: 0, notes: [c.note || "Too heavy to move"], half: false, canMove: false };

  let half = false;
  if (v.halfSpeed) { half = true; notes.push("Hurt: half Speed"); }
  if (c?.half) { half = true; if (c.note) notes.push(c.note); }
  const passenger = carryingPassenger || !!carry?.carryingPassenger;
  if (passenger) {
    if ((perks ?? []).includes("passenger")) notes.push("Passenger: full Speed with a crewmate");
    else { half = true; notes.push("Carrying a crewmate: half Speed"); }
  }
  if (half && notes.filter(s => /half/i.test(s)).length > 1) notes.push("Halvings don't stack");
  return { speed: half ? Math.floor(b / 2) : b, notes, half, canMove: true };
}

/**
 * Derived Vitality: the dice penalty honours Unfazed (Rattled → 0).
 * @param {string} stateKey
 * @param {string[]} [abilityKeys]
 */
export function deriveVitality(stateKey, abilityKeys = []) {
  const v = HEISTY.vitality[stateKey] ?? HEISTY.vitality.unharmed;
  const unfazed = (abilityKeys ?? []).includes("unfazed");
  const penalty = (unfazed && stateKey === "rattled") ? 0 : v.penalty;
  return { ...v, key: HEISTY.vitality[stateKey] ? stateKey : "unharmed", penalty, unfazed: unfazed && stateKey === "rattled" };
}
