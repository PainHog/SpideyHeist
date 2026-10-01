/**
 * HEISTY SPIDEYS — Roll-card buttons, reactions and consequences (WP-B, §3.3)
 * -------------------------------------------------------------------------
 * Buttons are injected per viewer at render time (renderChatMessageHTML), so a
 * card shows each person only what they can do: the roller gets Reroll /
 * Clutch / Run It Again / Silver Tongue / Accept; a Face or Wheelman on the
 * crew gets their reactions; the GM gets Spotted / Confirmed / Loud, the
 * Partial swaps, the hit, Spectacular Failure and Contingency.
 *
 * Every click re-validates against the current card. Updates to a card the
 * clicker authored (or any card, for the GM) are written directly; anything
 * else goes through the `card.patch` GM op. The Alert itself is never written
 * here: the card's `alert.triggers/cancels` are mirrored into the ledger by
 * the heist automation (WP-C). With no ledger (or `autoAlert = manual`) the GM
 * gets the old ±Alert buttons instead.
 *
 * Pending consequences (a hit after a Failure, a Full Alert Partial's cost, a
 * Full Alert Escape capture) are applied by the active GM once the card is
 * final: Accept, the same spider's next roll, or End Round.
 */

import { SYSTEM_ID, CARD, OPS, HOOKS, SETTINGS } from "../contracts.mjs";
import { HEISTY } from "../config.mjs";
import {
  ABILITY_KEYS, SILK_COSTS, SILK_REROLL_MAX, cardActions, canReroll, canClutch, applyClutch,
  rerollIndices, applyReroll, resolveRoll, isFailed, strongestAttacker, cardAlertDelta, recomputeCheckCard
} from "../logic/rolls.mjs";

/** Recompute a check card's consequences and Alert block (pure; logic/rolls.mjs). */
export const recomputeCard = recomputeCheckCard;
import { getCard, applyPatch, diffPatch, renderCardContent, cardUpdateData, WPB_KINDS } from "./card-flags.mjs";
import { HitFlow } from "./hit-flow.mjs";

/* -------------------------------------------- */
/*  Late-bound runtime helpers (shared by B)    */
/* -------------------------------------------- */

/** The system API namespace (other packages attach to it). */
export const ns = () => globalThis.game?.heistySpideys ?? {};

/** Read a world setting registered by another package, with a fallback. */
export function setting(key, fallback) {
  try {
    if (!game.settings.settings.has(`${SYSTEM_ID}.${key}`)) return fallback;
    const v = game.settings.get(SYSTEM_ID, key);
    return v ?? fallback;
  } catch (e) { return fallback; }
}

/** Is there an Alert ledger to mirror card triggers into? */
export function hasLedger() {
  return typeof ns().alert?.raise === "function";
}

/** "auto" | "confirm" | "manual": with no ledger the old GM buttons are used. */
export function alertMode() {
  if (!hasLedger()) return "manual";
  return setting(SETTINGS.autoAlert, "auto");
}

/** Slug of a name, matching the pack keys ("Don't Look Down" → "dont-look-down"). */
export function slugName(name) {
  return String(name ?? "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Ability keys of an actor (WP-A's actorOps when present, else from its items). */
export function abilityKeysOf(actor) {
  if (!actor) return [];
  try {
    const items = ns().actorOps?.abilityItems?.(actor);
    if (Array.isArray(items)) return items.map(e => e.key).filter(Boolean);
  } catch (e) { /* fall through */ }
  const keys = [];
  for (const item of actor.items ?? []) {
    const s = item.system ?? {};
    if (item.type === "perk" || item.type === "flaw") keys.push(s.key || slugName(item.name));
    else if (item.type === "species") keys.push(`species:${s.speciesKey || slugName(item.name).replace(/-spider$/, "")}`);
    else if (item.type === "role") keys.push(`sig:${s.roleKey || slugName(item.name).replace(/^the-/, "")}`);
  }
  return keys;
}

/** Is a limited ability still available (WP-A usage)? Unknown → available. */
export function abilityAvailable(actor, key) {
  try {
    const u = ns().actorOps?.usage?.(actor, key);
    if (u == null || typeof u.then === "function") return true;
    if (typeof u === "boolean") return u;
    return u.available !== false;
  } catch (e) { return true; }
}

/** Stamp a limited ability as used (WP-A); no-op without it. */
export async function markUsed(actor, key) {
  try { await ns().actorOps?.markUsed?.(actor, key); } catch (e) { console.warn("Heisty Spideys | markUsed failed", e); }
}

/** Current Silk Points of an actor. */
export const silkOf = actor => Number(actor?.system?.silk?.value) || 0;

/**
 * Spend SP from an actor. With `autoSilk` off nothing is deducted (advice
 * only). Returns {ok, advice}.
 */
export async function spendSilk(actor, cost, reason = "") {
  if (!cost) return { ok: true, advice: false };
  if (setting(SETTINGS.autoSilk, true) === false) return { ok: true, advice: true };
  if (silkOf(actor) < cost) {
    ui.notifications?.warn(`${actor.name} needs ${cost} SP for ${reason || "that"} (has ${silkOf(actor)}).`);
    return { ok: false };
  }
  const ops = ns().actorOps;
  try {
    if (typeof ops?.spendSilk === "function") {
      const res = await ops.spendSilk(actor, cost, { reason });
      return { ok: res !== false, advice: false };
    }
    if (!actor.isOwner) { ui.notifications?.warn(`You can't spend ${actor.name}'s Silk.`); return { ok: false }; }
    await actor.update({ "system.silk.value": silkOf(actor) - cost });
    return { ok: true, advice: false };
  } catch (e) {
    console.error("Heisty Spideys | spendSilk failed", e);
    ui.notifications?.error("Couldn't spend the Silk Points — nothing was changed.");
    return { ok: false };
  }
}

/** Award SP (earned Silk may exceed the starting total). */
export async function earnSilk(actor, sp, reason = "") {
  const ops = ns().actorOps;
  try {
    if (typeof ops?.earnSilk === "function") return await ops.earnSilk(actor, sp, { reason });
    if (actor.isOwner) return await actor.update({ "system.silk.value": silkOf(actor) + sp });
  } catch (e) { console.error("Heisty Spideys | earnSilk failed", e); }
  return null;
}

/** Queue a bonus/penalty on an actor's next roll (WP-A pending). Returns true when queued. */
export async function addPending(target, bonus, { sourceActor = null, ability = "" } = {}) {
  const entry = { id: foundry.utils.randomID(), dice: 0, diff: 0, capped: true, skills: [], jobOnly: false, expires: "nextRoll", serial: 0, label: "", source: "", ...bonus };
  const ops = ns().actorOps;
  try {
    if (typeof ops?.addPending === "function") { await ops.addPending(target, entry, { sourceActor, ability }); return true; }
    const list = target?.system?.heist?.pending;
    if (Array.isArray(list) && target.isOwner) {
      // "Only one spider can Assist a given roll": the latest Assist replaces an earlier one.
      const keep = entry.source === "assist" ? list.filter(p => p.source !== "assist") : list;
      await target.update({ "system.heist.pending": [...keep.map(p => ({ ...p })), entry] });
      return true;
    }
  } catch (e) { console.error("Heisty Spideys | addPending failed", e); }
  return false;
}

/** Run a GM op (WP-C transport). Throws a readable error when no GM is reachable. */
export async function gmRun(op, args) {
  const gm = ns().gm;
  if (typeof gm?.run !== "function") throw new Error("The Storyteller isn't connected — nothing was changed.");
  return gm.run(op, args);
}

/** The heist clock, or a freeplay stand-in. */
export function clockNow() {
  try {
    const c = ns().heist?.clock?.();
    if (c) return c;
  } catch (e) { /* none */ }
  return { heistId: "freeplay", phase: "idle", sceneSerial: 0, obstacleSerial: 0, roundSerial: 0, round: 0 };
}

/** The current Alert value and Limit. */
export function alertNow() {
  const a = ns().alert;
  const value = Number(a?.value ?? 0) || 0;
  const limit = Number(a?.limit ?? 8) || 8;
  return { value, limit, state: HEISTY.getAlertState(value, limit) };
}

/** Does a connected non-GM user own this actor? */
export const hasActivePlayerOwner = actor => !!game.users?.some(u => u.active && !u.isGM && actor?.testUserPermission?.(u, "OWNER"));

/** Is this client the one active GM? */
export const isActiveGM = () => !!game.user?.isGM && (game.users?.activeGM?.id ?? game.user.id) === game.user.id;

/** Actor from a uuid, synchronously where possible. */
export function actorFrom(uuid) {
  if (!uuid) return null;
  try { return fromUuidSync(uuid) ?? null; } catch (e) { return null; }
}

/** Roll N d6 (at least 0) and return {roll, faces}. Shows Dice So Nice when present. */
export async function rollDice(n, { show = false } = {}) {
  if (n <= 0) return { roll: null, faces: [] };
  const roll = new Roll(`${n}d6`);
  await roll.evaluate();
  const faces = roll.dice[0].results.filter(r => r.active !== false).map(r => r.result);
  if (show) try { await game.dice3d?.showForRoll?.(roll, game.user, true); } catch (e) { /* cosmetic */ }
  return { roll, faces };
}

/**
 * Write a new card state onto its message: directly when this client may
 * (author or GM), else through the `card.patch` GM op.
 */
export async function updateCard(message, next) {
  const content = await renderCardContent(next);
  if (message.isOwner) return message.update(cardUpdateData(next, content));
  const prev = getCard(message);
  const patch = diffPatch(prev, next);
  return gmRun(OPS.cardPatch, { messageId: message.id, patch, expectVersion: prev?.version ?? 0 });
}

/** Re-read the card from the message and stamp the next version. */
const bump = card => ({ ...card, version: (Number(card.version) || 0) + 1 });

/* -------------------------------------------- */
/*  Consequences                                */
/* -------------------------------------------- */

/**
 * Finalize a check card (Accept, the spider's next roll, End Round). Only the
 * status changes here; the active GM applies the consequences on update.
 */
export async function finalizeCard(message) {
  const card = getCard(message);
  if (!card || card.kind !== CARD.check || card.consequences?.status === "final") return;
  const next = bump(recomputeCard(card));
  next.consequences.status = "final";
  return updateCard(message, next);
}

/** Finalize every pending check card of one actor (before its next roll). */
export async function finalizeActorCards(actorUuid, { except = null } = {}) {
  const msgs = (game.messages?.contents ?? []).slice(-60);
  for (const m of msgs) {
    const c = getCard(m);
    if (!c || c.kind !== CARD.check || c.actorUuid !== actorUuid || m.id === except) continue;
    if (c.consequences?.status === "final") continue;
    if (!m.isOwner) continue; // the GM finalizes the rest at End Round
    try { await finalizeCard(m); } catch (e) { console.warn("Heisty Spideys | finalize failed", e); }
  }
}

/** GM: finalize every pending check card (End Round). */
export async function finalizePending() {
  if (!game.user?.isGM) return;
  const msgs = (game.messages?.contents ?? []).slice(-200);
  for (const m of msgs) {
    const c = getCard(m);
    if (c?.kind === CARD.check && c.consequences?.status !== "final") {
      try { await finalizeCard(m); } catch (e) { console.warn("Heisty Spideys | finalize failed", e); }
    }
  }
}

const applying = new Set();

/** Active GM: apply a final card's consequences once (hit, −1 die, capture). */
async function applyFinalConsequences(message) {
  const card = getCard(message);
  const c = card?.consequences;
  if (!card || card.kind !== CARD.check || c?.status !== "final" || c.applied) return;
  if (applying.has(message.id)) return;
  applying.add(message.id);
  try {
    const actor = actorFrom(card.actorUuid);
    const next = structuredClone(card);
    const nc = next.consequences;
    const penalty = nc.swap?.kind === "penalty" || (!nc.swap && nc.partialCost === "penalty");
    if (penalty && actor) {
      const ok = await addPending(actor, { dice: -1, capped: false, label: "−1 die (a Partial's cost)", source: "partial" });
      nc.penaltyApplied = ok;
      if (!ok) ChatMessage.create({ content: `<p><strong>${actor.name}</strong>: −1 die on the next roll (a Partial's cost).</p>`, whisper: game.users.filter(u => u.isGM).map(u => u.id), speaker: { alias: "Heisty Spideys" } });
    }
    if (nc.swap?.kind === "drop" && actor) {
      try { await ns().heist?.dropLoot?.(actor.id, { messageId: message.id }); } catch (e) { console.warn(e); }
    }
    if (nc.hit && !nc.hitMessageId && actor && !nc.caught) {
      const m = await HitFlow.hitFromConsequence(nc.hit, actor, { sourceMessageId: message.id });
      if (m) nc.hitMessageId = m.id;
    }
    if (nc.caught && actor && setting(SETTINGS.autoCapture, true) !== false && actor.system?.vitality?.state !== "out") {
      await HitFlow.setVitality(actor, "out", "caught");
    }
    nc.applied = true;
    next.version = (Number(card.version) || 0) + 1;
    await message.update(cardUpdateData(next, await renderCardContent(next)));
  } catch (e) {
    console.error("Heisty Spideys | applying consequences failed", e);
  } finally {
    applying.delete(message.id);
  }
}

/* -------------------------------------------- */
/*  Viewer and buttons                          */
/* -------------------------------------------- */

/** Crew spiders this user may react with (reaction windows: this round). */
function viewerCrew(card) {
  if (game.user.isGM) return [];
  const clock = clockNow();
  if (card.roundSerial != null && clock.heistId !== "freeplay" && card.roundSerial !== clock.roundSerial) return [];
  if (clock.heistId === "freeplay" && card.consequences?.status === "final") return [];
  const crewIds = new Set((ns().heist?.state?.crew ?? []).map(c => c.actorId));
  return (game.actors?.contents ?? [])
    .filter(a => a.type === "spider" && a.isOwner && (!crewIds.size || crewIds.has(a.id)))
    .map(a => {
      const keys = abilityKeysOf(a);
      const available = {};
      for (const k of [ABILITY_KEYS.thatsNotWhatHappened, ABILITY_KEYS.plausibleDeniability, ABILITY_KEYS.abortAbort]) available[k] = abilityAvailable(a, k);
      return { actorId: a.id, name: a.name, keys, silk: silkOf(a), available };
    });
}

/** That's Not What Happened also works on a roll the ST made for an NPC, when it raised the Alert. */
function threatReactions(card) {
  if ((card.alert?.cancels ?? []).length || cardAlertDelta(card.alert) <= 0) return [];
  const out = [];
  for (const c of viewerCrew(card)) {
    if (!c.keys.includes(ABILITY_KEYS.thatsNotWhatHappened) || c.available[ABILITY_KEYS.thatsNotWhatHappened] === false) continue;
    const poor = setting(SETTINGS.autoSilk, true) !== false && c.silk < SILK_COSTS.thatsNotWhatHappened;
    out.push({ action: "cancel", value: "thatsNotWhatHappened", actorId: c.actorId, label: `That's Not What Happened (2 SP) — ${c.name}`, disabled: poor });
  }
  return out;
}

/** The buttons for one viewer on one card. */
export function buttonsFor(message, card) {
  const actor = actorFrom(card.actorUuid);
  const gm = game.user.isGM;
  const autoSilk = setting(SETTINGS.autoSilk, true) !== false;
  const mode = card.alertMode === "manual" ? "manual" : alertMode();
  const out = [];
  switch (card.kind) {
    case CARD.check: {
      const keys = abilityKeysOf(actor);
      const available = { [ABILITY_KEYS.runItAgain]: abilityAvailable(actor, ABILITY_KEYS.runItAgain) };
      const contingency = ns().heist?.state?.contingency;
      // The GM gets the roller's own buttons only for spiders no connected player owns.
      out.push(...cardActions(card, {
        isGM: gm, isOwner: !!actor?.isOwner && (!gm || !hasActivePlayerOwner(actor)), silk: silkOf(actor), abilityKeys: keys,
        available, alertMode: mode, autoSilk, crew: viewerCrew(card), contingencyOpen: !!contingency && !contingency.used
      }));
      // GM hit candidates (autoHits = prompt).
      if (gm && card.consequences?.status !== "final" && !card.consequences?.hitMessageId) {
        for (const [i, e] of (card.consequences?.candidates ?? []).entries())
          out.push({ action: "hitCandidate", value: String(i), label: `Hit: ${e.name} (${e.label} ${e.pool})`, cls: `gm${i === 0 ? " suggested" : ""}` });
      }
      if (gm && card.consequences?.status === "final" && !card.consequences?.applied && !isActiveGM())
        out.push({ action: "noop", label: "Waiting for the active GM…", cls: "subtle", disabled: true });
      break;
    }
    case CARD.threat:
      out.push(...threatReactions(card));
      if (gm && mode !== "manual") {
        out.push({ action: "trigger", value: "spotted", label: "Spotted +1", cls: "gm" });
        out.push({ action: "trigger", value: "confirmed", label: "Confirmed +2", cls: "gm" });
      }
      break;
    case CARD.attack:
      out.push(...HitFlow.attackButtons(message, card));
      break;
    case CARD.shrug:
      out.push(...HitFlow.shrugButtons(message, card));
      break;
  }
  // Manual mode (no ledger): the GM's old Alert buttons, the suggested one highlighted.
  if (gm && mode === "manual" && (card.kind === CARD.check || card.kind === CARD.threat)) {
    const suggested = card.kind === CARD.check ? cardAlertDelta(card.alert) : null;
    const deltas = card.kind === CARD.check ? [-1, 1, 2] : [1, 2];
    for (const d of deltas) out.push({ action: "legacyAlert", value: String(d), label: `Alert ${d > 0 ? "+" : "−"}${Math.abs(d)}`, cls: `gm alert${suggested === d ? " suggested" : ""}` });
  }
  return out;
}

function renderButtons(container, message, card) {
  container.replaceChildren();
  let buttons;
  try { buttons = buttonsFor(message, card); } catch (e) { console.error("Heisty Spideys | card buttons", e); return; }
  if (!buttons.length) { container.remove(); return; }
  const own = buttons.filter(b => !String(b.cls ?? "").includes("gm"));
  const gmB = buttons.filter(b => String(b.cls ?? "").includes("gm"));
  for (const [list, cls] of [[own, "hrc-actions-row"], [gmB, "hrc-actions-row gm-row"]]) {
    if (!list.length) continue;
    const row = document.createElement("div");
    row.className = cls;
    if (cls.includes("gm")) {
      const lbl = document.createElement("span");
      lbl.className = "hrc-actions-label";
      lbl.innerHTML = `<i class="fa-solid fa-user-secret"></i> ST`;
      row.appendChild(lbl);
    }
    for (const b of list) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `heisty-card-btn ${b.cls ?? ""}`.trim();
      btn.dataset.action = b.action;
      if (b.value != null) btn.dataset.value = b.value;
      if (b.actorId) btn.dataset.actorId = b.actorId;
      if (b.title) btn.title = b.title;
      if (b.disabled) btn.disabled = true;
      btn.textContent = b.label;
      btn.addEventListener("click", ev => {
        ev.preventDefault();
        btn.disabled = true;
        onAction(message.id, b, btn).catch(err => {
          console.error("Heisty Spideys | card action failed", err);
          ui.notifications?.error(err?.message ?? String(err));
        }).finally(() => { if (btn.isConnected) btn.disabled = false; });
      });
      row.appendChild(btn);
    }
    container.appendChild(row);
  }
}

/* -------------------------------------------- */
/*  Actions                                     */
/* -------------------------------------------- */

/** Pick a threat attack: engaged candidates first, then threats on the scene/directory. */
export async function pickAttacker(card, { title = "Which threat lands the hit?" } = {}) {
  const options = [];
  for (const e of card.ctx?.engaged ?? []) options.push({ ...e });
  const seen = new Set(options.map(o => o.uuid));
  const add = a => {
    if (!a || a.type !== "threat" || seen.has(a.uuid)) return;
    seen.add(a.uuid);
    const idx = HitFlow.attackIndex(a);
    if (idx < 0) return;
    const r = a.system.rolls[idx];
    options.push({ uuid: a.uuid, name: a.name, label: r.label || "Attack", pool: r.pool, index: idx });
  };
  try { for (const t of game.scenes?.viewed?.tokens ?? []) add(t.actor); for (const a of game.actors ?? []) add(a); } catch (e) { /* none */ }
  if (!options.length) { ui.notifications?.warn("No threat with an attack pool to pick."); return null; }
  const best = strongestAttacker(card.ctx?.engaged ?? []);
  const content = `<div class="form-group"><label>Attacker</label><select name="attacker">${options.map((o, i) =>
    `<option value="${i}" ${best && o.uuid === best.uuid && o.index === best.index ? "selected" : ""}>${foundry.utils.escapeHTML?.(o.name) ?? o.name} — ${o.label} (${o.pool}d6)</option>`).join("")}</select></div>`;
  const choice = await foundry.applications.api.DialogV2.prompt({
    window: { title }, content, rejectClose: false,
    classes: ["heisty-spideys", "themed", "theme-light"],
    ok: { label: "Land the hit", callback: (event, button) => button.form.elements.attacker.value }
  });
  if (choice == null) return null;
  return options[Number(choice)] ?? null;
}

async function promptText(title, label) {
  return foundry.applications.api.DialogV2.prompt({
    window: { title }, rejectClose: false,
    classes: ["heisty-spideys", "themed", "theme-light"],
    content: `<div class="form-group"><label>${label}</label><input type="text" name="text" autofocus /></div>`,
    ok: { label: "OK", callback: (event, button) => button.form.elements.text.value }
  });
}

/** Handle one button click. */
async function onAction(messageId, b, btn) {
  const message = game.messages.get(messageId);
  if (!message) return;
  const card = getCard(message);
  if (!card) return;
  const actor = actorFrom(card.actorUuid);
  const action = b.action;

  if (card.kind === CARD.attack || card.kind === CARD.shrug) return HitFlow.onAction(message, card, b);

  if (action === "legacyAlert") {
    if (!game.user.isGM) return;
    return ns().alert?.applyDelta?.(Number(b.value));
  }

  if (card.kind === CARD.threat) {
    if (action === "trigger" && game.user.isGM) return doTrigger(message, card, b.value);
    if (action === "cancel" && threatReactions(card).some(x => x.actorId === b.actorId)) return doCancel(message, card, b.value, b.actorId);
    return;
  }

  // Re-validate against the live card.
  const live = cardActions(card, {
    isGM: game.user.isGM, isOwner: !!actor?.isOwner, silk: silkOf(actor), abilityKeys: abilityKeysOf(actor),
    alertMode: alertMode(), autoSilk: setting(SETTINGS.autoSilk, true) !== false, crew: viewerCrew(card),
    contingencyOpen: true
  });
  const ok = ["hitCandidate", "noop"].includes(action) || live.some(x => x.action === action && (x.value == null || String(x.value) === String(b.value ?? "")) && (!b.actorId || x.actorId === b.actorId));
  if (!ok) { ui.notifications?.warn("That's no longer available on this card."); return; }

  switch (action) {
    case "reroll": return doReroll(message, card, actor, "silk");
    case "wolf": return doReroll(message, card, actor, "wolf");
    case "silverTongue": return doReroll(message, card, actor, "silverTongue");
    case "clutch": return doClutch(message, card, actor);
    case "accept": return finalizeCard(message);
    case "cancel": return doCancel(message, card, b.value, b.actorId);
    case "trigger": return doTrigger(message, card, b.value);
    case "noConsequence": {
      const next = recomputeCard({ ...card, consequences: { ...card.consequences, noConsequence: true } });
      return updateCard(message, bump(next));
    }
    case "swap": return doSwap(message, card, b.value);
    case "hit": {
      const atk = await pickAttacker(card);
      if (!atk) return;
      return hitNow(message, card, actor, atk);
    }
    case "hitCandidate": {
      const atk = card.consequences?.candidates?.[Number(b.value)];
      if (!atk) return;
      if (card.roll.result === "partial") return doSwap(message, card, "hit", atk);
      return hitNow(message, card, actor, atk);
    }
    case "spectacular": {
      if (!actor) return;
      await earnSilk(actor, 1, "Spectacular Failure");
      const next = bump(structuredClone(card));
      next.silk = next.silk ?? { spent: [], earned: [] };
      (next.silk.earned ??= []).push({ type: "spectacular", sp: 1, label: "Spectacular Failure" });
      return updateCard(message, next);
    }
    case "contingency": {
      const next = structuredClone(card);
      next.roll.contingency = true;
      next.roll.preContingencyResult = next.roll.result;
      next.roll.result = "success";
      next.consequences = { ...next.consequences, hit: null, caught: false, partialCost: null, swap: null, candidates: [] };
      try { await ns().heist?.useContingency?.({ messageId: message.id, actorId: actor?.id }); } catch (e) { console.warn(e); }
      return updateCard(message, bump(recomputeCard(next)));
    }
  }
}

/** Silk Reroll, Run It Again or Silver Tongue on a check card. */
async function doReroll(message, card, actor, by) {
  if (!actor?.isOwner) return;
  if (!canReroll(card, by)) return ui.notifications?.warn("That reroll isn't open on this roll.");
  const r = card.roll;
  let spent = null;
  if (by === "silk") {
    const res = await spendSilk(actor, SILK_COSTS.reroll, "a Reroll");
    if (!res.ok) return;
    spent = { type: "reroll", cost: SILK_COSTS.reroll, label: "Reroll", advice: !!res.advice };
  }
  let indices, faces, newFaces;
  if (by === "silverTongue") {
    const n = r.botch ? 1 : r.faces.length;
    ({ faces: newFaces } = await rollDice(n, { show: true }));
    indices = newFaces.map((_, i) => i);
    faces = newFaces;
  } else {
    indices = rerollIndices(r.faces, by === "silk" ? SILK_REROLL_MAX : Infinity);
    ({ faces: newFaces } = await rollDice(indices.length, { show: true }));
    faces = applyReroll(r.faces, indices, newFaces);
  }
  const next = structuredClone(card);
  const res = resolveRoll(faces, r.difficulty, { botch: r.botch });
  next.roll.rerolls = [...(r.rerolls ?? []), { by, indices, faces: newFaces, from: r.result }];
  next.roll.faces = faces;
  next.roll.successes = res.successes;
  next.roll.result = res.result;
  if (spent) { next.silk = next.silk ?? { spent: [], earned: [] }; (next.silk.spent ??= []).push(spent); }
  if (by === "wolf") await markUsed(actor, ABILITY_KEYS.runItAgain);
  if (by === "silverTongue") await markUsed(actor, ABILITY_KEYS.silverTongue);
  const out = bump(recomputeCard(next));
  await updateCard(message, out);
  Hooks.callAll(HOOKS.rollResolved, message, out);
  return out;
}

async function doClutch(message, card, actor) {
  if (!actor?.isOwner || !canClutch(card)) return;
  const res = await spendSilk(actor, SILK_COSTS.clutch, "a Silk Clutch");
  if (!res.ok) return;
  const next = applyClutch(card);
  next.silk = next.silk ?? { spent: [], earned: [] };
  (next.silk.spent ??= []).push({ type: "clutch", cost: SILK_COSTS.clutch, label: "Silk Clutch", advice: !!res.advice });
  const out = bump(recomputeCard(next));
  await updateCard(message, out);
  Hooks.callAll(HOOKS.rollResolved, message, out);
  return out;
}

/** A crew reaction that cancels the event's Alert (via WP-C's alert.cancel). */
async function doCancel(message, card, key, actorId) {
  const reactor = game.actors.get(actorId);
  if (!reactor?.isOwner) return;
  const abilityKey = { thatsNotWhatHappened: ABILITY_KEYS.thatsNotWhatHappened, plausibleDeniability: ABILITY_KEYS.plausibleDeniability, abortAbort: ABILITY_KEYS.abortAbort }[key];
  const viaGM = typeof ns().gm?.run === "function";
  if (viaGM) {
    await gmRun(OPS.alertCancel, { eventId: card.eventId, ability: key, abilityKey, actorId, messageId: message.id });
  } else {
    // Degraded (no heist runtime): pay and stamp locally.
    if (key === "thatsNotWhatHappened") {
      const res = await spendSilk(reactor, SILK_COSTS.thatsNotWhatHappened, "That's Not What Happened");
      if (!res.ok) return;
    }
    await markUsed(reactor, abilityKey);
  }
  const fresh = getCard(game.messages.get(message.id)) ?? card;
  if ((fresh.alert?.cancels ?? []).some(c => c.key === key)) return;
  const next = bump(structuredClone(fresh));
  next.alert.cancels = [...(next.alert.cancels ?? []), { key, by: actorId, src: "reaction" }];
  try { await updateCard(message, next); }
  catch (e) { if (!viaGM) ui.notifications?.warn(`${e.message} Ask the Storyteller to note it on the card.`); else throw e; }
  const line = {
    thatsNotWhatHappened: "That's Not What Happened. The Alert that roll would have caused is cancelled" + (isFailed(fresh.roll?.result) ? " — but a failed roll still made no progress, and the ST may still charge a cost that isn't Alert." : "."),
    plausibleDeniability: "Plausible Deniability: that single point of Alert is talked away.",
    abortAbort: "Abort, Abort! The crew retreats without the Alert that failure would have added — this spider leaves the obstacle unpassed."
  }[key];
  ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: reactor }), content: `<p class="heisty-reaction"><strong>${reactor.name}</strong>: ${line}</p>` });
}

const GM_TRIGGERS = { spotted: { delta: 1, label: "Spotted" }, confirmed: { delta: 2, label: "Confirmed alert" }, loud: { delta: 2, label: "Loud Failure" } };

/** GM: add (or remove, on a second click) Spotted / Confirmed / Loud on the same event. */
async function doTrigger(message, card, key) {
  if (!game.user.isGM || !GM_TRIGGERS[key]) return;
  const next = bump(structuredClone(card));
  next.alert = next.alert ?? { triggers: [], cancels: [] };
  const had = next.alert.triggers.some(t => t.key === key && t.src === "gm");
  next.alert.triggers = had ? next.alert.triggers.filter(t => !(t.key === key && t.src === "gm"))
    : [...next.alert.triggers, { key, ...GM_TRIGGERS[key], src: "gm" }];
  return updateCard(message, next);
}

const SWAP_TEXT = { penalty: "−1 die on the next roll", drop: "drops an item or the loot", hit: "a hit from an engaged threat", custom: "" };

/** GM: swap a Partial's default +1 for another cost of the same size. */
async function doSwap(message, card, kind, attacker = null) {
  if (!game.user.isGM || card.roll?.result !== "partial") return;
  const next = structuredClone(card);
  let text = SWAP_TEXT[kind];
  if (kind === "custom") {
    text = await promptText("Partial: the complication", "What it costs instead of the noise");
    if (!text) return;
  }
  next.consequences = { ...next.consequences, swap: { kind, text } };
  if (kind === "hit") {
    const atk = attacker ?? await pickAttacker(card);
    if (!atk) return;
    next.consequences.hit = { ...atk, manual: true };
    next.consequences.swap.text = `a hit from ${atk.name} (${atk.label} ${atk.pool})`;
  } else next.consequences.hit = null;
  return updateCard(message, bump(recomputeCard(next)));
}

/** GM: an engaged threat lands a hit now (opens the attack card). */
async function hitNow(message, card, actor, atk) {
  if (!game.user.isGM || !actor) return;
  const m = await HitFlow.hitFromConsequence(atk, actor, { sourceMessageId: message.id });
  if (!m) return;
  const next = bump(structuredClone(card));
  next.consequences = { ...next.consequences, hit: { ...atk, manual: true }, hitMessageId: m.id, candidates: [] };
  return updateCard(message, next);
}

/* -------------------------------------------- */
/*  GM ops                                      */
/* -------------------------------------------- */

const userOf = (args, ctx) => game.users.get(ctx?.user?.id ?? ctx?.id ?? ctx?.userId ?? args?.userId) ?? null;

/** card.patch: whitelisted fields, optimistic version. */
export const cardPatchOp = {
  check(args, ctx) {
    const user = userOf(args, ctx);
    const message = game.messages.get(args?.messageId);
    const card = getCard(message);
    if (!user || !message || !card || !WPB_KINDS.includes(card.kind)) return "No such card.";
    if (user.isGM) return true;
    const actor = actorFrom(card.actorUuid);
    const target = card.kind === CARD.attack ? actorFrom(card.attack?.targetUuid) : null;
    const ownsActor = a => !!a && a.testUserPermission?.(user, "OWNER");
    if (ownsActor(actor) || ownsActor(target)) return true;
    // A crew reaction may only add its own cancel to the Alert block.
    const keys = Object.keys(args.patch ?? {});
    if (keys.length === 1 && keys[0] === "alert") {
      const added = (args.patch.alert.cancels ?? []).filter(c => !(card.alert?.cancels ?? []).some(o => o.key === c.key));
      const sameTriggers = JSON.stringify(args.patch.alert.triggers ?? []) === JSON.stringify(card.alert?.triggers ?? []);
      if (sameTriggers && added.length === 1 && ownsActor(game.actors.get(added[0].by))) return true;
    }
    return "You can't change that card.";
  },
  async apply(args) {
    const message = game.messages.get(args.messageId);
    const next = applyPatch(getCard(message), args.patch, args.expectVersion);
    await message.update(cardUpdateData(next, await renderCardContent(next)));
    return { version: next.version };
  }
};

/** Register WP-B's GM ops on WP-C's registry (if present). */
export function registerCardOps(gm) {
  if (typeof gm?.register !== "function") return false;
  gm.register(OPS.cardPatch, cardPatchOp);
  gm.register(OPS.hitRetarget, HitFlow.retargetOp);
  gm.register(OPS.uiForcedRoll, HitFlow.forcedRollOp);
  return true;
}

/* -------------------------------------------- */
/*  Hooks                                       */
/* -------------------------------------------- */

let registered = false;

/** Chat listeners: buttons per viewer, legacy cards, GM consequence application. */
export function registerCardActions() {
  if (registered) return;
  registered = true;

  Hooks.on("renderChatMessageHTML", (message, html) => {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;
    const card = getCard(message);
    if (card && WPB_KINDS.includes(card.kind)) {
      const container = root.querySelector("[data-heisty-actions]");
      if (container) renderButtons(container, message, card);
      return;
    }
    // Pre-1.8 cards: the GM's ±Alert buttons, hidden from players.
    const controls = root.querySelector(".hrc-alert-controls");
    if (controls && !game.user.isGM) { controls.remove(); return; }
    root.querySelectorAll("[data-heisty-alert]").forEach(btn => {
      btn.addEventListener("click", async ev => {
        ev.preventDefault();
        if (!game.user.isGM) return;
        await ns().alert?.applyDelta?.(Number(ev.currentTarget.dataset.heistyAlert));
      });
    });
  });

  // The active GM applies consequences once a card is final, and auto-rolls shrug-offs.
  Hooks.on("updateChatMessage", message => {
    if (!isActiveGM()) return;
    const card = getCard(message);
    if (card?.kind === CARD.check && card.consequences?.status === "final" && !card.consequences.applied) applyFinalConsequences(message);
  });
  Hooks.on("createChatMessage", message => {
    if (!isActiveGM()) return;
    const card = getCard(message);
    if (card?.kind === CARD.check && card.consequences?.status === "final" && !card.consequences.applied) applyFinalConsequences(message);
    if (card?.kind === CARD.attack) HitFlow.onAttackCreated(message, card);
  });
  // End Round finalizes pending consequences (WP-C fires the hook).
  Hooks.on(HOOKS.roundEnded, () => { if (isActiveGM()) finalizePending(); });
}

