/**
 * HEISTY SPIDEYS — Chat card flags (§7 of docs/AUTOMATION-DESIGN.md)
 * -----------------------------------------------------------------
 * Every WP-B card (check, threat, attack, shrug, assist) carries its state in
 * `flags["heisty-spideys"].card`; the HTML content is re-rendered from it on
 * every update and per-viewer buttons are injected at render time
 * (chat/card-actions.mjs). This module holds the flag schema helpers, the
 * card.patch whitelist and optimistic versioning (pure), and the template data
 * builders (pure; `renderCardContent` is the only Foundry call).
 */

import { FLAG, CARD } from "../contracts.mjs";
import { HEISTY } from "../config.mjs";
import { SUCCESS_FACE } from "../logic/rules.mjs";
import { cardAlertDelta } from "../logic/rolls.mjs";

export const CARD_VERSION = 1;

/** Template per card kind. */
export const CARD_TEMPLATES = Object.freeze({
  [CARD.check]: "systems/heisty-spideys/templates/chat/roll-card.hbs",
  [CARD.threat]: "systems/heisty-spideys/templates/chat/threat-card.hbs",
  [CARD.attack]: "systems/heisty-spideys/templates/chat/attack-card.hbs",
  [CARD.shrug]: "systems/heisty-spideys/templates/chat/shrug-card.hbs",
  [CARD.assist]: "systems/heisty-spideys/templates/chat/assist-card.hbs"
});

/** Card kinds WP-B renders. */
export const WPB_KINDS = Object.freeze([CARD.check, CARD.threat, CARD.attack, CARD.shrug, CARD.assist]);

/**
 * Top-level card fields a `card.patch` GM op may replace, per kind. Everything
 * else (actor, event, clock stamps) is fixed at creation.
 */
export const PATCHABLE = Object.freeze({
  [CARD.check]: ["roll", "silk", "alert", "consequences"],
  [CARD.threat]: ["alert"],
  [CARD.attack]: ["attack", "consequences", "alert"],
  [CARD.shrug]: ["shrug", "silk", "roll"],
  [CARD.assist]: ["assist", "silk"]
});

/** The card on a message (or null). */
export function getCard(message) {
  return message?.flags?.[FLAG]?.card ?? message?.getFlag?.(FLAG, "card") ?? null;
}

/** A new card with the common header. */
export function newCard(kind, fields = {}) {
  return { v: CARD_VERSION, kind, version: 0, ...fields };
}

/**
 * Apply a whitelisted patch with optimistic concurrency.
 * @param {object} card
 * @param {object} patch          {field: value} — only PATCHABLE fields of the card's kind.
 * @param {number} [expectVersion] When given, must equal card.version.
 * @returns {object} The new card (version + 1).
 * @throws When the version is stale or a field isn't patchable.
 */
export function applyPatch(card, patch, expectVersion) {
  if (!card) throw new Error("No card on that message.");
  if (expectVersion != null && Number(expectVersion) !== Number(card.version ?? 0))
    throw new Error("The card changed meanwhile — try again.");
  const allowed = PATCHABLE[card.kind] ?? [];
  const next = structuredClone(card);
  for (const [k, v] of Object.entries(patch ?? {})) {
    if (!allowed.includes(k)) throw new Error(`"${k}" can't be patched on a ${card.kind} card.`);
    next[k] = structuredClone(v);
  }
  next.version = (Number(card.version) || 0) + 1;
  return next;
}

/** The patch that turns `card` into `next` (only the changed patchable fields). */
export function diffPatch(card, next) {
  const out = {};
  for (const k of PATCHABLE[next.kind] ?? []) {
    if (JSON.stringify(card?.[k]) !== JSON.stringify(next[k])) out[k] = next[k];
  }
  return out;
}

/* -------------------------------------------- */
/*  Template data (pure)                        */
/* -------------------------------------------- */

const signed = n => (n > 0 ? `+${n}` : `${n}`);
const skillLabel = k => HEISTY.skills[k]?.label ?? k;
const vitLabel = k => HEISTY.vitality[k]?.label ?? k;

/** Faces for display, marking Successes and rerolled dice. */
export function displayFaces(faces, rerolls = []) {
  const rerolled = new Set((rerolls ?? []).flatMap(r => r.indices ?? []));
  return (faces ?? []).map((f, i) => ({ result: f, success: Number(f) >= SUCCESS_FACE, rerolled: rerolled.has(i) }));
}

const REROLL_LABEL = { silk: "Silk Reroll", wolf: "Run It Again", silverTongue: "Silver Tongue" };
const CANCEL_LABEL = {
  thatsNotWhatHappened: "That's Not What Happened", plausibleDeniability: "Plausible Deniability",
  abortAbort: "Abort, Abort", smokeAndMirrors: "Smoke and Mirrors", notPartOfThePlan: "Not Part of the Plan",
  noConsequence: "no consequence", swapped: "the ST swapped the cost", contingency: "Contingency"
};

/** One line describing a card's Alert effect. */
export function alertLine(card) {
  const r = card.roll ?? {};
  if (card.alertOff) return { text: "No Alert in this phase.", cls: "" };
  const a = card.alert ?? { triggers: [], cancels: [] };
  if ((a.cancels ?? []).length) {
    return { text: `Alert: cancelled (${a.cancels.map(c => CANCEL_LABEL[c.key] ?? c.key).join(", ")}).`, cls: "good" };
  }
  const d = cardAlertDelta(a);
  const trig = (a.triggers ?? []).find(t => Number(t.delta) === d);
  const manual = card.alertMode === "manual";
  if (!d) return r.result ? { text: manual ? "Suggested Alert: no change." : "No Alert change.", cls: "" } : null;
  const why = trig?.label ? ` (${trig.label})` : "";
  const group = card.groupId ? " — a group check raises the Alert once, by its largest trigger" : "";
  return { text: `${manual ? "Suggested Alert" : "Alert"} ${signed(d)}${why}${group}.`, cls: d > 0 ? "warn" : "good" };
}

/** Template data for a check card. */
export function checkCardData(card) {
  const r = card.roll ?? {};
  const res = HEISTY.results[r.result] ?? HEISTY.results.failure;
  const notes = [];
  if (r.approachLabel) notes.push({ icon: "fa-route", text: `Approach: ${r.approachLabel}` });
  if (r.opposed) notes.push({ icon: "fa-scale-balanced", text: `Opposed by ${r.opposed.name}${r.opposed.label ? ` (${r.opposed.label})` : ""}: ${r.opposed.successes} Success${r.opposed.successes === 1 ? "" : "es"} + 1 = Difficulty ${r.opposed.difficulty}.` });
  if (r.humanRow) notes.push({ icon: "fa-person", text: `Against a human: ${r.humanRow.label ?? "Ch 15 row"} (Difficulty ${r.humanRow.difficulty}).` });
  if (r.improvise) notes.push({ icon: "fa-shuffle", text: `Improvised with ${skillLabel(r.skill)}${r.calledSkill ? ` instead of ${skillLabel(r.calledSkill)}` : ""} (+1 Difficulty, 2 SP).` });
  if (r.bonus?.capped) notes.push({ icon: "fa-hand", text: `Bonus dice capped at +2 (asked for +${r.bonus.requested}). Silk dice don't count toward the limit.` });
  if (r.showOff) notes.push({ icon: "fa-star", text: "Show-Off: the flashier approach." });
  if (r.casing) notes.push({ icon: "fa-magnifying-glass", text: "Casing roll: each Success can reveal one true detail (never the unknown obstacle)." });
  if (r.forced) notes.push({ icon: "fa-bolt", text: `Forced roll${r.reason ? `: ${r.reason}` : ""} — free, not your Action.` });
  if (r.passFail) notes.push({ icon: "fa-check-double", text: "Pass or fail: a Partial passes, at no extra cost." });
  if (card.groupId) notes.push({ icon: "fa-people-group", text: "Group check: each spider gets through on its own result." });
  if (card.fullAlert) notes.push({ icon: "fa-lock", text: "Full Alert: the Alert is locked at the Limit.", warn: true });
  if (r.clutched) notes.push({ icon: "fa-gem", text: "Silk Clutch: this Failure became a Success (+1 Alert).", good: true });
  if (r.contingency) notes.push({ icon: "fa-clipboard-check", text: "Contingency: the trigger happened — a Success, no Alert, no complication.", good: true });
  for (const w of r.warnings ?? []) notes.push({ icon: "fa-circle-info", text: w });

  const chips = [{ text: `${r.botch ? 1 : r.pool}d6`, cls: "" }];
  for (const p of r.poolParts ?? []) {
    if (p.kind === "base" || p.kind === "note" || !p.value) continue;
    chips.push({ text: `${p.label} ${signed(p.value)}`, cls: p.value > 0 ? "good" : "warn" });
  }
  for (const p of r.diffParts ?? []) {
    if (p.id === "base" || !p.value) continue;
    chips.push({ text: `${p.label}: Diff ${signed(p.value)}`, cls: p.value > 0 ? "warn" : "good" });
  }

  const history = [];
  for (const rr of r.rerolls ?? []) history.push({ text: `${REROLL_LABEL[rr.by] ?? rr.by}: ${rr.indices?.length ?? 0} ${rr.indices?.length === 1 ? "die" : "dice"} → ${(rr.faces ?? []).join(", ")}${rr.from ? ` (was ${HEISTY.results[rr.from]?.label ?? rr.from})` : ""}` });
  for (const s of card.silk?.spent ?? []) history.push({ text: `Silk spent: ${s.label ?? s.type} (${s.cost} SP)${s.advice ? " — not deducted (advice only)" : ""}` });
  for (const e of card.silk?.earned ?? []) history.push({ text: `Silk earned: ${e.label ?? e.type} (+${e.sp} SP)` });

  const c = card.consequences ?? {};
  const cons = [];
  if (c.swap) cons.push({ text: `Partial cost: ${c.swap.text ?? c.swap.kind}`, cls: "" });
  if (c.partialCost === "hit" && c.hit) cons.push({ text: `Full Alert Partial: a hit from ${c.hit.name} (${c.hit.label} ${c.hit.pool}).`, cls: "warn" });
  else if (c.partialCost === "penalty") cons.push({ text: "Full Alert Partial: −1 die on your next roll (or a dropped item).", cls: "warn" });
  else if (c.hit) cons.push({ text: `${c.hit.name} sees you fail: a hit (${c.hit.label} ${c.hit.pool})${c.status === "final" ? "" : " — when the roll is final"}.`, cls: "warn" });
  if (c.caught) cons.push({ text: c.status === "final" ? "Caught in a Full Alert Escape — Out." : "Full Alert Escape: caught — Out — once this roll is final (a Reroll or Clutch can still save it).", cls: "warn" });
  if (c.custom) cons.push({ text: c.custom, cls: "" });

  return {
    actorName: card.actorName, actorImg: card.actorImg,
    label: r.label, subtitle: r.subtitle,
    resultCss: res.css, resultLabel: r.clutched ? "Success (Clutched)" : res.label,
    blurb: r.result === "cleanfail" ? "An ordinary Failure, no bonus disaster. This time. (+1 Alert; a Botch die can't be Clutched.)" : res.blurb,
    faces: displayFaces(r.faces, r.rerolls),
    successes: r.successes, difficulty: r.difficulty, isBotch: !!r.botch, botchDie: r.botch ? r.faces?.[0] : null,
    notes, chips, history, hasHistory: history.length > 0,
    alertLine: alertLine(card), consequences: cons, hasConsequences: cons.length > 0,
    final: c.status === "final"
  };
}

/** Template data for a threat card (a creature's plain or opposed roll). */
export function threatCardData(card) {
  const r = card.roll ?? {};
  return {
    actorName: card.actorName, actorImg: card.actorImg,
    label: r.label, note: r.note ?? "",
    pool: r.pool, faces: displayFaces(r.faces), successes: r.successes,
    opposedDifficulty: (Number(r.successes) || 0) + 1, opposing: r.opposing ?? "",
    alertLine: (card.alert?.triggers ?? []).length || (card.alert?.cancels ?? []).length ? alertLine(card) : null
  };
}

/** Template data for an attack card. */
export function attackCardData(card) {
  const a = card.attack ?? {};
  const outs = [];
  if (a.critToOut) outs.push("A Critical spider it hits goes under a glass: Out.");
  if (a.outIfLands) outs.push("Caught in the open: if it lands, Out.");
  if (a.capture) outs.push("A capture: if it lands, Out (Alert +3).");
  const sh = a.result;
  return {
    sourceName: a.sourceName, sourceImg: a.sourceImg || "icons/svg/hazard.svg",
    label: a.label, why: a.why ?? "",
    pool: a.pool, faces: displayFaces(a.faces), successes: a.successes, noDice: !a.pool,
    targetName: a.targetName, targetImg: a.targetImg,
    redirected: a.redirectedFromName ? `Take the Hit: ${a.targetName} steps in for ${a.redirectedFromName}.` : "",
    outs, hasOuts: outs.length > 0,
    resolved: !!sh,
    resultText: sh ? (sh.shrugged ? `${a.targetName} shrugged it off.` : `${a.targetName}: ${vitLabel(sh.vitalityBefore)} → ${vitLabel(sh.vitalityAfter)}${sh.out ? " (Out)" : ""}.`) : "",
    resultCss: sh ? (sh.shrugged ? "good" : "warn") : ""
  };
}

/** Template data for a shrug-off card. */
export function shrugCardData(card) {
  const s = card.shrug ?? {};
  const r = card.roll ?? {};
  let verdict;
  if (s.shrugged) verdict = "Shrugged it off";
  else if (s.out) verdict = "Out";
  else if (s.taygSaved) verdict = "Stopped at Hurt";
  else verdict = `Drop ${s.drop}`;
  const history = (r.rerolls ?? []).map(rr => ({ text: `${REROLL_LABEL[rr.by] ?? rr.by}: ${rr.indices?.length ?? 0} ${rr.indices?.length === 1 ? "die" : "dice"} → ${(rr.faces ?? []).join(", ")}` }));
  for (const sp of card.silk?.spent ?? []) history.push({ text: `Silk spent: ${sp.label ?? sp.type} (${sp.cost} SP)` });
  const marginText = s.shrugged
    ? `You beat the attack by ${-s.margin}.`
    : s.margin === 0 ? "A tie goes to the threat: drop one level."
      : s.margin <= 2 ? `The attack beats you by ${s.margin}: drop one level.` : `The attack beats you by ${s.margin}: drop two levels. That one landed.`;
  let tayg = null;
  if (s.tayg) tayg = {
    faces: displayFaces(s.tayg.faces), successes: s.tayg.successes,
    text: s.tayg.passed ? "That All You Got?: passed — you stop at Hurt." : "That All You Got?: not this time."
  };
  const causeText = { glass: "Under a glass: Out.", exterminator: "Sprayed in the open: Out.", capture: "Captured: Out." }[s.cause] ?? "";
  return {
    actorName: card.actorName, actorImg: card.actorImg,
    attackLabel: s.attackLabel, attackSuccesses: s.attackSuccesses,
    pool: s.pool, faces: displayFaces(s.faces, r.rerolls), successes: s.successes, noDice: !s.pool,
    verdict, verdictCss: s.shrugged ? "success" : s.out ? "botch" : s.drop >= 2 ? "failure" : "partial",
    marginText, causeText,
    vitText: `${vitLabel(s.vitalityBefore)} → ${vitLabel(s.vitalityAfter)}`,
    applied: s.applied !== false, tayg, history, hasHistory: history.length > 0
  };
}

/** Template data for an assist card. */
export function assistCardData(card) {
  const a = card.assist ?? {};
  return {
    actorName: card.actorName, actorImg: card.actorImg,
    targetName: a.targetName, skillLabel: skillLabel(a.skill),
    pool: a.pool, silkDice: a.silkDice, faces: displayFaces(a.faces), successes: a.successes,
    bonusText: a.successes > 0
      ? `+${a.successes} ${a.successes === 1 ? "die" : "dice"} to ${a.targetName}'s next roll${a.queued ? " (queued)" : ""}. The roll still gains at most +2 bonus dice.`
      : `No help this time — ${a.targetName} rolls without it.`
  };
}

const DATA = {
  [CARD.check]: checkCardData, [CARD.threat]: threatCardData, [CARD.attack]: attackCardData,
  [CARD.shrug]: shrugCardData, [CARD.assist]: assistCardData
};

/** Template data for any WP-B card. */
export function cardTemplateData(card) {
  return DATA[card?.kind]?.(card) ?? {};
}

/** Render a card's HTML content from its flags (Foundry). */
export async function renderCardContent(card) {
  const path = CARD_TEMPLATES[card?.kind];
  if (!path) return "";
  return foundry.applications.handlebars.renderTemplate(path, cardTemplateData(card));
}

/** Update data for writing a card back onto its message. */
export function cardUpdateData(card, content) {
  const data = { [`flags.${FLAG}.card`]: card };
  if (content != null) data.content = content;
  return data;
}
