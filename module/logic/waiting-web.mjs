/**
 * HEISTY SPIDEYS — The Waiting Web (pure)
 * ---------------------------------------
 * Chapter 10, Going Out: the player draws a fresh spider from the Waiting Web —
 * same Role, Attributes, Skills, Perks and Flaw; a new name and optionally a new
 * species (swap the old species' Attribute bonus and Speed for the new one's,
 * no Attribute above 5). It enters at the start of the next obstacle, next to
 * any crewmate, Rattled, with half its starting Silk Points rounded down — and
 * it carries on with the uses its player has left (usage stamps are copied).
 * Foundry-free; unit-tested in test/waiting-web.test.mjs.
 */

import { HEISTY } from "../config.mjs";
import { startingSilk } from "./rules.mjs";

const ATTRS = Object.keys(HEISTY.attributes);
const n = v => Math.trunc(Number(v) || 0);
const valueOf = v => (v && typeof v === "object" ? n(v.value) : n(v));
const clone = o => (o === undefined ? undefined : JSON.parse(JSON.stringify(o)));

/**
 * The replacement's numbers.
 * @param {object} p
 * @param {object} p.attributes   Final Attributes of the original (numbers or {value}).
 * @param {object} [p.oldBonuses] The original species' bonuses.
 * @param {object|null} [p.newBonuses] The new species' bonuses (null/undefined = no swap).
 * @param {number} p.silkMax      The original's starting Silk (WIT + NERVE + 1, no species bonus).
 * @param {number} [p.newSpeed]   The new species' Speed (or the old one when not swapping).
 * @returns {{attributes:object, silk:number, vitality:"rattled", speed:number|null}}
 */
export function replacementStats({ attributes = {}, oldBonuses = {}, newBonuses = null, silkMax = 0, newSpeed = null } = {}) {
  const out = {};
  for (const k of ATTRS) {
    let v = valueOf(attributes[k]);
    if (newBonuses) v = v - n(oldBonuses?.[k]) + n(newBonuses?.[k]);
    out[k] = Math.max(1, Math.min(5, v));
  }
  return {
    attributes: out,
    silk: Math.max(0, Math.floor(n(silkMax) / 2)),
    vitality: "rattled",
    speed: newSpeed === null || newSpeed === undefined ? null : Math.max(0, n(newSpeed))
  };
}

/**
 * Build the creation data for a replacement from the original's plain data.
 * @param {object} source  `actor.toObject()` of the original (items included).
 * @param {object} opts
 * @param {string} opts.sourceId        The original actor's id.
 * @param {string} [opts.name]          The new name (blank → "<name> II").
 * @param {object|null} [opts.species]  New species item data (toObject()), or null to keep the species.
 * @param {number} [opts.silkMax]       The original's derived starting Silk (recomputed if omitted).
 * @param {number|null} [opts.arrivesAtSerial] Obstacle serial it arrives at (stored in a flag).
 * @param {string} [opts.flag]          Flag scope for bookkeeping (default "heisty-spideys").
 * @returns {object} Actor creation data.
 */
export function replacementActorData(source, { sourceId, name, species = null, silkMax, arrivesAtSerial = null, flag = "heisty-spideys" } = {}) {
  const data = clone(source) ?? {};
  delete data._id;
  delete data._stats;
  delete data.sort;
  const sys = data.system ?? (data.system = {});
  const items = Array.isArray(data.items) ? data.items : [];

  const oldSpecies = items.find(i => i.type === "species") ?? null;
  const oldBonuses = oldSpecies?.system?.bonuses ?? {};
  const swap = !!species;
  const newBonuses = swap ? (species.system?.bonuses ?? {}) : null;
  const baseSpeed = swap ? species.system?.speed : (oldSpecies?.system?.speed ?? sys.speed?.value);

  const attrsNow = Object.fromEntries(ATTRS.map(k => [k, valueOf(sys.attributes?.[k])]));
  const max = Number.isFinite(Number(silkMax)) && silkMax !== null && silkMax !== undefined
    ? n(silkMax) : startingSilk(attrsNow, oldBonuses);
  const stats = replacementStats({ attributes: attrsNow, oldBonuses, newBonuses, silkMax: max, newSpeed: baseSpeed });

  data.name = String(name ?? "").trim() || `${source?.name ?? "Spider"} II`;
  sys.attributes = Object.fromEntries(ATTRS.map(k => [k, { ...(sys.attributes?.[k] ?? {}), value: stats.attributes[k] }]));
  sys.silk = { ...(sys.silk ?? {}), value: stats.silk, max };
  sys.vitality = { ...(sys.vitality ?? {}), state: stats.vitality, outCause: "" };
  if (stats.speed !== null) sys.speed = { ...(sys.speed ?? {}), value: stats.speed };
  sys.advancement = { value: 0, earned: 0 };
  const h = sys.heist ?? {};
  sys.heist = {
    ...h,
    status: "waiting",
    slot: h.slot || sourceId || "",
    replacementOf: sourceId || "",
    recoveredSerial: -1,
    camouflaged: false,
    pending: []
  };

  // Items: keep everything (Role, Perks, Flaw, gadgets) with their usage stamps;
  // swap the species item if a new one was chosen. Embedded ids are dropped so
  // the new actor gets fresh ones.
  const kept = items.filter(i => !(swap && i.type === "species")).map(i => { const c = clone(i); delete c._id; return c; });
  if (swap) { const s = clone(species); delete s._id; delete s.folder; kept.push(s); }
  data.items = kept;

  if (data.prototypeToken) data.prototypeToken.name = data.name;
  data.flags = data.flags ?? {};
  data.flags[flag] = { ...(data.flags[flag] ?? {}), replacement: { of: sourceId || "", arrivesAtSerial } };
  return data;
}
