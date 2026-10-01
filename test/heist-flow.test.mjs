/**
 * Heist flow (WP-C, design §2–§3.13 + §16): phases and scenes, obstacle
 * progress, group checks, rounds, the clock, the stall, Casing, Preparations,
 * Out and the Waiting Web, Full Alert, the Debrief.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  newHeistState, startHeist, setPhase, startObstacle, startObstacleWithEvents, recordRoll, isCleared,
  requiredPasses, openGroup, groupSummary, endRound, clockDue, stallDue, applyStall, casingReveal,
  recordCasing, revealIntel, addPreparation, canPrepare, markOut, addReplacement, isLoss,
  debriefOutcome, apAward, apAwards, onFullAlert, undoFullAlert, addPendingCapture, voidPendingCapture,
  gapRecoveryTargets, recoverOne, adjustProgress, allActed, markActed, carryFor, lootAction,
  addEffect, activeEffects, rollContext, clock, newScene, endHeist, finishEscape, delayFlaw,
  isLastEscapeObstacle, nextObstacleId, progressView, pendingCapturesOf, takePendingCapture, applyStall as stall
} from "../module/logic/heist-flow.mjs";
import { findHeist } from "../module/logic/heist-catalog.mjs";
import { foldLedger, upsertEvent } from "../module/logic/alert-ledger.mjs";

const CREW = [
  { actorId: "a", userId: "u1", slot: "s1", name: "Pebbles" },
  { actorId: "b", userId: "u2", slot: "s2", name: "Dusty" },
  { actorId: "c", userId: "u3", slot: "s3", name: "Nook" }
];

function begin(key = "cookie", crew = CREW) {
  return startHeist(newHeistState(), { heist: findHeist(key), crew, heistId: "h1" });
}

let msg = 0;
const roll = (s, actorId, result, extra = {}) => recordRoll(s, { messageId: `m${++msg}`, actorId, obstacleId: s.current, result, difficulty: 3, ...extra });

test("a fresh state is idle freeplay", () => {
  const s = newHeistState();
  assert.equal(s.phase, "idle");
  assert.equal(clock(s).heistId, "freeplay");
  assert.equal(newScene(s).sceneSerial, 1);
});

test("startHeist seeds obstacles, crew, creatures, intel and loot", () => {
  const s = begin();
  assert.equal(s.phase, "score");
  assert.equal(s.limit, 10);
  assert.deepEqual(s.obstacles.map(o => o.id), ["O1", "O2", "O3", "O4", "E1", "E2"]);
  assert.equal(s.obstacles.find(o => o.id === "O4").revealed, false, "the unknown is hidden");
  assert.equal(s.crew.length, 3);
  assert.equal(s.creatures[0].key, "house-cat");
  assert.equal(s.loot[0].objective, true);
  assert.equal(s.intel.list.length, 4);
});

test("sceneSerial: Planning is a scene, every obstacle is a scene, the Escape is a scene", () => {
  let s = begin();
  const s0 = s.sceneSerial;
  s = setPhase(s, "planning");
  assert.equal(s.sceneSerial, s0 + 1);
  s = setPhase(s, "heist");
  assert.equal(s.sceneSerial, s0 + 1, "the heist phase itself isn't a scene");
  s = startObstacle(s, "O1");
  assert.equal(s.sceneSerial, s0 + 2);
  assert.equal(s.obstacleSerial, 1);
  assert.equal(s.round, 1);
  s = startObstacle(s, "O2");
  assert.equal(s.sceneSerial, s0 + 3);
  assert.equal(s.obstacles.find(o => o.id === "O1").status, "skipped");
  s = setPhase(s, "escape");
  assert.equal(s.sceneSerial, s0 + 4);
  assert.equal(s.current, null);
  s = startObstacle(s, "E1");
  assert.equal(s.phase, "escape");
  assert.equal(s.sceneSerial, s0 + 5);
});

test("a heist obstacle takes two successful rolls; an Escape obstacle one", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O3");
  assert.equal(requiredPasses(s.obstacles.find(o => o.id === "O3")), 2);
  s = roll(s, "a", "partial", { approachId: "engineering" });
  assert.equal(isCleared(s, "O3"), false);
  assert.deepEqual(progressView(s, "O3"), { need: 2, have: 1, cleared: false, passedActors: ["a"] });
  s = roll(s, "a", "failure", { approachId: "engineering" });
  assert.equal(isCleared(s, "O3"), false, "a Failure is no progress");
  s = roll(s, "b", "critical", { approachId: "engineering" });
  assert.equal(isCleared(s, "O3"), true, "a Critical counts as one");
  assert.equal(s.obstacles.find(o => o.id === "O3").status, "cleared");
  let e = startObstacle(setPhase(s, "escape"), "E2");
  assert.equal(requiredPasses(e.obstacles.find(o => o.id === "E2")), 1);
  e = roll(e, "c", "partial", { approachId: "engineering" });
  assert.equal(isCleared(e, "E2"), true);
});

test("progress is keyed by message id: a reroll or Clutch updates the same roll", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O3");
  s = recordRoll(s, { messageId: "r1", actorId: "a", obstacleId: "O3", result: "failure", approachId: "engineering" });
  s = recordRoll(s, { messageId: "r1", actorId: "a", obstacleId: "O3", result: "success", approachId: "engineering" });
  s = recordRoll(s, { messageId: "r1", actorId: "a", obstacleId: "O3", result: "success", approachId: "engineering" });
  assert.equal(progressView(s, "O3").have, 1);
  assert.equal(isCleared(s, "O3"), false);
});

test("That's Not What Happened on a Failure: still no progress", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O3");
  s = roll(s, "a", "success", { noProgress: true });
  assert.equal(progressView(s, "O3").have, 0);
});

test("group check: each spider gets through on its own result; done once every spider is through (N1)", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O2");
  s = openGroup(s, { groupId: "g1", approachId: "acrobatics" });
  assert.deepEqual(s.groups.g1.expected, ["a", "b", "c"]);
  s = roll(s, "a", "success", { groupId: "g1", approachId: "acrobatics" });
  s = roll(s, "b", "partial", { groupId: "g1", approachId: "acrobatics" });
  assert.equal(isCleared(s, "O2"), false, "group rolls don't count as two solo successes");
  s = roll(s, "c", "failure", { groupId: "g1", approachId: "acrobatics" });
  assert.equal(s.groups.g1.closed, true, "everyone rolled");
  assert.equal(isCleared(s, "O2"), false);
  const { state: s2 } = endRound(s, {});
  let s3 = openGroup(s2, { groupId: "g2", approachId: "acrobatics" });
  assert.deepEqual(s3.groups.g2.expected, ["c"], "the one who failed retries next round");
  s3 = roll(s3, "c", "success", { groupId: "g2", approachId: "acrobatics" });
  assert.equal(isCleared(s3, "O2"), true);
});

test("groupSummary: a Critical's −1 only if every roll was a Critical at Difficulty 3+", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O2");
  s = openGroup(s, { groupId: "g", approachId: "acrobatics", expected: ["a", "b"] });
  s = roll(s, "a", "critical", { groupId: "g", difficulty: 3 });
  assert.deepEqual(groupSummary(s.groups.g), { closed: false, allCritical: false });
  s = roll(s, "b", "critical", { groupId: "g", difficulty: 3 });
  assert.deepEqual(groupSummary(s.groups.g), { closed: true, allCritical: true });
  let t = openGroup(startObstacle(setPhase(begin(), "heist"), "O2"), { groupId: "g", expected: ["a", "b"] });
  t = roll(t, "a", "critical", { groupId: "g", difficulty: 3 });
  t = roll(t, "b", "critical", { groupId: "g", difficulty: 2 });
  assert.equal(groupSummary(t.groups.g).allCritical, false);
});

test("rounds: who has acted; allActed skips spiders already through", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O2");
  assert.equal(allActed(s), false);
  s = markActed(s, "a");
  s = roll(s, "b", "success");
  assert.equal(allActed(s), false);
  s = markActed(s, "c");
  assert.equal(allActed(s), true);
});

test("End Round: the cat's +1 is its own event; round and roundSerial advance", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O1");
  assert.equal(s.creatures[0].state.active, true, "awake from the start");
  const rs = s.roundSerial;
  const { state, actions } = endRound(s, { alert: 0, heist: findHeist("cookie") });
  const a = actions.find(x => x.type === "alert");
  assert.equal(a.eventId, `creature:cat:${rs}`);
  assert.equal(a.triggers[0].delta, 1);
  assert.equal(state.round, 2);
  assert.equal(state.roundSerial, rs + 1);
  // It roams once awake: +1 at the cabinet too.
  const s2 = startObstacle(state, "O2");
  assert.ok(endRound(s2, { alert: 0 }).actions.some(x => x.type === "alert" && x.eventId.startsWith("creature:cat")));
});

test("the clock: a complication as the crew starts round 3; the stall after round 5", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O3");
  let r = endRound(s, {});
  assert.ok(!r.actions.some(a => a.type === "clock"));
  r = endRound(r.state, {});
  assert.ok(r.actions.some(a => a.type === "clock"), "round 3 starts");
  assert.equal(r.state.round, 3);
  r = endRound(r.state, {});
  r = endRound(r.state, {});
  assert.ok(!r.actions.some(a => a.type === "stall"));
  r = endRound(r.state, {});
  assert.ok(r.actions.some(a => a.type === "stall"), "end of round 5");
  assert.equal(clockDue(3), true);
  assert.equal(stallDue(5), true);
  assert.equal(stallDue(4), false);
});

test("no clock or stall at an obstacle that's done", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O3");
  s = adjustProgress(s, "O3", { cleared: true });
  let r = endRound(endRound(s, {}).state, {});
  assert.ok(!r.actions.some(a => a.type === "clock"));
});

test("stall: in the heist the objective slips; in the Escape the stragglers are caught", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O3");
  const h = stall(s);
  assert.equal(h.state.objective.lost, true);
  let e = startObstacle(setPhase(begin(), "escape"), "E1");
  e = openGroup(e, { groupId: "g", approachId: "stealth" });
  e = roll(e, "a", "success", { groupId: "g" });
  const out = applyStall(e);
  assert.deepEqual(out.caught, ["b", "c"]);
});

test("round effects expire; the quiet round prompt; due Flaws fire", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O3");
  s = addEffect(s, { kind: "diff", value: 1, skills: ["stealth"], untilRoundSerial: s.roundSerial });
  s = addEffect(s, { kind: "diff", value: 1, skills: ["stealth"], untilRoundSerial: s.roundSerial + 1 });
  assert.equal(activeEffects(s, { skill: "stealth" }).length, 2);
  assert.equal(activeEffects(s, { skill: "engineering" }).length, 0);
  s = delayFlaw(s, "a", "dramatic");
  const r = endRound(s, { alert: 0 });
  assert.equal(r.state.effects.length, 1);
  assert.ok(r.actions.some(a => a.type === "quietRecovery"), "nothing can reach them at the tin (the cat asleep)");
  assert.ok(r.actions.some(a => a.type === "flawFire" && a.actorId === "a"));
});

test("Casing: one roll each; capped at what the ST holds; never the unknown obstacle", () => {
  let s = setPhase(startHeist(newHeistState(), { heist: findHeist("restaurant"), crew: CREW, heistId: "h" }), "planning");
  // Restaurant intel: 5 items, one (the office door, O4) is the unknown's.
  assert.equal(casingReveal(9, s.intel.list), 4);
  const r1 = recordCasing(s, "a", 2);
  assert.deepEqual(r1.reveal, ["i1", "i2"]);
  s = revealIntel(r1.state, r1.reveal);
  assert.equal(recordCasing(s, "a", 3).refused, true, "a second Casing roll is refused");
  const r2 = recordCasing(s, "b", 9);
  assert.deepEqual(r2.reveal, ["i4", "i5"], "never the unknown (i3)");
  assert.equal(revealIntel(s, ["i3"]).intel.list.find(i => i.id === "i3").revealed, false);
  assert.equal(rollContext(r2.state, { actorId: "c", skillKey: "tactics" }).casing, true);
  assert.equal(rollContext(r2.state, { actorId: "b", skillKey: "tactics" }).casing, false);
});

test("Preparations: one per spider; entry squares and Perk-granted ones are free; a Silk Line marks its obstacle", () => {
  let s = setPhase(begin(), "planning");
  assert.equal(canPrepare(s, "a", "silkLine"), true);
  s = addPreparation(s, "a", { kind: "entry", text: "the drain" }).state;
  const r = addPreparation(s, "a", { kind: "silkLine", obstacleId: "O2" });
  assert.equal(r.ok, true);
  assert.equal(r.state.obstacles.find(o => o.id === "O2").silkLinePrepared, true);
  assert.equal(addPreparation(r.state, "a", { kind: "stash" }).ok, false, "one Preparation each");
  assert.equal(addPreparation(r.state, "a", { kind: "perk", text: "Dead Drop" }).ok, true);
  assert.match(r.state.preparations.a[1].complication, /complication/);
});

test("Out: +2 Alert, a capture +3 on the same event; loot carried alone is lost", () => {
  let s = startObstacle(setPhase(begin("office"), "heist"), "O4");
  s = roll(s, "a", "success");
  s = roll(s, "a", "success");
  assert.equal(s.objective.taken, true);
  assert.deepEqual(s.loot[0].carriers, ["a"]);
  s = lootAction(s, "objective", "join", { actorId: "b" });
  const out = markOut(s, "a");
  assert.equal(out.alert.eventId, `out:a:${s.sceneSerial}`);
  assert.deepEqual(out.lostLoot, [], "co-carried loot stays with the others");
  assert.deepEqual(out.state.loot[0].carriers, ["b"]);
  const out2 = markOut(out.state, "b", { capture: true });
  assert.deepEqual(out2.lostLoot, ["objective"]);
  let l = upsertEvent([], out2.alert.eventId, { triggers: out2.alert.triggers });
  assert.equal(foldLedger(l, 8).value, 3, "+3 replaces the +2");
  assert.equal(out2.state.objective.lost, true);
});

test("Waiting Web: the replacement arrives at the next obstacle; Out in the last Escape obstacle waits at the exit", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O1");
  s = markOut(s, "a").state;
  s = addReplacement(s, { actorId: "a2", slot: "s1", replacementOf: "a", name: "Pebbles II" });
  const rep = s.crew.find(c => c.actorId === "a2");
  assert.equal(rep.status, "waiting");
  assert.equal(rep.arrivesAtSerial, s.obstacleSerial + 1);
  const { state, events } = startObstacleWithEvents(s, "O2");
  assert.equal(state.crew.find(c => c.actorId === "a2").status, "present");
  assert.ok(events.some(e => e.type === "arrival" && e.actorId === "a2"));
  // The last Escape obstacle.
  let e = startObstacle(setPhase(state, "escape"), "E1");
  assert.equal(isLastEscapeObstacle(e), false);
  e = startObstacle(e, "E2");
  assert.equal(isLastEscapeObstacle(e), true);
  e = markOut(e, "b").state;
  assert.equal(e.crew.find(c => c.actorId === "b").caughtLastEscape, true);
  e = addReplacement(e, { actorId: "b2", slot: "s2", replacementOf: "b" });
  assert.equal(e.crew.find(c => c.actorId === "b2").status, "escaped", "waiting at the exit");
});

test("Loss: nobody present or escaped (pending replacements don't count)", () => {
  assert.equal(isLoss([{ status: "out" }, { status: "waiting" }]), true);
  assert.equal(isLoss([{ status: "out" }, { status: "present" }]), false);
  assert.equal(isLoss([{ status: "out" }, { status: "escaped" }]), false);
});

test("Debrief: full / partial / loss and AP (half rounded down; N13; both spiders of a slot)", () => {
  let s = startObstacle(setPhase(begin("office"), "heist"), "O4");
  s = roll(s, "a", "success");
  s = roll(s, "b", "success");
  s = startObstacle(setPhase(s, "escape"), "E2");
  s = markOut(s, "c").state;                   // caught in the last Escape obstacle
  s = addReplacement(s, { actorId: "c2", slot: "s3", replacementOf: "c" });
  s = setPhase(s, "debrief");
  assert.equal(debriefOutcome(s), "full");
  assert.equal(s.debrief.outcome, "full");
  const awards = apAwards(s);
  assert.deepEqual(awards.map(a => [a.slot, a.ap]).sort(), [["s1", 3], ["s2", 3], ["s3", 1]]);
  assert.deepEqual(awards.find(a => a.slot === "s3").actorIds.sort(), ["c", "c2"]);
  assert.equal(apAward("standard", "partial"), 1);
  assert.equal(apAward("hard", "partial"), 2);
  assert.equal(apAward("easy", "full"), 2);
  assert.equal(apAward("legendary", "loss"), 0);
  // Incomplete loot is a Partial; nobody out is a Loss.
  const inc = { ...s, loot: s.loot.map(l => ({ ...l, incomplete: true })) };
  assert.equal(debriefOutcome(inc), "partial");
  assert.equal(debriefOutcome({ ...s, crew: s.crew.map(c => ({ ...c, status: "out" })) }), "loss");
});

test("finishEscape: everyone on the board got out, with their loot", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O4");
  s = roll(s, "a", "success");
  s = roll(s, "a", "success");
  s = finishEscape(s);
  assert.ok(s.crew.every(c => c.status === "escaped"));
  assert.equal(s.loot[0].status, "escaped");
});

test("Full Alert: the objective is out of reach if not taken; undo restores it", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O2");
  const r = onFullAlert(s);
  assert.equal(r.objectiveLost, true);
  assert.equal(r.state.objective.lost, true);
  assert.equal(r.state.fullAlert.atObstacle, "O2");
  assert.equal(onFullAlert(r.state).objectiveLost, false, "once");
  assert.equal(undoFullAlert(r.state).objective.lost, false);
});

test("a Full Alert Escape capture waits until the roll is final", () => {
  let s = startObstacle(setPhase(begin(), "escape"), "E1");
  s = addPendingCapture(s, { messageId: "m1", actorId: "a" });
  s = addPendingCapture(s, { messageId: "m2", actorId: "b" });
  s = voidPendingCapture(s, "m2");                       // Clutched
  assert.deepEqual(pendingCapturesOf(s, "a", "m9"), ["m1"]);
  const r = endRound(s, {});
  assert.deepEqual(r.actions.filter(a => a.type === "capture").map(a => a.actorId), ["a"]);
  assert.deepEqual(r.state.pendingCaptures, {});
  assert.equal(takePendingCapture(s, "m1").capture.actorId, "a");
});

test("creatures: a beaten guard's backup takes its post at the next obstacle (not in the fight's round)", () => {
  let s = startObstacle(setPhase(begin("office"), "heist"), "O2");
  assert.equal(s.creatures[0].state.aware, true, "aware from the start");
  s = roll(s, "a", "success", { approachId: "brawl" });
  s = roll(s, "b", "success", { approachId: "brawl" });
  assert.equal(s.creatures[0].state.beaten, true);
  const backup = s.creatures.find(c => c.backupOf === "guard");
  assert.ok(backup);
  const r = endRound(s, { alert: 1 });
  assert.ok(!r.actions.some(a => a.type === "alert"), "no +1 in the fight's own round");
  const { state, events } = startObstacleWithEvents(r.state, "O3");
  assert.ok(events.some(e => e.type === "backupArrives"));
  const r2 = endRound(state, { alert: 1 });
  assert.ok(r2.actions.some(a => a.eventId?.startsWith("creature:guard-backup1")), "+1 at its post");
  let down = startObstacle(setPhase(r2.state, "escape"), "E2");
  assert.ok(!endRound(down, { alert: 1 }).actions.some(a => a.type === "alert"), "never follows the crew beyond its post");
});

test("creatures: a talk pays the guard off; a Weakness shuts the snake in; the bottle cap backs the cat off", () => {
  let s = startObstacle(setPhase(begin("office"), "heist"), "O2");
  s = roll(s, "c", "success", { approachId: "persuasion" });
  s = roll(s, "c", "success", { approachId: "persuasion" });
  assert.equal(s.creatures[0].state.paid, true);
  let p = startObstacle(setPhase(begin("petstore"), "heist"), "O2");
  p = roll(p, "a", "success", { approachId: "engineering" });
  p = roll(p, "a", "success", { approachId: "engineering" });
  assert.equal(p.creatures.find(c => c.key === "corn-snake").state.shut, true);
  let c = startObstacle(setPhase(begin(), "heist"), "O1");
  c = roll(c, "a", "success", { approachId: "athletics" });
  c = roll(c, "b", "success", { approachId: "athletics" });
  const cat = c.creatures[0].state;
  assert.equal(cat.drivenOffAt, c.obstacleSerial);
  const r = endRound(c, { alert: 0 });
  assert.ok(r.actions.some(a => a.type === "alert"), "the clearing round's +X still counts");
});

test("gap recovery: once per obstacle", () => {
  const snaps = [
    { actorId: "a", vitality: "hurt", recoveredSerial: 2 },
    { actorId: "b", vitality: "rattled", recoveredSerial: 3 },
    { actorId: "c", vitality: "unharmed", recoveredSerial: -1 },
    { actorId: "d", vitality: "out", recoveredSerial: -1 }
  ];
  assert.deepEqual(gapRecoveryTargets(snaps, 3), ["a"]);
  assert.equal(recoverOne("hurt"), "rattled");
  assert.equal(recoverOne("unharmed"), "unharmed");
  assert.equal(recoverOne("out"), "out");
});

test("loot and carrying", () => {
  let s = startObstacle(setPhase(begin("library"), "heist"), "O3");
  s = roll(s, "a", "success");
  s = roll(s, "a", "success");
  assert.deepEqual(carryFor(s, "a"), { tier: "treasure", carriers: 1, sled: false, lootId: "objective", present: 3 });
  s = lootAction(s, "objective", "join", { actorId: "b" });
  s = lootAction(s, "objective", "sled", { value: true });
  assert.equal(carryFor(s, "b").carriers, 2);
  assert.equal(carryFor(s, "b").sled, true);
  assert.equal(carryFor(s, "c"), null);
  s = lootAction(s, "objective", "drop");
  assert.equal(s.loot[0].status, "dropped");
});

test("squeezes: loot bigger than a Trinket raises a warning at a squeeze", () => {
  let s = startObstacle(setPhase(begin("petstore"), "heist"), "O4");
  s = roll(s, "a", "success");
  s = roll(s, "a", "success");
  const { events } = startObstacleWithEvents(setPhase(s, "escape"), "E2");
  assert.ok(!events.some(e => e.type === "squeeze"), "E2 has no squeeze tag");
  const c = { ...s, obstacles: s.obstacles.map(o => (o.id === "E2" ? { ...o, tags: [...o.tags, "squeeze"] } : o)) };
  assert.ok(startObstacleWithEvents(c, "E2").events.some(e => e.type === "squeeze"));
});

test("rollContext: approaches using the skill, the Face can't talk to the guard, the group's one creature roll", () => {
  let s = startObstacle(setPhase(begin("office"), "heist"), "O2");
  const ctx = rollContext(s, { actorId: "a", skillKey: "persuasion", roleKey: "face" });
  assert.equal(ctx.obstacle.id, "O2");
  assert.ok(!ctx.approaches.some(a => a.id === "persuasion"), "not the Face");
  const ctx2 = rollContext(s, { actorId: "a", skillKey: "stealth", roleKey: "ghost" });
  assert.ok(ctx2.approaches.find(a => a.id === "stealth").matches);
  assert.equal(ctx2.engaged.length, 1, "the aware guard here");
  assert.equal(rollContext(setPhase(begin(), "score"), {}).noRolls, true);
  assert.equal(rollContext(setPhase(begin(), "planning"), {}).alertOff, true);
});

test("nextObstacleId and endHeist", () => {
  let s = startObstacle(setPhase(begin(), "heist"), "O1");
  assert.equal(nextObstacleId(s), "O2");
  const e = endHeist(s);
  assert.equal(e.phase, "idle");
  assert.equal(e.heistId, "freeplay");
  assert.ok(e.sceneSerial > s.sceneSerial);
  assert.equal(e.lastHeist.heistId, "h1");
});
