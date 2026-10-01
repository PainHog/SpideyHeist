/**
 * HEISTY SPIDEYS — The heist store (design §2)
 * --------------------------------------------
 * The heist state lives in the hidden world setting `heistState`, written only
 * by the active GM. Every write goes through one promise queue and is a pure
 * function from logic/heist-flow.mjs. Every client hears the change through the
 * setting's onChange: it fires HOOKS.heistChanged (and phaseChanged), re-prepares
 * the crew actors (Speed from loot and carrying) and re-renders the tracker.
 *
 * `heistApi` is the late-bound `game.heistySpideys.heist` namespace; the
 * orchestration methods (startHeist, endRound, nextObstacle, …) are added to it
 * by module/heist/automation.mjs.
 */

import { SYSTEM_ID, SETTINGS, HOOKS, OPS, FLAG } from "../contracts.mjs";
import { HEISTY } from "../config.mjs";
import * as flow from "../logic/heist-flow.mjs";
import { findHeist } from "../logic/heist-catalog.mjs";
import { creatureDef, resolveCreatureKey } from "../logic/creatures.mjs";
import { gm, isActiveGM } from "../net/gm-ops.mjs";

let queue = Promise.resolve();
let lastSeen = null;

const clone = v => (v === null || v === undefined ? v : (globalThis.foundry?.utils?.deepClone?.(v) ?? JSON.parse(JSON.stringify(v))));

function readRaw() {
  try { return game.settings.get(SYSTEM_ID, SETTINGS.heistState); } catch (err) { return null; }
}

function alertLimitSetting() {
  try { return Number(game.settings.get(SYSTEM_ID, "alertLimit")) || 8; } catch (err) { return 8; }
}

function alertSetting() {
  try { return Number(game.settings.get(SYSTEM_ID, "alert")) || 0; } catch (err) { return 0; }
}

export const store = {
  /** The current heist state (a copy; freeplay if none was ever written). */
  get state() {
    const raw = readRaw();
    if (raw && raw.v) return clone(raw);
    return flow.newHeistState({ limit: alertLimitSetting() });
  },

  clock() {
    return flow.clock(this.state);
  },

  /** The catalog (or custom journal) heist the state was started from. */
  heist(state = this.state) {
    return findHeist(state?.catalogKey) ?? state?.customHeist ?? null;
  },

  isActiveGM,

  /**
   * Apply a pure mutation (active GM only), serialized. `fn(state)` returns the
   * next state (or the same object for "no change"); it may be async but must
   * never call `mutate` itself.
   * @returns {Promise<object>} the state after the write
   */
  mutate(fn, { label = "" } = {}) {
    if (!isActiveGM()) {
      console.warn(`Heisty Spideys | heist store: only the active GM writes the heist state (${label}).`);
      return Promise.resolve(this.state);
    }
    const run = async () => {
      const before = this.state;
      const after = await fn(clone(before));
      if (!after || after === before) return before;
      await game.settings.set(SYSTEM_ID, SETTINGS.heistState, after);
      return after;
    };
    const p = queue.then(run, run);
    queue = p.catch(err => console.error(`Heisty Spideys | heist store write failed (${label}):`, err));
    return p;
  },

  /** Wait for every queued write. */
  settle() {
    return queue;
  },

  /**
   * First ready on a world: seed the heist state, with a ledger checkpoint at
   * the current Alert so an Alert mid-heist survives the upgrade.
   */
  async seed() {
    if (!isActiveGM()) return;
    const raw = readRaw();
    if (raw && raw.v) return;
    const s = flow.newHeistState({ limit: alertLimitSetting() });
    const a = alertSetting();
    if (a > 0) s.alertLedger = [{ id: "checkpoint-seed", eventId: "checkpoint-seed", seq: 1, type: "checkpoint", value: a, locked: a >= s.limit, absorbed: [] }];
    await game.settings.set(SYSTEM_ID, SETTINGS.heistState, s);
  },

  /** Setting onChange (every client): hooks, crew re-prep, tracker re-render. */
  onSettingChange(value) {
    const before = lastSeen;
    lastSeen = clone(value);
    const state = value?.v ? value : flow.newHeistState();
    try {
      Hooks.callAll(HOOKS.heistChanged, state, { before });
      if (before && before.phase !== state.phase) Hooks.callAll(HOOKS.phaseChanged, state, before.phase, state.phase);
    } catch (err) { console.error(err); }
    // Re-prepare crew actors: Speed depends on loot and carrying.
    const ids = new Set([...(state.crew ?? []), ...(before?.crew ?? [])].map(c => c.actorId));
    for (const id of ids) {
      const a = game.actors?.get(id);
      if (!a) continue;
      try { a.reset?.(); if (a.sheet?.rendered) a.sheet.render(); } catch (err) { /* ignore */ }
    }
    ui.heistyAlert?.render?.();
    heistApi._tracker?.()?.render?.();
  },

  /** Remember the state at ready (so the first change has a "before"). */
  prime() {
    lastSeen = clone(readRaw());
  }
};

/* -------------------------------------------------------------- the API -- */

/** Role key of a spider ("face", "ghost", …) from its Role item. */
export function roleKeyOf(actor) {
  const role = actor?.items?.find?.(i => i.type === "role");
  if (!role) return null;
  if (role.system?.roleKey) return role.system.roleKey;
  const byLabel = Object.entries(HEISTY.roles).find(([, r]) => r.label === role.name);
  if (byLabel) return byLabel[0];
  return String(role.name ?? "").toLowerCase().replace(/^the\s+/, "").trim();
}

export const heistApi = {
  /** The live heist state (a copy). */
  get state() { return store.state; },

  /** The heist clock: {heistId, phase, sceneSerial, obstacleSerial, roundSerial, round}. */
  clock() { return store.clock(); },

  /** The catalog entry of the running heist. */
  catalog() { return store.heist(); },

  /** Is a heist running (not freeplay)? */
  get active() { return store.state.phase !== "idle"; },

  /**
   * What a roll by this spider with this Skill is up against now (WP-B's roll
   * dialog binds to it). See heist-flow.rollContext.
   */
  rollContext(actor, skillKey) {
    const s = store.state;
    const alert = alertSetting();
    const fullAlert = alert >= (Number(s.limit) || alertLimitSetting());
    const ctx = flow.rollContext(s, { actorId: actor?.id ?? null, skillKey, roleKey: roleKeyOf(actor), alert, fullAlert });
    ctx.alert = alert;
    ctx.limit = Number(s.limit) || alertLimitSetting();
    ctx.fullAlert = fullAlert;
    // A human's reach is its room: at a human obstacle the Swat (3) can land (N18).
    if (ctx.obstacle?.human) ctx.engaged.push({ id: "human", key: "human", name: "Human", attack: { label: "Swat", pool: 3, index: 0 }, human: true });
    // Carried Silk Line, Escape-wide effects.
    ctx.escapeDiff = s.phase === "escape" ? (s.effects ?? []).filter(e => e.kind === "escapeDiff").reduce((n, e) => n + (Number(e.value) || 0), 0) : 0;
    return ctx;
  },

  /** Carry info for a spider (SpiderData.carryLookup). */
  carryFor(actorId) {
    const s = store.state;
    if (s.phase === "idle") return null;
    const c = flow.carryFor(s, actorId);
    const passenger = (s.assists ?? []).some(a => a.carrier === actorId);
    if (!c && !passenger) return null;
    return { ...(c ?? {}), carryingPassenger: passenger };
  },

  /** The attack roll index of a threat (WP-B's hit flow). */
  attackIndexFor(threat) {
    const key = threat?.system?.automation?.key || resolveCreatureKey(threat?.name);
    const def = creatureDef(key);
    const idx = def?.attack?.index;
    return Number.isInteger(idx) ? idx : null;
  },

  /** Add a round/scene effect (§2 effects). Players go through the heist.addEffect op. */
  async addEffect(effect, { actorId = null, ability = "" } = {}) {
    if (isActiveGM()) return store.mutate(s => flow.addEffect(s, { ...effect, sourceActorId: effect.sourceActorId ?? actorId, ability: ability || effect.source }), { label: "addEffect" });
    return gm.run(OPS.heistAddEffect, { effect, actorId, ability, userId: game.user.id });
  },

  /** A spider acted this round (a roll, an Assist, an ability, "I acted"). */
  async markActed(actorId) {
    if (isActiveGM()) return store.mutate(s => (s.phase === "idle" ? s : flow.markActed(s, actorId)), { label: "acted" });
    return gm.run(OPS.heistActed, { actorId, userId: game.user.id }, { quiet: true });
  },

  /** A Partial's dropped item / Butterfingers: the loot this spider carries is dropped. */
  async dropLoot(actorId, { messageId = null } = {}) {
    const s = store.state;
    const l = (s.loot ?? []).find(x => x.status === "carried" && (x.carriers ?? []).includes(actorId));
    if (!l) return null;
    if (isActiveGM()) return store.mutate(st => flow.addLog(flow.lootAction(st, l.id, "drop", { actorId }), `${l.name} dropped.`), { label: "dropLoot" });
    return gm.run(OPS.heistLoot, { lootId: l.id, action: "drop", actorId, userId: game.user.id, messageId });
  },

  /** The Lookout's Contingency was used. */
  async useContingency({ messageId = null, actorId = null } = {}) {
    if (!isActiveGM()) return null;
    return store.mutate(s => (s.contingency ? flow.addLog({ ...s, contingency: { ...s.contingency, used: true, messageId } }, "Contingency used.") : s), { label: "contingency" });
  },

  /** Delay a Flaw one round (the player paid 1 SP). */
  async delayFlaw(actorId, flawKey) {
    if (isActiveGM()) return store.mutate(s => flow.delayFlaw(s, actorId, flawKey), { label: "delayFlaw" });
    return gm.run("heist.delayFlaw", { actorId, flawKey, userId: game.user.id }, { quiet: true });
  },

  /** Set by the tracker module: () => the open tracker app (or null). */
  _tracker: null,

  /** Flag scope (for journals carrying a custom heist). */
  FLAG
};
