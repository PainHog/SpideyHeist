/**
 * Creature automation (WP-C, design §3.7 + §16 #5–8): every row of the table.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import {
  CREATURE_AUTOMATION, resolveCreatureKey, creatureStatus, escalationEvents, perRoundDelta,
  newCreatureState, driveOff, shutIn, payOff, beat, backupState, dealGoesBad, spotted,
  engagedAttackers, isEngaged, canCallExterminator, creatureDef
} from "../module/logic/creatures.mjs";

const D = k => CREATURE_AUTOMATION[k];
const st = (p = {}) => newCreatureState(p);

test("every automated creature is in the creature pack", () => {
  const keys = readdirSync(new URL("../packs/_source/creatures/", import.meta.url)).map(f => f.replace(/\.json$/, ""));
  for (const k of Object.keys(CREATURE_AUTOMATION)) assert.ok(keys.includes(k), `${k} in packs/_source/creatures`);
  for (const k of keys) assert.ok(CREATURE_AUTOMATION[k], `${k} has automation`);
});

test("resolveCreatureKey: names, aliases and keys", () => {
  assert.equal(resolveCreatureKey("The Rat"), "protection-rat");
  assert.equal(resolveCreatureKey("House Cat"), "house-cat");
  assert.equal(resolveCreatureKey("guard-spider"), "guard-spider");
  assert.equal(resolveCreatureKey("Guard Spider (backup)"), "guard-spider");
  assert.equal(resolveCreatureKey("The Exterminator"), "the-exterminator");
  assert.equal(resolveCreatureKey("A Moth"), null);
});

test("creatureDef: a threat's automation fields override the table", () => {
  const d = creatureDef("house-cat", { perRound: 2, wakeAt: null, huntAt: 5, roams: "" });
  assert.equal(d.perRound, 2);
  assert.equal(d.wakeAt, 3);
  assert.equal(d.huntAt, 5);
  assert.equal(d.roams, "active");
});

test("House Cat: wakes and roams at 3, hunts at 7; activation is permanent", () => {
  const cat = D("house-cat");
  assert.equal(creatureStatus(cat, st(), 2).active, false);
  const s3 = creatureStatus(cat, st(), 3);
  assert.equal(s3.active, true);
  assert.equal(s3.roams, true);
  assert.equal(s3.hunting, false);
  const ev = escalationEvents(cat, st(), 2, 3, false);
  assert.equal(ev.patch.active, true);
  assert.deepEqual(ev.steps.map(s => s.at), [3]);
  // A Critical pulls the Alert back to 2: it stays awake.
  assert.equal(creatureStatus(cat, st({ active: true }), 2).active, true);
  assert.equal(creatureStatus(cat, st({ active: true }), 7).hunting, true);
  assert.equal(perRoundDelta(cat, st({ active: true }), { here: false, alert: 3 }), 1, "roams once awake");
  assert.equal(perRoundDelta(cat, st(), { here: true, alert: 2 }), 0, "asleep");
});

test("Full Alert counts as every Escalation step at once (E43)", () => {
  const cat = D("house-cat");
  const ev = escalationEvents(cat, st(), 0, 4, true);
  assert.deepEqual(ev.steps.map(s => s.at), [3, 5, 7]);
  assert.equal(ev.patch.active, true);
  assert.equal(ev.patch.hunting, true);
  assert.equal(creatureStatus(cat, st(), 4, true).hunting, true, "Limit 4: straight from asleep to hunting");
  const human = escalationEvents(D("human"), st(), 0, 6, true);
  assert.deepEqual(human.steps.map(s => s.at), [5, 7], "a human is up at Full Alert");
});

test("+X counts in the round the obstacle is cleared; driven off after that", () => {
  const cat = D("house-cat");
  const off = driveOff(st({ active: true }), 4, 10);
  assert.equal(perRoundDelta(cat, off, { here: true, obstacleSerial: 4, roundSerial: 10, alert: 3 }), 1, "the clearing round counts");
  assert.equal(perRoundDelta(cat, off, { here: true, obstacleSerial: 4, roundSerial: 11, alert: 3 }), 0, "backs off for the rest of that obstacle");
  assert.equal(perRoundDelta(cat, off, { here: false, obstacleSerial: 5, roundSerial: 12, alert: 3 }), 1, "a roamer is back at the next one, sulking");
});

test("suppression (Decoy, Fast Talk, …) stops the +X until its round", () => {
  const cat = D("house-cat");
  const s = st({ active: true, suppressedUntilRound: 6 });
  assert.equal(perRoundDelta(cat, s, { here: true, roundSerial: 6, alert: 3 }), 0);
  assert.equal(perRoundDelta(cat, s, { here: true, roundSerial: 7, alert: 3 }), 1);
});

test("House Dog: +2 a round once active (smells at 2); barks +2 once, the first time the Alert reaches 4", () => {
  const dog = D("house-dog");
  assert.equal(perRoundDelta(dog, st(), { here: true, alert: 1 }), 0);
  assert.equal(perRoundDelta(dog, st(), { here: false, alert: 2 }), 2);
  const e1 = escalationEvents(dog, st({ active: true }), 3, 4, false);
  assert.deepEqual(e1.spikes.map(s => [s.key, s.delta]), [["bark", 2]]);
  const after = { ...st({ active: true }), ...e1.patch };
  assert.equal(escalationEvents(dog, after, 3, 6, false).spikes.length, 0, "once");
});

test("Vacuum: +1 only in pursuit", () => {
  const v = D("vacuum");
  assert.equal(perRoundDelta(v, st(), { here: true, alert: 9 }), 0);
  assert.equal(perRoundDelta(v, st({ pursuit: true }), { here: true, alert: 0 }), 1);
  assert.equal(v.fearOfVacuums, true);
});

test("Curious Child: no +X; capture is +3; attack Capture 3", () => {
  const c = D("curious-child");
  assert.equal(perRoundDelta(c, st(), { here: true, alert: 9 }), 0);
  assert.equal(c.captureAlert, 3);
  assert.equal(c.attack.pool, 3);
  assert.equal(creatureStatus(c, st(), 0).active, true, "present");
});

test("Guard Spider: aware on being spotted (+1 is the spot itself), +1 a round, follows the crew", () => {
  const g = D("guard-spider");
  assert.equal(perRoundDelta(g, st(), { here: true, alert: 7 }), 0, "not aware: nothing");
  const sp = spotted(g, st());
  assert.deepEqual([sp.trigger.key, sp.trigger.delta], ["spotted", 1]);
  assert.equal(spotted(g, sp.st).trigger, null, "only the first spot");
  assert.equal(perRoundDelta(g, sp.st, { here: false, alert: 0 }), 1, "follows the crew");
});

test("Guard Spider paid off: no +X for the rest of the heist", () => {
  const g = D("guard-spider");
  const paid = payOff(st({ aware: true }));
  assert.equal(perRoundDelta(g, paid, { here: true, alert: 9, fullAlert: true }), 0);
  assert.equal(creatureStatus(g, paid, 9).canAttack, false);
});

test("Guard Spider beaten: out of the heist; its backup holds the post and never follows", () => {
  const g = D("guard-spider");
  const r = beat(g, st({ aware: true }), 3, 9);
  assert.equal(r.backup, true);
  assert.equal(r.st.beaten, true);
  assert.equal(perRoundDelta(g, r.st, { here: true, alert: 5 }), 0);
  const b = backupState(4);
  assert.equal(b.holdsPost, true);
  assert.equal(perRoundDelta(g, b, { here: true, alert: 0 }), 1, "at its post");
  assert.equal(perRoundDelta(g, b, { here: false, alert: 0 }), 0, "never follows the crew");
  assert.equal(beat(g, b, 5, 12).backup, false, "a beaten backup calls no one");
});

test("Corn Snake: active at 3, strikes only when hunting (7); a shut lid holds all heist", () => {
  const s = D("corn-snake");
  assert.equal(creatureStatus(s, st(), 3).active, true);
  assert.equal(creatureStatus(s, st(), 5).canAttack, false);
  assert.equal(creatureStatus(s, st(), 7).canAttack, true);
  assert.equal(creatureStatus(s, st(), 7).roams, true);
  const shut = shutIn(st({ active: true }));
  const at7 = creatureStatus(s, shut, 7, true);
  assert.equal(at7.hunting, false);
  assert.equal(at7.canAttack, false);
  assert.equal(at7.roams, false);
  assert.equal(perRoundDelta(s, shut, { here: true, alert: 7 }), 1, "still counts at its own obstacle");
  assert.equal(perRoundDelta(s, shut, { here: false, alert: 7 }), 0, "can't follow anyone");
});

test("Alert Parrot: mutters at 3, +1 from 5 anywhere it hears; shrieks +2 once at a spider it can see", () => {
  const p = D("alert-parrot");
  assert.equal(perRoundDelta(p, st(), { here: true, alert: 3 }), 0, "muttering adds nothing");
  assert.equal(perRoundDelta(p, st(), { earshot: true, alert: 5 }), 1, "repeating: its whole floor");
  assert.equal(perRoundDelta(p, st(), { earshot: false, here: false, alert: 5 }), 0, "not in the stockroom");
  const unseen = escalationEvents(p, st(), 6, 7, false, { seesCrew: false });
  assert.equal(unseen.spikes.length, 0);
  assert.deepEqual(unseen.armed, ["shriek"]);
  const seen = escalationEvents(p, st({ active: true, stepMax: 7 }), 7, 7, false, { seesCrew: true });
  assert.deepEqual(seen.spikes.map(s => [s.key, s.delta]), [["shriek", 2]]);
  const covered = shutIn(st({ active: true }));
  assert.equal(perRoundDelta(p, covered, { here: true, earshot: true, alert: 7 }), 0, "quiet all night");
  assert.equal(escalationEvents(p, covered, 6, 8, true, { seesCrew: true }).spikes.length, 0, "no shriek");
});

test("The Rat: nothing while the deal holds; +2 once when it goes bad, then Brawl 4", () => {
  const r = D("protection-rat");
  assert.equal(perRoundDelta(r, st(), { here: true, alert: 9 }), 0);
  assert.equal(creatureStatus(r, st(), 9).canAttack, false);
  const bad = dealGoesBad(r, st());
  assert.deepEqual([bad.spike.key, bad.spike.delta], ["dealBad", 2]);
  assert.equal(creatureStatus(r, bad.st, 0).canAttack, true);
  assert.equal(dealGoesBad(r, bad.st).spike, null, "once");
});

test("The Exterminator: only on the ST's call at 7+ or Full Alert; +1 a round on the map", () => {
  const x = D("the-exterminator");
  assert.equal(canCallExterminator(6, false), false);
  assert.equal(canCallExterminator(7, false), true);
  assert.equal(canCallExterminator(4, true), true);
  assert.equal(perRoundDelta(x, st(), { here: true, alert: 9 }), 0);
  assert.equal(perRoundDelta(x, st({ onMap: true }), { here: false, alert: 0 }), 1);
  assert.equal(x.sprayInOpenIsOut, true);
});

test("Goldfish and Human add nothing of their own", () => {
  assert.equal(perRoundDelta(D("goldfish"), st({ active: true }), { here: true, alert: 9 }), 0);
  assert.equal(perRoundDelta(D("human"), st({ active: true }), { here: true, alert: 9 }), 0);
  assert.equal(D("human").attack.pool, 3);
});

test("engaged: already active and able to reach you; the biggest attack lands", () => {
  const list = [
    { id: "cat", name: "Cat", def: D("house-cat"), st: st({ active: true }), here: true },
    { id: "snake", name: "Snake", def: D("corn-snake"), st: st({ active: true }), here: true },
    { id: "guard", name: "Guard", def: D("guard-spider"), st: st({ aware: true }), here: false }
  ];
  const at5 = engagedAttackers(list, { alert: 5 });
  assert.deepEqual(at5.map(a => a.id), ["cat"], "the snake isn't hunting; the guard roams but isn't here");
  assert.equal(isEngaged(D("guard-spider"), st({ aware: true }), { here: false, fighting: true }), true);
  const at7 = engagedAttackers(list, { alert: 7 });
  assert.deepEqual(at7.map(a => a.pool), [4, 4]);
});
