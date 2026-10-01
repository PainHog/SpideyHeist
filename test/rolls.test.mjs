/**
 * WP-B pure roll logic (module/logic/rolls.mjs) — rulebook v4.8.
 *   npm test
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  ABILITY_KEYS, buildRollPlan, resolveRoll, rerollIndices, applyReroll, applyClutch,
  rollAlertTriggers, mergeAlert, cardAlertDelta, vitalityPenalty, assistPool, canReroll, canClutch,
  cardActions, strongestAttacker, fullAlertPartialCost, isFailed, isPassing
} from "../module/logic/rolls.mjs";
import { HEISTY } from "../module/config.mjs";

const calm = { value: 0, limit: 8 };
const spider = (over = {}) => ({
  kind: "skill", attr: "nerve", attrValue: 3, skill: "stealth", skillValue: 2,
  difficulty: 3, vitality: "unharmed", abilityKeys: [], alert: calm, phase: "heist", ...over
});
const part = (plan, id) => plan.diffParts.find(p => p.id === id) ?? plan.poolParts.find(p => p.id === id);
const opt = (plan, id) => plan.options.find(o => o.id === id);

/* ------------------------------------------------------------------ plan: pool */

test("pool = Attribute + Skill; an Attribute alone uses Skill 0", () => {
  assert.equal(buildRollPlan(spider()).pool, 5);
  const a = buildRollPlan({ kind: "attribute", attr: "body", attrValue: 4, difficulty: 2, alert: calm });
  assert.equal(a.pool, 4);
  assert.equal(a.difficulty, 2);
});

test("Vitality penalties; Unfazed ignores Rattled only", () => {
  assert.equal(vitalityPenalty("rattled"), -1);
  assert.equal(vitalityPenalty("rattled", ["unfazed"]), 0);
  assert.equal(vitalityPenalty("hurt", ["unfazed"]), -2);
  assert.equal(vitalityPenalty("critical"), -3);
  assert.equal(buildRollPlan(spider({ vitality: "hurt" })).pool, 3);
  assert.equal(buildRollPlan(spider({ vitality: "rattled", abilityKeys: ["unfazed"] })).pool, 5);
});

test("non-Silk bonus dice are capped at +2 together; Silk dice and Overclock are not", () => {
  const p = buildRollPlan(spider({
    bonusDice: 1,
    pending: [{ id: "a", dice: 2, label: "Assist" }, { id: "b", dice: 1, label: "Tactical Feed" }],
    silkDice: 3
  }));
  assert.equal(p.bonus.requested, 4);
  assert.equal(p.bonus.applied, 2);
  assert.equal(p.bonus.capped, true);
  assert.equal(p.silkDice, 3);
  assert.equal(p.pool, 5 + 2 + 3);
  assert.deepEqual(p.consumePending.sort(), ["a", "b"]);
  assert.ok(p.warnings.some(w => /capped/.test(w)));

  const eng = buildRollPlan(spider({ attr: "wit", skill: "engineering", abilityKeys: ["overclock"], overclock: true, bonusDice: 2, silkDice: 1 }));
  assert.equal(eng.pool, 5 + 2 + 2 + 1); // base + capped 2 + overclock 2 + silk 1
  assert.equal(eng.silkCost, 2);
  assert.deepEqual(eng.silkSpends.map(s => s.type).sort(), ["die", "overclock"]);
  // Overclock needs the Perk and an Engineering roll.
  const bad = buildRollPlan(spider({ overclock: true }));
  assert.equal(bad.overclock, false);
  assert.equal(bad.silkCost, 0);
});

test("unticking a pending bonus drops it and keeps it queued", () => {
  const p = buildRollPlan(spider({ pending: [{ id: "a", dice: 1, label: "Boost" }], toggles: { "pending:a": false } }));
  assert.equal(p.pool, 5);
  assert.deepEqual(p.consumePending, []);
  assert.equal(opt(p, "pending:a").checked, false);
});

test("pending penalties (−1 die next roll) and pending Difficulty (Bypass)", () => {
  const p = buildRollPlan(spider({ pending: [{ id: "p", dice: -1, label: "Full Alert Partial" }] }));
  assert.equal(p.pool, 4);
  assert.deepEqual(p.consumePending, ["p"]);
  const by = buildRollPlan(spider({ attr: "wit", skill: "engineering", pending: [{ id: "b", diff: -1, skills: ["engineering"], label: "Bypass" }] }));
  assert.equal(by.difficulty, 2);
  assert.deepEqual(by.consumePending, ["b"]);
  // A pending tied to another Skill is ignored and stays queued.
  const no = buildRollPlan(spider({ pending: [{ id: "b", diff: -1, skills: ["engineering"], label: "Bypass" }] }));
  assert.equal(no.difficulty, 3);
  assert.deepEqual(no.consumePending, []);
});

test("Silk dice are limited by SP on hand; Improvise and Overclock must be affordable", () => {
  const p = buildRollPlan(spider({ silkDice: 5, silkAvailable: 2 }));
  assert.equal(p.silkDice, 2);
  assert.equal(p.silkCost, 2);
  assert.equal(p.valid, true);
  const imp = buildRollPlan(spider({ improvise: true, silkDice: 2, silkAvailable: 3 }));
  assert.equal(imp.silkDice, 1);
  assert.equal(imp.silkCost, 3);
  const broke = buildRollPlan(spider({ improvise: true, silkAvailable: 1 }));
  assert.equal(broke.valid, false);
});

test("Improvise: +1 Difficulty, 2 SP, rolled with the new Skill's Attribute (E20)", () => {
  // Called for Athletics (BODY); the spider improvises with Engineering (WIT).
  const p = buildRollPlan(spider({ attr: "wit", attrValue: 4, skill: "engineering", skillValue: 3, calledSkill: "athletics", improvise: true, difficulty: 2 }));
  assert.equal(p.pool, 7);
  assert.equal(p.difficulty, 3);
  assert.equal(p.silkCost, 2);
  assert.equal(part(p, "improvise").value, 1);
});

test("Botch at a pool of 0 or less", () => {
  assert.equal(buildRollPlan(spider({ attrValue: 1, skillValue: 0, vitality: "rattled" })).botch, true);
  assert.equal(buildRollPlan(spider({ attrValue: 1, skillValue: 1, vitality: "critical" })).pool, -1);
  assert.equal(buildRollPlan(spider({ attrValue: 1, skillValue: 0 })).botch, false);
});

test("Assist pool: one Skill, min 1, max 3, plus own Silk outside the max (N21)", () => {
  assert.equal(assistPool(0), 1);
  assert.equal(assistPool(2), 2);
  assert.equal(assistPool(5), 3);
  assert.equal(assistPool(5, { silkDice: 2 }), 5);
  assert.equal(assistPool(3, { vitalityPenalty: -1 }), 2);
  const p = buildRollPlan({ kind: "assist", skill: "brawl", skillValue: 4, silkDice: 2, bonusDice: 2, vitality: "unharmed", alert: calm });
  assert.equal(p.pool, 5);
  assert.equal(p.difficulty, null);
  assert.equal(p.bonus.applied, 0); // an Assist isn't itself assisted
  assert.equal(p.botch, false);
});

/* ------------------------------------------------------------------ plan: Difficulty */

test("Alert band: Stealth +1 at Stirring/Active, +2 at Lockdown; all +1 at Lockdown", () => {
  assert.equal(buildRollPlan(spider({ alert: { value: 3, limit: 8 } })).difficulty, 4);
  assert.equal(buildRollPlan(spider({ alert: { value: 5, limit: 8 } })).difficulty, 4);
  assert.equal(buildRollPlan(spider({ alert: { value: 7, limit: 8 } })).difficulty, 5);
  assert.equal(buildRollPlan(spider({ skill: "athletics", alert: { value: 5, limit: 8 } })).difficulty, 3);
  assert.equal(buildRollPlan(spider({ skill: "athletics", alert: { value: 7, limit: 8 } })).difficulty, 4);
  // Full Alert at a low Limit brings the Lockdown penalties.
  const fa = buildRollPlan(spider({ alert: { value: 4, limit: 4 } }));
  assert.equal(fa.difficulty, 5);
  assert.equal(fa.fullAlert, true);
  // Untick it.
  assert.equal(buildRollPlan(spider({ alert: { value: 7, limit: 8 }, toggles: { alert: false } })).difficulty, 3);
  // Planning: the Alert is off.
  assert.equal(buildRollPlan(spider({ phase: "planning", alert: { value: 7, limit: 8 } })).difficulty, 3);
});

test("cover −2 on Stealth only, and gone when a complication removes cover", () => {
  assert.equal(buildRollPlan(spider({ context: { cover: true } })).difficulty, 1);
  assert.equal(opt(buildRollPlan(spider({ skill: "athletics", context: { cover: true } })), "cover"), undefined);
  const nc = buildRollPlan(spider({ context: { cover: true }, effects: [{ id: "c5", kind: "noCover", label: "Complication 5" }] }));
  assert.equal(nc.difficulty, 3);
  assert.equal(opt(nc, "cover"), undefined);
});

test("Height +1 on Acrobatics; Don't Look Down removes it", () => {
  const acro = { attr: "grace", skill: "acrobatics", context: { tags: ["height"] } };
  assert.equal(buildRollPlan(spider(acro)).difficulty, 4);
  assert.equal(buildRollPlan(spider({ ...acro, abilityKeys: ["dont-look-down"] })).difficulty, 3);
  assert.equal(buildRollPlan(spider({ ...acro, context: {} })).difficulty, 3);
});

test("Soundless −1 moving; Loud +1 at 5+; Arachnophobe +1 vs a human; Crab −2; I Was Never Here −2", () => {
  assert.equal(buildRollPlan(spider({ abilityKeys: ["soundless"] })).difficulty, 2);
  assert.equal(buildRollPlan(spider({ abilityKeys: ["soundless"], context: { moving: false } })).difficulty, 3);
  assert.equal(buildRollPlan(spider({ abilityKeys: ["loud"], alert: { value: 4, limit: 8 } })).difficulty, 4); // Stirring +1 only
  assert.equal(buildRollPlan(spider({ abilityKeys: ["loud"], alert: { value: 5, limit: 8 } })).difficulty, 5);
  assert.equal(buildRollPlan(spider({ abilityKeys: ["arachnophobe-magnet"] })).difficulty, 3);
  assert.equal(buildRollPlan(spider({ abilityKeys: ["arachnophobe-magnet"], context: { tags: ["human"] } })).difficulty, 4);
  assert.equal(buildRollPlan(spider({ abilityKeys: ["arachnophobe-magnet"], humanRow: { difficulty: 2, label: "Sleeping" } })).difficulty, 3);
  assert.equal(buildRollPlan(spider({ abilityKeys: ["species:crab"], context: { camouflaged: true } })).difficulty, 1);
  assert.equal(buildRollPlan(spider({ abilityKeys: ["i-was-never-here"], context: { forget: true } })).difficulty, 1);
  assert.equal(buildRollPlan(spider({ abilityKeys: ["i-was-never-here"] })).difficulty, 3);
});

test("Show-Off: Difficulty 4, or +1 if already 4+; Alert still on top (E13)", () => {
  assert.equal(buildRollPlan(spider({ skill: "athletics", difficulty: 2, abilityKeys: ["show-off"], context: { showOffArmed: true } })).difficulty, 4);
  assert.equal(buildRollPlan(spider({ skill: "athletics", difficulty: 4, abilityKeys: ["show-off"], context: { showOffArmed: true } })).difficulty, 5);
  const p = buildRollPlan(spider({ difficulty: 2, abilityKeys: ["show-off"], context: { showOffArmed: true }, alert: { value: 7, limit: 8 } }));
  assert.equal(p.difficulty, 6);
  assert.equal(p.showOff, true);
  assert.equal(buildRollPlan(spider({ difficulty: 2, abilityKeys: ["show-off"] })).difficulty, 2); // not armed
});

test("opposed: the creature's Successes + 1, then modifiers; humans use their row", () => {
  assert.equal(buildRollPlan(spider({ opposed: { successes: 2 } })).difficulty, 3);
  assert.equal(buildRollPlan(spider({ opposed: { successes: 0 }, alert: { value: 3, limit: 8 } })).difficulty, 2);
  assert.equal(buildRollPlan(spider({ opposed: { successes: 3 }, context: { cover: true } })).difficulty, 2);
  assert.equal(buildRollPlan(spider({ humanRow: { difficulty: 4, label: "Alert" }, difficulty: 2 })).difficulty, 4);
});

test("minimum Difficulty 1", () => {
  const p = buildRollPlan(spider({ difficulty: 1, context: { cover: true }, modifier: -1 }));
  assert.equal(p.difficulty, 1);
  assert.ok(part(p, "minimum"));
});

test("Silk Line, escape effects, heist effects", () => {
  assert.equal(buildRollPlan(spider({ skill: "athletics", context: { silkLinePrepared: true } })).difficulty, 2);
  assert.equal(buildRollPlan(spider({ phase: "escape", effects: [{ id: "ikaw", kind: "escapeDiff", value: -1, label: "I Know a Way" }] })).difficulty, 2);
  assert.equal(buildRollPlan(spider({ phase: "heist", effects: [{ id: "ikaw", kind: "escapeDiff", value: -1, label: "I Know a Way" }] })).difficulty, 3);
  assert.equal(buildRollPlan(spider({ effects: [{ id: "c3", kind: "diff", value: 1, skills: ["stealth"], label: "Complication 3" }] })).difficulty, 4);
  assert.equal(buildRollPlan(spider({ skill: "athletics", effects: [{ id: "c3", kind: "diff", value: 1, skills: ["stealth"], label: "Complication 3" }] })).difficulty, 3);
  assert.equal(buildRollPlan(spider({ effects: [{ id: "mas", kind: "dice", value: 2, label: "Make a Scene" }] })).pool, 7);
});

test("Method Actor, The Long Con, Drafting, Negotiating Position are offered and capped", () => {
  const p = buildRollPlan(spider({ skill: "deception", abilityKeys: ["method-actor", "the-long-con"], context: { vsMethodTarget: true, usingIdentity: true } }));
  assert.equal(p.bonus.requested, 3);
  assert.equal(p.bonus.applied, 2);
  const d = buildRollPlan(spider({ skill: "athletics", context: { drafting: true } }));
  assert.equal(d.pool, 6);
  assert.equal(opt(buildRollPlan(spider({ skill: "persuasion", attr: "grace", abilityKeys: ["sig:face"], crewKeys: ["negotiating-position"] })), "negotiating").checked, false);
});

test("Casing in Planning for Perception/Tactics", () => {
  assert.equal(buildRollPlan(spider({ phase: "planning", attr: "wit", skill: "perception" })).casing, true);
  assert.equal(buildRollPlan(spider({ phase: "planning" })).casing, false);
  assert.ok(buildRollPlan(spider({ phase: "score" })).warnings.some(w => /Score/.test(w)));
});

/* ------------------------------------------------------------------ resolution */

test("resolveRoll: 5–6 Successes, half-Difficulty Partials, 2× Critical, Botch die", () => {
  assert.deepEqual(resolveRoll([5, 6, 1], 2), { successes: 2, result: "success" });
  assert.deepEqual(resolveRoll([5, 4, 4, 1], 3), { successes: 1, result: "failure" });
  assert.deepEqual(resolveRoll([5, 6, 4], 3), { successes: 2, result: "partial" });
  assert.deepEqual(resolveRoll([5, 6, 5, 6, 5, 6], 3), { successes: 6, result: "critical" });
  assert.deepEqual(resolveRoll([5], 1), { successes: 1, result: "success" });
  assert.deepEqual(resolveRoll([3], 3, { botch: true }), { successes: 0, result: "botch" });
  assert.deepEqual(resolveRoll([6], 3, { botch: true }), { successes: 0, result: "cleanfail" });
  assert.equal(isFailed("cleanfail"), true);
  assert.equal(isPassing("partial"), true);
  assert.equal(isFailed("partial"), false);
});

test("rerollIndices: only non-Successes, lowest first, at most 3 (Silk) or all (Wolf)", () => {
  assert.deepEqual(rerollIndices([5, 1, 4, 6, 2, 3]), [1, 4, 5]);
  assert.deepEqual(rerollIndices([5, 1, 4, 6, 2, 3], Infinity), [1, 2, 4, 5]);
  assert.deepEqual(rerollIndices([5, 6]), []);
});

test("applyReroll keeps every Success and never rerolls one", () => {
  const faces = [5, 1, 4, 6, 2];
  const idx = rerollIndices(faces);
  const out = applyReroll(faces, idx, [6, 3, 5]);
  assert.deepEqual(idx, [1, 2, 4]);
  assert.deepEqual(out, [5, 6, 3, 6, 5]);
  assert.equal(out.filter(f => f >= 5).length >= faces.filter(f => f >= 5).length, true);
  assert.throws(() => applyReroll(faces, [0], [1]));
  assert.throws(() => applyReroll(faces, [1, 2], [1]));
});

const card = (result, over = {}) => ({
  kind: "check",
  roll: { skill: "stealth", difficulty: 3, faces: [1, 2, 4], result, botch: false, rerolls: [], ...over.roll },
  consequences: { status: "pending", ...over.consequences },
  alert: { triggers: [], cancels: [] },
  ...over.card
});

test("Silk Clutch only on a Failure — never a Partial, Botch or clean failure", () => {
  const c = applyClutch(card("failure", { consequences: { caught: true } }));
  assert.equal(c.roll.result, "success");
  assert.equal(c.roll.clutched, true);
  assert.equal(c.consequences.caught, false);
  assert.throws(() => applyClutch(card("partial")));
  assert.throws(() => applyClutch(card("botch", { roll: { botch: true } })));
  assert.throws(() => applyClutch(card("cleanfail", { roll: { botch: true } })));
  assert.throws(() => applyClutch(c));
  assert.equal(canClutch(card("failure")), true);
  assert.equal(canClutch(card("cleanfail", { roll: { botch: true } })), false);
  assert.equal(canClutch(card("failure", { consequences: { status: "final" } })), false);
});

test("canReroll: Silk on anything but a Critical; Wolf on a physical Failure/Partial once; Silver Tongue on failed Persuasion once", () => {
  assert.equal(canReroll(card("failure"), "silk"), true);
  assert.equal(canReroll(card("success"), "silk"), true);
  assert.equal(canReroll(card("critical", { roll: { faces: [5, 6, 5, 6, 5, 6, 1] } }), "silk"), false);
  assert.equal(canReroll(card("botch", { roll: { botch: true } }), "silk"), false);
  assert.equal(canReroll(card("failure", { roll: { faces: [5, 6] } }), "silk"), false); // nothing to reroll
  assert.equal(canReroll(card("failure", { roll: { physical: true } }), "wolf"), true);
  assert.equal(canReroll(card("failure"), "wolf"), false);
  assert.equal(canReroll(card("success", { roll: { physical: true } }), "wolf"), false);
  assert.equal(canReroll(card("partial", { roll: { physical: true, rerolls: [{ by: "wolf" }] } }), "wolf"), false);
  assert.equal(canReroll(card("failure", { roll: { skill: "persuasion" } }), "silverTongue"), true);
  assert.equal(canReroll(card("partial", { roll: { skill: "persuasion" } }), "silverTongue"), false);
  assert.equal(canReroll(card("failure", { roll: { skill: "persuasion", rerolls: [{ by: "silverTongue" }] } }), "silverTongue"), false);
});

/* ------------------------------------------------------------------ Alert triggers */

const trig = (c, ctx = {}) => rollAlertTriggers(c, { alertState: HEISTY.getAlertState(ctx.value ?? 2, 8), phase: ctx.phase ?? "heist", abilityKeys: ctx.keys ?? [] });
const keysOf = r => r.triggers.map(t => `${t.key}:${t.delta}`);

test("triggers: Failure +1, clean failure +1 (v4.8), Partial +1, Botch +2, Success 0", () => {
  assert.deepEqual(keysOf(trig(card("failure"))), ["failure:1"]);
  assert.deepEqual(keysOf(trig(card("cleanfail", { roll: { botch: true } }))), ["failure:1"]);
  assert.deepEqual(keysOf(trig(card("partial"))), ["partial:1"]);
  assert.deepEqual(keysOf(trig(card("botch", { roll: { botch: true } }))), ["botch:2"]);
  assert.deepEqual(keysOf(trig(card("success"))), []);
});

test("Critical −1 only at final Difficulty 3+ and never at Full Alert", () => {
  assert.deepEqual(keysOf(trig(card("critical", { roll: { difficulty: 3 } }))), ["critical:-1"]);
  assert.deepEqual(keysOf(trig(card("critical", { roll: { difficulty: 2 } }))), []);
  assert.deepEqual(keysOf(trig(card("critical", { roll: { difficulty: 4 } }), { value: 8 })), []);
});

test("Full Alert: a Partial costs no Alert (it costs a hit or −1 die); a Failure still lists +1", () => {
  assert.deepEqual(keysOf(trig(card("partial"), { value: 8 })), []);
  assert.deepEqual(keysOf(trig(card("failure"), { value: 8 })), ["failure:1"]);
  assert.equal(fullAlertPartialCost([]), "penalty");
  assert.equal(fullAlertPartialCost([{ pool: 3 }]), "hit");
  assert.deepEqual(strongestAttacker([{ name: "cat", pool: 4 }, { name: "dog", pool: 5 }, { name: "x", pool: 5 }]), { name: "dog", pool: 5 });
  assert.equal(strongestAttacker([]), null);
});

test("Clutch replaces the Failure with +1; Smoke and Mirrors cancels a failed Deception", () => {
  const c = applyClutch(card("failure"));
  assert.deepEqual(keysOf(trig(c)), ["clutch:1"]);
  const sm = trig(card("failure", { roll: { skill: "deception" } }), { keys: ["smoke-and-mirrors"] });
  assert.deepEqual(sm.cancels.map(x => x.key), ["smokeAndMirrors"]);
  assert.equal(trig(card("failure", { roll: { skill: "stealth" } }), { keys: ["smoke-and-mirrors"] }).cancels.length, 0);
  assert.equal(trig(card("partial", { roll: { skill: "deception" } }), { keys: ["smoke-and-mirrors"] }).cancels.length, 0);
});

test("fights: landed +1, lost +2 (Loud Failure); alertOnUse adds the approach's noise", () => {
  assert.deepEqual(keysOf(trig(card("success", { roll: { fight: true, skill: "brawl" } }))), ["fightLanded:1"]);
  assert.deepEqual(keysOf(trig(card("partial", { roll: { fight: true } }))), ["partial:1", "fightLanded:1"]);
  assert.deepEqual(keysOf(trig(card("failure", { roll: { fight: true } }))), ["failure:1", "loud:2"]);
  assert.deepEqual(keysOf(trig(card("success", { roll: { alertOnUse: 1 } }))), ["approach:1"]);
  assert.equal(cardAlertDelta(trig(card("failure", { roll: { fight: true } }))), 2);
});

test("pass-or-fail checks: a Partial passes free; noAlert rolls add nothing", () => {
  assert.deepEqual(keysOf(trig(card("partial", { roll: { passFail: true } }))), []);
  assert.deepEqual(keysOf(trig(card("failure", { roll: { passFail: true } }))), ["failure:1"]);
  assert.deepEqual(trig(card("failure", { roll: { noAlert: true } })), { triggers: [], cancels: [] });
});

test("no Alert in Planning or the Score; Contingency cancels everything", () => {
  assert.deepEqual(trig(card("failure"), { phase: "planning" }), { triggers: [], cancels: [] });
  assert.deepEqual(trig(card("failure", { roll: { contingency: true } })).cancels.map(c => c.key), ["contingency"]);
});

test("Partial swap / No consequence drop the default trigger and cancel when nothing remains", () => {
  const sw = trig(card("partial", { consequences: { swap: { kind: "penalty" } } }));
  assert.deepEqual(sw.triggers, []);
  assert.deepEqual(sw.cancels.map(c => c.key), ["swapped"]);
  const loudSwap = trig(card("partial", { roll: { alertOnUse: 1 }, consequences: { swap: { kind: "penalty" } } }));
  assert.deepEqual(keysOf(loudSwap), ["approach:1"]);
  assert.deepEqual(loudSwap.cancels, []);
  const nc = trig(card("failure", { consequences: { noConsequence: true } }));
  assert.deepEqual(nc.cancels.map(c => c.key), ["noConsequence"]);
});

test("mergeAlert keeps GM and reaction entries; cardAlertDelta takes the largest", () => {
  const prev = { triggers: [{ key: "failure", delta: 1, src: "roll" }, { key: "spotted", delta: 1, src: "gm" }], cancels: [{ key: "abortAbort", src: "reaction" }] };
  const merged = mergeAlert(prev, { triggers: [{ key: "partial", delta: 1, src: "roll" }], cancels: [] });
  assert.deepEqual(merged.triggers.map(t => t.key), ["partial", "spotted"]);
  assert.deepEqual(merged.cancels.map(c => c.key), ["abortAbort"]);
  assert.equal(cardAlertDelta(merged), 0);
  assert.equal(cardAlertDelta({ triggers: [{ delta: 1 }, { delta: 2 }], cancels: [] }), 2);
  assert.equal(cardAlertDelta({ triggers: [{ delta: -1 }], cancels: [] }), -1);
  assert.equal(cardAlertDelta({ triggers: [{ delta: 1 }, { delta: -1 }], cancels: [] }), 1);
});

/* ------------------------------------------------------------------ buttons */

test("cardActions: owner gets Reroll/Clutch/Accept; GM gets triggers, swaps and hit", () => {
  const acts = c => c.map(a => a.action + (a.value ? `:${a.value}` : ""));
  const fail = card("failure", { roll: { physical: true } });
  fail.alert = trig(fail);
  const owner = cardActions(fail, { isOwner: true, silk: 5, abilityKeys: ["species:wolf"] });
  assert.deepEqual(acts(owner), ["reroll", "clutch", "wolf", "accept"]);
  const poor = cardActions(fail, { isOwner: true, silk: 2 });
  assert.equal(poor.find(a => a.action === "clutch").disabled, true);
  const used = cardActions(fail, { isOwner: true, silk: 5, abilityKeys: ["species:wolf"], available: { "species:wolf": false } });
  assert.ok(!acts(used).includes("wolf"));
  const gm = cardActions(fail, { isGM: true, alertMode: "auto" });
  assert.ok(acts(gm).includes("trigger:spotted") && acts(gm).includes("noConsequence") && acts(gm).includes("hit") && acts(gm).includes("spectacular"));
  const manual = cardActions(fail, { isGM: true, alertMode: "manual" });
  assert.ok(!acts(manual).includes("trigger:spotted"));
  const partial = card("partial");
  partial.alert = trig(partial);
  assert.ok(acts(cardActions(partial, { isGM: true })).includes("swap:penalty"));
  // Final cards offer no rerolls.
  assert.deepEqual(acts(cardActions(card("failure", { consequences: { status: "final" } }), { isOwner: true, silk: 9 })), []);
});

test("cardActions: crew reactions follow their limits", () => {
  const fail = card("failure");
  fail.alert = trig(fail);
  const face = { actorId: "f", name: "Fen", keys: ["sig:face", "plausible-deniability"], silk: 3 };
  const wheel = { actorId: "w", name: "Wiz", keys: ["abort-abort"], silk: 0 };
  const a = cardActions(fail, { crew: [face, wheel] }).map(x => x.value);
  assert.deepEqual(a, ["thatsNotWhatHappened", "plausibleDeniability", "abortAbort"]);
  // A +2 event: Plausible Deniability can't touch it.
  const botch = card("botch", { roll: { botch: true } });
  botch.alert = trig(botch);
  assert.deepEqual(cardActions(botch, { crew: [face] }).map(x => x.value), ["thatsNotWhatHappened"]);
  // Already cancelled: nothing more to cancel.
  fail.alert.cancels.push({ key: "abortAbort", src: "reaction" });
  assert.deepEqual(cardActions(fail, { crew: [face, wheel] }), []);
});

test("every ability key the roll plan reads is a slug or a species/sig key", () => {
  for (const k of Object.values(ABILITY_KEYS)) assert.match(k, /^(species:|sig:)?[a-z][a-z-]*$/);
});

/* ------------------------------------------------------------------ consequences */

import { recomputeCheckCard } from "../module/logic/rolls.mjs";
import { applyPatch, diffPatch, checkCardData, alertLine, PATCHABLE } from "../module/chat/card-flags.mjs";

const cat = { uuid: "Actor.cat", index: 2, name: "House Cat", label: "Pounce", pool: 4 };
const dog = { uuid: "Actor.dog", index: 1, name: "House Dog", label: "Chase", pool: 5 };
const live = (result, ctx = {}, roll = {}, cons = {}) => recomputeCheckCard({
  kind: "check", version: 0,
  roll: { skill: "stealth", difficulty: 3, faces: [1, 2, 4], result, botch: false, rerolls: [], ...roll },
  alert: { triggers: [], cancels: [] },
  consequences: { status: "pending", ...cons },
  ctx: { engaged: [], autoHits: "prompt", phase: "heist", fullAlert: false, alertState: { atLimit: false }, abilityKeys: [], ...ctx }
});

test("a Failure seen by engaged threats: the biggest attack lands (auto) or the GM picks (prompt)", () => {
  const auto = live("failure", { engaged: [cat, dog], autoHits: "auto" });
  assert.equal(auto.consequences.hit.name, "House Dog");
  const prompt = live("failure", { engaged: [cat, dog] });
  assert.equal(prompt.consequences.hit, null);
  assert.equal(prompt.consequences.candidates.length, 2);
  assert.equal(live("failure", { engaged: [cat], autoHits: "off" }).consequences.hit, null);
  assert.equal(live("partial", { engaged: [cat], autoHits: "auto" }).consequences.hit, null); // a Partial isn't a failed roll
});

test("a hazard's Failure is the hit, rolled with its Difficulty", () => {
  const c = live("failure", {}, { hazard: { difficulty: 3, label: "The broom" } });
  assert.equal(c.consequences.hit.pool, 3);
  assert.equal(c.consequences.hit.hazard, true);
  assert.equal(live("partial", {}, { hazard: { difficulty: 3 } }).consequences.hit, null);
});

test("Full Alert Partial: a hit from an engaged threat, otherwise −1 die; no Alert", () => {
  const fa = { fullAlert: true, alertState: { atLimit: true } };
  const withCat = live("partial", { ...fa, engaged: [cat] });
  assert.equal(withCat.consequences.partialCost, "hit");
  assert.equal(withCat.consequences.hit.name, "House Cat");
  assert.deepEqual(withCat.alert.triggers, []);
  const alone = live("partial", fa);
  assert.equal(alone.consequences.partialCost, "penalty");
  assert.equal(alone.consequences.hit, null);
});

test("Full Alert Escape: a Failure is caught once final; a Clutch or reroll to a pass voids it", () => {
  const fa = { fullAlert: true, alertState: { atLimit: true }, phase: "escape" };
  const c = live("failure", fa);
  assert.equal(c.consequences.caught, true);
  assert.equal(live("cleanfail", fa, { botch: true }).consequences.caught, true);
  assert.equal(live("partial", fa).consequences.caught, false);
  const clutched = recomputeCheckCard(applyClutch(c));
  assert.equal(clutched.consequences.caught, false);
  assert.deepEqual(clutched.alert.triggers.map(t => t.key), ["clutch"]);
  assert.equal(live("failure", { ...fa, phase: "heist" }).consequences.caught, false);
  assert.equal(live("failure", { ...fa, autoCapture: false }).consequences.caught, false);
});

test("a final card's consequences don't move; GM triggers survive a recompute", () => {
  const c = live("failure", { engaged: [cat], autoHits: "auto" });
  c.consequences.status = "final";
  c.roll.result = "success";
  assert.equal(recomputeCheckCard(c).consequences.hit.name, "House Cat");
  const g = live("failure");
  g.alert.triggers.push({ key: "spotted", delta: 1, src: "gm" });
  g.roll.result = "partial";
  assert.deepEqual(recomputeCheckCard(g).alert.triggers.map(t => t.key), ["partial", "spotted"]);
});

test("Partial swaps: −1 die / a hit replace the +1", () => {
  const sw = live("partial", {}, {}, { swap: { kind: "penalty", text: "−1 die" } });
  assert.deepEqual(sw.alert.triggers, []);
  assert.deepEqual(sw.alert.cancels.map(c => c.key), ["swapped"]);
  const hit = live("partial", {}, {}, { swap: { kind: "hit" }, hit: { ...cat, manual: true } });
  assert.equal(hit.consequences.hit.name, "House Cat");
});

test("card.patch: whitelisted fields only, optimistic version", () => {
  const card = { kind: "check", version: 3, actorUuid: "Actor.a", roll: { result: "failure" }, alert: { triggers: [], cancels: [] } };
  const next = applyPatch(card, { roll: { result: "success" } }, 3);
  assert.equal(next.version, 4);
  assert.equal(next.roll.result, "success");
  assert.equal(card.roll.result, "failure"); // untouched
  assert.throws(() => applyPatch(card, { roll: {} }, 2), /changed/);
  assert.throws(() => applyPatch(card, { actorUuid: "Actor.b" }, 3), /can't be patched/);
  assert.deepEqual(Object.keys(diffPatch(card, next)), ["roll"]);
  assert.ok(PATCHABLE.shrug.includes("shrug"));
});

test("card template data: alert line, Clutch, consequences", () => {
  const c = live("failure", { engaged: [cat], autoHits: "auto" });
  c.actorName = "Pip";
  const d = checkCardData(c);
  assert.match(d.alertLine.text, /Alert \+1/);
  assert.ok(d.consequences.some(x => /House Cat/.test(x.text)));
  assert.equal(d.faces.length, 3);
  const cl = checkCardData(recomputeCheckCard(applyClutch(live("failure"))));
  assert.equal(cl.resultLabel, "Success (Clutched)");
  assert.match(cl.alertLine.text, /Silk Clutch/);
  assert.match(alertLine({ roll: { result: "failure" }, alert: { triggers: [{ delta: 1 }], cancels: [{ key: "abortAbort" }] } }).text, /Abort, Abort/);
  assert.match(alertLine({ roll: { result: "failure" }, alertMode: "manual", alert: { triggers: [{ delta: 1, label: "Failure" }], cancels: [] } }).text, /Suggested Alert \+1/);
});
