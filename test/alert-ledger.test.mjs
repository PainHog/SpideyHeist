/**
 * The Alert ledger (WP-C, design §3.1 + §16): one event → its largest trigger,
 * amendments and cancels, the Full Alert lock, compaction. Pure, no Foundry.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {
  eventDelta, grossDelta, foldLedger, upsertEvent, amendEvent, setEntry, compact, hasEvent, findEvent,
  canDamageControl, canPlausibleDeniability, canCancel, previewAmend, confirmEvent, proposedEntries,
  windowOpen, isSpike
} from "../module/logic/alert-ledger.mjs";

const T = (key, delta, src = "roll") => ({ key, delta, label: key, src });
const fold = (l, limit = 8) => foldLedger(l, limit).value;

test("one event, one trigger: a Failure that gets you spotted is +1, not +2", () => {
  let l = upsertEvent([], "m1", { triggers: [T("failure", 1)] });
  l = upsertEvent(l, "m1", { triggers: [T("spotted", 1, "gm")] });
  assert.equal(l.length, 1);
  assert.equal(fold(l), 1);
  l = upsertEvent(l, "m1", { triggers: [T("confirmed", 2, "gm")] });
  assert.equal(fold(l), 2, "the largest trigger wins, not the sum");
});

test("separate events add up", () => {
  let l = upsertEvent([], "m1", { triggers: [T("failure", 1)] });
  l = upsertEvent(l, "m2", { triggers: [T("botch", 2)] });
  l = upsertEvent(l, "creature:cat:3", { triggers: [T("creature", 1, "creature")], cause: "creature" });
  assert.equal(fold(l), 4);
});

test("a Critical's −1 never takes the Alert below 0", () => {
  const l = upsertEvent([], "m1", { triggers: [T("critical", -1)] });
  assert.equal(fold(l), 0);
  const l2 = upsertEvent(upsertEvent([], "a", { triggers: [T("failure", 1)] }), "b", { triggers: [T("critical", -1)] });
  assert.equal(fold(l2), 0);
});

test("a negative trigger doesn't offset a positive one in the same event", () => {
  const e = { triggers: [T("critical", -1), T("approach", 1)], cancels: [], reductions: [] };
  assert.equal(eventDelta(e), 1);
});

test("group check: the largest single trigger; a clean failure is an ordinary Failure (+1)", () => {
  let l = upsertEvent([], "g1", { group: { id: "g1", closed: false }, triggers: [T("partial", 1)] });
  l = upsertEvent(l, "g1", { triggers: [T("failure", 1)] });
  assert.equal(fold(l), 1);
  l = upsertEvent(l, "g1", { triggers: [T("botch", 2)] });
  assert.equal(fold(l), 2);
});

test("group check: a Critical's −1 counts only once the group closes all Critical", () => {
  const start = upsertEvent([], "x", { triggers: [T("failure", 1)] });
  let l = upsertEvent(start, "g1", { group: { id: "g1", closed: false, allCritical: false }, triggers: [T("critical", -1)] });
  assert.equal(fold(l), 1, "open group: no −1 yet");
  l = upsertEvent(l, "g1", { group: { closed: true, allCritical: false } });
  assert.equal(fold(l), 1, "closed but not every roll Critical");
  l = upsertEvent(l, "g1", { group: { closed: true, allCritical: true } });
  assert.equal(fold(l), 0, "closed and all Critical");
});

test("cancels are exact and reversible", () => {
  let l = upsertEvent([], "m1", { triggers: [T("botch", 2)] });
  l = amendEvent(l, "m1", { cancels: [{ key: "thatsNotWhatHappened", by: "a1" }] });
  assert.equal(fold(l), 0);
  l = amendEvent(l, "m1", { removeCancels: ["thatsNotWhatHappened"] });
  assert.equal(fold(l), 2);
});

test("amendEvent never invents an event", () => {
  const l = amendEvent([], "nope", { cancels: [{ key: "abortAbort" }] });
  assert.deepEqual(l, []);
});

test("a reroll replaces the roll's own triggers but keeps the GM's", () => {
  let l = upsertEvent([], "m1", { triggers: [T("failure", 1)] });
  l = upsertEvent(l, "m1", { triggers: [T("confirmed", 2, "gm")] });
  l = upsertEvent(l, "m1", { replaceSource: "roll", triggers: [T("partial", 1)] });
  const e = findEvent(l, "m1");
  assert.deepEqual(e.triggers.map(t => t.key).sort(), ["confirmed", "partial"]);
  assert.equal(fold(l), 2);
});

test("Damage Control: −1 only on a spike of +2 or more, floored at 0", () => {
  const two = { triggers: [T("botch", 2)], cancels: [], reductions: [{ key: "damageControl", delta: -1 }] };
  assert.equal(eventDelta(two), 1);
  const one = { triggers: [T("failure", 1)], cancels: [], reductions: [{ key: "damageControl", delta: -1 }] };
  assert.equal(eventDelta(one), 1, "a +1 isn't reduced");
  const deep = { triggers: [T("capture", 3)], cancels: [], reductions: [{ key: "a", delta: -2 }, { key: "b", delta: -2 }] };
  assert.equal(eventDelta(deep), 0, "floored at 0");
});

test("canDamageControl: spikes only, once per crew, before the round ends", () => {
  const clock = { heistId: "h", roundSerial: 4 };
  let l = upsertEvent([], "m1", { triggers: [T("botch", 2)], roundSerial: 4, heistId: "h" });
  l = upsertEvent(l, "m2", { triggers: [T("failure", 1)], roundSerial: 4, heistId: "h" });
  const spike = findEvent(l, "m1"), small = findEvent(l, "m2");
  assert.equal(isSpike(spike), true);
  assert.equal(canDamageControl(spike, { damageControl: null }, clock), true);
  assert.equal(canDamageControl(small, { damageControl: null }, clock), false);
  assert.equal(canDamageControl(spike, { damageControl: { eventId: "m1", pledges: [] } }, clock), true, "pledges collecting on this spike");
  assert.equal(canDamageControl(spike, { damageControl: { eventId: "zz", done: true } }, clock), false, "once per heist between them");
  assert.equal(canDamageControl(spike, { damageControl: null }, { heistId: "h", roundSerial: 5 }), false, "window closed");
  const reduced = findEvent(amendEvent(l, "m1", { reductions: [{ key: "damageControl", delta: -1 }] }), "m1");
  assert.equal(canDamageControl(reduced, { damageControl: null }, clock), false);
});

test("Plausible Deniability: only an exact +1 from a crew action", () => {
  const crew = { triggers: [T("failure", 1)], cancels: [], reductions: [], cause: "roll", roundSerial: 2 };
  assert.equal(canPlausibleDeniability(crew), true);
  assert.equal(canPlausibleDeniability({ ...crew, triggers: [T("botch", 2)] }), false);
  assert.equal(canPlausibleDeniability({ ...crew, cause: "creature" }), false);
  assert.equal(canPlausibleDeniability({ ...crew, cancels: [{ key: "abortAbort" }] }), false);
  assert.equal(canPlausibleDeniability(crew, { roundSerial: 3 }), false, "until the end of the round");
  assert.equal(windowOpen(crew, { roundSerial: 2 }), true);
});

test("canCancel (That's Not What Happened / Abort, Abort)", () => {
  const e = { triggers: [T("failure", 1)], cancels: [], reductions: [], roundSerial: 1 };
  assert.equal(canCancel(e, { roundSerial: 1 }), true);
  assert.equal(canCancel(e, { roundSerial: 1 }, { failureOnly: true }), true);
  assert.equal(canCancel({ ...e, triggers: [T("partial", 1)] }, null, { failureOnly: true }), false);
  assert.equal(canCancel({ ...e, triggers: [T("critical", -1)] }), false);
});

test("Full Alert: locks at the Limit; nothing raises or lowers it", () => {
  let l = upsertEvent([], "a", { triggers: [T("botch", 2)] });
  l = upsertEvent(l, "b", { triggers: [T("botch", 2)] });
  let f = foldLedger(l, 4);
  assert.equal(f.value, 4);
  assert.equal(f.locked, true);
  assert.equal(f.lockedByEntryId, findEvent(l, "b").id);
  l = upsertEvent(l, "c", { triggers: [T("critical", -1)] });
  l = upsertEvent(l, "d", { triggers: [T("confirmed", 2)] });
  f = foldLedger(l, 4);
  assert.equal(f.value, 4, "frozen at the Limit");
  assert.equal(f.peak, 4);
  assert.equal(foldLedger(setEntry(l, 1), 4).value, 4, "a plain set can't lower it");
  assert.equal(foldLedger(setEntry(l, 0, { force: true }), 4).value, 0, "Reset releases it");
});

test("Full Alert never goes past the Limit", () => {
  const l = upsertEvent(upsertEvent([], "a", { triggers: [T("capture", 3)] }), "b", { triggers: [T("capture", 3)] });
  assert.equal(foldLedger(l, 4).value, 4);
});

test("an amendment can undo Full Alert (the GM confirms)", () => {
  let l = upsertEvent([], "a", { triggers: [T("botch", 2)] });
  l = upsertEvent(l, "b", { triggers: [T("botch", 2)] });
  const p = previewAmend(l, "b", { cancels: [{ key: "thatsNotWhatHappened" }] }, 4);
  assert.equal(p.before.locked, true);
  assert.equal(p.after.value, 2);
  assert.equal(p.unlocks, true);
});

test("Lockdown penalties at any Limit once at Full Alert", () => {
  const l = upsertEvent([], "a", { triggers: [T("manual", 6, "gm")] });
  const f = foldLedger(l, 6);
  assert.equal(f.state.key, "fullalert");
  assert.equal(f.state.stealth, 2);
  assert.equal(f.state.all, 1);
  assert.equal(foldLedger(l, 10).state.key, "active");
});

test("compaction keeps the value, the lock and the absorbed eventIds", () => {
  let l = upsertEvent([], "m1", { triggers: [T("failure", 1)] });
  l = upsertEvent(l, "m2", { triggers: [T("botch", 2)] });
  l = upsertEvent(l, "p1", { triggers: [T("failure", 1)], proposed: true });
  const c = compact(l, 8);
  assert.equal(c.length, 2, "one checkpoint + the proposed entry");
  assert.equal(c[0].type, "checkpoint");
  assert.equal(c[0].value, 3);
  assert.equal(fold(c), 3);
  assert.equal(hasEvent(c, "m1"), true);
  assert.equal(hasEvent(c, "m3"), false);
  const again = compact(upsertEvent(c, "m3", { triggers: [T("failure", 1)] }), 8);
  assert.equal(again[0].value, 4);
  assert.ok(again[0].absorbed.includes("m1") && again[0].absorbed.includes("m3"));
  const locked = compact(upsertEvent([], "z", { triggers: [T("manual", 9, "gm")] }), 6);
  assert.equal(locked[0].locked, true);
  assert.equal(foldLedger(upsertEvent(locked, "y", { triggers: [T("critical", -1)] }), 6).value, 6);
});

test("confirm mode: proposed entries wait for the GM's ✓", () => {
  let l = upsertEvent([], "m1", { triggers: [T("failure", 1)], proposed: true });
  assert.equal(fold(l), 0);
  assert.equal(proposedEntries(l).length, 1);
  assert.equal(fold(confirmEvent(l, "m1", true)), 1);
  assert.equal(confirmEvent(l, "m1", false).length, 0);
});

test("grossDelta ignores cancels and reductions", () => {
  const e = { triggers: [T("botch", 2)], cancels: [{ key: "x" }], reductions: [{ key: "damageControl", delta: -1 }] };
  assert.equal(grossDelta(e), 2);
  assert.equal(eventDelta(e), 0);
});

test("replay: a short Cookie Situation night folds to the book's number", () => {
  // Limit 10. O1: the cat is awake from the start (+1 each round).
  let l = [];
  // Round 1: a Failure that gets the spider spotted (+1, not +2); the cat's +1.
  l = upsertEvent(l, "m1", { triggers: [T("failure", 1)] });
  l = upsertEvent(l, "m1", { triggers: [T("spotted", 1, "gm")] });
  l = upsertEvent(l, "creature:cat:1", { triggers: [T("creature", 1, "creature")], cause: "creature" });
  // Round 2: a group check — a Partial (+1) and a Botch (+2): the Alert rises once, by 2. The cat +1.
  l = upsertEvent(l, "g2", { group: { id: "g2", closed: true }, triggers: [T("partial", 1)] });
  l = upsertEvent(l, "g2", { triggers: [T("botch", 2)] });
  l = upsertEvent(l, "creature:cat:2", { triggers: [T("creature", 1, "creature")], cause: "creature" });
  // Round 3: a Critical at Difficulty 3 (−1); Damage Control on the earlier Botch? Too late (window closed) — but
  // That's Not What Happened on the Critical round's own Failure cancels it.
  l = upsertEvent(l, "m4", { triggers: [T("critical", -1)] });
  l = upsertEvent(l, "m5", { triggers: [T("failure", 1)] });
  l = amendEvent(l, "m5", { cancels: [{ key: "thatsNotWhatHappened" }] });
  l = upsertEvent(l, "creature:cat:3", { triggers: [T("creature", 1, "creature")], cause: "creature" });
  // 1 + 1 + 2 + 1 − 1 + 0 + 1 = 5
  assert.equal(fold(l, 10), 5);
  assert.equal(foldLedger(l, 10).peak, 5);
});

test("group events: each card's triggers are its own (a reroll replaces only that card's)", () => {
  let l = upsertEvent([], "g", { group: { id: "g" }, replaceMessage: "m1", triggers: [{ ...T("failure", 1), msg: "m1" }] });
  l = upsertEvent(l, "g", { replaceMessage: "m2", triggers: [{ ...T("failure", 1), msg: "m2" }] });
  assert.equal(findEvent(l, "g").triggers.length, 2);
  l = upsertEvent(l, "g", { replaceMessage: "m2", triggers: [{ ...T("critical", -1), msg: "m2" }] });
  assert.deepEqual(findEvent(l, "g").triggers.map(t => `${t.key}@${t.msg}`).sort(), ["critical@m2", "failure@m1"]);
  assert.equal(fold(l), 1, "m1's Failure still raises it");
  l = upsertEvent(l, "g", { replaceMessage: "m1", triggers: [] });
  assert.equal(fold(l), 0);
});
