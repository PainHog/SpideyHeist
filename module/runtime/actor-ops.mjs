/**
 * HEISTY SPIDEYS — Actor operations (runtime, WP-A)
 * -------------------------------------------------
 * The small set of writes every package makes to spiders: spend and earn Silk,
 * stamp ability usage, queue and consume pending bonuses, set Vitality, and
 * build a Waiting Web replacement. A player writes only their own actor; a
 * write to someone else's spider goes through a GM operation
 * (`game.heistySpideys.gm.run`, WP-C), registered here by `registerSpiderOps`.
 *
 * Late binding: every cross-package call is `game.heistySpideys.<ns>?.…`, so
 * this runs (degraded) without the heist runtime.
 */

import { SYSTEM_ID, FLAG, QUERY, OPS, HOOKS, SETTINGS } from "../contracts.mjs";
import { HEISTY } from "../config.mjs";
import {
  getAbility, usageStatus, markUsage, blankUsage, addPendingBonus, consumePendingIds, prunePending,
  FREEPLAY_CLOCK
} from "../logic/abilities.mjs";
import { itemAbilityKey } from "../logic/keys.mjs";
import { replacementActorData } from "../logic/waiting-web.mjs";

const api = () => game.heistySpideys ?? {};
const OWNER = () => CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
const PASSING = new Set(["partial", "success", "critical"]);

/* -------------------------------------------- */
/*  Small helpers                               */
/* -------------------------------------------- */

/** A world setting, or a default when it isn't registered (WP-C registers them). */
export function setting(key, fallback) {
  try {
    const v = game.settings.get(SYSTEM_ID, key);
    return v === undefined ? fallback : v;
  } catch (err) {
    return fallback;
  }
}

/** The heist clock `{heistId, phase, sceneSerial, roundSerial, …}` (freeplay without WP-C). */
export function clock() {
  try {
    const c = api().heist?.clock?.();
    if (c && c.heistId) return c;
  } catch (err) { /* fall through */ }
  return { ...FREEPLAY_CLOCK };
}

/** The live heist state, or null. */
export function heistState() {
  try { return api().heist?.state ?? null; } catch (err) { return null; }
}

/** HTML-escape a string for chat content. */
export const esc = s => (foundry.utils.escapeHTML ?? (x => String(x).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)))(String(s ?? ""));

/** The user who sent a GM op (sender if the transport passes it, else the claimed id). */
export function requestUser(args, ctx) {
  const id = ctx?.user?.id ?? ctx?.sender?.id ?? ctx?.userId ?? ctx?.senderId ?? args?.userId;
  return (id && game.users.get(id)) || (ctx?.user instanceof User ? ctx.user : null);
}

/**
 * Run a GM operation. Through WP-C's `gm.run` when it's there; a GM with no
 * transport runs our own registered handlers locally.
 */
export async function gmRun(op, args) {
  const gm = api().gm;
  // quiet: our callers decide whether a refusal is worth a toast.
  if (typeof gm?.run === "function") return gm.run(op, args, { quiet: true });
  const local = LOCAL_OPS.get(op);
  if (local && game.user.isGM) {
    const ctx = { user: game.user, userId: game.user.id };
    await local.check?.(args, ctx);
    return local.apply(args, ctx);
  }
  throw new Error("The Storyteller isn't connected — nothing was changed.");
}

/** Post a simple system chat note (never a WP-B/WP-C card kind). */
export async function postNote(actor, html, { whisperGM = false, flags = {}, title = "" } = {}) {
  const data = {
    speaker: actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker(),
    content: `<div class="heisty-ability-card">${title ? `<h4 class="hac-title">${title}</h4>` : ""}${html}</div>`,
    flags: { [FLAG]: flags }
  };
  if (whisperGM) data.whisper = game.users.filter(u => u.isGM).map(u => u.id);
  return ChatMessage.create(data);
}

/** Squares between two tokens (Chebyshev; null when either isn't on the canvas). */
export function tokenDistance(a, b) {
  const size = canvas?.grid?.size || canvas?.scene?.grid?.size;
  const da = a?.document ?? a;
  const db = b?.document ?? b;
  if (!size || !da || !db || da.parent?.id !== db.parent?.id) return null;
  const sq = d => ({ x: Math.floor((Number(d.x) || 0) / size + 1e-6), y: Math.floor((Number(d.y) || 0) / size + 1e-6) });
  const pa = sq(da);
  const pb = sq(db);
  // A bigger token (w/h in squares) is as close as its nearest square.
  const dx = Math.max(0, pb.x - (pa.x + (da.width ?? 1) - 1), pa.x - (pb.x + (db.width ?? 1) - 1));
  const dy = Math.max(0, pb.y - (pa.y + (da.height ?? 1) - 1), pa.y - (pb.y + (db.height ?? 1) - 1));
  return Math.max(dx, dy);
}

/** An actor's token on the viewed scene, or null. */
export function actorToken(actor) {
  if (!actor || !canvas?.ready) return null;
  return actor.getActiveTokens?.(false, true)?.[0] ?? actor.getActiveTokens?.()?.[0] ?? null;
}

/**
 * Within range? True/false from tokens when both are on the canvas, or null
 * when it can't be checked (the GM override then stands).
 */
export function inRange(actorA, actorOrTokenB, squares) {
  const ta = actorToken(actorA);
  const tb = actorOrTokenB?.document ? actorOrTokenB : actorToken(actorOrTokenB);
  const d = tokenDistance(ta, tb);
  return d === null ? null : d <= squares;
}

/* -------------------------------------------- */
/*  Abilities on an actor                       */
/* -------------------------------------------- */

/** [{item, key, def}] for the spider's Species, Role, Perks and Flaws. */
export function abilityItems(actor) {
  return (actor?.items ?? [])
    .filter(i => ["species", "role", "perk", "flaw"].includes(i.type))
    .map(item => ({ item, key: itemAbilityKey(item), def: getAbility(itemAbilityKey(item)) }))
    .filter(e => e.key);
}

/** The item carrying an ability key, or null. */
export function abilityItem(actor, key) {
  return abilityItems(actor).find(e => e.key === key)?.item ?? null;
}

/** Usage status of an ability on this actor right now. */
export function usage(actor, key, c = clock()) {
  const def = getAbility(key);
  const item = abilityItem(actor, key);
  const status = usageStatus(def, item?.system?.usage, c);
  return { ...status, def, item, has: !!item };
}

/** Stamp a use of the ability on its item. Returns the new usage. */
export async function markUsed(actor, key, c = clock()) {
  const def = getAbility(key);
  const item = abilityItem(actor, key);
  if (!def || !item) return null;
  const next = markUsage(def, item.system.usage, c);
  await item.update({ "system.usage": next });
  return next;
}

/** Clear an item's usage stamp (item sheet "Reset"). */
export async function resetUsage(item) {
  return item?.update({ "system.usage": blankUsage() });
}

/* -------------------------------------------- */
/*  Silk                                        */
/* -------------------------------------------- */

/**
 * Spend Silk from a spider. Re-checks the current pool. With the `autoSilk`
 * setting off nothing is deducted (Silk is advice only) and this returns true.
 * @returns {Promise<boolean>} false if it couldn't be paid.
 */
export async function spendSilk(actor, n, { reason = "" } = {}) {
  const cost = Math.max(0, Math.trunc(Number(n) || 0));
  if (!cost) return true;
  if (!setting(SETTINGS.autoSilk, true)) return true;
  if (!actor?.isOwner) {
    ui.notifications?.warn("You can only spend your own spider's Silk.");
    return false;
  }
  const have = Number(actor.system.silk?.value) || 0;
  if (have < cost) {
    ui.notifications?.warn(`${actor.name} has ${have} SP — ${reason || "that"} costs ${cost}.`);
    return false;
  }
  await actor.update({ "system.silk.value": have - cost });
  return true;
}

/** Earn Silk (may go above the starting total — Ch 8). */
export async function earnSilk(actor, n, { reason = "", announce = false } = {}) {
  const gain = Math.max(0, Math.trunc(Number(n) || 0));
  if (!gain || !actor) return false;
  if (!actor.isOwner) {
    ui.notifications?.warn("Only the Storyteller or the spider's owner can award Silk.");
    return false;
  }
  await actor.update({ "system.silk.value": (Number(actor.system.silk?.value) || 0) + gain });
  if (announce) await postNote(actor, `<p><strong>+${gain} SP</strong>${reason ? ` — ${esc(reason)}` : ""}</p>`);
  return true;
}

/* -------------------------------------------- */
/*  Pending bonuses                             */
/* -------------------------------------------- */

/** The spider's queued bonuses (expired ones dropped). */
export function listPending(actor, c = clock()) {
  return prunePending(actor?.system?.heist?.pending ?? [], c);
}

/** Write a pending bonus on an actor the current user owns. */
async function writePending(target, bonus) {
  const c = clock();
  const next = addPendingBonus(prunePending(target.system.heist?.pending ?? [], c), bonus, c);
  await target.update({ "system.heist.pending": next });
  return next;
}

/**
 * Queue a bonus on a spider: directly if we own it, else via the GM op.
 * @param {Actor} target
 * @param {object} bonus   {dice, diff, capped, skills, jobOnly, expires, label, source}
 * @param {{sourceActor?:Actor, ability?:string}} [opts]
 */
export async function addPending(target, bonus, { sourceActor = null, ability = "" } = {}) {
  if (!target) return false;
  if (target.isOwner) { await writePending(target, bonus); return true; }
  try {
    await gmRun(OPS.actorAddPending, { targetId: target.id, bonus, sourceActorId: sourceActor?.id ?? "", ability, userId: game.user.id });
    return true;
  } catch (err) {
    ui.notifications?.error(err?.message ?? String(err));
    return false;
  }
}

/** Remove consumed bonuses (by id) after a roll. */
export async function consumePending(actor, ids) {
  if (!actor?.isOwner || !ids?.length) return;
  const next = consumePendingIds(actor.system.heist?.pending ?? [], ids);
  await actor.update({ "system.heist.pending": next });
}

/** Drop expired bonuses (end of round / scene). */
export async function prunePendingFor(actor, c = clock()) {
  if (!actor?.isOwner) return;
  const cur = actor.system.heist?.pending ?? [];
  const next = prunePending(cur, c);
  if (next.length !== cur.length) await actor.update({ "system.heist.pending": next });
}

/* -------------------------------------------- */
/*  Vitality                                    */
/* -------------------------------------------- */

/** Set a spider's Vitality state and announce it on the vitalityChanged hook. */
export async function setVitality(actor, state, cause = "") {
  if (!actor || !HEISTY.vitality[state]) return null;
  // Callers pass the cause as a string ("hit", "caught", "capture", …); accept
  // a {cause} record too, so an outCause is never "[object Object]".
  if (cause && typeof cause === "object") cause = cause.cause ?? cause.key ?? "";
  cause = String(cause ?? "");
  const from = actor.system.vitality?.state ?? "unharmed";
  if (from === state) return state;
  await actor.update({ "system.vitality.state": state, "system.vitality.outCause": state === "out" ? cause : "" });
  Hooks.callAll(HOOKS.vitalityChanged, actor, from, state, cause);
  return state;
}

/** One level better (heal) or worse (harm); never heals an Out spider. */
export function stepVitalityKey(from, delta) {
  const order = HEISTY.vitalityOrder;
  if (from === "out" && delta < 0) return "out";
  const i = Math.max(0, order.indexOf(from));
  return order[Math.max(0, Math.min(order.length - 1, i + delta))];
}

/* -------------------------------------------- */
/*  Waiting Web                                 */
/* -------------------------------------------- */

/** A replacement name from the Ch 20 2d6 table. */
export async function rollReplacementName() {
  try {
    const { NAME_TABLE } = await import("../apps/character-builder.mjs");
    const r = (1 + Math.floor(Math.random() * 6)) + (1 + Math.floor(Math.random() * 6));
    return NAME_TABLE[r] ?? "Gerald";
  } catch (err) {
    return "Gerald";
  }
}

/** The non-GM owner to ask about a replacement (active ones first). */
export function playerOwner(actor) {
  const owners = game.users.filter(u => !u.isGM && actor?.testUserPermission?.(u, OWNER()));
  return owners.find(u => u.active) ?? owners[0] ?? null;
}

/**
 * Ask the spider's owner for the replacement's name and an optional species
 * swap (GM side). Owner offline, no answer in time, or no transport → defaults.
 * @returns {Promise<{name:string, speciesUuid:string|null, defaulted:boolean}>}
 */
export async function promptReplacement(actor, { timeout = 60000 } = {}) {
  const defaults = { name: await rollReplacementName(), speciesUuid: null, defaulted: true };
  if (!actor) return defaults;
  const owner = playerOwner(actor);
  const local = async () => {
    const { ReplacementDialog } = await import("../apps/replacement-dialog.mjs");
    const res = await ReplacementDialog.prompt(actor, { timeout, defaultName: defaults.name });
    return res ? { ...defaults, ...res, defaulted: false } : defaults;
  };
  if (!owner) return game.user.isGM ? local() : defaults;
  if (owner.id === game.user.id) return local();
  if (!owner.active) return defaults;
  const args = { actorId: actor.id, timeout, defaultName: defaults.name };
  // WP-C's gm.ask (User#query with a socket fallback) when it's loaded.
  const gm = api().gm;
  if (typeof gm?.ask === "function") {
    try {
      const res = await gm.ask(owner.id, OPS.uiPromptReplacement, args, { timeout: timeout + 5000 });
      return res?.ok && res.result?.name ? { ...defaults, ...res.result, defaulted: false } : defaults;
    } catch (err) {
      return defaults;
    }
  }
  if (typeof owner.query !== "function") return defaults;
  try {
    const res = await owner.query(QUERY, {
      op: OPS.uiPromptReplacement, args: { actorId: actor.id, timeout, defaultName: defaults.name },
      userId: game.user.id, requestId: foundry.utils.randomID()
    }, { timeout: timeout + 5000 });
    return res?.name ? { ...defaults, ...res, defaulted: false } : defaults;
  } catch (err) {
    console.warn("Heisty Spideys | replacement prompt went unanswered:", err);
    return defaults;
  }
}

/**
 * Create the Waiting Web replacement (GM only): duplicated from the original,
 * owned by the same player, Rattled, half starting SP, usage stamps carried,
 * same slot, status "waiting". The original's heist status becomes "out".
 * @param {Actor} original
 * @param {{name?:string, speciesUuid?:string|null}} [answer]  From promptReplacement.
 * @param {{arrivesAtSerial?:number|null}} [opts]
 * @returns {Promise<Actor|null>}
 */
export async function createReplacement(original, { name = "", speciesUuid = null } = {}, { arrivesAtSerial = null } = {}) {
  if (!game.user.isGM || !original) return null;
  let species = null;
  if (speciesUuid) {
    try { species = await fromUuid(speciesUuid); } catch (err) { species = null; }
    if (species?.type !== "species") species = null;
  }
  const data = replacementActorData(original.toObject(), {
    sourceId: original.id,
    name: name || await rollReplacementName(),
    species: species ? species.toObject() : null,
    silkMax: original.system.silk?.max,
    arrivesAtSerial,
    flag: FLAG
  });
  const created = await Actor.create(data);
  if (original.system.heist?.status !== "out") await original.update({ "system.heist.status": "out" });
  return created ?? null;
}

/* -------------------------------------------- */
/*  GM operations (§8)                          */
/* -------------------------------------------- */

/** Bonus sanity for queued bonuses a player asks the GM to write. */
function checkBonus(b) {
  const dice = Math.trunc(Number(b?.dice) || 0);
  const diff = Math.trunc(Number(b?.diff) || 0);
  if (Math.abs(dice) > 3 || Math.abs(diff) > 2) throw new Error("That bonus is out of range.");
}

const LOCAL_OPS = new Map();

/** The ops WP-A owns: actor.addPending, actor.heal, ui.promptReplacement. */
export const SPIDER_OPS = {
  [OPS.actorAddPending]: {
    /** Source owner; the ability is theirs (or it's an Assist); a spider target. */
    check(args, ctx) {
      const user = requestUser(args, ctx);
      const target = game.actors.get(args?.targetId);
      if (target?.type !== "spider") throw new Error("No such spider.");
      checkBonus(args?.bonus);
      if (user?.isGM) return true;
      const source = game.actors.get(args?.sourceActorId);
      if (!source || !user || !source.testUserPermission(user, OWNER())) throw new Error("You don't control that spider.");
      if (args.ability && args.ability !== "assist" && !abilityItem(source, args.ability)) throw new Error("That spider doesn't have that ability.");
      return true;
    },
    async apply(args) {
      const target = game.actors.get(args.targetId);
      await writePending(target, { ...args.bonus, source: args.bonus?.source || args.ability || "" });
      return { ok: true };
    }
  },

  [OPS.actorHeal]: {
    /** Field Repair: the card passed, the source has the Perk, not applied twice, adjacent if checkable. */
    check(args, ctx) {
      const user = requestUser(args, ctx);
      const target = game.actors.get(args?.targetId);
      const source = game.actors.get(args?.sourceActorId);
      if (target?.type !== "spider" || !source) throw new Error("No such spider.");
      if (!user?.isGM && !(user && source.testUserPermission(user, OWNER()))) throw new Error("You don't control that spider.");
      if (!abilityItem(source, "field-repair")) throw new Error(`${source.name} doesn't have Field Repair.`);
      const msg = game.messages.get(args?.messageId);
      const result = msg?.flags?.[FLAG]?.card?.roll?.result ?? msg?.flags?.[FLAG]?.result;
      if (!user?.isGM && !PASSING.has(result)) throw new Error("The Field Repair roll didn't pass.");
      if (msg?.flags?.[FLAG]?.fieldRepair?.applied) throw new Error("That patch-up was already applied.");
      if (!user?.isGM && inRange(source, target, 1) === false) throw new Error(`${target.name} isn't adjacent.`);
      return true;
    },
    async apply(args) {
      const target = game.actors.get(args.targetId);
      const from = target.system.vitality?.state ?? "unharmed";
      const to = stepVitalityKey(from, -1);
      if (to !== from) await setVitality(target, to, "fieldRepair");
      const msg = game.messages.get(args.messageId);
      if (msg) await msg.update({ [`flags.${FLAG}.fieldRepair`]: { applied: true, targetId: target.id, from, to } });
      return { ok: true, from, to };
    }
  },

  [OPS.uiPromptReplacement]: {
    /** Runs on the owner's client; only the GM may ask. */
    check(args, ctx) {
      const user = requestUser(args, ctx);
      if (user && !user.isGM) throw new Error("Only the Storyteller can ask for a replacement.");
      return true;
    },
    async apply(args) {
      const actor = game.actors.get(args?.actorId);
      if (!actor) return null;
      const { ReplacementDialog } = await import("../apps/replacement-dialog.mjs");
      return ReplacementDialog.prompt(actor, { timeout: Number(args?.timeout) || 60000, defaultName: args?.defaultName });
    }
  }
};

/**
 * Register WP-A's GM ops with WP-C's registry (`gm.register(op, {check, apply})`).
 * Also kept locally so a GM can run them with no transport loaded.
 */
export function registerSpiderOps(gm = api().gm) {
  for (const [op, handler] of Object.entries(SPIDER_OPS)) {
    LOCAL_OPS.set(op, handler);
    try { gm?.register?.(op, handler); } catch (err) { console.error(`Heisty Spideys | couldn't register ${op}:`, err); }
  }
}

/** The public namespace (`game.heistySpideys.actorOps`). */
export const actorOps = {
  clock, heistState, setting, abilityItems, abilityItem, usage, markUsed, resetUsage,
  spendSilk, earnSilk, listPending, addPending, consumePending, prunePendingFor,
  setVitality, stepVitalityKey, promptReplacement, createReplacement, rollReplacementName,
  inRange, tokenDistance, actorToken, gmRun, postNote
};
