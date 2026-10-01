/**
 * HEISTY SPIDEYS — Advancement (pure)
 * -----------------------------------
 * Chapter 11, Spending AP: 1 AP for +1 to a Skill, 2 AP for +1 to an Attribute,
 * 3 AP for a new Perk from your Role list (no maximum). After creation Skills
 * and Attributes can reach 5 (Attributes include the species bonus). Unspent
 * AP carry over. The Silk maximum is derived, so it follows WIT and NERVE.
 * Foundry-free; unit-tested in test/advancement.test.mjs.
 */

import { HEISTY } from "../config.mjs";

export const ADVANCE_COSTS = Object.freeze({ skill: 1, attribute: 2, perk: 3 });
export const ADVANCE_MAX = 5;

const n = v => Math.trunc(Number(v) || 0);
const valueOf = v => (v && typeof v === "object" ? n(v.value) : n(v));

/**
 * Every advance the spider could buy, with whether it's allowed now.
 * @param {object} p
 * @param {object} p.attributes      {body, wit, nerve, grace} — final values (species bonus included), numbers or {value}.
 * @param {object} p.skills          {athletics: n, …} — numbers or {value}.
 * @param {object} [p.speciesBonuses] Shown for reference; the cap already counts them.
 * @param {number} p.ap              Unspent AP.
 * @param {string[]} [p.ownedPerkKeys]
 * @param {string[]} [p.rolePerkKeys] The Role's Perk list (keys), in book order.
 * @returns {Array<{type, key, cost, allowed, reason, from, to}>}
 */
export function advanceOptions({ attributes = {}, skills = {}, speciesBonuses = {}, ap = 0, ownedPerkKeys = [], rolePerkKeys = [] } = {}) {
  const have = n(ap);
  const out = [];
  const gate = (cost, atMax) => atMax ? "max" : have < cost ? "ap" : "";

  for (const key of Object.keys(HEISTY.skills)) {
    const from = valueOf(skills[key]);
    const reason = gate(ADVANCE_COSTS.skill, from >= ADVANCE_MAX);
    out.push({ type: "skill", key, cost: ADVANCE_COSTS.skill, allowed: !reason, reason, from, to: Math.min(ADVANCE_MAX, from + 1) });
  }
  for (const key of Object.keys(HEISTY.attributes)) {
    const from = valueOf(attributes[key]);
    const reason = gate(ADVANCE_COSTS.attribute, from >= ADVANCE_MAX);
    out.push({
      type: "attribute", key, cost: ADVANCE_COSTS.attribute, allowed: !reason, reason, from,
      to: Math.min(ADVANCE_MAX, from + 1), speciesBonus: n(speciesBonuses?.[key])
    });
  }
  const owned = new Set(ownedPerkKeys ?? []);
  for (const key of rolePerkKeys ?? []) {
    const reason = owned.has(key) ? "owned" : have < ADVANCE_COSTS.perk ? "ap" : "";
    out.push({ type: "perk", key, cost: ADVANCE_COSTS.perk, allowed: !reason, reason });
  }
  return out;
}

/** Plain-English reason an option is blocked. */
export function advanceReasonLabel(reason) {
  return { max: "Already at 5", ap: "Not enough AP", owned: "Already have it", "": "" }[reason ?? ""] ?? String(reason);
}

/**
 * Apply one advance to a snapshot.
 * @param {object} snapshot  The same shape advanceOptions takes.
 * @param {{type:string, key:string}} choice
 * @returns {{updates:object, apSpent:number, addPerk:string|null}}
 *   `updates` is a flat actor update ("system.…" paths), including the new AP.
 *   `addPerk` is the Perk key the runtime must pull from the Perks pack.
 * @throws {Error} if the advance isn't allowed.
 */
export function applyAdvance(snapshot, choice) {
  const opt = advanceOptions(snapshot).find(o => o.type === choice?.type && o.key === choice?.key);
  if (!opt) throw new Error(`Unknown advance: ${choice?.type} ${choice?.key}`);
  if (!opt.allowed) throw new Error(`Can't buy ${opt.type} ${opt.key}: ${advanceReasonLabel(opt.reason)}`);
  const ap = n(snapshot.ap) - opt.cost;
  const updates = { "system.advancement.value": ap };
  if (opt.type === "skill") updates[`system.skills.${opt.key}.value`] = opt.to;
  if (opt.type === "attribute") updates[`system.attributes.${opt.key}.value`] = opt.to;
  return { updates, apSpent: opt.cost, addPerk: opt.type === "perk" ? opt.key : null };
}
