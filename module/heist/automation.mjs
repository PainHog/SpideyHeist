/**
 * HEISTY SPIDEYS — Heist automation (design §1, §3.1–3.13, §8; WP-C runtime)
 * ---------------------------------------------------------------------------
 * The active GM's client reacts to documents and does the bookkeeping:
 *
 *  - roll cards (WP-B's `check` / `threat` / `assist` cards) → the Alert ledger
 *    (one event, one trigger; reroll/Clutch/GM buttons re-mirror the card),
 *    obstacle progress, group checks, Casing, who has acted, the Rat's deal,
 *    the guard being spotted, the parrot's sight, the Heist 5 sleeper;
 *  - after every fold → creature Escalation (activation, hunting, spikes), Full
 *    Alert (the objective out of reach), the band's "Describe it" prompt,
 *    procedures at an Alert threshold, the Exterminator and humans' prompts;
 *  - End Round → creatures' +X, procedures and timers, group closes, Flaws due,
 *    the quiet-round recovery prompt, the five-round stall, the clock (a Mid-Heist
 *    Complication as the crew starts round 3);
 *  - Next obstacle → gap recovery, ledger compaction, Waiting Web arrivals, a
 *    guard's backup, squeezes, procedures, information-Perk prompts;
 *  - a spider Out (updateActor) → +2 (capture +3), loot lost, token hidden,
 *    the Loss check, the Waiting Web;
 *  - the GM ops of §8 that belong to this package, and the heist chat cards.
 *
 * Every rule lives in the pure modules (logic/*.mjs); this file only wires them
 * to Foundry. Nothing here runs on a client that isn't the active GM, except the
 * card buttons (which go through GM ops) and the tracker.
 */

import { SYSTEM_ID, FLAG, SETTINGS, HOOKS, OPS, CARD } from "../contracts.mjs";
import { HEISTY } from "../config.mjs";
import * as flow from "../logic/heist-flow.mjs";
import { HEISTS, findHeist, proceduresFor } from "../logic/heist-catalog.mjs";
import {
  CREATURE_AUTOMATION, HUMAN_ROWS, creatureDef, resolveCreatureKey, escalationEvents, dealGoesBad,
  spotted, creatureStatus, canCallExterminator, newCreatureState, payOff, shutIn, beat, driveOff, slug
} from "../logic/creatures.mjs";
import { complicationEffect, MID_HEIST } from "../logic/complications.mjs";
import {
  findEvent, hasEvent, canCancel, canPlausibleDeniability, canDamageControl, isSpike, eventDelta,
  compact, setEntry, describeEntry
} from "../logic/alert-ledger.mjs";
import { gm, isActiveGM, ownsActor, registerGmQueries, registerGmSocket } from "../net/gm-ops.mjs";
import { store, heistApi, roleKeyOf } from "./store.mjs";
import { registerHeistSettings, setting, SETTING_LANG_KEYS } from "./settings.mjs";
import { HeistyAlert } from "../helpers/alert.mjs";
import * as procs from "./procedures.mjs";
import * as waitingWeb from "./waiting-web.mjs";
import { hideTokens, onUpdateToken, onPreUpdateToken } from "./tokens.mjs";
import { HeistTracker } from "../apps/heist-tracker.mjs";

/* ------------------------------------------------------------------ utils -- */

const api = () => globalThis.game?.heistySpideys ?? {};
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const gmIds = () => game.users.filter(u => u.isGM).map(u => u.id);
const inPlay = s => s?.phase === "heist" || s?.phase === "escape";
const renderTemplate = (path, data) => foundry.applications.handlebars.renderTemplate(path, data);
const PASSING = ["partial", "success", "critical"];
const FAILED = ["failure", "cleanfail", "botch"];
const ST_FLAWS = ["overconfident", "dramatic", "allergic-to-dust", "compulsive-planner", "butterfingers", "easily-distracted", "show-off"];

/** Kinds this package renders. */
export const HEIST_CARD_KINDS = Object.freeze([CARD.group, CARD.request, CARD.alertEvent, CARD.complication, CARD.procedure, CARD.flaw, CARD.prompt, CARD.debrief]);
const MY_KINDS = new Set(HEIST_CARD_KINDS);

const TEMPLATE_DIR = "systems/heisty-spideys/templates/chat/heist";
const TEMPLATES = {
  [CARD.group]: `${TEMPLATE_DIR}/group-card.hbs`,
  [CARD.request]: `${TEMPLATE_DIR}/request-card.hbs`,
  [CARD.alertEvent]: `${TEMPLATE_DIR}/alert-event-card.hbs`,
  [CARD.complication]: `${TEMPLATE_DIR}/complication-card.hbs`,
  [CARD.procedure]: `${TEMPLATE_DIR}/procedure-card.hbs`,
  [CARD.flaw]: `${TEMPLATE_DIR}/flaw-card.hbs`,
  [CARD.prompt]: `${TEMPLATE_DIR}/prompt-card.hbs`,
  [CARD.debrief]: `${TEMPLATE_DIR}/debrief-card.hbs`
};

const getCard = m => m?.flags?.[FLAG]?.card ?? null;

function actorIdOf(card) {
  if (card?.actorId) return card.actorId;
  const uuid = String(card?.actorUuid ?? "");
  const m = uuid.match(/Actor\.([A-Za-z0-9]+)$/);
  return m ? m[1] : null;
}

function itemSlugs(actor) {
  return (actor?.items ?? []).map(i => i.system?.key || slug(i.name));
}

const hasPerk = (actor, key) => itemSlugs(actor).includes(key);

function skillLabel(k) { return HEISTY.skills[k]?.label ?? k; }

function approachLabel(a) {
  if (!a) return "";
  const skills = (a.skills ?? []).map(skillLabel).join(" / ");
  const opp = a.opposed ? `, opposed (${a.opposed.roll}${a.opposed.pool ? ` ${a.opposed.pool}` : ""})` : ` (${a.difficulty})`;
  return `${skills}${opp}${a.alertOnUse ? `, +${a.alertOnUse} Alert` : ""}`;
}

/* ------------------------------------------------------------------ cards -- */

/** Precomputed template data per card kind (no new Handlebars helpers). */
function cardContext(card) {
  const ctx = { ...card, isGM: !!game.user?.isGM };
  const s = store.state;
  switch (card.kind) {
    case CARD.group: {
      const g = s.groups?.[card.groupId];
      const rolled = g?.results ?? {};
      ctx.spiders = (card.expected ?? []).map(id => {
        const a = game.actors.get(id);
        const r = rolled[id]?.result ?? null;
        return { actorId: id, name: a?.name ?? "?", img: a?.img ?? "", rolled: !!r, result: r, passed: PASSING.includes(r), resultLabel: r ? (HEISTY.results[r]?.label ?? r) : "" };
      });
      ctx.closed = !!g?.closed;
      ctx.opposedText = g?.opposed && g.opposed.roundSerial === s.roundSerial ? `${card.opposedName ?? "The creature"} rolled ${g.opposed.successes}: Difficulty ${g.opposed.difficulty} for everyone this round.` : "";
      ctx.canOppose = !!card.opposedPool && !ctx.opposedText && !ctx.closed;
      ctx.leader = g?.ledBy ? (game.actors.get(g.ledBy)?.name ?? "") : "";
      // Drafting: a Wheelman with Drafting who leads a group check on the move.
      ctx.leaderChoices = (card.expected ?? []).filter(id => hasPerk(game.actors.get(id), "drafting")).map(id => ({ id, name: game.actors.get(id)?.name ?? "?", selected: g?.ledBy === id }));
      ctx.canLead = ctx.leaderChoices.length > 0 && ["athletics", "acrobatics", "stealth"].includes(card.skill);
      break;
    }
    case CARD.alertEvent: {
      const dc = s.crewUsage?.damageControl;
      const mine = dc?.eventId === card.eventId;
      ctx.pledges = mine ? (dc.pledges ?? []).map(p => ({ name: game.actors.get(p.actorId)?.name ?? "?", sp: p.sp })) : [];
      ctx.pledged = ctx.pledges.reduce((n, p) => n + p.sp, 0);
      ctx.dcDone = !!(mine && dc.done);
      ctx.dcClosed = !!(dc && (dc.done || dc.eventId !== card.eventId)) || s.roundSerial !== card.roundSerial;
      ctx.nptpUsed = !!s.crewUsage?.notPartOfThePlan;
      ctx.showCrew = !ctx.dcClosed || !ctx.nptpUsed;
      break;
    }
    case CARD.complication:
      ctx.nptpUsed = !!s.crewUsage?.notPartOfThePlan;
      ctx.hasChoices = (card.choices ?? []).length > 1;
      break;
    case CARD.prompt:
      ctx.hasChecks = (card.checks ?? []).length > 0;
      ctx.hasButtons = (card.buttons ?? []).length > 0 && !card.done;
      ctx.buttons = (card.buttons ?? []).map(b => ({ ...b, argsJson: JSON.stringify(b.args ?? {}) }));
      break;
    case CARD.procedure:
      ctx.hasRows = (card.rows ?? []).length > 0;
      ctx.hasOutcomes = (card.outcomes ?? []).length > 0 && !card.chosen;
      break;
    case CARD.debrief:
      ctx.outcomeLabel = { full: "Full Success", partial: "Partial Success", loss: "Loss" }[card.outcome] ?? card.outcome;
      ctx.outcomes = ["full", "partial", "loss"].map(o => ({ value: o, label: { full: "Full Success", partial: "Partial Success", loss: "Loss" }[o], selected: o === card.outcome }));
      break;
  }
  return ctx;
}

async function renderCard(card) {
  return renderTemplate(TEMPLATES[card.kind], cardContext(card));
}

/**
 * Post a heist card.
 * @param {string} kind  a CARD kind this package renders
 * @param {object} data
 * @param {{whisperGM?:boolean, speaker?:object}} [opts]
 */
export async function postCard(kind, data = {}, { whisperGM = false, speaker = null } = {}) {
  const c = store.clock();
  const card = { v: 1, kind, version: 0, heistId: c.heistId, roundSerial: c.roundSerial, obstacleSerial: c.obstacleSerial, ...data };
  const content = await renderCard(card);
  return ChatMessage.create({
    content,
    speaker: speaker ?? { alias: "The Heist" },
    whisper: whisperGM ? gmIds() : [],
    style: CONST.CHAT_MESSAGE_STYLES.OTHER,
    flags: { [FLAG]: { card } }
  });
}

/** Re-render a heist card with a patch (GM). */
async function patchCard(message, patch) {
  const card = { ...getCard(message), ...patch };
  card.version = (Number(card.version) || 0) + 1;
  const content = await renderCard(card);
  return message.update({ content, [`flags.${FLAG}.card`]: card });
}

/** A GM-whispered prompt with one-click buttons (§5). */
export function postPrompt({ title, html = "", buttons = [], checks = [], tone = "" } = {}) {
  return postCard(CARD.prompt, { title, html, buttons, checks, tone, done: false }, { whisperGM: true });
}

function recentMessages(n = 120) {
  return (game.messages?.contents ?? []).slice(-n);
}

function findCardMessage(pred, n = 200) {
  return recentMessages(n).reverse().find(m => { const c = getCard(m); return c && pred(c, m); }) ?? null;
}

/* ------------------------------------------------------- card listeners -- */

/** The viewer's own present crew spiders (crew spends on heist cards). */
function viewerCrew() {
  const s = store.state;
  return (s.crew ?? []).filter(c => c.status === "present" || c.status === "waiting").map(c => game.actors.get(c.actorId)).filter(a => a?.isOwner && !game.user.isGM);
}

function onRenderHeistCard(message, html) {
  const card = getCard(message);
  if (!card || !MY_KINDS.has(card.kind)) return;
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root) return;
  const isGM = game.user.isGM;
  root.querySelectorAll("[data-gm-only]").forEach(el => { if (!isGM) el.remove(); });
  root.querySelectorAll("[data-owner]").forEach(el => {
    const a = game.actors.get(el.dataset.owner);
    if (!isGM && !a?.isOwner) el.remove();
  });
  root.querySelectorAll("[data-crew-only]").forEach(el => {
    const mine = viewerCrew();
    if (!mine.length) { el.remove(); return; }
    const sel = el.querySelector("select[data-crew-picker]");
    if (sel) sel.innerHTML = mine.map(a => `<option value="${a.id}">${esc(a.name)} (${Number(a.system?.silk?.value) || 0} SP)</option>`).join("");
  });
  root.querySelectorAll("[data-heist-action]").forEach(btn => {
    btn.addEventListener("click", ev => {
      ev.preventDefault();
      onCardAction(message, btn, root).catch(err => {
        console.error("Heisty Spideys | heist card action failed:", err);
        ui.notifications?.error(err.message ?? "That didn't work — see the console.");
      });
    });
  });
  root.querySelectorAll("select[data-heist-change]").forEach(sel => {
    sel.addEventListener("change", () => onCardAction(message, sel, root).catch(err => console.error(err)));
  });
}

async function onCardAction(message, el, root) {
  const card = getCard(message);
  const action = el.dataset.heistAction ?? el.dataset.heistChange;
  let args = {};
  try { args = el.dataset.args ? JSON.parse(el.dataset.args) : {}; } catch (e) { args = {}; }
  const picked = () => root.querySelector("select[data-crew-picker]")?.value ?? null;
  switch (action) {
    case "rollGroup": return rollFor(el.dataset.actorId, { skill: card.skill, approachId: card.approachId, groupId: card.groupId });
    case "rollRequest": return rollFor(card.actorId, { skill: card.skill, approachId: card.approachId });
    case "creatureRoll": return heistApi.groupOpposedRoll(card.groupId, message);
    case "closeGroup": return heistApi.closeGroup(card.groupId);
    case "leadGroup": return heistApi.setGroupLeader(card.groupId, el.value || null);
    case "chip": {
      const actorId = picked();
      if (!actorId) return;
      return gm.run(OPS.alertPledge, { eventId: card.eventId, actorId, sp: Number(el.dataset.sp) || 1, userId: game.user.id });
    }
    case "nptp": {
      const actorId = picked();
      if (!actorId) return;
      const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: "Not Part of the Plan" }, content: "<p>Spend 4 SP to negate this complication? Once per heist, for the whole crew.</p>", rejectClose: false }).catch(() => false);
      if (!ok) return;
      return gm.run(OPS.crewNptp, { ref: card.ref ?? { eventId: card.eventId }, actorId, userId: game.user.id, messageId: message.id });
    }
    case "complicationPick": {
      if (!game.user.isGM) return;
      return applyComplicationChoice(message, card, el.value);
    }
    case "procOutcome":
      if (!game.user.isGM) return;
      await applyProcedureOutcome(card.procId, args.key);
      return patchCard(message, { chosen: args.key });
    case "flawRoll": {
      const actor = game.actors.get(card.actorId);
      if (!actor?.isOwner) return;
      const fn = api().dice?.rollForced;
      if (typeof fn !== "function") return ui.notifications?.info(`Roll ${card.rollLabel} from the sheet.`);
      return fn.call(api().dice, actor, card.rollSpec ?? {}, { local: true });
    }
    case "prompt": {
      if (!game.user.isGM) return;
      const checks = [...root.querySelectorAll("input[data-check]")].filter(i => i.checked).map(i => i.dataset.check);
      const done = await runPromptAction(args.do, { ...args, checks }, message);
      if (done !== false && !args.keep) await patchCard(message, { done: true, chosenLabel: el.textContent?.trim() ?? "" });
      return;
    }
    case "award": {
      if (!game.user.isGM) return;
      const outcome = root.querySelector("select[name='outcome']")?.value ?? card.outcome;
      const awards = await heistApi.awardDebrief(outcome);
      const rows = Array.isArray(awards) ? awards.map(a => ({ names: a.actorIds.map(id => game.actors.get(id)?.name ?? "?").join(" & "), ap: a.ap, half: a.half })) : card.rows;
      return patchCard(message, { awarded: true, outcome, rows });
    }
  }
}

/** Open a roll for a spider (WP-B's dice when loaded). */
async function rollFor(actorId, { skill, approachId = null, groupId = null } = {}) {
  const actor = game.actors.get(actorId);
  if (!actor) return null;
  if (!actor.isOwner) return ui.notifications?.warn(`You don't control ${actor.name}.`);
  const s = store.state;
  const opts = { approachId, groupId };
  const g = groupId ? s.groups?.[groupId] : null;
  if (g?.opposed && g.opposed.roundSerial === s.roundSerial) opts.opposed = { successes: g.opposed.successes, name: g.opposed.creature, label: "the creature's roll this round" };
  const dice = api().dice;
  if (typeof dice?.rollCheck === "function") return dice.rollCheck(actor, skill, opts);
  if (typeof dice?.skillCheck === "function") return dice.skillCheck(actor, skill, opts);
  ui.notifications?.info(`Roll ${skillLabel(skill)} from ${actor.name}'s sheet.`);
  return null;
}

/* ------------------------------------------------------ prompt actions -- */

async function runPromptAction(what, args = {}, message = null) {
  switch (what) {
    case "endRound": return heistApi.endRound();
    case "next": return heistApi.nextObstacle(args.obstacleId ?? null);
    case "escape": return heistApi.setPhase("escape");
    case "debrief": return heistApi.setPhase("debrief");
    case "reveal": return heistApi.revealIntel(args.checks?.length ? args.checks : (args.ids ?? []));
    case "recover": {
      for (const id of args.checks ?? []) await recoverActor(game.actors.get(id), store.state.obstacleSerial);
      return true;
    }
    case "stall": return heistApi.applyStall();
    case "replacement": await waitingWeb.bringReplacement(args.actorId); return true;
    case "dealBad": return heistApi.creatureAction(args.creatureId ?? creatureIdByKey("protection-rat"), "dealBad");
    case "callExterminator": return heistApi.callExterminator();
    case "proc": return runProcedureById(args.procId, "manual");
    case "fireFlaw": {
      const actor = game.actors.get(args.actorId);
      return actor ? api().abilities?.fireFlaw?.(actor, args.flawKey ?? null) : false;
    }
    case "breakOff": return heistApi.lootAction(args.lootId, "incomplete", { value: true });
    case "wake": return heistApi.creatureAction(args.creatureId, "wake");
    case "spotted": return heistApi.creatureAction(args.creatureId, "spotted");
    case "noop": return true;
    default: return false;
  }
}

function creatureIdByKey(key) {
  return (store.state.creatures ?? []).find(c => c.key === key && !c.backupOf)?.id ?? null;
}

/* ------------------------------------------------------------ Alert mirror -- */

function sameContribution(entry, patch, messageId) {
  const pick = list => JSON.stringify((list ?? []).filter(x => x.msg === messageId).map(x => [x.key, Number(x.delta) || 0]).sort());
  const groupSame = !patch.group || JSON.stringify({ c: !!entry.group?.closed, a: !!entry.group?.allCritical }) === JSON.stringify({ c: !!patch.group.closed, a: !!patch.group.allCritical });
  return pick(entry.triggers) === pick(patch.triggers) && pick(entry.cancels) === pick(patch.cancels) && groupSame;
}

/** Mirror one roll card's Alert block into the ledger (one event per roll / group). */
async function mirrorAlert(message, card) {
  if (card.alertOff) return;
  const eventId = card.eventId || card.groupId || message.id;
  const triggers = card.alert?.triggers ?? [];
  const cancels = card.alert?.cancels ?? [];
  const groupCard = !!card.groupId;
  const g = groupCard ? store.state.groups?.[card.groupId] : null;
  const patch = {
    eventId, replaceMessage: message.id,
    // In a group check one spider's cancel (Smoke and Mirrors) removes only that spider's trigger.
    triggers: groupCard && cancels.length ? [] : triggers.map(t => ({ ...t, delta: Number(t.delta) || 0, msg: message.id, src: t.src ?? "roll" })),
    cancels: groupCard ? [] : cancels.map(c => ({ ...c, msg: message.id })),
    cause: groupCard ? "group" : (card.kind === CARD.check ? "roll" : card.kind),
    source: { messageId: message.id, actorId: actorIdOf(card) },
    roundSerial: card.roundSerial
  };
  if (groupCard) patch.group = { id: card.groupId, ...(flow.groupSummary(g) ?? { closed: false, allCritical: false }) };
  const ledger = HeistyAlert.ledger;
  const existing = findEvent(ledger, eventId);
  if (!existing) {
    if (hasEvent(ledger, eventId)) return;          // compacted: its window closed long ago
    if (!patch.triggers.length && !patch.cancels.length) return;
  } else if (sameContribution(existing, patch, message.id)) return;
  await HeistyAlert.raise(patch);
  const entry = findEvent(HeistyAlert.ledger, eventId);
  if (entry && !entry.proposed && isSpike(entry)) await spikeCard(entry);
}

/** Post the crew-spend card for a spike (+2 or more) once. */
async function spikeCard(entry) {
  const s = store.state;
  if ((s.spikeCards ?? []).includes(entry.eventId)) return;
  await store.mutate(st => ({ ...st, spikeCards: [...(st.spikeCards ?? []).slice(-100), entry.eventId] }), { label: "spikeCard" });
  await postCard(CARD.alertEvent, {
    eventId: entry.eventId, label: describeEntry(entry), delta: eventDelta(entry), roundSerial: entry.roundSerial ?? s.roundSerial,
    ref: { eventId: entry.eventId }
  });
}

/* ------------------------------------------------------------- roll cards -- */

let automationQueue = Promise.resolve();
function serial(task) {
  const p = automationQueue.then(task, task);
  automationQueue = p.catch(err => console.error("Heisty Spideys | heist automation failed:", err));
  return p;
}

const ROLL_KINDS = new Set([CARD.check, CARD.threat, CARD.assist, CARD.attack, CARD.shrug]);

async function onRollMessage(message, isUpdate) {
  const card = getCard(message);
  if (!card || MY_KINDS.has(card.kind) || !ROLL_KINDS.has(card.kind)) return;
  const s0 = store.state;
  if (card.heistId && card.heistId !== s0.heistId) return;
  const actorId = actorIdOf(card);
  const mode = setting(SETTINGS.autoAlert, "auto");

  if (card.kind !== CARD.check) {
    if (mode !== "manual" && card.alert) await mirrorAlert(message, card);
    if (card.kind === CARD.assist && actorId && inPlay(s0)) await store.mutate(st => flow.markActed(st, actorId), { label: "acted" });
    return;
  }

  const roll = card.roll ?? {};
  const result = roll.clutched || roll.contingency ? "success" : roll.result;

  // Casing (Planning): each spider's first Perception or Tactics roll.
  if (s0.phase === "planning" && !isUpdate && actorId && (roll.casing || ["perception", "tactics"].includes(roll.skill))) {
    await handleCasing(actorId, card);
  }

  if (inPlay(s0) && actorId && result) {
    const before = store.state;
    await store.mutate(st => flow.recordRoll(st, {
      messageId: message.id, actorId, obstacleId: card.obstacleId ?? null, approachId: card.approachId ?? null,
      groupId: card.groupId ?? null, result, roundSerial: card.roundSerial ?? st.roundSerial, difficulty: roll.difficulty
    }), { label: "recordRoll" });
    const after = store.state;
    await afterProgress(before, after, card, message);
  }

  if (mode !== "manual" && card.alert) await mirrorAlert(message, card);

  if (!inPlay(store.state)) return;
  await creatureReactions(card, result, isUpdate);
  if (!("consequences" in card)) await fallbackCapture(message, card, actorId, result);
  await maybeEndRoundPrompt();
}

/** What changed after a roll was recorded: groups, a cleared obstacle. */
async function afterProgress(before, after, card, message) {
  // A group closed: the ledger needs its "all Critical" summary.
  if (card.groupId) {
    const g = after.groups?.[card.groupId];
    await updateGroupCard(card.groupId);
    if (g?.closed && !before.groups?.[card.groupId]?.closed) {
      if (findEvent(HeistyAlert.ledger, card.groupId)) await HeistyAlert.raise({ eventId: card.groupId, group: { id: card.groupId, ...flow.groupSummary(g) } });
    }
  }
  const ob = flow.getObstacle(after, card.obstacleId);
  if (!ob) return;
  const was = !!before.progress?.[ob.id]?.cleared;
  const now = !!after.progress?.[ob.id]?.cleared;
  if (now && !was) await clearedPrompt(after, ob);
}

async function clearedPrompt(state, ob) {
  const next = flow.nextObstacleId(state);
  const nextOb = flow.getObstacle(state, next);
  const lines = [`<p><strong>${esc(ob.name)}</strong> is done.</p>`];
  const before = store.state;
  const guard = (before.creatures ?? []).find(c => c.state?.beaten && !c.backupOf && (ob.threats ?? []).includes(c.key) && !(before.creatures ?? []).some(b => b.backupOf === c.id && b.state?.arrived));
  if (guard) lines.push(`<p>${esc(guard.name)} is beaten — out of the heist. Its backup, already aware, takes its post at the start of the next obstacle.</p>`);
  if (ob.objective && before.objective?.taken) lines.push("<p>The objective is taken.</p>");
  const buttons = [];
  if (nextOb && nextOb.phase === ob.phase) buttons.push({ action: "prompt", label: `Next: ${nextOb.name}`, primary: true, args: { do: "next", obstacleId: nextOb.id } });
  else if (ob.phase === "heist") buttons.push({ action: "prompt", label: "To the Escape", primary: true, args: { do: "escape" } });
  else buttons.push({ action: "prompt", label: "They're out — the Debrief", primary: true, args: { do: "debrief" } });
  await postPrompt({ title: "Obstacle cleared", html: lines.join(""), buttons });
}

/** Creature reactions to a roll: the Rat's deal, the guard spotted, the parrot's sight, the sleeper. */
async function creatureReactions(card, result, isUpdate) {
  const s = store.state;
  const ob = flow.currentObstacle(s);
  if (!ob || card.obstacleId !== ob.id || !setting(SETTINGS.autoCreatures, true)) return;
  const approach = (ob.approaches ?? []).find(a => a.id === card.approachId) ?? null;
  const final = card.consequences ? card.consequences.status === "final" : true;

  // The Rat: a fight, or a failed pitch, and the deal goes bad (+2 once).
  const rat = (s.creatures ?? []).find(c => c.key === "protection-rat" && c.atObstacles.includes(ob.id) && !c.state?.bad);
  if (rat && approach) {
    if (approach.fight && approach.opposed?.creature === "protection-rat") await heistApi.creatureAction(rat.id, "dealBad");
    else if (approach.ratPitch && final && !s.procedures?.["rat-deal"]?.pitched) {
      // "The crew gets one pitch."
      await store.mutate(st => procs.markFired(st, "rat-deal", { pitched: true, pitch: result }), { label: "rat pitch" });
      if (FAILED.includes(result)) await heistApi.creatureAction(rat.id, "dealBad");
      else if (result === "partial") await postPrompt({ title: "The Rat's deal", html: "<p>The deal holds — but the trap comes first (jamming it is Engineering 3).</p>" });
      else if (PASSING.includes(result)) await postPrompt({ title: "The Rat's deal", html: "<p>Safe passage: he stays out of it.</p>" });
    }
  }

  // The guard: "spotted" is its own trigger — aware for the heist.
  if ((card.alert?.triggers ?? []).some(t => t.key === "spotted")) {
    for (const c of s.creatures ?? []) {
      const def = creatureDef(c.key);
      if (!def?.spottedIsTrigger || c.state?.aware || c.state?.paid || c.state?.beaten) continue;
      if (!c.atObstacles.includes(ob.id) || (c.backupOf && !c.state?.arrived)) continue;
      await heistApi.creatureAction(c.id, "spotted");
    }
  }

  // The parrot sees a spider up on the shelf tops (an approach it can see).
  if ((approach?.seenBy ?? []).length) {
    const f = HeistyAlert.fold();
    await evaluateCreatures({ prev: f.value, value: f.value, locked: f.locked, sees: c => (approach.seenBy ?? []).includes(c.key) || c.atObstacles.includes(ob.id) });
  }

  // Heist 5: the sleeper wakes at the first noise within 4 squares.
  if (!isUpdate && s.catalogKey === "restaurant" && ob.id === "O4" && ["partial", ...FAILED].includes(result) && !procs.hasFired(s, "sleeper")) {
    await postPrompt({
      title: "The sleeper",
      html: "<p>A noise at the office: is it within 4 squares of the break room? If so, the staffer wakes and heads for the phone on the desk.</p>",
      buttons: [{ action: "prompt", label: "They wake", primary: true, args: { do: "proc", procId: "sleeper" } }, { action: "prompt", label: "Too far", args: { do: "noop" } }]
    });
  }
}

/** Without WP-B's consequences: a Failure in a Full Alert Escape is caught at End Round (or the spider's next roll). */
async function fallbackCapture(message, card, actorId, result) {
  if (!actorId || !setting(SETTINGS.autoCapture, true)) return;
  const s = store.state;
  if (s.phase !== "escape" || !HeistyAlert.locked) return;
  if (FAILED.includes(result)) {
    const others = flow.pendingCapturesOf(s, actorId, message.id);
    for (const mid of others) {
      let cap = null;
      await store.mutate(st => { const r = flow.takePendingCapture(st, mid); cap = r.capture; return r.state; });
      if (cap) await catchSpider(cap.actorId);
    }
    await store.mutate(st => flow.addPendingCapture(st, { messageId: message.id, actorId }), { label: "pendingCapture" });
  } else if (PASSING.includes(result)) {
    await store.mutate(st => flow.voidPendingCapture(st, message.id), { label: "voidCapture" });
  }
}

async function catchSpider(actorId) {
  const actor = game.actors.get(actorId);
  if (!actor || actor.system?.vitality?.state === "out") return;
  const ops = api().actorOps;
  if (typeof ops?.setVitality === "function") await ops.setVitality(actor, "out", "caught");
  else await actor.update({ "system.vitality.state": "out" });
}

/** autoEndRound: once every present spider not yet through has acted. */
async function maybeEndRoundPrompt() {
  const s = store.state;
  const mode = setting(SETTINGS.autoEndRound, "prompt");
  if (mode === "off" || !inPlay(s) || !flow.allActed(s) || s.endRoundPrompted === s.roundSerial) return;
  await store.mutate(st => ({ ...st, endRoundPrompted: st.roundSerial }), { label: "endRoundPrompted" });
  if (mode === "auto") return heistApi.endRound();
  return postPrompt({ title: `Round ${s.round}: everyone has acted`, html: "<p>End the round? (Creatures add their +X, procedures roll, the clock ticks.)</p>", buttons: [{ action: "prompt", label: "End round", primary: true, args: { do: "endRound" } }] });
}

/** Casing: one roll each; the GM gets a pre-ticked list and one click to reveal. */
async function handleCasing(actorId, card) {
  let res = null;
  await store.mutate(st => { res = flow.recordCasing(st, actorId, Number(card.roll?.successes) || 0); return res.state; }, { label: "casing" });
  const actor = game.actors.get(actorId);
  if (!res) return;
  if (res.refused) {
    return postPrompt({ title: "Casing", html: `<p>${esc(actor?.name)} already made their one Casing roll — this one reveals nothing new.</p>` });
  }
  const s = store.state;
  const pool = (s.intel?.list ?? []).filter(i => !i.revealed && !i.unknown);
  if (!pool.length) return postPrompt({ title: "Casing", html: "<p>Nothing left to case: the crew knows everything the Storyteller is holding (never the unknown obstacle).</p>" });
  return postPrompt({
    title: `Casing — ${actor?.name ?? "a spider"}: ${res.reveal.length} detail${res.reveal.length === 1 ? "" : "s"}`,
    html: `<p>${card.roll?.successes ?? 0} Successes. Each reveals one true detail, up to what you're holding (never the unknown obstacle).</p>`,
    checks: pool.map(i => ({ id: i.id, label: i.text, checked: res.reveal.includes(i.id) })),
    buttons: [{ action: "prompt", label: "Reveal to the crew", primary: true, args: { do: "reveal" } }]
  });
}

async function updateGroupCard(groupId) {
  const msg = findCardMessage(c => c.kind === CARD.group && c.groupId === groupId);
  if (msg) await patchCard(msg, {});
}

/* ------------------------------------------------------------ after fold -- */

let foldDepth = 0;

/** Creature Escalation after the Alert moved (activation, hunting, spikes). Returns the steps reached. */
async function evaluateCreatures({ prev, value, locked, sees = null }) {
  const s = store.state;
  const patches = [];
  const spikes = [];
  const steps = [];
  for (const c of s.creatures ?? []) {
    if (c.backupOf && !c.state?.arrived) continue;
    const def = creatureDef(c.key);
    if (!def) continue;
    const here = !!s.current && c.atObstacles.includes(s.current);
    const ev = escalationEvents(def, c.state ?? {}, prev, value, locked, { seesCrew: sees ? !!sees(c) : here });
    if (Object.keys(ev.patch).length) patches.push([c.id, ev.patch]);
    for (const sp of ev.spikes) spikes.push({ c, sp });
    for (const st of ev.steps) steps.push({ c, st });
  }
  if (patches.length) await store.mutate(st => patches.reduce((acc, [id, p]) => flow.patchCreature(acc, id, p), st), { label: "escalation" });
  for (const { c, sp } of spikes) {
    const eventId = `spike:${c.id}:${sp.key}`;
    await HeistyAlert.raise({ eventId, triggers: [{ key: "spike", delta: sp.delta, label: sp.label, src: "creature" }], cause: "spike", source: { creatureId: c.id } });
    const e = findEvent(HeistyAlert.ledger, eventId);
    if (e && !e.proposed) await spikeCard(e);
  }
  return steps;
}

async function afterFold(value, entry, info = {}) {
  if (!isActiveGM() || foldDepth > 6) return;
  foldDepth++;
  try {
    const s = store.state;
    const prev = Number(info.prev) || 0;
    const locked = !!info.locked;
    const limit = Number(info.limit) || HeistyAlert.limit;
    let steps = [];
    if (inPlay(s) && setting(SETTINGS.autoCreatures, true)) steps = await evaluateCreatures({ prev, value, locked });

    // Full Alert: the objective is out of reach if the crew doesn't have it.
    if (locked && inPlay(s) && !s.fullAlert?.atObstacle) {
      let r = null;
      await store.mutate(st => { r = flow.onFullAlert(st); return r.state; }, { label: "fullAlert" });
      const buttons = s.phase === "heist" ? [{ action: "prompt", label: "Go to the Escape", primary: true, args: { do: "escape" } }] : [];
      await postPrompt({
        title: "FULL ALERT", tone: "danger",
        html: `<p>The location is compromised for the rest of the heist. ${r?.objectiveLost ? "The objective is out of reach: escape is the only play." : "The crew has the objective — now get out."} Finish the current action or round first (Ch 18).</p>${s.phase === "escape" ? "<p>In a Full Alert Escape a spider who fails a roll is caught once the roll is final.</p>" : ""}`,
        buttons
      });
    }

    // The band changed: show the number, describe the change yourself (Ch 18).
    const bandPrev = HEISTY.getAlertState(prev, limit).key;
    const bandNow = HEISTY.getAlertState(value, limit);
    if (bandPrev !== bandNow.key && s.phase !== "idle" && s.phase !== "debrief") await describeIt(bandNow, value, limit, steps, locked);

    // Procedures on an Alert threshold (the water run at 7, the sleeper at 5).
    if (inPlay(s) && setting(SETTINGS.autoProcedures, true)) {
      const heist = store.heist(s);
      for (const p of proceduresFor(heist, "alertAtLeast")) {
        if ((value >= Number(p.alertAtLeast) || locked) && !procs.hasFired(store.state, p.id)) await runProcedureById(p.id, `Alert ${value}`);
      }
    }
  } finally {
    foldDepth--;
  }
}

async function describeIt(band, value, limit, steps, locked) {
  const s = store.state;
  const lines = [`<p><strong>Alert ${value}/${limit} — ${esc(band.label)}.</strong> The tracker shows the number; describe what changed yourself.</p>`];
  for (const { c, st } of steps) lines.push(`<p><strong>${esc(c.name)}</strong> (Alert ${st.at}): ${esc(st.text)}</p>`);
  const humans = s.humans ?? [];
  if (humans.length && (value >= 5 || locked)) {
    const up = value >= 7 || locked;
    lines.push(`<p><strong>Humans</strong>: ${up ? "up with the lights on" : "stirring"} — ${humans.map(h => esc(h.name)).join(", ")}. Their row doesn't change.</p>`);
  }
  const buttons = [];
  if (canCallExterminator(value, locked) && !(s.creatures ?? []).some(c => c.key === "the-exterminator")) {
    lines.push("<p>At Lockdown or Full Alert the humans could call the Exterminator — only if you decide they did.</p>");
    buttons.push({ action: "prompt", label: "Call the Exterminator", args: { do: "callExterminator" } });
  }
  return postPrompt({ title: "Describe it", html: lines.join(""), buttons });
}

/* --------------------------------------------------------------- Out -- */

async function handleOut(actor) {
  const s = store.state;
  if (!inPlay(s)) return;
  const entry = (s.crew ?? []).find(c => c.actorId === actor.id);
  if (!entry || entry.status !== "present") return;
  const cause = String(actor.system?.vitality?.outCause ?? "");
  const capture = /capture/i.test(cause);
  let out = null;
  await store.mutate(st => { out = flow.markOut(st, actor.id, { capture }); return out.state; }, { label: "out" });
  if (!out) return;
  await HeistyAlert.raise({ eventId: out.alert.eventId, triggers: out.alert.triggers, cause: "out", source: { actorId: actor.id } });
  const e = findEvent(HeistyAlert.ledger, out.alert.eventId);
  if (e && !e.proposed) await spikeCard(e);
  try { if (actor.system?.heist && actor.system.heist.status !== "out") await actor.update({ "system.heist.status": "out" }); } catch (err) { /* ignore */ }
  try { await hideTokens(actor); } catch (err) { /* no canvas */ }
  const lost = (out.lostLoot ?? []).map(id => store.state.loot.find(l => l.id === id)?.name).filter(Boolean);
  const notes = [];
  if (lost.length) notes.push(`<p>What ${esc(actor.name)} carried alone went where they went — and is lost: ${lost.map(esc).join(", ")}.</p>`);
  if (capture) notes.push("<p>Captured: the crew now has a second objective — get that spider back.</p>");
  if (notes.length) await ChatMessage.create({ speaker: { alias: "The Heist" }, content: notes.join("") });
  if (flow.isLoss(store.state.crew)) {
    await postPrompt({ title: "Everyone is Out", tone: "danger", html: "<p>The whole crew is Out at once — a Loss, unless you rule otherwise. (Replacements arrive at the next obstacle.)</p>", buttons: [{ action: "prompt", label: "Go to the Debrief", primary: true, args: { do: "debrief" } }] });
  }
  await waitingWeb.onSpiderOut(actor, { postPrompt });
}

/* ------------------------------------------------------------- round end -- */

async function applyRoundAction(a, s0) {
  switch (a.type) {
    case "alert":
      if (setting(SETTINGS.autoCreatures, true)) await HeistyAlert.raise({ eventId: a.eventId, triggers: a.triggers, cause: "creature", roundSerial: s0.roundSerial });
      return;
    case "procedure":
      if (setting(SETTINGS.autoProcedures, true)) await runProcedureById(a.procId, a.reason);
      return;
    case "procedureTimerTick": {
      const proc = (store.heist()?.procedures ?? []).find(p => p.id === a.procId);
      const stage = procs.timerStage(proc, a.elapsed);
      if (stage?.text) await postCard(CARD.procedure, { procId: a.procId, name: proc.name, text: stage.text, rows: [], outcomes: [] }, { whisperGM: true });
      return;
    }
    case "procedureTimerEnd": {
      const proc = (store.heist()?.procedures ?? []).find(p => p.id === a.procId);
      await store.mutate(st => procs.endTimer(st, a.procId), { label: "timerEnd" });
      if (proc) await postCard(CARD.procedure, { procId: a.procId, name: proc.name, text: proc.timer?.end ?? "Time's up.", rows: [], outcomes: [] }, { whisperGM: true });
      return;
    }
    case "groupClosed": {
      const g = store.state.groups?.[a.groupId];
      if (g && findEvent(HeistyAlert.ledger, a.groupId)) await HeistyAlert.raise({ eventId: a.groupId, group: { id: a.groupId, ...flow.groupSummary(g) } });
      await updateGroupCard(a.groupId);
      return;
    }
    case "capture":
      if (setting(SETTINGS.autoCapture, true)) await catchSpider(a.actorId);
      return;
    case "flawFire": {
      const actor = game.actors.get(a.actorId);
      if (actor && typeof api().abilities?.fireFlaw === "function") await api().abilities.fireFlaw(actor, a.flawKey);
      else if (actor) await postPrompt({ title: "A delayed Flaw comes due", html: `<p>${esc(actor.name)}'s Flaw fires now.</p>` });
      return;
    }
    case "quietRecovery": {
      if (!setting(SETTINGS.autoRecovery, true)) return;
      const s = store.state;
      const hurt = flow.presentCrew(s).map(c => game.actors.get(c.actorId)).filter(x => x && ["rattled", "hurt", "critical"].includes(x.system?.vitality?.state) && Number(x.system?.heist?.recoveredSerial ?? -1) !== Number(s0.obstacleSerial));
      if (!hurt.length) return;
      await postPrompt({
        title: "Quiet round: recover",
        html: "<p>No threat could reach the crew this round. Each spider recovers one level, once per obstacle.</p>",
        checks: hurt.map(x => ({ id: x.id, label: `${x.name} (${HEISTY.vitality[x.system.vitality.state]?.label})`, checked: true })),
        buttons: [{ action: "prompt", label: "Recover", primary: true, args: { do: "recover" } }]
      });
      return;
    }
    case "stall": {
      if (!setting(SETTINGS.autoStall, true)) return;
      const ob = flow.getObstacle(store.state, a.obstacleId);
      await postPrompt({
        title: "Five rounds: end it", tone: "danger",
        html: a.phase === "escape"
          ? `<p>Five rounds stuck at <strong>${esc(ob?.name)}</strong>. In the Escape, anyone still inside is caught.</p>`
          : `<p>Five rounds stuck at <strong>${esc(ob?.name)}</strong>. In the heist the objective slips out of reach — on to the Escape.</p>`,
        buttons: [{ action: "prompt", label: "End it", primary: true, args: { do: "stall" } }, { action: "prompt", label: "Not yet", args: { do: "noop" } }]
      });
      return;
    }
    case "clock":
      if (setting(SETTINGS.autoClock, true)) await rollComplication({ reason: "clock" });
      return;
  }
}

async function recoverActor(actor, obstacleSerial) {
  if (!actor) return;
  const from = actor.system?.vitality?.state;
  const to = flow.recoverOne(from);
  if (to === from) return;
  const ops = api().actorOps;
  if (typeof ops?.setVitality === "function") await ops.setVitality(actor, to, "recovery");
  else await actor.update({ "system.vitality.state": to });
  try { await actor.update({ "system.heist.recoveredSerial": Number(obstacleSerial) || 0 }); } catch (e) { /* ignore */ }
}

/* --------------------------------------------------------- complications -- */

async function rollComplication({ roll = null, reason = "clock" } = {}) {
  const s = store.state;
  const r = roll ?? (await procs.rollD6(1))[0];
  const f = HeistyAlert.fold();
  const crewActors = flow.presentCrew(s).map(c => game.actors.get(c.actorId)).filter(Boolean);
  const ctx = {
    roundSerial: s.roundSerial, sceneSerial: s.sceneSerial, obstacleId: s.current,
    creatures: (s.creatures ?? []).filter(c => !c.backupOf).map(c => {
      const def = creatureDef(c.key);
      return { id: c.id, key: c.key, active: creatureStatus(def, c.state, f.value, f.locked).active, wakeable: def?.wakeAt !== null && def?.wakeAt !== undefined && c.key !== "curious-child" };
    }).filter(c => c.wakeable || c.key === "vacuum"),
    intel: s.intel?.list ?? [],
    fearOfVacuums: crewActors.filter(a => hasPerk(a, "fear-of-vacuums")).map(a => a.id)
  };
  const eff = complicationEffect(r, ctx);
  const applied = [];
  const ref = { eventIds: [], effectIds: [], creatureId: null, intelId: null };
  let choices = [];
  for (const a of eff.actions) {
    switch (a.type) {
      case "wakeCreature": {
        await store.mutate(st => flow.patchCreature(st, a.creatureId, { active: true }), { label: "complication wake" });
        const c = s.creatures.find(x => x.id === a.creatureId);
        applied.push(`${c?.name ?? "A creature"} is active now.`);
        ref.creatureId = a.creatureId;
        choices = a.choices.map(id => ({ value: id, label: s.creatures.find(x => x.id === id)?.name ?? id, selected: id === a.creatureId }));
        break;
      }
      case "alert": {
        const eventId = `complication:${s.roundSerial}:${r}:${foundry.utils.randomID(4)}`;
        await HeistyAlert.raise({ eventId, triggers: [{ key: "complication", delta: a.delta, label: a.label, src: "complication" }], cause: "complication" });
        ref.eventIds.push(eventId);
        applied.push(`+${a.delta} Alert.`);
        break;
      }
      case "revealIntel": {
        const i = (s.intel?.list ?? []).find(x => x.id === a.intelId);
        ref.intelId = a.intelId;
        applied.push("The Storyteller gives the crew one detail they didn't case.");
        choices = a.choices.map(id => ({ value: id, label: (s.intel.list.find(x => x.id === id)?.text ?? id).slice(0, 80), selected: id === a.intelId }));
        await postPrompt({
          title: "Complication 2: an uncased detail",
          html: "<p>Give the crew one detail they didn't case (never the unknown obstacle):</p>",
          checks: (s.intel?.list ?? []).filter(x => !x.revealed && !x.unknown).map(x => ({ id: x.id, label: x.text, checked: x.id === i?.id })),
          buttons: [{ action: "prompt", label: "Reveal", primary: true, args: { do: "reveal" } }]
        });
        break;
      }
      case "effect": {
        const id = `fx-comp-${s.roundSerial}-${foundry.utils.randomID(6)}`;
        await store.mutate(st => flow.addEffect(st, { ...a.effect, id }), { label: "complication effect" });
        ref.effectIds.push(id);
        applied.push(a.effect.label);
        break;
      }
      case "activateCreature":
        await store.mutate(st => flow.patchCreature(st, a.creatureId, { active: true, pursuit: !!a.pursuit }), { label: "vacuum" });
        applied.push("The vacuum is in pursuit (+1 a round).");
        break;
      case "forcedRoll":
        for (const id of a.actors) await flawCheckCard(id, { flawName: "Fear of Vacuums", text: "Vacuums cause immediate, total panic.", spec: { attr: a.attr, difficulty: a.difficulty, label: "Fear of Vacuums (NERVE)", reason: "Fear of Vacuums", passFail: true, noAlert: true } });
        applied.push("Fear of Vacuums: a NERVE check (Difficulty 3) for each spider with it.");
        break;
      case "procedure":
        for (const p of proceduresFor(store.heist(), "complication")) {
          if (Number(p.complication) === r && !procs.hasFired(store.state, p.id)) await runProcedureById(p.id, `Complication ${r}`);
        }
        break;
    }
  }
  return postCard(CARD.complication, {
    roll: r, reason, title: MID_HEIST[r].title, text: MID_HEIST[r].text, effect: MID_HEIST[r].effect,
    applied, ref, choices, negated: false
  });
}

async function applyComplicationChoice(message, card, value) {
  if (!value) return;
  if (card.ref?.creatureId && value !== card.ref.creatureId) {
    const prev = card.ref.creatureId;
    await store.mutate(st => flow.patchCreature(flow.patchCreature(st, prev, { active: false }), value, { active: true }), { label: "complication pick" });
    return patchCard(message, { ref: { ...card.ref, creatureId: value }, choices: card.choices.map(c => ({ ...c, selected: c.value === value })) });
  }
  if (card.ref?.intelId && value !== card.ref.intelId) return patchCard(message, { ref: { ...card.ref, intelId: value }, choices: card.choices.map(c => ({ ...c, selected: c.value === value })) });
}

/** A forced Flaw check card (Fear of Vacuums, Allergic to Dust). */
async function flawCheckCard(actorId, { flawName, text, spec }) {
  const actor = game.actors.get(actorId);
  if (!actor) return;
  if (setting(SETTINGS.forcedRolls, "player") === "auto" && typeof api().dice?.rollForced === "function") {
    await api().dice.rollForced(actor, spec, { local: true });
  }
  return postCard(CARD.flaw, { actorId, actorName: actor.name, flawName, text, rollSpec: spec, rollLabel: spec.label ?? "the check" });
}

/* ------------------------------------------------------------ procedures -- */

async function runProcedureById(procId, reason = "") {
  const heist = store.heist();
  const proc = (heist?.procedures ?? []).find(p => p.id === procId);
  if (!proc) return false;
  if (proc.once && procs.hasFired(store.state, procId)) return false;
  const res = await procs.runProcedure(proc, { reason });
  await store.mutate(st => {
    let n = procs.markFired(st, procId, { lastRoll: res.rows.map(r => r.roll), since: st.procedures?.[procId]?.since ?? st.roundSerial });
    if (proc.timer) n = procs.startTimer({ ...n, procedures: { ...n.procedures, [procId]: { ...n.procedures[procId], timer: undefined } } }, proc);
    return n;
  }, { label: `procedure ${procId}` });
  if (procId === "sleeper") {
    await store.mutate(st => ({ ...st, humans: (st.humans ?? []).map(h => (h.id === "sleeper" ? { ...h, awake: true, row: "alert" } : h)), obstacles: st.obstacles.map(o => (o.id === "O4" ? { ...o, human: "alert" } : o)) }), { label: "sleeper" });
  }
  await postCard(CARD.procedure, { procId, name: proc.name, text: proc.text ?? "", reason, rows: res.rows, outcomes: res.outcomes, chosen: null, timerText: proc.timer?.stages?.[0]?.text ?? "" }, { whisperGM: true });
  return true;
}

async function applyProcedureOutcome(procId, key) {
  const proc = (store.heist()?.procedures ?? []).find(p => p.id === procId);
  const o = (proc?.outcomes ?? []).find(x => x.key === key);
  if (!o) return;
  if (o.dealBad) await heistApi.creatureAction(creatureIdByKey("protection-rat"), "dealBad");
  if (o.sled) {
    const obj = (store.state.loot ?? []).find(l => l.objective);
    if (obj) await heistApi.lootAction(obj.id, "sled", { value: true });
  }
  if (o.lootStatus === "lost") await store.mutate(st => flow.addLog({ ...st, loot: st.loot.map(l => (l.objective ? { ...l, status: "lost", carriers: [], snatched: true } : l)) }, "The rival crew snatched the book."), { label: "snatch" });
  if (key === "partial" && procId === "rat-deal") await store.mutate(st => procs.markFired(st, "rat-deal", { trapFirst: true }), { label: "rat" });
  await store.mutate(st => flow.addLog(st, `${proc.name}: ${o.text}`), { label: "log" });
}

/* ------------------------------------------------------------ the API -- */

async function gmOnly(fn) {
  if (!isActiveGM()) { ui.notifications?.warn("Only the active Storyteller can do that."); return null; }
  return fn();
}

/**
 * Default crew: player-owned spiders, one per player slot ("next heist, the
 * player may bring back either spider" — the original by default; the GM can
 * tick the replacement instead). Benched spiders stay home.
 */
function crewDefaults() {
  const bySlot = new Map();
  for (const a of game.actors.filter(x => x.type === "spider" && x.hasPlayerOwner && (x.system?.heist?.status ?? "active") !== "benched")) {
    const slot = a.system?.heist?.slot || a.system?.heist?.replacementOf || a.id;
    const cur = bySlot.get(slot);
    const rank = x => ((x.system?.heist?.status ?? "active") === "active" ? 0 : 2) + (x.system?.heist?.replacementOf ? 1 : 0);
    if (!cur || rank(a) < rank(cur)) bySlot.set(slot, a);
  }
  return [...bySlot.values()];
}

/** After a heist: every crew spider (original or replacement) is ready to come back. */
async function resetCrewStatus(state) {
  for (const c of state?.crew ?? []) {
    const a = game.actors.get(c.actorId);
    if (a?.system?.heist && a.system.heist.status !== "active" && a.system.heist.status !== "benched") {
      try { await a.update({ "system.heist.status": "active" }); } catch (e) { /* ignore */ }
    }
  }
}

Object.assign(heistApi, {
  /** Open the Heist Tracker. */
  openTracker(options = {}) {
    const app = foundry.applications.instances.get(HeistTracker.DEFAULT_OPTIONS.id) ?? new HeistTracker(options);
    return app.render({ force: true });
  },

  /** Catalog heists and journals (for the Start Heist form). */
  heistChoices() {
    const list = HEISTS.map(h => ({ value: h.key, label: `${h.n}. ${h.name} (${HEISTY.alertLimits[h.difficulty]?.label}, Limit ${h.limit})` }));
    for (const j of game.journal?.contents ?? []) {
      const f = j.getFlag?.(FLAG, "heist");
      if (f && typeof f === "object" && f.obstacles) list.push({ value: `journal:${j.uuid}`, label: `${j.name} (custom)` });
    }
    return list;
  },

  /** Default crew: player-owned spiders with heist status active. */
  defaultCrew() {
    return crewDefaults().map(a => a.id);
  },

  /**
   * Start Heist (§3.6): the catalog heist or a journal, the crew, the Limit.
   * Resets the Alert with a new ledger; every crew spider gets full starting
   * Silk and Unharmed (Ch 11); creature actors are imported and mapped;
   * heist-start procedures roll.
   */
  async startHeist({ heistKey = null, journalUuid = null, crewIds = null, limit = null } = {}) {
    return gmOnly(async () => {
      let heist = findHeist(heistKey);
      if (!heist && journalUuid) {
        const j = await fromUuid(journalUuid);
        const f = j?.getFlag?.(FLAG, "heist");
        heist = (f && typeof f === "object") ? f : findHeist(f) ?? findHeist(j?.name);
      }
      if (!heist) return ui.notifications?.warn("Pick a heist first.");
      const ids = crewIds?.length ? crewIds : crewDefaults().map(a => a.id);
      const crew = ids.map(id => game.actors.get(id)).filter(Boolean).map(a => {
        const owner = game.users.find(u => !u.isGM && a.testUserPermission(u, "OWNER"));
        return { actorId: a.id, userId: owner?.id ?? null, slot: a.system?.heist?.slot || a.id, name: a.name, replacementOf: a.system?.heist?.replacementOf || null };
      });
      const lim = Math.max(1, Number(limit) || Number(heist.limit) || 8);
      const heistId = foundry.utils.randomID();
      await store.mutate(st => {
        const n = flow.startHeist(st, { heist, crew, heistId, limit: lim, journalUuid });
        n.alertLedger = setEntry([], 0, { force: true, cause: "reset" });
        if (!findHeist(heist.key)) n.customHeist = heist;
        n.procedures = Object.fromEntries((heist.procedures ?? []).filter(p => (p.when ?? []).includes("everyNRounds")).map(p => [p.id, { since: n.roundSerial }]));
        return n;
      }, { label: "startHeist" });
      HeistyAlert._lastBand = null;
      await game.settings.set(HEISTY.id, "alertLimit", lim);
      await HeistyAlert.refold();
      for (const c of crew) {
        const a = game.actors.get(c.actorId);
        if (!a) continue;
        const upd = { "system.silk.value": Number(a.system?.silk?.max) || 0, "system.vitality.state": "unharmed" };
        if (a.system?.heist) Object.assign(upd, { "system.heist.pending": [], "system.heist.camouflaged": false, "system.heist.status": "active", "system.heist.recoveredSerial": -1 });
        if (a.system?.vitality && "outCause" in a.system.vitality) upd["system.vitality.outCause"] = "";
        try { await a.update(upd); } catch (err) { console.warn("Heisty Spideys | crew reset failed:", err); }
      }
      await mapCreatureActors();
      if (setting(SETTINGS.autoProcedures, true)) for (const p of proceduresFor(heist, "heistStart")) await runProcedureById(p.id, "before play");
      await ChatMessage.create({ speaker: { alias: "The Heist" }, content: `<h3>${esc(heist.name)}</h3><p>The job is on. Alert Limit ${lim}. Every spider starts Unharmed, with WIT + NERVE + 1 Silk Points.</p>` });
      return store.state;
    });
  },

  /** Change phase (Score → Planning → Heist → Escape → Debrief). */
  async setPhase(phase) {
    return gmOnly(async () => {
      const before = store.state;
      if (phase === "debrief" && before.phase === "escape" && before.current) {
        // Out of the last obstacle: the spiders still on the board got out.
      }
      await store.mutate(st => flow.setPhase(st, phase), { label: `phase ${phase}` });
      const s = store.state;
      if (phase === "heist") {
        const first = (s.obstacles ?? []).find(o => o.phase === "heist" && o.status === "pending");
        if (first && !s.current) await heistApi.nextObstacle(first.id);
      } else if (phase === "escape") {
        await escapeNudges();
        const first = (s.obstacles ?? []).find(o => o.phase === "escape" && o.status === "pending");
        if (first) await heistApi.nextObstacle(first.id);
      } else if (phase === "debrief") {
        await debriefCard();
      } else if (phase === "idle") {
        await resetCrewStatus(before);
        await store.mutate(st => flow.endHeist(st), { label: "endHeist" });
      }
      return store.state;
    });
  },

  /**
   * Next obstacle (§3.5 Advance): End Round if this round saw action, gap
   * recovery, ledger compaction, Waiting Web arrivals, a guard's backup,
   * squeezes, procedures, information-Perk prompts.
   */
  async nextObstacle(obstacleId = null) {
    return gmOnly(async () => {
      let s = store.state;
      const target = obstacleId ?? flow.nextObstacleId(s);
      if (!target) {
        if (s.phase === "heist") return heistApi.setPhase("escape");
        return postPrompt({ title: "No more obstacles", html: "<p>That was the last one.</p>", buttons: [{ action: "prompt", label: "The Debrief", primary: true, args: { do: "debrief" } }] });
      }
      if (s.current && (s.acted?.[String(s.roundSerial)] ?? []).length) { await heistApi.endRound(); s = store.state; }
      // The gap: recovery once per obstacle (the gap counts as part of the one just finished).
      if (s.current && setting(SETTINGS.autoRecovery, true)) {
        for (const c of flow.presentCrew(s)) {
          const a = game.actors.get(c.actorId);
          if (!a) continue;
          const st = a.system?.vitality?.state;
          if (["rattled", "hurt", "critical"].includes(st) && Number(a.system?.heist?.recoveredSerial ?? -1) !== Number(s.obstacleSerial)) await recoverActor(a, s.obstacleSerial);
        }
      }
      await store.mutate(st => ({ ...st, alertLedger: compact(st.alertLedger ?? [], HeistyAlert.limit) }), { label: "compact" });
      let events = [];
      await store.mutate(st => { const r = flow.startObstacleWithEvents(st, target); events = r.events; return r.state; }, { label: `obstacle ${target}` });
      s = store.state;
      const ob = flow.currentObstacle(s);
      for (const e of events) {
        if (e.type === "arrival") await waitingWeb.arrive(e.actorId);
        else if (e.type === "backupArrives") {
          const c = s.creatures.find(x => x.id === e.creatureId);
          await postPrompt({ title: "The backup", html: `<p>${esc(c?.name)} has taken its post — already aware. It holds the post and never follows the crew beyond it.</p>` });
        } else if (e.type === "squeeze") {
          const l = s.loot.find(x => x.id === e.lootId);
          await postPrompt({ title: "A squeeze", html: `<p>${esc(l?.name)} (${esc(HEISTY.lootTiers[l?.tier]?.label)}) won't fit. Another way — or break it off (incomplete loot).</p>`, buttons: [{ action: "prompt", label: "Break it off", args: { do: "breakOff", lootId: e.lootId } }] });
        } else if (e.type === "procedures" && setting(SETTINGS.autoProcedures, true)) {
          for (const p of proceduresFor(store.heist(s), e.trigger, { obstacleId: e.obstacleId })) {
            if (p.obstacleId && p.obstacleId !== e.obstacleId) continue;
            await runProcedureById(p.id, e.trigger === "firstObstacle" ? "as the crew comes in" : `obstacle ${e.obstacleId}`);
          }
        }
      }
      await perkPrompts(ob);
      // Creatures that see the crew here now (the parrot at 7+).
      const f = HeistyAlert.fold();
      if (setting(SETTINGS.autoCreatures, true)) await evaluateCreatures({ prev: f.value, value: f.value, locked: f.locked });
      if (ob?.flawTrigger) await postPrompt({ title: "A Flaw trigger", html: `<p>${esc(ob.name)}: a spider with ${esc(ob.flawTrigger.replace(/-/g, " "))} may have it triggered here.</p>` });
      Hooks.callAll(HOOKS.obstacleStarted, store.state);
      return store.state;
    });
  },

  /** End Round (§3.5). */
  async endRound({ fromCombat = false } = {}) {
    return gmOnly(async () => {
      const s0 = store.state;
      if (!inPlay(s0)) return null;
      const f = HeistyAlert.fold();
      let res = null;
      await store.mutate(st => { res = flow.endRound(st, { alert: f.value, fullAlert: f.locked, heist: store.heist(st) }); return res.state; }, { label: "endRound" });
      if (!res) return null;
      Hooks.callAll(HOOKS.roundEnded, store.state);
      for (const a of res.actions) {
        try { await applyRoundAction(a, s0); } catch (err) { console.error("Heisty Spideys | round action failed:", a, err); }
      }
      return store.state;
    });
  },

  /** Freeplay: a New Scene (once-per-scene abilities are ready again). */
  async newScene() {
    return gmOnly(async () => {
      await store.mutate(st => flow.newScene(st), { label: "newScene" });
      ui.notifications?.info("New scene: once-per-scene abilities are ready again.");
    });
  },

  /** A Group check on an approach (§3.4): one card, a Roll button per spider. */
  async groupCheck(approachId = null) {
    return gmOnly(async () => {
      const s = store.state;
      const ob = flow.currentObstacle(s);
      if (!ob) return ui.notifications?.warn("Start an obstacle first.");
      const a = (ob.approaches ?? []).find(x => x.id === approachId) ?? ob.approaches?.[0];
      const groupId = foundry.utils.randomID();
      await store.mutate(st => flow.openGroup(st, { groupId, approachId: a?.id ?? null }), { label: "group" });
      const g = store.state.groups[groupId];
      if (!g.expected.length) return ui.notifications?.info("Everyone is already through.");
      const opp = a?.opposed?.creature && a.opposed.creature !== "rival-crew" ? a.opposed : null;
      return postCard(CARD.group, {
        groupId, obstacleId: ob.id, obstacleName: ob.name, approachId: a?.id ?? null, approachLabel: approachLabel(a),
        skill: a?.skills?.[0] ?? null, skillLabel: skillLabel(a?.skills?.[0]), difficulty: a?.difficulty ?? 3,
        expected: g.expected, opposedPool: opp?.pool ?? (a?.opposed?.creature === "rival-crew" ? 5 : null),
        opposedName: opp ? (CREATURE_AUTOMATION[opp.creature]?.name ?? opp.creature) : (a?.opposed ? "The other crew" : null), opposedRoll: a?.opposed?.roll ?? ""
      });
    });
  },

  /** The creature's one roll for the round in a group check (N2). */
  async groupOpposedRoll(groupId, message = null) {
    return gmOnly(async () => {
      const msg = message ?? findCardMessage(c => c.kind === CARD.group && c.groupId === groupId);
      const card = getCard(msg);
      const pool = Number(card?.opposedPool) || 0;
      if (!pool) return null;
      const faces = await procs.rollD6(pool);
      const successes = faces.filter(x => x >= 5).length;
      await store.mutate(st => flow.setGroupOpposed(st, groupId, { creature: card.opposedName, successes }), { label: "opposed" });
      if (msg) await patchCard(msg, { lastOpposedFaces: faces });
      return successes;
    });
  },

  async closeGroup(groupId) {
    return gmOnly(async () => {
      await store.mutate(st => flow.closeGroup(st, groupId), { label: "closeGroup" });
      const g = store.state.groups?.[groupId];
      if (g && findEvent(HeistyAlert.ledger, groupId)) await HeistyAlert.raise({ eventId: groupId, group: { id: groupId, ...flow.groupSummary(g) } });
      await updateGroupCard(groupId);
    });
  },

  async setGroupLeader(groupId, actorId) {
    return gmOnly(async () => {
      await store.mutate(st => (st.groups?.[groupId] ? { ...st, groups: { ...st.groups, [groupId]: { ...st.groups[groupId], ledBy: actorId || null } } } : st), { label: "lead" });
      await updateGroupCard(groupId);
    });
  },

  /** Call for a roll: one spider, one approach. */
  async callForRoll(approachId, actorId) {
    return gmOnly(async () => {
      const s = store.state;
      const ob = flow.currentObstacle(s);
      const a = (ob?.approaches ?? []).find(x => x.id === approachId);
      const actor = game.actors.get(actorId);
      if (!ob || !a || !actor) return null;
      return postCard(CARD.request, { obstacleId: ob.id, obstacleName: ob.name, approachId, approachLabel: approachLabel(a), skill: a.skills[0], skillLabel: skillLabel(a.skills[0]), actorId, actorName: actor.name, note: a.note ?? "" });
    });
  },

  /** GM: +1 / −1 progress, mark a spider passed (or not), mark cleared. */
  async adjustProgress(opts = {}) {
    return gmOnly(async () => {
      const before = store.state;
      const id = opts.obstacleId ?? before.current;
      await store.mutate(st => flow.adjustProgress(st, id, opts), { label: "progress" });
      const after = store.state;
      if (!before.progress?.[id]?.cleared && after.progress?.[id]?.cleared) await clearedPrompt(after, flow.getObstacle(after, id));
    });
  },

  /** Mark an obstacle skipped / reveal the unknown. */
  async obstacleAction(obstacleId, action) {
    return gmOnly(() => store.mutate(st => ({
      ...st,
      obstacles: st.obstacles.map(o => {
        if (o.id !== obstacleId) return o;
        if (action === "skip") return { ...o, status: "skipped" };
        if (action === "unskip") return { ...o, status: "pending" };
        if (action === "reveal") return { ...o, revealed: true };
        if (action === "hide") return { ...o, revealed: !o.unknown };
        return o;
      })
    }), { label: "obstacle" }));
  },

  /**
   * Add a custom obstacle (one approach to start with; more can be added the same way).
   * @param {{name:string, phase?:"heist"|"escape", skill:string, difficulty?:number, mode?:string, after?:string}} o
   */
  async addObstacle({ name = "New obstacle", phase = "heist", skill = "stealth", difficulty = 3, mode = "individual", obstacleId = null } = {}) {
    return gmOnly(() => store.mutate(st => {
      const approach = { id: skill, skills: [skill], difficulty: Math.max(1, Number(difficulty) || 3), mode, opposed: null, alertOnUse: 0, fight: false, excludeRoles: [], note: "", weakness: null, hold: null, pays: null, seenBy: [], tags: [] };
      if (obstacleId) {
        return { ...st, obstacles: st.obstacles.map(o => (o.id === obstacleId ? { ...o, approaches: [...o.approaches, { ...approach, id: o.approaches.some(a => a.id === skill) ? `${skill}-${o.approaches.length + 1}` : skill }] } : o)) };
      }
      const n = st.obstacles.filter(o => o.phase === phase).length + 1;
      const id = `${phase === "escape" ? "E" : "O"}${n}${st.obstacles.some(o => o.id === `${phase === "escape" ? "E" : "O"}${n}`) ? `-${foundry.utils.randomID(3)}` : ""}`;
      const ob = { id, name, phase, kind: "environment", tags: phase === "escape" ? ["escape"] : [], threats: [], awake: [], unknown: false, revealed: true, objective: false, postObjective: false, keyLock: false, silkLinePrepared: false, human: null, ratDeal: false, flawTrigger: null, note: "", improvise: [], approaches: [approach], status: "pending" };
      const list = [...st.obstacles];
      const lastOfPhase = list.map(o => o.phase).lastIndexOf(phase);
      list.splice(lastOfPhase >= 0 ? lastOfPhase + 1 : (phase === "escape" ? list.length : list.findIndex(o => o.phase === "escape") >>> 0), 0, ob);
      return flow.addLog({ ...st, obstacles: list, customized: true }, `Obstacle added: ${name}.`);
    }, { label: "addObstacle" }));
  },

  /** Move an obstacle up or down within its phase. */
  async moveObstacle(obstacleId, dir = -1) {
    return gmOnly(() => store.mutate(st => {
      const list = [...st.obstacles];
      const i = list.findIndex(o => o.id === obstacleId);
      const j = i + (dir < 0 ? -1 : 1);
      if (i < 0 || j < 0 || j >= list.length || list[j].phase !== list[i].phase) return st;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...st, obstacles: list, customized: true };
    }, { label: "moveObstacle" }));
  },

  /** Save the (edited) obstacle list onto the heist's journal (flags[FLAG].heist), for next time. */
  async saveToJournal() {
    return gmOnly(async () => {
      const s = store.state;
      const base = store.heist(s);
      const journal = s.journalUuid ? await fromUuid(s.journalUuid) : (game.journal?.find(j => j.name === s.name) ?? null);
      if (!journal) return ui.notifications?.warn("No journal to save to: drop the heist's journal on the tracker before starting.");
      const strip = o => ({ id: o.id, name: o.name, kind: o.kind, tags: o.tags, threats: o.threats, awake: o.awake, unknown: o.unknown, objective: o.objective, postObjective: o.postObjective, keyLock: o.keyLock, human: o.human, note: o.note, improvise: o.improvise, approaches: o.approaches, ratDeal: o.ratDeal, flawTrigger: o.flawTrigger });
      const custom = {
        ...(base ?? {}), key: `custom-${journal.id}`, name: s.name || journal.name, difficulty: s.difficulty, limit: s.limit,
        obstacles: s.obstacles.filter(o => o.phase === "heist").map(strip), escape: s.obstacles.filter(o => o.phase === "escape").map(strip)
      };
      await journal.setFlag(FLAG, "heist", custom);
      ui.notifications?.info(`Saved the obstacle list to ${journal.name}.`);
      return true;
    });
  },

  /** Five rounds: end it. */
  async applyStall() {
    return gmOnly(async () => {
      let caught = [];
      await store.mutate(st => { const r = flow.applyStall(st); caught = r.caught; return r.state; }, { label: "stall" });
      for (const id of caught) await catchSpider(id);
      if (store.state.phase === "heist") await heistApi.setPhase("escape");
      return true;
    });
  },

  /** Reveal intel to the crew. */
  async revealIntel(ids = []) {
    if (!isActiveGM()) return gm.run(OPS.heistCasingReveal, { ids, userId: game.user.id });
    await store.mutate(st => flow.revealIntel(st, ids), { label: "reveal" });
    const s = store.state;
    const texts = (s.intel?.list ?? []).filter(i => ids.includes(i.id) && i.revealed).map(i => `<li>${esc(i.text)}</li>`);
    if (texts.length) await ChatMessage.create({ speaker: { alias: "Casing" }, content: `<p><strong>The crew learns:</strong></p><ul>${texts.join("")}</ul>` });
    return true;
  },

  /** A Preparation (GM, or a player through the heist.prep op). */
  async addPreparation(actorId, prep) {
    if (!isActiveGM()) return gm.run(OPS.heistPrep, { actorId, prep, userId: game.user.id });
    let ok = false;
    await store.mutate(st => {
      const r = flow.addPreparation(st, actorId, prep);
      ok = r.ok;
      let n = r.state;
      if (r.ok && prep.kind === "contingency") n = flow.setContingency(n, { actorId, trigger: prep.trigger ?? prep.text ?? "", rollDesc: prep.rollDesc ?? "" });
      return n;
    }, { label: "prep" });
    if (!ok) ui.notifications?.warn("One Preparation per spider (entry squares and Perk-granted ones are free).");
    return ok;
  },

  async removePreparation(actorId, prepId) {
    return gmOnly(() => store.mutate(st => flow.removePreparation(st, actorId, prepId), { label: "unprep" }));
  },

  async setPrepComplication(actorId, prepId, text) {
    return gmOnly(() => store.mutate(st => ({ ...st, preparations: { ...st.preparations, [actorId]: (st.preparations?.[actorId] ?? []).map(p => (p.id === prepId ? { ...p, complication: String(text ?? "") } : p)) } }), { label: "prep complication" }));
  },

  /** Loot actions (GM; players through heist.loot). */
  async lootAction(lootId, action, { actorId = null, toActorId = null, value = true } = {}) {
    if (!isActiveGM()) return gm.run(OPS.heistLoot, { lootId, action, actorId, toActorId, value, userId: game.user.id });
    await store.mutate(st => flow.addLog(flow.lootAction(st, lootId, action, { actorId, toActorId, value }), `Loot: ${action}.`), { label: "loot" });
    return true;
  },

  async addLoot({ name = "Loot", tier = "trinket", objective = false } = {}) {
    return gmOnly(() => store.mutate(st => ({ ...st, loot: [...(st.loot ?? []), { id: foundry.utils.randomID(), name, tier, objective, carriers: [], sled: false, status: "inPlace", incomplete: false }] }), { label: "addLoot" }));
  },

  async removeEffect(id) {
    return gmOnly(() => store.mutate(st => flow.removeEffect(st, id), { label: "removeEffect" }));
  },

  async setEscapeLeader(actorId) {
    return gmOnly(() => store.mutate(st => ({ ...st, escapeLeader: actorId || null }), { label: "leader" }));
  },

  async setAssist(carrier, passenger, on = true) {
    return gmOnly(() => store.mutate(st => flow.setAssist(st, carrier, passenger, on), { label: "assist" }));
  },

  /**
   * Creature actions from the tracker or a card: wake, sleep, spotted, paid,
   * dealBad, beaten, shut, driveOff, suppress, engaged, onMap, pursuit.
   */
  async creatureAction(creatureId, action, opts = {}) {
    return gmOnly(async () => {
      const s = store.state;
      const c = (s.creatures ?? []).find(x => x.id === creatureId);
      if (!c) return null;
      const def = creatureDef(c.key);
      let st = { ...c.state };
      let spike = null;
      let trigger = null;
      let backup = false;
      switch (action) {
        case "wake": st.active = true; if (def?.spottedIsTrigger) st.aware = true; break;
        case "sleep": st.active = false; st.aware = false; break;
        case "spotted": { const r = spotted(def, st); st = r.st; break; }
        case "paid": st = payOff(st); break;
        case "unpaid": st.paid = false; break;
        case "dealBad": { const r = dealGoesBad(def, st); st = r.st; spike = r.spike; break; }
        case "beaten": { const r = beat(def, st, s.obstacleSerial, s.roundSerial); st = r.st; backup = r.backup; break; }
        case "shut": st = shutIn(st); break;
        case "unshut": st.shut = false; break;
        case "driveOff": st = driveOff(st, s.obstacleSerial, s.roundSerial); break;
        case "suppress": st.suppressedUntilRound = s.roundSerial + Math.max(0, (Number(opts.rounds) || 1) - 1); break;
        case "engaged": st.engaged = !st.engaged; break;
        case "onMap": st.onMap = !st.onMap; st.active = st.onMap; break;
        case "pursuit": st.pursuit = !st.pursuit; break;
      }
      const vacuumOn = def?.fearOfVacuums && ((action === "pursuit" && st.pursuit) || (action === "wake" && !c.state?.active));
      await store.mutate(x => {
        let n = flow.patchCreature(x, creatureId, st);
        if (backup) n = flow.addBackup(n, creatureId);
        return flow.addLog(n, `${c.name}: ${action}.`);
      }, { label: `creature ${action}` });
      if (spike) {
        const eventId = `spike:${creatureId}:${spike.key}`;
        await HeistyAlert.raise({ eventId, triggers: [{ key: "spike", delta: spike.delta, label: spike.label, src: "creature" }], cause: "spike" });
        const e = findEvent(HeistyAlert.ledger, eventId);
        if (e && !e.proposed) await spikeCard(e);
      }
      if (trigger) await HeistyAlert.raise({ eventId: `creature-spot:${creatureId}:${s.roundSerial}`, triggers: [{ ...trigger, src: "creature" }], cause: "creature" });
      if (vacuumOn && setting(SETTINGS.autoFlaws, true)) {
        // Fear of Vacuums: a forced NERVE check (Difficulty 3) when a vacuum becomes active.
        for (const cm of flow.presentCrew(store.state)) {
          const a = game.actors.get(cm.actorId);
          if (a && hasPerk(a, "fear-of-vacuums")) await flawCheckCard(a.id, { flawName: "Fear of Vacuums", text: "Vacuums cause immediate, total panic. A Failure loses the Action (and pays the Flaw Moment).", spec: { attr: "nerve", difficulty: 3, label: "Fear of Vacuums (NERVE)", reason: "Fear of Vacuums", passFail: true, noAlert: true } });
        }
      }
      return store.state;
    });
  },

  /** Roll one of a creature's pools (its threat actor, through WP-B when loaded). */
  async creatureRoll(creatureId, which = "attack") {
    return gmOnly(async () => {
      const c = store.state.creatures.find(x => x.id === creatureId);
      if (!c) return null;
      const def = creatureDef(c.key);
      const actor = c.actorUuid ? await fromUuid(c.actorUuid) : null;
      const idx = which === "attack" ? def?.attack?.index : def?.perception?.index;
      if (actor && typeof api().dice?.threatRoll === "function") return api().dice.threatRoll(actor, idx ?? 0);
      const pool = which === "attack" ? def?.attack?.pool : def?.perception?.pool;
      const faces = await procs.rollD6(pool || 1);
      return ChatMessage.create({ speaker: { alias: c.name }, content: `<p><strong>${esc(c.name)}</strong> — ${esc(which === "attack" ? def?.attack?.label : def?.perception?.label)} ${pool}: [${faces.join(", ")}] → <strong>${faces.filter(x => x >= 5).length}</strong> Successes.</p>`, whisper: gmIds() });
    });
  },

  /** Call the Exterminator (only at Lockdown or Full Alert, on the ST's call). */
  async callExterminator() {
    return gmOnly(async () => {
      const f = HeistyAlert.fold();
      if (!canCallExterminator(f.value, f.locked)) return ui.notifications?.warn("Only at Lockdown (7+) or Full Alert.");
      if ((store.state.creatures ?? []).some(c => c.key === "the-exterminator")) return null;
      const all = store.state.obstacles.map(o => o.id);
      await store.mutate(st => flow.addLog({ ...st, creatures: [...st.creatures, { id: "exterminator", key: "the-exterminator", name: "The Exterminator", actorUuid: null, atObstacles: all, earshot: [], postObstacles: [], backupOf: null, state: newCreatureState({ onMap: true, active: true }) }] }, "The Exterminator arrives."), { label: "exterminator" });
      await mapCreatureActors();
      return ChatMessage.create({ speaker: { alias: "The Heist" }, content: "<p><strong>The Exterminator</strong> came prepared: +1 Alert a round while on the map; a Spray that lands on a spider caught in the open is Out.</p>" });
    });
  },

  /** Run a heist procedure now (tracker). */
  async runProcedure(procId) { return gmOnly(() => runProcedureById(procId, "manual")); },

  /** Roll the Mid-Heist Complication now ("when the night needs a nudge"). */
  async nudge() { return gmOnly(() => rollComplication({ reason: "nudge" })); },

  /** Fire a spider's ST-triggered Flaw (WP-A's ability runtime). */
  async fireFlaw(actorId) {
    const actor = game.actors.get(actorId);
    const fn = api().abilities?.fireFlaw;
    if (!actor || typeof fn !== "function") return ui.notifications?.info("Fire the Flaw from the spider's sheet.");
    return fn(actor);
  },

  /** GM award buttons: Spectacular Failure +1, Creative Species Use +1, Brilliant Plan +2. */
  async awardSilk(actorId, sp, reason) {
    return gmOnly(async () => {
      const actor = game.actors.get(actorId);
      if (!actor) return;
      const ops = api().actorOps;
      if (typeof ops?.earnSilk === "function") return ops.earnSilk(actor, sp, { reason, announce: true });
      await actor.update({ "system.silk.value": (Number(actor.system?.silk?.value) || 0) + sp });
      return ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p>${esc(actor.name)} earns <strong>+${sp} SP</strong> — ${esc(reason)}.</p>` });
    });
  },

  /** Debrief: award AP to every spider of each slot (half for a slot caught in the last Escape obstacle). */
  async awardDebrief(outcome = null) {
    return gmOnly(async () => {
      const s = store.state;
      if (s.debrief?.awarded) return ui.notifications?.info("AP were already awarded for this heist.");
      const out = outcome ?? s.debrief?.outcome ?? flow.debriefOutcome(s);
      const awards = flow.apAwards(s, out);
      for (const a of awards) {
        for (const id of a.actorIds) {
          const actor = game.actors.get(id);
          if (!actor || !a.ap) continue;
          const adv = actor.system?.advancement ?? {};
          await actor.update({ "system.advancement.value": (Number(adv.value) || 0) + a.ap, "system.advancement.earned": (Number(adv.earned) || 0) + a.ap });
        }
      }
      await store.mutate(st => flow.addLog({ ...st, debrief: { outcome: out, awarded: true, awards } }, `Debrief: ${out}.`), { label: "award" });
      const rows = awards.map(a => `<li>${a.actorIds.map(id => esc(game.actors.get(id)?.name ?? "?")).join(" & ")}: <strong>${a.ap} AP</strong>${a.half ? " (caught in the last Escape obstacle: half)" : ""}</li>`);
      await ChatMessage.create({ speaker: { alias: "The Debrief" }, content: `<p>AP awarded:</p><ul>${rows.join("")}</ul>` });
      await resetCrewStatus(store.state);
      await store.mutate(st => flow.endHeist(st), { label: "endHeist" });
      return awards;
    });
  }
});

/** Import missing creature actors from the creatures pack and map them. */
async function mapCreatureActors() {
  const s = store.state;
  const pack = game.packs?.get(`${SYSTEM_ID}.creatures`);
  const updates = {};
  for (const c of s.creatures ?? []) {
    if (c.actorUuid) continue;
    let actor = game.actors.find(a => a.type === "threat" && ((a.system?.automation?.key || resolveCreatureKey(a.name)) === c.key));
    if (!actor && pack) {
      try {
        const index = await pack.getIndex();
        const name = CREATURE_AUTOMATION[c.key]?.name;
        const entry = index.find(e => e.name === name || slug(e.name) === c.key);
        if (entry) actor = await game.actors.importFromCompendium(pack, entry._id, {}, { keepId: false });
      } catch (err) { console.warn("Heisty Spideys | creature import failed:", err); }
    }
    if (actor) updates[c.id] = actor.uuid;
  }
  if (Object.keys(updates).length) {
    await store.mutate(st => ({ ...st, creatures: st.creatures.map(c => (updates[c.id] ? { ...c, actorUuid: updates[c.id] } : c)) }), { label: "creature actors" });
  }
}

/** Escape start: unfired Flaws, I Know a Way, the sled, the Rat's trap. */
async function escapeNudges() {
  const s = store.state;
  const lines = [];
  const buttons = [];
  for (const c of flow.presentCrew(s)) {
    const a = game.actors.get(c.actorId);
    const flaw = a?.items?.find(i => i.type === "flaw");
    const key = flaw ? (flaw.system?.key || slug(flaw.name)) : null;
    if (key && ST_FLAWS.includes(key) && flaw.system?.usage?.heistId !== s.heistId) {
      lines.push(`<li>${esc(a.name)}'s ${esc(flaw.name)} hasn't fired this heist.</li>`);
      buttons.push({ action: "prompt", label: `Fire ${a.name}'s Flaw`, args: { do: "fireFlaw", actorId: a.id, keep: true } });
    }
    if (a && hasPerk(a, "escape-routes")) lines.push(`<li>${esc(a.name)} has Escape Routes: Escape rolls −1 while leading (set the leader on the tracker).</li>`);
    if (a && (a.items ?? []).some(i => i.type === "role" && /wheelman/i.test(i.name))) lines.push(`<li>${esc(a.name)} can use I Know a Way (−1 on every Escape roll).</li>`);
  }
  for (const l of s.loot ?? []) {
    if (l.status === "carried" && l.tier === "treasure" && !l.sled) lines.push(`<li>${esc(l.name)} is a Treasure: two carriers at half Speed (one can't move it), or a silk sled (1 SP) at full.</li>`);
  }
  const rat = (s.creatures ?? []).find(c => c.key === "protection-rat" && !c.state?.bad);
  if (rat && s.catalogKey === "restaurant" && !s.procedures?.["rat-deal"]?.trapJammed) {
    lines.push("<li>Is the snap trap still set? Leaving with it set and the deal goes bad (+2, once).</li>");
    buttons.push({ action: "prompt", label: "The trap's still set: the deal goes bad", args: { do: "dealBad", creatureId: rat.id } });
  }
  if (lines.length) await postPrompt({ title: "Into the Escape", html: `<ul>${lines.join("")}</ul>`, buttons });
}

/** Information Perks at an obstacle's start (WP-A's ability runtime posts the GM prompt). */
async function perkPrompts(ob) {
  if (!ob) return;
  const s = store.state;
  const abilities = api().abilities;
  if (typeof abilities?.use === "function") {
    const defs = Object.values(abilities.ABILITIES ?? {});
    const atStart = new Set(defs.filter(d => d.trigger === "obstacleStart" || d.extra?.trigger === "obstacleStart").map(d => d.key));
    atStart.add("early-warning");
    const mechanism = ob.kind === "mechanism" || (ob.tags ?? []).some(t => ["lock", "complexLock", "sensor", "smallMech"].includes(t));
    for (const c of flow.presentCrew(s)) {
      const a = game.actors.get(c.actorId);
      if (!a) continue;
      for (const key of atStart) if (hasPerk(a, key)) await abilities.use(a, key, { quiet: true }).catch?.(() => null);
      if (mechanism && hasPerk(a, "i-see-how-this-works")) await abilities.use(a, "i-see-how-this-works", { quiet: true }).catch?.(() => null);
    }
    return;
  }
  const holders = [];
  for (const c of flow.presentCrew(s)) {
    const a = game.actors.get(c.actorId);
    if (!a) continue;
    for (const [key, name] of [["early-warning", "Early Warning"], ["i-see-how-this-works", "I See How This Works"], ["spider-sense-sort-of", "Spider-Sense… Sort Of"]]) {
      if (hasPerk(a, key)) holders.push(`${esc(a.name)} (${name})`);
    }
  }
  if (!holders.length) return;
  const threats = (s.creatures ?? []).filter(c => c.atObstacles.includes(ob.id)).map(c => {
    const def = creatureDef(c.key);
    return `<li><strong>${esc(c.name)}</strong>: ${c.state?.active ? "active" : "not active"}. Escalation: ${esc((def?.steps ?? []).map(x => `${x.at} ${x.text}`).join(" · ") || "—")}. Weakness: ${esc(def?.weakness ?? "—")}</li>`;
  });
  await postPrompt({
    title: "Information Perks",
    html: `<p>${holders.join(", ")} — at <strong>${esc(ob.name)}</strong>. Tags: ${esc((ob.tags ?? []).join(", ") || "none")}.</p>${threats.length ? `<ul>${threats.join("")}</ul>` : "<p>No creature here.</p>"}`
  });
}

/** The Debrief card (outcome preselected; the GM confirms with one click). */
async function debriefCard() {
  const s = store.state;
  const outcome = s.debrief?.outcome ?? flow.debriefOutcome(s);
  const awards = flow.apAwards(s, outcome);
  return postCard(CARD.debrief, {
    outcome,
    rows: awards.map(a => ({ names: a.actorIds.map(id => game.actors.get(id)?.name ?? "?").join(" & "), ap: a.ap, half: a.half })),
    awarded: false, heistName: s.name
  });
}

/* --------------------------------------------------------------- GM ops -- */

function actorOrThrow(id) {
  const a = game.actors.get(id);
  if (!a) throw new Error("Unknown spider.");
  return a;
}

function mustOwn(ctx, actorId) {
  if (!ownsActor(ctx.userId, actorId)) throw new Error("You don't control that spider.");
}

async function spendSp(actor, n, reason) {
  if (!setting(SETTINGS.autoSilk, true)) return true;
  const ops = api().actorOps;
  if (typeof ops?.spendSilk === "function") {
    const r = await ops.spendSilk(actor, n, { reason });
    return r?.ok !== false && r !== false;
  }
  const have = Number(actor.system?.silk?.value) || 0;
  if (have < n) return false;
  await actor.update({ "system.silk.value": have - n });
  return true;
}

function abilityUsable(actor, key) {
  try {
    const u = api().actorOps?.usage?.(actor, key);
    if (u == null) return true;
    if (u.has === false) return false;
    return u.available !== false;
  } catch (e) { return true; }
}

const CANCEL_ABILITIES = {
  thatsNotWhatHappened: { key: "sig:face", sp: 2, name: "That's Not What Happened" },
  plausibleDeniability: { key: "plausible-deniability", sp: 0, name: "Plausible Deniability" },
  abortAbort: { key: "abort-abort", sp: 0, name: "Abort, Abort" }
};

/** Register this package's GM operations (§8). */
export function registerHeistOps() {
  gm.register(OPS.alertCancel, {
    check(args, ctx) {
      mustOwn(ctx, args.actorId);
      const def = CANCEL_ABILITIES[args.ability];
      if (!def) throw new Error("That reaction can't cancel an Alert.");
      const actor = actorOrThrow(args.actorId);
      const entry = findEvent(HeistyAlert.ledger, args.eventId);
      if (!entry) throw new Error("That moment has passed (the round has ended).");
      const clock = store.clock();
      const ok = args.ability === "plausibleDeniability" ? canPlausibleDeniability(entry, clock)
        : canCancel(entry, clock, { failureOnly: args.ability === "abortAbort" });
      if (!ok) throw new Error(`${def.name} can't cancel that one.`);
      const abilityKey = args.abilityKey ?? def.key;
      if (!abilityUsable(actor, abilityKey)) throw new Error(`${def.name}: already used.`);
      if (def.sp && setting(SETTINGS.autoSilk, true) && (Number(actor.system?.silk?.value) || 0) < def.sp) throw new Error(`${def.name} costs ${def.sp} SP.`);
      return true;
    },
    async apply(args) {
      const def = CANCEL_ABILITIES[args.ability];
      const actor = actorOrThrow(args.actorId);
      const abilityKey = args.abilityKey ?? def.key;
      const use = api().abilities?.use;
      if (typeof use === "function") {
        // WP-A validates, pays (That's Not What Happened: 2 SP) and stamps the use.
        const r = await use(actor, abilityKey, { stampOnly: true, quiet: true });
        if (!r?.ok) throw new Error(r?.reason === "silk" ? `${def.name} costs ${def.sp} SP.` : `${def.name} isn't available.`);
      } else {
        if (def.sp && !(await spendSp(actor, def.sp, def.name))) throw new Error(`${def.name} costs ${def.sp} SP.`);
        try { await api().actorOps?.markUsed?.(actor, abilityKey); } catch (e) { /* no WP-A */ }
      }
      await HeistyAlert.amend(args.eventId, { cancels: [{ key: args.ability, by: args.actorId }] });
      if (args.ability === "abortAbort") await store.mutate(st => flow.addLog(st, `${actor.name}: Abort, Abort — may retreat, leaving the obstacle unpassed.`), { label: "abort" });
      return { cancelled: true };
    }
  });

  gm.register(OPS.alertPledge, {
    check(args, ctx) {
      mustOwn(ctx, args.actorId);
      const sp = Math.round(Number(args.sp) || 0);
      if (sp < 1 || sp > 3) throw new Error("Chip in 1 to 3 SP.");
      const entry = findEvent(HeistyAlert.ledger, args.eventId);
      if (!canDamageControl(entry, store.state.crewUsage, store.clock())) throw new Error("Damage Control can't be called on that (once per heist, on a +2 or bigger spike, before the round ends).");
      const actor = actorOrThrow(args.actorId);
      if (setting(SETTINGS.autoSilk, true) && (Number(actor.system?.silk?.value) || 0) < sp) throw new Error("Not enough Silk.");
      return true;
    },
    async apply(args) {
      const sp = Math.round(Number(args.sp) || 0);
      let dc = null;
      await store.mutate(st => {
        const cur = st.crewUsage?.damageControl?.eventId === args.eventId ? st.crewUsage.damageControl : { eventId: args.eventId, pledges: [], done: false };
        const pledges = [...(cur.pledges ?? []).filter(p => p.actorId !== args.actorId), { actorId: args.actorId, sp }];
        dc = { ...cur, pledges };
        return { ...st, crewUsage: { ...(st.crewUsage ?? {}), damageControl: dc } };
      }, { label: "pledge" });
      const total = dc.pledges.reduce((n, p) => n + p.sp, 0);
      if (total >= 3) {
        let need = 3;
        const paid = [];
        for (const p of dc.pledges) {
          if (need <= 0) break;
          const take = Math.min(p.sp, need);
          const actor = game.actors.get(p.actorId);
          if (actor && await spendSp(actor, take, "Damage Control")) { paid.push({ actorId: p.actorId, sp: take }); need -= take; }
        }
        if (need > 0) throw new Error("The pledges didn't cover it — nothing was spent.");
        await store.mutate(st => ({ ...st, crewUsage: { ...st.crewUsage, damageControl: { ...st.crewUsage.damageControl, pledges: paid, done: true } } }), { label: "damage control" });
        await HeistyAlert.amend(args.eventId, { reductions: [{ key: "damageControl", delta: -1, by: paid }] });
        await ChatMessage.create({ speaker: { alias: "Damage Control" }, content: `<p>The crew spends 3 SP between them: that spike is reduced by 1.</p>` });
      }
      const msg = findCardMessage(c => c.kind === CARD.alertEvent && c.eventId === args.eventId);
      if (msg) await patchCard(msg, {});
      return { total, done: total >= 3 };
    }
  });

  gm.register(OPS.crewNptp, {
    check(args, ctx) {
      mustOwn(ctx, args.actorId);
      if (store.state.crewUsage?.notPartOfThePlan) throw new Error("Not Part of the Plan was already used this heist.");
      const actor = actorOrThrow(args.actorId);
      if (setting(SETTINGS.autoSilk, true) && (Number(actor.system?.silk?.value) || 0) < 4) throw new Error("Not Part of the Plan costs 4 SP.");
      return true;
    },
    async apply(args) {
      const actor = actorOrThrow(args.actorId);
      if (!(await spendSp(actor, 4, "Not Part of the Plan"))) throw new Error("Not Part of the Plan costs 4 SP.");
      const ref = args.ref ?? {};
      await store.mutate(st => {
        let n = { ...st, crewUsage: { ...(st.crewUsage ?? {}), notPartOfThePlan: { ref, actorId: args.actorId } } };
        for (const id of ref.effectIds ?? []) n = flow.removeEffect(n, id);
        if (ref.creatureId) n = flow.patchCreature(n, ref.creatureId, { active: false });
        return flow.addLog(n, `${actor.name}: Not Part of the Plan.`);
      }, { label: "nptp" });
      for (const eid of [ref.eventId, ...(ref.eventIds ?? [])].filter(Boolean)) {
        if (findEvent(HeistyAlert.ledger, eid)) await HeistyAlert.amend(eid, { cancels: [{ key: "notPartOfThePlan", by: args.actorId }] });
      }
      if (args.messageId) {
        const m = game.messages.get(args.messageId);
        if (m && MY_KINDS.has(getCard(m)?.kind)) await patchCard(m, { negated: true });
      }
      await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor }), content: `<p><strong>${esc(actor.name)}</strong> spends 4 SP: <em>Not Part of the Plan.</em> The Storyteller's last complication doesn't happen.</p>` });
      return { negated: true };
    }
  });

  gm.register(OPS.heistActed, {
    check(args, ctx) { mustOwn(ctx, args.actorId); return true; },
    async apply(args) {
      if (!inPlay(store.state)) return null;
      await store.mutate(st => flow.markActed(st, args.actorId), { label: "acted" });
      await maybeEndRoundPrompt();
      return true;
    }
  });

  gm.register(OPS.heistLoot, {
    check(args, ctx) {
      if (args.actorId) mustOwn(ctx, args.actorId);
      else if (!ctx.isGM) throw new Error("Pick a spider.");
      if (!["pickUp", "join", "leave", "handOver", "drop", "sled"].includes(args.action) && !ctx.isGM) throw new Error("Only the Storyteller can do that to the loot.");
      return true;
    },
    async apply(args) {
      const s = store.state;
      let lootId = args.lootId;
      if (!lootId && args.action === "sled") lootId = (s.loot ?? []).find(l => (l.carriers ?? []).includes(args.actorId) && l.tier === "treasure")?.id ?? (s.loot ?? []).find(l => l.objective)?.id;
      if (!lootId) return null;
      await store.mutate(st => flow.addLog(flow.lootAction(st, lootId, args.action, { actorId: args.actorId, toActorId: args.toActorId, value: args.value ?? true }), `Loot: ${args.action}.`), { label: "loot" });
      return true;
    }
  });

  gm.register(OPS.heistPrep, {
    check(args, ctx) { mustOwn(ctx, args.actorId); return true; },
    async apply(args) {
      // Accept {prep: {...}} or the fields flat on args.
      const { actorId, userId, prep: nested, ...flat } = args;
      const prep = { ...flat, ...(nested ?? {}) };
      if (prep.perkKind === "trap" || prep.kind === "trap") prep.kind = "perk";
      const ok = await heistApi.addPreparation(actorId, { ...prep, kind: prep.kind ?? "other" });
      if (!ok) throw new Error("One Preparation per spider (entry squares and Perk-granted ones are free).");
      return true;
    }
  });

  gm.register(OPS.heistCasingReveal, {
    check(args, ctx) { if (!ctx.isGM) throw new Error("The Storyteller reveals intel."); return true; },
    async apply(args) { return heistApi.revealIntel(args.ids ?? []); }
  });

  gm.register(OPS.heistAddEffect, {
    check(args, ctx) {
      if (args.actorId) mustOwn(ctx, args.actorId);
      else if (!ctx.isGM) throw new Error("Pick a spider.");
      const e = args.effect ?? {};
      if (!["diff", "dice", "noCover", "npcDistracted", "escapeDiff", "line", "snare", "autoPass", "orbLine", "orbSnare", "phaseThrough"].includes(e.kind)) throw new Error("Unknown effect.");
      if (Math.abs(Number(e.value) || 0) > 3) throw new Error("That effect is out of range.");
      return true;
    },
    async apply(args) {
      await store.mutate(st => flow.addEffect(st, { ...args.effect, sourceActorId: args.actorId ?? null, ability: args.ability ?? "" }), { label: "effect" });
      // A distracted NPC: suppress the creature's +X while it's distracted.
      const e = args.effect ?? {};
      // ("all: true" — every NPC watching one spider, Make a Scene — is a note, not a suppression.)
      if (e.kind === "npcDistracted" && !e.all && (e.actors ?? []).length) {
        const ids = new Set(e.actors);
        await store.mutate(st => ({ ...st, creatures: st.creatures.map(c => (ids.has(c.id) || (c.actorUuid && ids.has(c.actorUuid.split(".").pop())) ? { ...c, state: { ...c.state, suppressedUntilRound: Math.max(Number(c.state.suppressedUntilRound ?? -1), Number(e.untilRoundSerial ?? st.roundSerial)) } } : c)) }), { label: "suppress" });
      }
      return true;
    }
  });

  // Internal (not in OPS): a player's ability raises the Alert (Make a Scene, Dramatic).
  gm.register("heist.alertRaise", {
    check(args, ctx) {
      const actorId = args.source?.actorId;
      if (!actorId) throw new Error("No source spider.");
      mustOwn(ctx, actorId);
      if (!/^(ability|flaw):/.test(String(args.eventId))) throw new Error("Only an ability's own Alert.");
      const t = args.triggers ?? [];
      if (!t.length || t.length > 2 || t.some(x => !(Number(x.delta) > 0 && Number(x.delta) <= 2))) throw new Error("That Alert change is out of range.");
      return true;
    },
    async apply(args) {
      await HeistyAlert.raise({ eventId: args.eventId, triggers: args.triggers.map(t => ({ ...t, src: "ability" })), cause: "ability", source: args.source });
      return true;
    }
  });

  // Internal: a player delays their Flaw a round (they paid the SP).
  gm.register("heist.delayFlaw", {
    check(args, ctx) { mustOwn(ctx, args.actorId); return true; },
    async apply(args) { await store.mutate(st => flow.delayFlaw(st, args.actorId, args.flawKey), { label: "delayFlaw" }); return true; }
  });
}

/* ----------------------------------------------------------- registration -- */

function addTrackerControl(controls) {
  const group = controls?.tokens;
  if (!group?.tools || ("heisty-heist-tracker" in group.tools)) return;
  group.tools["heisty-heist-tracker"] = {
    name: "heisty-heist-tracker",
    title: "Heist Tracker",
    icon: "fa-solid fa-route",
    order: Object.keys(group.tools).length,
    button: true,
    visible: !!game.user?.isGM || !!setting(SETTINGS.trackerForPlayers, true),
    onChange: () => heistApi.openTracker()
  };
}

let registered = false;

/**
 * Init (WP-D calls this FIRST): settings, the GM-op registry and query
 * handler, this package's ops, the hooks, the carry lookup. Attaches `gm`,
 * `heist`, `alert` and `openTracker` to `game.heistySpideys` (creating it if
 * needed) so the other packages can register their ops right after.
 * @returns {{gm, heist, alert, openTracker}}
 */
export function registerHeistAutomation() {
  const ns = { gm, heist: heistApi, alert: HeistyAlert, openTracker: () => heistApi.openTracker() };
  if (globalThis.game) game.heistySpideys = Object.assign(game.heistySpideys ?? {}, ns);
  if (registered) return ns;
  registered = true;

  registerHeistSettings({ onStateChange: v => store.onSettingChange(v), onTrackerChange: () => ui.controls?.render?.() });
  registerGmQueries();
  registerHeistOps();

  // The carry lookup for SpiderData (Speed from loot and carrying), once data models exist.
  Hooks.once("setup", () => {
    const Spider = CONFIG.Actor?.dataModels?.spider;
    if (Spider) Spider.carryLookup = actor => heistApi.carryFor(actor?.id);
  });

  Hooks.on("createChatMessage", message => { if (isActiveGM()) serial(() => onRollMessage(message, false)); });
  Hooks.on("updateChatMessage", (message, changes) => {
    if (!isActiveGM()) return;
    if (!foundry.utils.hasProperty(changes, `flags.${FLAG}`)) return;
    serial(() => onRollMessage(message, true));
  });
  Hooks.on("updateActor", (actor, changes) => {
    if (!isActiveGM() || actor?.type !== "spider") return;
    if (foundry.utils.getProperty(changes, "system.vitality.state") === "out") serial(() => handleOut(actor));
  });
  Hooks.on("updateCombat", (combat, changes, options) => {
    if (!isActiveGM() || !("round" in (changes ?? {})) || options?.heistyInternal) return;
    if (!inPlay(store.state) || Number(changes.round) <= 1) return;
    if (options?.direction !== undefined && options.direction < 0) return;
    serial(() => heistApi.endRound({ fromCombat: true }));
  });
  Hooks.on("createCombatant", combatant => {
    if (!isActiveGM() || combatant?.initiative !== null && combatant?.initiative !== undefined) return;
    // The crew goes first (Ch 3).
    const crew = combatant.actor?.type === "spider";
    combatant.parent?.setInitiative?.(combatant.id, crew ? 2 : 1).catch?.(() => {});
  });
  Hooks.on("preUpdateToken", (doc, changes, options) => onPreUpdateToken(doc, changes, options));
  Hooks.on("updateToken", (doc, changes, options, userId) => onUpdateToken(doc, changes, options, userId, { isActiveGM }));
  HeistyAlert.afterFold = (value, entry, info) => afterFold(value, entry, info);
  Hooks.on("renderChatMessageHTML", onRenderHeistCard);
  Hooks.on("getSceneControlButtons", addTrackerControl);

  heistApi._tracker = () => foundry.applications.instances?.get?.(HeistTracker.DEFAULT_OPTIONS.id) ?? null;
  return ns;
}

/**
 * Ready (WP-D calls this after the migration): the socket fallback, seeding the
 * heist state (with a ledger checkpoint at the current Alert), and the GM's
 * reconcile of roll cards made while no GM was online.
 */
export async function readyHeistAutomation() {
  registerGmSocket();
  store.prime();
  if (!isActiveGM()) return;
  await store.seed();
  await reconcile();
}

/** On ready: apply roll cards whose eventId the ledger has never seen (made with no GM online). */
async function reconcile() {
  const s = store.state;
  if (s.phase === "idle" && !(s.alertLedger ?? []).length) return;
  for (const m of recentMessages(60)) {
    const card = getCard(m);
    if (!card || !ROLL_KINDS.has(card.kind) || card.heistId !== s.heistId) continue;
    const eventId = card.eventId || card.groupId || m.id;
    const prog = card.obstacleId ? store.state.progress?.[card.obstacleId]?.rolls?.[m.id] : null;
    if (hasEvent(HeistyAlert.ledger, eventId) && (!card.obstacleId || prog)) continue;
    await serial(() => onRollMessage(m, false));
  }
}

export { heistApi, HeistyAlert, SETTING_LANG_KEYS };
