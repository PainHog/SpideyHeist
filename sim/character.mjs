/**
 * Random, rules-legal spider generation — Chapter 7 ("Building Your Spider"),
 * with the Ch 20 random tables for the dice-rolled options.
 *
 *  Step 1  Species (Ch 4): Attribute bonus + Speed + passive ability.
 *  Step 2  Role (Ch 5): core skills, +3 role bonus points, Signature Move.
 *  Step 3  10 Attribute points, minimum 1 each, nothing above 5 *including*
 *          the species bonus.
 *  Step 4  Speed from species.
 *  Step 5  12 Skill points + 3 role bonus points that must go on the two core
 *          skills; max 3 in any one skill at creation (the cap includes the
 *          role bonus).
 *  Step 6  2 Perks from the Role's list.
 *  Step 7  Exactly 1 Flaw (d10).
 *  Step 8  Silk Points = WIT + NERVE (after species bonuses).
 *
 * Every generated spider is validated with the shared rules helpers
 * (module/logic/rules.mjs) and any rule the generator could not satisfy is
 * counted in `GEN_STATS.violations`.
 */

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { HEISTY } from "../module/config.mjs";
import { finalAttributes, attributesSpent, skillBudget } from "../module/logic/rules.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKS = join(ROOT, "packs", "_source");

function readPack(name) {
  const dir = join(PACKS, name);
  return readdirSync(dir).filter(f => f.endsWith(".json"))
    .map(f => JSON.parse(readFileSync(join(dir, f), "utf8")));
}

/* ------------------------------------------------------------------ data -- */

export const ATTRS = Object.keys(HEISTY.attributes);            // body wit nerve grace
export const SKILLS = Object.keys(HEISTY.skills);               // 12
export const SKILL_ATTR = Object.fromEntries(SKILLS.map(s => [s, HEISTY.skills[s].attr]));

const speciesPack = readPack("species");
const rolesPack = readPack("roles");
const perksPack = readPack("perks");
const flawsPack = readPack("flaws");
export const creaturesPack = readPack("creatures");

/** Species keyed by config key, merged with the pack entry. */
export const SPECIES = Object.fromEntries(Object.entries(HEISTY.species).map(([k, s]) => {
  const p = speciesPack.find(x => x.system.speciesKey === k);
  return [k, { key: k, label: s.label, speed: s.speed, bonuses: s.bonuses, ability: s.ability, pack: p }];
}));

export const ROLES = Object.fromEntries(Object.entries(HEISTY.roles).map(([k, r]) => {
  const p = rolesPack.find(x => x.system.roleKey === k);
  const perks = perksPack.filter(x => x.system.role === k).map(x => x.key).sort();
  return [k, { key: k, label: r.label, coreSkills: r.coreSkills, signature: r.signature, roleBonus: p?.system.roleBonus ?? 3, perks }];
}));

/** Flaws in d10 order (Ch 7 table / Ch 20). */
export const FLAWS = flawsPack.slice().sort((a, b) => a.system.rollValue - b.system.rollValue)
  .map(f => ({ key: f.key, name: f.name, roll: f.system.rollValue }));

/** Cross-check config.mjs against the packs; each mismatch is a data issue. */
export function dataConsistencyIssues() {
  const out = [];
  for (const [k, s] of Object.entries(SPECIES)) {
    if (!s.pack) { out.push(`species ${k}: no pack entry`); continue; }
    if (s.pack.system.speed !== s.speed) out.push(`species ${k}: speed config ${s.speed} vs pack ${s.pack.system.speed}`);
    for (const a of ATTRS) {
      if ((s.pack.system.bonuses[a] ?? 0) !== (s.bonuses[a] ?? 0)) out.push(`species ${k}: ${a} bonus config ${s.bonuses[a] ?? 0} vs pack ${s.pack.system.bonuses[a]}`);
    }
  }
  for (const [k, r] of Object.entries(ROLES)) {
    const p = rolesPack.find(x => x.system.roleKey === k);
    if (!p) { out.push(`role ${k}: no pack entry`); continue; }
    if (JSON.stringify(p.system.coreSkills) !== JSON.stringify(r.coreSkills)) out.push(`role ${k}: core skills differ`);
    if (r.perks.length !== 6) out.push(`role ${k}: ${r.perks.length} perks in pack (book lists 6)`);
  }
  if (FLAWS.length !== 10) out.push(`flaws: ${FLAWS.length} in pack (book lists 10)`);
  return out;
}

/* --------------------------------------------------------------- tables -- */

/** Ch 20 name table (2d6). */
const NAMES = { 2: "Gerald", 3: "Pebbles", 4: "Dusty", 5: "Crinkle", 6: "Jar Lid", 7: "The Architect", 8: "Filament", 9: "Nook", 10: "Cassette", 11: "Widow", 12: "Eight" };
/** Ch 20 species table (1d6). */
const SPECIES_D6 = ["jumping", "orbweaver", "wolf", "cellar", "spitting", "crab"];
/** Ch 20 role table (1d6; on a 6 roll again: 1–3 Wheelman, 4–6 Grifter). */
function rollRole(rng) {
  const r = rng.d6();
  if (r <= 5) return ["face", "ghost", "tinkerer", "bruiser", "lookout"][r - 1];
  return rng.d6() <= 3 ? "wheelman" : "grifter";
}

/** The Attributes each Role leans on (the governing Attributes of its core skills). */
export function roleAttrs(role) {
  return [...new Set(ROLES[role].coreSkills.map(s => SKILL_ATTR[s]))];
}

/* -------------------------------------------------------------- builder -- */

export const GEN_STATS = { built: 0, violations: {}, byBuild: {} };
function violation(code) {
  GEN_STATS.violations[code] = (GEN_STATS.violations[code] ?? 0) + 1;
}

/**
 * Distribute the 10 Attribute points. Every Attribute starts at 1 (the
 * minimum); the other 6 go one at a time by weight, never letting
 * base + species bonus exceed 5 (or `softCap` for generalists).
 */
function allocateAttributes(rng, species, weights, softCap = 5) {
  const bonus = SPECIES[species].bonuses;
  const base = Object.fromEntries(ATTRS.map(a => [a, 1]));
  let left = 10 - 4;
  let guard = 0;
  while (left > 0 && guard++ < 200) {
    const open = Object.fromEntries(ATTRS.map(a => {
      const cap = Math.min(5, softCap);
      return [a, base[a] + (bonus[a] ?? 0) < cap ? weights[a] : 0];
    }));
    if (!Object.values(open).some(w => w > 0)) {
      // soft cap too tight: fall back to the hard cap of 5
      softCap = 5;
      const hard = ATTRS.filter(a => base[a] + (bonus[a] ?? 0) < 5);
      if (!hard.length) break;
      base[rng.pick(hard)]++; left--; continue;
    }
    base[rng.weighted(open)]++;
    left--;
  }
  if (left > 0) violation("attributes: could not place all 10 points under the cap of 5");
  return base;
}

/**
 * Skills. `policy`:
 *  - specialist: both core skills to 3, then three more skills to 3.
 *  - generalist: core skills to 2, the rest spread at 1–2.
 *  - random:     role bonus split at random, general points one at a time.
 */
function allocateSkills(rng, role, attrs, policy) {
  const core = ROLES[role].coreSkills;
  const skills = Object.fromEntries(SKILLS.map(s => [s, 0]));
  // Role bonus: 3 points split between the two core skills, neither above 3.
  let bonus = 3;
  if (policy === "random") {
    const a = rng.int(0, 3);
    skills[core[0]] = a; skills[core[1]] = 3 - a;
  } else {
    const a = rng.int(1, 2);
    skills[core[0]] = a; skills[core[1]] = 3 - a;
  }
  bonus = 0;
  let general = 12;
  const addTo = (s, cap = 3) => {
    if (skills[s] >= cap || general <= 0) return false;
    skills[s]++; general--; return true;
  };
  const attrWeight = s => Math.pow(attrs[SKILL_ATTR[s]], 2);

  if (policy === "specialist") {
    for (const c of core) while (skills[c] < 3) addTo(c);
    // three secondary skills at 3: weighted by governing Attribute, with a nudge
    // toward Endurance (survival) and Stealth (the most-called skill).
    const pool = SKILLS.filter(s => !core.includes(s));
    const w = Object.fromEntries(pool.map(s => [s, attrWeight(s) * (s === "stealth" ? 2 : s === "endurance" ? 1.5 : 1)]));
    while (general > 0) {
      const open = Object.fromEntries(Object.entries(w).filter(([s]) => skills[s] < 3));
      if (!Object.keys(open).length) break;
      const s = rng.weighted(open);
      while (skills[s] < 3 && general > 0) addTo(s);
      delete w[s];
    }
  } else if (policy === "generalist") {
    for (const c of core) while (skills[c] < 2) addTo(c);
    let guard = 0;
    while (general > 0 && guard++ < 500) {
      const open = Object.fromEntries(SKILLS.filter(s => skills[s] < (core.includes(s) ? 3 : 2)).map(s => [s, attrWeight(s)]));
      if (!Object.keys(open).length) break;
      addTo(rng.weighted(open));
    }
  } else {
    let guard = 0;
    while (general > 0 && guard++ < 500) {
      const open = SKILLS.filter(s => skills[s] < 3);
      addTo(rng.pick(open));
    }
  }
  if (general > 0) violation("skills: could not spend all 12 general points");
  return skills;
}

/**
 * Build one spider. Options: { species, role, build, flaw, perks, name }.
 * `build` ∈ specialist | generalist | random (default: random pick of the three).
 */
export function buildSpider(rng, opts = {}) {
  const species = opts.species ?? rng.pick(SPECIES_D6);
  const role = opts.role ?? rollRole(rng);
  const build = opts.build ?? rng.pick(["specialist", "specialist", "generalist", "random"]);
  const primary = roleAttrs(role);

  let weights, softCap = 5;
  if (build === "specialist") weights = Object.fromEntries(ATTRS.map(a => [a, primary.includes(a) ? 6 : 1]));
  else if (build === "generalist") { weights = Object.fromEntries(ATTRS.map(a => [a, primary.includes(a) ? 2 : 1])); softCap = 4; }
  else weights = Object.fromEntries(ATTRS.map(a => [a, 1]));

  const base = allocateAttributes(rng, species, weights, softCap);
  const attrs = finalAttributes(base, SPECIES[species].bonuses);
  const skills = allocateSkills(rng, role, attrs, build);
  const rolePerks = ROLES[role].perks;
  const perks = opts.perks ?? rng.shuffle(rolePerks).slice(0, 2);
  const flaw = opts.flaw ?? FLAWS[rng.int(0, 9)].key;
  const name = opts.name ?? NAMES[rng.d6() + rng.d6()];

  const spider = {
    name, species, role, build, base, attrs, skills, perks, flaw,
    speed: SPECIES[species].speed,
    silkMax: attrs.wit + attrs.nerve
  };
  GEN_STATS.built++;
  GEN_STATS.byBuild[build] = (GEN_STATS.byBuild[build] ?? 0) + 1;
  for (const v of validateSpider(spider)) violation(v);
  return spider;
}

/**
 * Validate a spider against Ch 7 using the shared rules helpers.
 * @returns {string[]} the rules it breaks (empty when legal).
 */
export function validateSpider(sp) {
  const errs = [];
  if (!SPECIES[sp.species]) errs.push("unknown species");
  if (!ROLES[sp.role]) errs.push("unknown role");
  if (errs.length) return errs;
  if (attributesSpent(sp.base) !== 10) errs.push(`attributes: spent ${attributesSpent(sp.base)} of 10`);
  for (const a of ATTRS) {
    if (sp.base[a] < 1) errs.push(`attributes: ${a} below the minimum of 1`);
  }
  const fin = finalAttributes(sp.base, SPECIES[sp.species].bonuses);
  for (const a of ATTRS) {
    if (fin[a] > 5) errs.push(`attributes: ${a} ${fin[a]} above 5 including species bonus`);
    if (fin[a] !== sp.attrs[a]) errs.push(`attributes: ${a} final value mismatch`);
  }
  const core = ROLES[sp.role].coreSkills;
  const b = skillBudget(sp.skills, core);
  if (b.total !== 15) errs.push(`skills: ${b.total} points spent (12 + 3 role bonus = 15)`);
  if (b.roleBonusUsed < 3) errs.push("skills: role bonus not fully placed on core skills");
  if (b.generalSpent > b.generalMax) errs.push(`skills: ${b.generalSpent} general points (max 12)`);
  for (const s of SKILLS) {
    if ((sp.skills[s] ?? 0) > 3) errs.push(`skills: ${s} above the creation cap of 3`);
    if ((sp.skills[s] ?? 0) < 0) errs.push(`skills: ${s} negative`);
  }
  if (!Array.isArray(sp.perks) || sp.perks.length !== 2 || new Set(sp.perks).size !== 2) errs.push("perks: must be exactly 2 distinct");
  for (const p of sp.perks ?? []) if (!ROLES[sp.role].perks.includes(p)) errs.push(`perks: ${p} not on the ${sp.role} list`);
  if (!FLAWS.some(f => f.key === sp.flaw)) errs.push("flaw: must be exactly 1 from the table");
  if (sp.silkMax !== fin.wit + fin.nerve) errs.push("silk: starting Silk must be WIT + NERVE");
  if (sp.speed !== SPECIES[sp.species].speed) errs.push("speed: must come from species");
  return errs;
}

/**
 * Build a crew of `size`. `composition`:
 *  - distinct: five different Roles (a sensible table), random species.
 *  - ch20:     every spider rolled on the Ch 20 tables (duplicate Roles allowed).
 */
export function buildCrew(rng, size = 5, composition = "distinct") {
  let roles;
  if (composition === "distinct") roles = rng.shuffle(Object.keys(ROLES)).slice(0, size);
  else roles = Array.from({ length: size }, () => rollRole(rng));
  return roles.map(role => buildSpider(rng, { role }));
}
