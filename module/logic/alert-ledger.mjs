/**
 * HEISTY SPIDEYS — The Alert ledger (pure; automation design §3.1)
 * ----------------------------------------------------------------
 * Every change to the Alert is an entry keyed by an `eventId` (a roll's message
 * id, a group check id, `creature:<id>:<roundSerial>`, `out:<actorId>:<sceneSerial>`,
 * …). The Alert itself is a pure fold over the entries:
 *
 *   - One event, one trigger (Ch 9): entries sharing an eventId are one entry,
 *     and an entry applies only its LARGEST trigger — a Failure that gets you
 *     spotted is +1, not +2.
 *   - A Critical's −1 counts only when nothing in the same event raised the
 *     Alert, and in a group check only once the group has closed with every
 *     roll a Critical (Ch 2 Group Checks).
 *   - Reactions that cancel or reduce (That's Not What Happened, Plausible
 *     Deniability, Damage Control, …) are amendments: the fold is re-run, so
 *     every one of them is exact and reversible.
 *   - Full Alert (Ch 9): once the Alert reaches the Limit nothing raises or
 *     lowers it; the fold freezes there (`nextAlertValue`). An amendment that
 *     re-folds below the Limit releases it — the GM confirms that.
 *   - Whatever the Limit, Full Alert brings the Lockdown penalties
 *     (HEISTY.getAlertState) — so a Limit of 6 or less is in Lockdown at the Limit.
 *
 * No Foundry globals here: unit-tested by test/alert-ledger.test.mjs.
 */

import { HEISTY } from "../config.mjs";
import { nextAlertValue } from "./rules.mjs";

/** How many absorbed eventIds a checkpoint remembers (for the GM's reconcile). */
export const ABSORBED_MAX = 400;

const clampLimit = limit => Math.max(1, Math.round(Number(limit) || 8));
const num = v => Math.round(Number(v) || 0);

/** Identity of a trigger/cancel: its key, and the card message it came from (group checks share an event). */
const ident = x => `${x?.key}|${x?.msg ?? ""}`;

/** Merge `incoming` items into `list` by key (+ source message; later wins). */
function mergeByKey(list, incoming) {
  const out = (list ?? []).map(x => ({ ...x }));
  for (const item of incoming ?? []) {
    if (!item?.key) continue;
    const i = out.findIndex(x => ident(x) === ident(item));
    if (i >= 0) out[i] = { ...out[i], ...item };
    else out.push({ ...item });
  }
  return out;
}

/**
 * The raw delta an event entry contributes, before the 0…Limit clamp and the
 * Full Alert lock (§3.1 eventDelta):
 *  1. any cancel → 0;
 *  2. positive triggers → the largest one;
 *  3. otherwise the smallest (most negative) trigger — but in a group check only
 *     once the group has closed with every roll a Critical;
 *  4. reductions (Damage Control) apply only when the pre-reduction delta is ≥ 2;
 *  5. floored at 0 whenever a positive trigger existed.
 * @param {object} entry
 * @returns {number}
 */
export function eventDelta(entry) {
  if (!entry || (entry.type && entry.type !== "event")) return 0;
  if ((entry.cancels ?? []).length) return 0;
  const deltas = (entry.triggers ?? []).map(t => num(t?.delta)).filter(d => d !== 0);
  const positive = deltas.filter(d => d > 0);
  let delta = 0;
  if (positive.length) delta = Math.max(...positive);
  else if (deltas.length) {
    const g = entry.group;
    if (!g || (g.closed && g.allCritical)) delta = Math.min(...deltas);
  }
  if (delta >= 2) {
    for (const r of entry.reductions ?? []) delta += num(r?.delta);
  }
  if (positive.length) delta = Math.max(0, delta);
  return delta;
}

/** The pre-reduction, pre-cancel delta: what the event "was worth" (for Damage Control / Plausible Deniability). */
export function grossDelta(entry) {
  if (!entry || (entry.type && entry.type !== "event")) return 0;
  return eventDelta({ ...entry, cancels: [], reductions: [] });
}

/** Entries in fold order (by seq, then insertion). Proposed (unconfirmed) entries are left out. */
function ordered(entries) {
  return (entries ?? [])
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => e && !e.proposed && !e.rejected)
    .sort((a, b) => (num(a.e.seq) - num(b.e.seq)) || (a.i - b.i))
    .map(({ e }) => e);
}

/**
 * Fold the ledger into the Alert.
 * - `event` entries add their eventDelta through nextAlertValue (0…Limit clamp, Full Alert lock);
 * - `set` entries assign their value (respecting the lock unless `force`);
 * - `checkpoint` entries assign their value directly (a compacted past).
 * @param {object[]} entries
 * @param {number} limit
 * @returns {{value:number, locked:boolean, lockedByEntryId:string|null, peak:number, applied:Object<string,number>, state:object}}
 */
export function foldLedger(entries, limit) {
  const lim = clampLimit(limit);
  let value = 0;
  let peak = 0;
  let lockedByEntryId = null;
  const applied = {};
  for (const e of ordered(entries)) {
    const before = value;
    if (e.type === "checkpoint") {
      value = Math.min(lim, Math.max(0, num(e.value)));
    } else if (e.type === "set") {
      value = e.force ? Math.min(lim, Math.max(0, num(e.value))) : nextAlertValue(value, e.value, lim);
      if (e.force && value < lim) lockedByEntryId = null;
    } else {
      value = nextAlertValue(value, value + eventDelta(e), lim);
    }
    applied[e.id ?? e.eventId] = value - before;
    if (value >= lim && before < lim) lockedByEntryId = e.id ?? e.eventId ?? null;
    if (value < lim) lockedByEntryId = null;
    peak = Math.max(peak, value);
  }
  const locked = value >= lim;
  return { value, locked, lockedByEntryId: locked ? lockedByEntryId : null, peak, applied, state: HEISTY.getAlertState(value, lim) };
}

/** Next sequence number for a new entry. */
export function nextSeq(ledger) {
  return (ledger ?? []).reduce((m, e) => Math.max(m, num(e?.seq)), 0) + 1;
}

/** Find the event entry for an eventId. */
export function findEvent(ledger, eventId) {
  return (ledger ?? []).find(e => e && e.eventId === eventId && (!e.type || e.type === "event")) ?? null;
}

/** Was this eventId ever recorded (live, or absorbed into a checkpoint)? */
export function hasEvent(ledger, eventId) {
  if (!eventId) return false;
  return (ledger ?? []).some(e => e && (e.eventId === eventId || (e.absorbed ?? []).includes(eventId)));
}

const META = ["cause", "source", "round", "roundSerial", "obstacleSerial", "heistId", "label", "proposed", "rejected"];

/** Apply a patch to one entry (pure). */
function patchEntry(entry, patch) {
  const e = { ...entry };
  for (const k of META) if (patch[k] !== undefined) e[k] = patch[k];
  // Replace everything one card contributed (its reroll / Clutch / GM buttons re-read the card).
  if (patch.replaceMessage) {
    e.triggers = (e.triggers ?? []).filter(t => t.msg !== patch.replaceMessage);
    e.cancels = (e.cancels ?? []).filter(c => c.msg !== patch.replaceMessage);
  }
  // Replace every trigger from one source (a reroll re-reads the roll's triggers).
  if (patch.replaceSource) e.triggers = (e.triggers ?? []).filter(t => (t.src ?? "roll") !== patch.replaceSource);
  if (patch.removeTriggers?.length) e.triggers = (e.triggers ?? []).filter(t => !patch.removeTriggers.includes(t.key));
  if (patch.triggers) e.triggers = mergeByKey(e.triggers, patch.triggers.map(t => ({ ...t, delta: num(t.delta) })));
  if (patch.removeCancels?.length) e.cancels = (e.cancels ?? []).filter(c => !patch.removeCancels.includes(c.key));
  if (patch.cancels) e.cancels = mergeByKey(e.cancels, patch.cancels);
  if (patch.removeReductions?.length) e.reductions = (e.reductions ?? []).filter(r => !patch.removeReductions.includes(r.key));
  if (patch.reductions) e.reductions = mergeByKey(e.reductions, patch.reductions.map(r => ({ ...r, delta: num(r.delta) })));
  if (patch.group !== undefined) e.group = patch.group ? { ...(e.group ?? {}), ...patch.group } : null;
  return e;
}

/**
 * Create or update the event entry for `eventId` (pure).
 * patch: { triggers, cancels, reductions, group, replaceSource, replaceMessage, removeTriggers,
 *          removeCancels, removeReductions, cause, source, round, roundSerial,
 *          obstacleSerial, heistId, proposed, id }
 * Triggers, cancels and reductions merge by `key` (a later one with the same key replaces it).
 * @returns {object[]} a new ledger
 */
export function upsertEvent(ledger, eventId, patch = {}) {
  const list = (ledger ?? []).slice();
  const i = list.findIndex(e => e && e.eventId === eventId && (!e.type || e.type === "event"));
  if (i >= 0) {
    list[i] = patchEntry(list[i], patch);
    return list;
  }
  const base = {
    id: patch.id ?? `ev-${nextSeq(list)}-${String(eventId).slice(-12)}`,
    eventId, seq: nextSeq(list), type: "event",
    triggers: [], cancels: [], reductions: [], group: null
  };
  list.push(patchEntry(base, patch));
  return list;
}

/**
 * Amend an existing event (cancels, reductions, re-triggers). Unknown eventIds
 * leave the ledger unchanged (an amendment never invents an event).
 */
export function amendEvent(ledger, eventId, patch = {}) {
  if (!findEvent(ledger, eventId)) return (ledger ?? []).slice();
  return upsertEvent(ledger, eventId, patch);
}

/** Append a `set` entry (the GM typed a value; `force` = Reset, which also releases Full Alert). */
export function setEntry(ledger, value, { force = false, cause = "manual", id = null } = {}) {
  const list = (ledger ?? []).slice();
  const seq = nextSeq(list);
  list.push({ id: id ?? `set-${seq}`, eventId: id ?? `set-${seq}`, seq, type: "set", value: Math.max(0, num(value)), force: !!force, cause });
  return list;
}

/**
 * Compact the ledger into one `checkpoint` entry at the folded value (done when
 * an obstacle starts — every reaction window has closed by then). The
 * checkpoint remembers the absorbed eventIds so the GM's reconcile never
 * re-applies an old roll. Proposed entries (confirm mode) are kept.
 * @param {object[]} ledger
 * @param {number} [limit]
 */
export function compact(ledger, limit = 8) {
  const list = ledger ?? [];
  const live = list.filter(e => e && !e.proposed);
  if (!live.length) return list.slice();
  const fold = foldLedger(live, limit);
  const absorbed = [];
  for (const e of live) {
    if (e.type === "checkpoint") absorbed.push(...(e.absorbed ?? []));
    else if (e.eventId) absorbed.push(e.eventId);
  }
  const seq = nextSeq(list);
  const checkpoint = {
    id: `checkpoint-${seq}`, eventId: `checkpoint-${seq}`, seq, type: "checkpoint",
    value: fold.value, locked: fold.locked, peak: fold.peak, absorbed: absorbed.slice(-ABSORBED_MAX)
  };
  return [checkpoint, ...list.filter(e => e && e.proposed)];
}

/** Is the entry's reaction window still open? Until the end of the round it happened in (§16 #13). */
export function windowOpen(entry, clock) {
  if (!entry || !clock) return false;
  if (entry.heistId && clock.heistId && entry.heistId !== clock.heistId) return false;
  if (entry.roundSerial === undefined || entry.roundSerial === null) return true;
  return num(entry.roundSerial) === num(clock.roundSerial);
}

/** Causes that are a crew action (a roll or an ability), not the world. */
export const CREW_CAUSES = Object.freeze(["roll", "group", "ability", "clutch", "flaw", "assist"]);

/**
 * Damage Control (3 SP between the crew, once per heist): reduces one Alert
 * spike of +2 or more by 1, called before the round ends.
 * @param {object} entry
 * @param {{damageControl?:object|null}} crewUsage
 * @param {object} [clock]
 */
export function canDamageControl(entry, crewUsage, clock = null) {
  if (!entry || (entry.type && entry.type !== "event")) return false;
  const dc = crewUsage?.damageControl;
  if (dc && (dc.done || dc.eventId !== entry.eventId)) return false;
  if ((entry.cancels ?? []).length) return false;
  if ((entry.reductions ?? []).some(r => r.key === "damageControl" && r.applied !== false)) return false;
  if (grossDelta(entry) < 2) return false;
  if (clock && !windowOpen(entry, clock)) return false;
  return true;
}

/**
 * Plausible Deniability: cancels an Alert rise of exactly +1 caused by a crew
 * action (not a creature's +X, a complication or the GM's manual bump).
 */
export function canPlausibleDeniability(entry, clock = null) {
  if (!entry || (entry.type && entry.type !== "event")) return false;
  if ((entry.cancels ?? []).length) return false;
  if (eventDelta(entry) !== 1) return false;
  const cause = entry.cause ?? "roll";
  if (!CREW_CAUSES.includes(cause)) return false;
  if (clock && !windowOpen(entry, clock)) return false;
  return true;
}

/** That's Not What Happened / Abort, Abort: cancel an event's Alert while its window is open. */
export function canCancel(entry, clock = null, { failureOnly = false } = {}) {
  if (!entry || (entry.type && entry.type !== "event")) return false;
  if ((entry.cancels ?? []).length) return false;
  if (grossDelta(entry) <= 0) return false;
  if (failureOnly && !(entry.triggers ?? []).some(t => ["failure", "botch"].includes(t.key))) return false;
  if (clock && !windowOpen(entry, clock)) return false;
  return true;
}

/** A spike is an event worth +2 or more (Damage Control and Not Part of the Plan surface on its card). */
export function isSpike(entry) {
  return grossDelta(entry) >= 2;
}

/**
 * Would amending `eventId` with `patch` undo Full Alert? (The GM confirms that.)
 * @returns {{before:object, after:object, unlocks:boolean}}
 */
export function previewAmend(ledger, eventId, patch, limit) {
  const before = foldLedger(ledger, limit);
  const after = foldLedger(amendEvent(ledger, eventId, patch), limit);
  return { before, after, unlocks: before.locked && !after.locked };
}

/** Proposed (confirm-mode) entries waiting for the GM's ✓. */
export function proposedEntries(ledger) {
  return (ledger ?? []).filter(e => e?.proposed && !e.rejected);
}

/** Confirm (or reject) a proposed entry. */
export function confirmEvent(ledger, eventId, accept = true) {
  return (ledger ?? []).map(e => {
    if (!e || e.eventId !== eventId || !e.proposed) return e;
    const out = { ...e, proposed: false };
    if (!accept) out.rejected = true;
    return out;
  }).filter(e => !(e?.rejected));
}

/** A short human label for an entry (the HUD strip and the tracker log). */
export function describeEntry(entry) {
  if (!entry) return "";
  if (entry.type === "checkpoint") return `Checkpoint at ${entry.value}`;
  if (entry.type === "set") return `${entry.force ? "Reset" : "Set"} to ${entry.value}`;
  const d = eventDelta(entry);
  const top = (entry.triggers ?? []).slice().sort((a, b) => Math.abs(num(b.delta)) - Math.abs(num(a.delta)))[0];
  const label = entry.label ?? top?.label ?? top?.key ?? entry.cause ?? "event";
  const cancelled = (entry.cancels ?? []).length ? ` (cancelled: ${entry.cancels.map(c => c.key).join(", ")})` : "";
  return `${d > 0 ? "+" : ""}${d} ${label}${cancelled}`;
}
