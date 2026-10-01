/**
 * HEISTY SPIDEYS — Ability keys (pure)
 * ------------------------------------
 * Items are matched to rules by a stable key, never by display text. Perks and
 * Flaws carry `system.key` (blank → the slug of their name, which equals the
 * compendium key, e.g. "Spider-Sense… Sort Of" → "spider-sense-sort-of").
 * Signature Moves are keyed "sig:<roleKey>" and species abilities
 * "species:<speciesKey>". Foundry-free; unit-tested in test/keys.test.mjs.
 */

import { HEISTY } from "../config.mjs";

/**
 * Slugify a display name the way the compendium keys are written: lower case,
 * apostrophes dropped (straight or curly), accents folded, every other run of
 * non-alphanumerics → one "-", no leading/trailing "-".
 * @param {string} name
 * @returns {string}
 */
export function slugKey(name) {
  return String(name ?? "")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['‘’ʼ`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** "The Face" / "the-face" / "face" → "face" (a HEISTY.roles key when it is one). */
export function roleKeyOf(item) {
  const sys = item?.system ?? {};
  if (sys.roleKey) return String(sys.roleKey);
  const name = String(item?.name ?? "");
  for (const [k, r] of Object.entries(HEISTY.roles)) {
    if (slugKey(r.label) === slugKey(name) || slugKey(r.signature) === slugKey(sys.signature ?? "")) return k;
  }
  return slugKey(name).replace(/^the-/, "");
}

/** "Orb Weaver" / "orb-weaver" → "orbweaver" (a HEISTY.species key when it is one). */
export function speciesKeyOf(item) {
  const sys = item?.system ?? {};
  if (sys.speciesKey) return String(sys.speciesKey);
  const name = slugKey(item?.name ?? "");
  for (const [k, s] of Object.entries(HEISTY.species)) {
    if (slugKey(s.label) === name || slugKey(s.ability) === slugKey(sys.ability ?? "")) return k;
  }
  return name.replace(/-spider$/, "").replace(/-/g, "");
}

/**
 * The ABILITIES key an item resolves to.
 *   perk / flaw → system.key, or the slug of the name
 *   role        → "sig:" + roleKey      (its Signature Move)
 *   species     → "species:" + speciesKey (its species ability)
 *   anything else → "" (gadgets are not abilities)
 * @param {{type:string, name:string, system?:object}} item
 * @returns {string}
 */
export function itemAbilityKey(item) {
  if (!item) return "";
  switch (item.type) {
    case "perk":
    case "flaw":
      return String(item.system?.key || "") || slugKey(item.name);
    case "role":
      return `sig:${roleKeyOf(item)}`;
    case "species":
      return `species:${speciesKeyOf(item)}`;
    default:
      return "";
  }
}
