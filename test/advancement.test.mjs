/**
 * WP-A: advancement (Ch 11 Spending AP) and the v4.8 creation tables (N23).
 *   npm test    (node --test)
 */
import test from "node:test";
import assert from "node:assert/strict";
import { advanceOptions, applyAdvance, ADVANCE_COSTS, advanceReasonLabel } from "../module/logic/advancement.mjs";
import { quickPickSkills, skillBudget, startingSilk } from "../module/logic/rules.mjs";
import { HEISTY } from "../module/config.mjs";

const snap = (o = {}) => ({
  attributes: { body: 2, wit: 5, nerve: 3, grace: 1 },
  skills: { athletics: 0, brawl: 5, endurance: 2, engineering: 3, perception: 3, tactics: 0, stealth: 2,
    deception: 0, intimidation: 0, acrobatics: 0, persuasion: 0, disguise: 0 },
  speciesBonuses: { wit: 2 },
  ap: 3,
  ownedPerkKeys: ["jury-rig", "overclock"],
  rolePerkKeys: ["jury-rig", "spider-sense-sort-of", "overclock", "field-repair", "trap-architect", "i-see-how-this-works"],
  ...o
});

test("costs per the book: Skill 1, Attribute 2, Perk 3", () => {
  assert.deepEqual({ ...ADVANCE_COSTS }, { skill: 1, attribute: 2, perk: 3 });
  assert.deepEqual(HEISTY.advancement.spend.map(s => s.cost), [1, 2, 3]);
});

test("advanceOptions: caps at 5 (Attributes include the species bonus), AP gates, owned Perks", () => {
  const opts = advanceOptions(snap());
  const get = (type, key) => opts.find(o => o.type === type && o.key === key);
  assert.equal(opts.filter(o => o.type === "skill").length, 12);
  assert.equal(opts.filter(o => o.type === "attribute").length, 4);
  assert.equal(opts.filter(o => o.type === "perk").length, 6);

  assert.deepEqual(get("skill", "brawl"), { type: "skill", key: "brawl", cost: 1, allowed: false, reason: "max", from: 5, to: 5 });
  assert.equal(get("skill", "tactics").allowed, true);
  assert.equal(get("skill", "tactics").to, 1);
  // WIT is 5 including the Orb Weaver's +2: maxed.
  assert.equal(get("attribute", "wit").reason, "max");
  assert.equal(get("attribute", "body").allowed, true);
  assert.equal(get("perk", "jury-rig").reason, "owned");
  assert.equal(get("perk", "field-repair").allowed, true);

  const poor = advanceOptions(snap({ ap: 1 }));
  assert.equal(poor.find(o => o.type === "attribute" && o.key === "body").reason, "ap");
  assert.equal(poor.find(o => o.type === "perk" && o.key === "field-repair").reason, "ap");
  assert.equal(poor.find(o => o.type === "skill" && o.key === "tactics").allowed, true);
  assert.equal(advanceReasonLabel("ap"), "Not enough AP");
  // {value} shapes (straight from actor.system) work too.
  const sys = advanceOptions({ attributes: { body: { value: 4 } }, skills: { stealth: { value: 4 } }, ap: 2 });
  assert.equal(sys.find(o => o.key === "body").to, 5);
  assert.equal(sys.find(o => o.key === "stealth").to, 5);
});

test("applyAdvance: updates and AP left; unspent AP carry over; refusals throw", () => {
  const s = applyAdvance(snap(), { type: "skill", key: "tactics" });
  assert.deepEqual(s, { updates: { "system.advancement.value": 2, "system.skills.tactics.value": 1 }, apSpent: 1, addPerk: null });
  const a = applyAdvance(snap(), { type: "attribute", key: "nerve" });
  assert.deepEqual(a.updates, { "system.advancement.value": 1, "system.attributes.nerve.value": 4 });
  const p = applyAdvance(snap(), { type: "perk", key: "field-repair" });
  assert.deepEqual(p, { updates: { "system.advancement.value": 0 }, apSpent: 3, addPerk: "field-repair" });
  assert.throws(() => applyAdvance(snap(), { type: "skill", key: "brawl" }), /Already at 5/);
  assert.throws(() => applyAdvance(snap({ ap: 2 }), { type: "perk", key: "field-repair" }), /Not enough AP/);
  assert.throws(() => applyAdvance(snap(), { type: "perk", key: "overclock" }), /Already have it/);
  assert.throws(() => applyAdvance(snap(), { type: "perk", key: "silver-tongue" }), /Unknown advance/);
});

test("raising WIT or NERVE raises the derived starting Silk (species bonus still excluded)", () => {
  const before = startingSilk({ wit: 4, nerve: 3 }, { wit: 2 });
  const after = startingSilk({ wit: 5, nerve: 3 }, { wit: 2 });
  assert.equal(after - before, 1);
});

test("v4.8 Quick Pick (N23): Face Perception 3 / Stealth 2; Tinkerer and Lookout take Endurance 2", () => {
  assert.deepEqual(HEISTY.roles.face.quickPick, { perception: 3, stealth: 2, disguise: 2, intimidation: 2 });
  assert.deepEqual(HEISTY.roles.tinkerer.quickPick, { stealth: 3, acrobatics: 2, tactics: 2, endurance: 2 });
  assert.deepEqual(HEISTY.roles.lookout.quickPick, { stealth: 3, acrobatics: 2, engineering: 2, endurance: 2 });
  const withEndurance = Object.values(HEISTY.roles).filter(r => (r.quickPick.endurance ?? 0) >= 2 || r.coreSkills.includes("endurance"));
  assert.equal(withEndurance.length, 4, "four of seven Roles start with Endurance (three packages + the Bruiser's core skill)");
  for (const [k, r] of Object.entries(HEISTY.roles)) {
    const b = skillBudget(quickPickSkills(r.coreSkills, r.quickPick), r.coreSkills);
    assert.equal(b.generalSpent, 12, k);
  }
});

test("v4.8 Silk text (§16 item 1): Clutch on your own roll, Damage Control before the round ends, NPTP on a Partial, Silk Line −1", () => {
  const t = Object.fromEntries(HEISTY.silkSpends.map(s => [s.label, s.text]));
  assert.match(t["Silk Clutch"], /on your own roll/);
  assert.match(t["Silk Clutch"], /Botch die can't be saved/);
  assert.match(t["Damage Control"], /before the round ends/);
  assert.match(t["Not Part of the Plan"], /a Partial's included/);
  assert.match(t["Silk Line"], /lowers that roll's Difficulty by 1/);
});
