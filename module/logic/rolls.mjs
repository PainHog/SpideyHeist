/**
 * HEISTY SPIDEYS — Roll plans, resolution, rerolls, Clutch and Alert triggers
 * --------------------------------------------------------------------------
 * Pure, Foundry-free rules for a spider's roll (WP-B of docs/AUTOMATION-DESIGN.md,
 * rulebook v4.8). Everything that decides a number lives here so it can be
 * unit-tested with node:test (test/rolls.test.mjs); the runtime (helpers/dice.mjs,
 * chat/card-actions.mjs) only gathers inputs, rolls dice and writes documents.
 *
 *  - buildRollPlan(input)   — pool, Difficulty, every part with its source, Silk cost.
 *  - resolveRoll(faces, d)  — Successes and the result key.
 *  - rerollIndices / applyReroll — rerolls that keep the Successes (Silk 3 dice, Wolf all).
 *  - applyClutch(card)      — a Failure on your own roll becomes a Success.
 *  - rollAlertTriggers(card, ctx) — the card's Alert triggers and cancels (§3.1 + §16).
 *  - cardActions(card, viewer)    — which buttons a viewer gets on a card.
 */

import { HEISTY } from "../config.mjs";
import {
  SUCCESS_FACE, BONUS_DICE_CAP, CRITICAL_ALERT_MIN_DIFFICULTY,
  countSuccesses, classifyResult, classifyBotch, opposedDifficulty
} from "./rules.mjs";
import { hazardPool } from "./hits.mjs";

/* -------------------------------------------- */
/*  Ability keys this module reads              */
/* -------------------------------------------- */

/**
 * Ability keys (WP-A `keys.itemAbilityKey`: perks/flaws by slug, species
 * "species:<key>", Signature Moves "sig:<roleKey>") used by the roll plan and
 * the card buttons. WP-D's contracts test checks each exists in ABILITIES.
 */
export const ABILITY_KEYS = Object.freeze({
  unfazed: "unfazed",
  soundless: "soundless",
  dontLookDown: "dont-look-down",
  iWasNeverHere: "i-was-never-here",
  overclock: "overclock",
  smokeAndMirrors: "smoke-and-mirrors",
  silverTongue: "silver-tongue",
  methodActor: "method-actor",
  longCon: "the-long-con",
  negotiatingPosition: "negotiating-position",
  escapeRoutes: "escape-routes",
  plausibleDeniability: "plausible-deniability",
  abortAbort: "abort-abort",
  takeTheHit: "take-the-hit",
  thatAllYouGot: "that-all-you-got",
  drafting: "drafting",
  contingency: "contingency",
  loud: "loud",
  arachnophobeMagnet: "arachnophobe-magnet",
  showOff: "show-off",
  runItAgain: "species:wolf",
  camouflage: "species:crab",
  thatsNotWhatHappened: "sig:face"
});
const K = ABILITY_KEYS;

/** Silk Point costs (Ch 8). */
export const SILK_COSTS = Object.freeze({
  die: 1, overclock: 1, reroll: 2, improvise: 2, clutch: 3, thatsNotWhatHappened: 2
});

/** A Silk Reroll rerolls at most this many dice that didn't succeed. */
export const SILK_REROLL_MAX = 3;

/** Results that count as a failed roll ("fail" means a Failure, a Botch or a clean failure; E1, §16). */
export const FAILED_RESULTS = Object.freeze(["failure", "cleanfail", "botch"]);
/** Results that pass a pass-or-fail check (a Partial passes). */
export const PASSING_RESULTS = Object.freeze(["partial", "success", "critical"]);

export const isFailed = result => FAILED_RESULTS.includes(result);
export const isPassing = result => PASSING_RESULTS.includes(result);

/** Skills that are "physical" for Run It Again by default (chase, pursuit, physical confrontation). */
export const PHYSICAL_SKILLS = Object.freeze(["athletics", "brawl"]);
/** Skills that make a roll against a creature a fight (E23). */
export const FIGHT_SKILLS = Object.freeze(["brawl", "intimidation"]);
/** Skills a movement group check covers for Drafting (E11). */
export const MOVEMENT_SKILLS = Object.freeze(["athletics", "acrobatics", "stealth"]);
/** Casing rolls in Planning (§3.13, §15-16). */
export const CASING_SKILLS = Object.freeze(["perception", "tactics"]);

const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const int = (v, d = 0) => Math.round(num(v, d));
const has = (keys, k) => Array.isArray(keys) ? keys.includes(k) : !!keys?.has?.(k);
const appliesToSkill = (skills, skill) => !skills || !skills.length || skills.includes(skill);

/* -------------------------------------------- */
/*  Vitality                                    */
/* -------------------------------------------- */

/**
 * The dice penalty for a Vitality state. Unfazed ignores Rattled's −1 (and
 * only that: Hurt and Critical still bite).
 */
export function vitalityPenalty(vitalityKey, abilityKeys = []) {
  const v = HEISTY.vitality[vitalityKey] ?? HEISTY.vitality.unharmed;
  if (vitalityKey === "rattled" && has(abilityKeys, K.unfazed)) return 0;
  return v.out ? 0 : v.penalty;
}

/* -------------------------------------------- */
/*  Alert band                                  */
/* -------------------------------------------- */

/** HEISTY.getAlertState for an {value, limit} pair, or pass a state through. */
export function alertStateOf(alert) {
  if (!alert) return HEISTY.getAlertState(0, 8);
  if ("atLimit" in alert && "stealth" in alert) return alert;
  return HEISTY.getAlertState(num(alert.value), num(alert.limit, 8));
}

/** Phases with no Alert (the Score has no rolls at all; Planning's Alert is off). */
export const ALERT_OFF_PHASES = Object.freeze(["score", "planning"]);

/* -------------------------------------------- */
/*  The roll plan                               */
/* -------------------------------------------- */

/**
 * Build the plan for one roll: every Difficulty modifier and every die with its
 * source, the +2 bonus cap, Silk dice and their cost, and the Botch check.
 *
 * Options are the auto-detected parts a player may untick. `input.toggles[id]`
 * (true/false) overrides an option's default; ids are stable (see below).
 *
 * @param {object} input
 * @param {"skill"|"attribute"|"assist"|"forced"} [input.kind]
 * @param {string}  [input.attr]          Attribute key rolled.
 * @param {number}  [input.attrValue]
 * @param {string}  [input.skill]         Skill key rolled ("" for an Attribute alone).
 * @param {number}  [input.skillValue]
 * @param {string}  [input.calledSkill]   The approach's Skill, when it differs (Improvise).
 * @param {number}  [input.difficulty]    Base Difficulty (ignored when opposed or a human row is set).
 * @param {{successes:number}|null} [input.opposed]   The creature's count (Successes + 1 = Difficulty).
 * @param {{difficulty:number,label?:string}|null} [input.humanRow]  Ch 15 row against a human.
 * @param {number}  [input.modifier]      Free Difficulty modifier.
 * @param {string}  [input.vitality]      Vitality key.
 * @param {string[]} [input.abilityKeys]  The roller's ability keys.
 * @param {string[]} [input.crewKeys]     Ability keys of the rest of the crew (Negotiating Position).
 * @param {{value:number,limit:number}|object} [input.alert]  Alert value/limit, or a getAlertState result.
 * @param {string}  [input.phase]         Heist phase ("idle" when no heist runs).
 * @param {object}  [input.context]       Obstacle facts: {tags:[], cover, moving, vsHuman, silkLinePrepared,
 *                                         camouflaged, showOffArmed, escapeLeader, longConIdentity, methodActorTarget, drafting}
 * @param {object[]} [input.effects]      Heist effects: {id, kind:"diff"|"dice"|"noCover"|"escapeDiff", value, skills, label, jobOnly}
 * @param {object[]} [input.pending]      Queued bonuses on the actor: {id, dice, diff, capped, skills, label, source}
 * @param {object[]} [input.bonuses]      Extra preset bonus dice: {id, dice, label, capped}
 * @param {number}  [input.bonusDice]     Manually entered bonus dice (capped).
 * @param {number}  [input.silkDice]      Silk dice bought (1 SP each, uncapped).
 * @param {number}  [input.penaltyDice]   Penalty dice.
 * @param {boolean} [input.improvise]     Pay 2 SP to roll a different Skill at +1 Difficulty.
 * @param {boolean} [input.overclock]     Pay 1 SP for +2 Engineering dice (counts as Silk).
 * @param {number|null} [input.silkAvailable]  SP on hand; null = don't check.
 * @param {object}  [input.toggles]       {optionId: boolean} overrides.
 * @returns {{
 *   pool:number, basePool:number, difficulty:number|null, baseDifficulty:number|null,
 *   diffParts:{id:string,label:string,value:number}[], poolParts:{id:string,label:string,value:number,kind:string}[],
 *   bonus:{requested:number,applied:number,capped:boolean}, silkDice:number, silkCost:number,
 *   silkSpends:{type:string,cost:number}[], botch:boolean, consumePending:string[], warnings:string[],
 *   options:object[], alertState:object, alertApplied:boolean, alertDiff:number, fullAlert:boolean,
 *   valid:boolean, casing:boolean, showOff:boolean, isStealth:boolean
 * }}
 */
export function buildRollPlan(input = {}) {
  const kind = input.kind ?? (input.skill ? "skill" : "attribute");
  const skill = input.skill || "";
  const keys = input.abilityKeys ?? [];
  const crewKeys = input.crewKeys ?? [];
  const ctx = input.context ?? {};
  const tags = ctx.tags ?? [];
  const phase = input.phase ?? "idle";
  const toggles = input.toggles ?? {};
  const isStealth = skill === "stealth";
  const effects = Array.isArray(input.effects) ? input.effects : [];
  const pending = Array.isArray(input.pending) ? input.pending : [];
  const warnings = [];
  const options = [];
  const diffParts = [];
  const poolParts = [];

  /** Register an auto-detected option; returns whether it is ticked. */
  const option = (id, group, label, value, def, extra = {}) => {
    const on = id in toggles ? !!toggles[id] : !!def;
    options.push({ id, group, label, value, default: !!def, checked: on, ...extra });
    return on;
  };

  /* ---- Alert ---- */
  const alertState = alertStateOf(input.alert);
  const fullAlert = !!alertState.atLimit;
  const alertValue = num(input.alert?.value, 0);
  const alertOff = ALERT_OFF_PHASES.includes(phase);
  const alertDiff = alertOff ? 0 : (isStealth ? alertState.stealth : alertState.all);
  if (phase === "score") warnings.push("The Score is roleplay only: no rolls, no Alert.");

  /* ---- Pool ---- */
  const vit = vitalityPenalty(input.vitality, keys);
  let basePool;
  if (kind === "assist") {
    // One Skill, no Attribute: at least 1 die, at most 3 (Ch 2). The Vitality
    // penalty applies first; the min/max are the final count before Silk.
    basePool = Math.min(3, Math.max(1, int(input.skillValue) + vit));
    poolParts.push({ id: "assist", label: `Assist: ${HEISTY.skills[skill]?.label ?? skill} (1–3 dice)`, value: basePool, kind: "base" });
  } else {
    const a = int(input.attrValue);
    const s = skill ? int(input.skillValue) : 0;
    basePool = a + s;
    poolParts.push({ id: "attr", label: HEISTY.attributes[input.attr]?.abbr ?? (input.attr || "Attribute"), value: a, kind: "base" });
    if (skill) poolParts.push({ id: "skill", label: HEISTY.skills[skill]?.label ?? skill, value: s, kind: "base" });
    if (vit) poolParts.push({ id: "vitality", label: `Vitality (${HEISTY.vitality[input.vitality]?.label ?? input.vitality})`, value: vit, kind: "vitality" });
  }
  if (input.vitality === "rattled" && has(keys, K.unfazed) && kind !== "assist")
    poolParts.push({ id: "unfazed", label: "Unfazed ignores Rattled", value: 0, kind: "note" });

  /* ---- Bonus dice (capped at +2 together) ---- */
  let requested = 0;
  const consumePending = [];
  const bonusParts = [];
  const assistLike = kind === "assist";
  if (!assistLike) {
    for (const p of pending) {
      const dice = int(p.dice);
      const diff = int(p.diff);
      if (!appliesToSkill(p.skills, skill)) continue;
      if (!dice && !diff) continue;
      const id = `pending:${p.id}`;
      const label = p.label || p.source || "Queued";
      if (dice > 0 && p.capped !== false) {
        if (option(id, "dice", `${label} (+${dice} ${dice === 1 ? "die" : "dice"})`, dice, true, { pending: true })) {
          requested += dice; bonusParts.push({ id, label, value: dice }); consumePending.push(p.id);
        }
      } else if (dice > 0) {
        if (option(id, "dice", `${label} (+${dice}, uncapped)`, dice, true, { pending: true })) {
          poolParts.push({ id, label, value: dice, kind: "uncapped" }); consumePending.push(p.id);
        }
      } else if (dice < 0) {
        if (option(id, "dice", `${label} (${dice} ${dice === -1 ? "die" : "dice"})`, dice, true, { pending: true })) {
          poolParts.push({ id, label, value: dice, kind: "penalty" }); consumePending.push(p.id);
        }
      }
      if (diff) {
        // A pending Difficulty change (e.g. Bypass −1). Consumed with the roll.
        if (option(`${id}:diff`, "diff", `${label} (Difficulty ${diff > 0 ? "+" : ""}${diff})`, diff, true, { pending: true })) {
          diffParts.push({ id: `${id}:diff`, label, value: diff });
          if (!consumePending.includes(p.id)) consumePending.push(p.id);
        }
      }
    }
    for (const e of effects) {
      if (e.kind !== "dice" || !appliesToSkill(e.skills, skill)) continue;
      const v = int(e.value);
      if (!v) continue;
      const id = `effect:${e.id ?? e.label}`;
      if (v > 0) {
        if (option(id, "dice", `${e.label || "Effect"} (+${v})`, v, true)) { requested += v; bonusParts.push({ id, label: e.label || "Effect", value: v }); }
      } else if (option(id, "dice", `${e.label || "Effect"} (${v})`, v, true)) {
        poolParts.push({ id, label: e.label || "Effect", value: v, kind: "penalty" });
      }
    }
    for (const b of input.bonuses ?? []) {
      const v = int(b.dice);
      if (v <= 0) continue;
      const id = `bonus:${b.id ?? b.label}`;
      if (option(id, "dice", `${b.label || "Bonus"} (+${v})`, v, b.default ?? true)) {
        if (b.capped === false) poolParts.push({ id, label: b.label || "Bonus", value: v, kind: "uncapped" });
        else { requested += v; bonusParts.push({ id, label: b.label || "Bonus", value: v }); }
      }
    }
    // Always-on Perks that add dice in a situation the player confirms.
    if (skill === "persuasion" && has(keys, K.thatsNotWhatHappened) && has(crewKeys, K.negotiatingPosition)) {
      if (option("negotiating", "dice", "Negotiating Position: a Bruiser is visibly nearby (+1)", 1, !!ctx.negotiating)) {
        requested += 1; bonusParts.push({ id: "negotiating", label: "Negotiating Position", value: 1 });
      }
    }
    if (has(keys, K.longCon)) {
      if (option("longCon", "dice", `The Long Con: using your false identity${ctx.longConIdentity ? ` (${ctx.longConIdentity})` : ""} (+1)`, 1, !!ctx.usingIdentity)) {
        requested += 1; bonusParts.push({ id: "longCon", label: "The Long Con", value: 1 });
      }
    }
    if ((skill === "deception" || skill === "disguise") && has(keys, K.methodActor)) {
      if (option("methodActor", "dice", `Method Actor: involves ${ctx.methodActorTarget || "your studied NPC"} (+2)`, 2, !!ctx.vsMethodTarget)) {
        requested += 2; bonusParts.push({ id: "methodActor", label: "Method Actor", value: 2 });
      }
    }
    if (ctx.drafting && MOVEMENT_SKILLS.includes(skill)) {
      if (option("drafting", "dice", "Drafting: the Wheelman leads this group check (+1)", 1, true)) {
        requested += 1; bonusParts.push({ id: "drafting", label: "Drafting", value: 1 });
      }
    }
    const manual = Math.max(0, int(input.bonusDice));
    if (manual) { requested += manual; bonusParts.push({ id: "manual", label: "Bonus dice (Assist, intel…)", value: manual }); }
  }
  const applied = Math.min(BONUS_DICE_CAP, requested);
  const capped = requested > applied;
  if (applied) poolParts.push({ id: "bonus", label: capped ? `Bonus dice (capped at +${BONUS_DICE_CAP})` : "Bonus dice", value: applied, kind: "bonus" });
  if (capped) warnings.push(`Bonus dice capped at +${BONUS_DICE_CAP} (asked for +${requested}). Silk dice don't count toward the limit.`);

  /* ---- Silk (uncapped, limited by SP on hand) ---- */
  const silkSpends = [];
  let improvise = !!input.improvise && kind !== "assist";
  let overclock = !!input.overclock && skill === "engineering" && has(keys, K.overclock);
  if (input.overclock && !overclock) warnings.push("Overclock works only on an Engineering roll by a spider with the Perk.");
  let silkDice = Math.max(0, int(input.silkDice));
  const available = input.silkAvailable == null ? Infinity : Math.max(0, int(input.silkAvailable));
  let valid = true;
  const fixed = (improvise ? SILK_COSTS.improvise : 0) + (overclock ? SILK_COSTS.overclock : 0);
  if (fixed > available) {
    valid = false;
    warnings.push(`Not enough Silk: ${improvise ? "Improvise (2 SP)" : ""}${improvise && overclock ? " and " : ""}${overclock ? "Overclock (1 SP)" : ""} needs ${fixed} SP, you have ${available}.`);
  }
  if (silkDice + fixed > available) {
    const max = Math.max(0, available - fixed);
    if (silkDice > max) warnings.push(`Only ${max} Silk ${max === 1 ? "die" : "dice"} affordable (${available} SP).`);
    silkDice = Math.min(silkDice, max);
  }
  if (silkDice) { poolParts.push({ id: "silk", label: "Silk dice", value: silkDice, kind: "silk" }); silkSpends.push({ type: "die", cost: silkDice * SILK_COSTS.die }); }
  if (overclock) { poolParts.push({ id: "overclock", label: "Overclock (1 SP)", value: 2, kind: "silk" }); silkSpends.push({ type: "overclock", cost: SILK_COSTS.overclock }); }
  if (improvise) silkSpends.push({ type: "improvise", cost: SILK_COSTS.improvise });
  const silkCost = silkSpends.reduce((n, s) => n + s.cost, 0);

  const penaltyDice = Math.max(0, int(input.penaltyDice));
  if (penaltyDice) poolParts.push({ id: "penalty", label: "Penalty dice", value: -penaltyDice, kind: "penalty" });

  const pool = poolParts.filter(p => p.kind !== "note").reduce((n, p) => n + p.value, 0);

  /* ---- Difficulty ---- */
  let difficulty = null;
  let baseDifficulty = null;
  let showOff = false;
  let alertApplied = false;
  if (kind !== "assist") {
    if (input.opposed && input.opposed.successes != null) {
      baseDifficulty = opposedDifficulty(input.opposed.successes);
      diffParts.unshift({ id: "base", label: `Opposed: ${int(input.opposed.successes)} Successes + 1`, value: baseDifficulty });
    } else if (input.humanRow && input.humanRow.difficulty != null) {
      baseDifficulty = Math.max(1, int(input.humanRow.difficulty));
      diffParts.unshift({ id: "base", label: `Human: ${input.humanRow.label || "Ch 15 row"}`, value: baseDifficulty });
    } else {
      baseDifficulty = Math.max(1, int(input.difficulty, 3));
      diffParts.unshift({ id: "base", label: "Difficulty", value: baseDifficulty });
    }

    // Show-Off (armed by the ST): Difficulty 4, or +1 if it was already 4+.
    if (has(keys, K.showOff)) {
      const bump = baseDifficulty >= 4 ? 1 : 4 - baseDifficulty;
      if (option("showOff", "diff", `Show-Off: the flashier approach (${baseDifficulty >= 4 ? "+1" : "Difficulty 4"})`, bump, !!ctx.showOffArmed)) {
        showOff = true;
        if (bump) diffParts.push({ id: "showOff", label: "Show-Off", value: bump });
      }
    }

    if (alertDiff > 0) {
      const lbl = `Alert: ${alertState.label}${isStealth ? " (Stealth)" : ""}`;
      if (option("alert", "diff", `${lbl} +${alertDiff}`, alertDiff, true)) {
        alertApplied = true;
        diffParts.push({ id: "alert", label: lbl, value: alertDiff });
      }
    }

    const noCover = effects.some(e => e.kind === "noCover");
    if (isStealth) {
      if (noCover) warnings.push("No cover this round (Mid-Heist Complication).");
      else if (option("cover", "diff", "Cover from what might see you (−2)", -2, !!ctx.cover))
        diffParts.push({ id: "cover", label: "Cover", value: -2 });
      if (has(keys, K.soundless) && option("soundless", "diff", "Soundless: moving (−1)", -1, ctx.moving ?? true))
        diffParts.push({ id: "soundless", label: "Soundless", value: -1 });
      const loudOn = alertOff ? false : (alertValue >= 5 || fullAlert);
      if (has(keys, K.loud) && loudOn && option("loud", "diff", "Loud: Alert 5+ (+1)", 1, true))
        diffParts.push({ id: "loud", label: "Loud", value: 1 });
      if (has(keys, K.arachnophobeMagnet) && option("arachnophobe", "diff", "Arachnophobe Magnet: against a human (+1)", 1, !!ctx.vsHuman || !!input.humanRow || tags.includes("human")))
        diffParts.push({ id: "arachnophobe", label: "Arachnophobe Magnet", value: 1 });
      if (has(keys, K.camouflage) && option("camouflage", "diff", "Wait, Was That There Before?: holding still (−2)", -2, !!ctx.camouflaged))
        diffParts.push({ id: "camouflage", label: "Camouflaged", value: -2 });
    }
    if (skill === "acrobatics") {
      const dld = has(keys, K.dontLookDown);
      const v = dld ? 0 : 1;
      if (option("height", "diff", dld ? "Height (Don't Look Down removes the +1)" : "Height: a fall would really hurt (+1)", v, tags.includes("height") || !!ctx.height) && v)
        diffParts.push({ id: "height", label: "Height", value: v });
    }
    if (has(keys, K.iWasNeverHere) && option("forget", "diff", "I Was Never Here: make them forget or doubt (−2)", -2, !!ctx.forget))
      diffParts.push({ id: "forget", label: "I Was Never Here", value: -2 });
    if (ctx.silkLinePrepared && option("silkLine", "diff", "Silk Line in place (−1 to the climb or crossing)", -1, ["athletics", "acrobatics"].includes(skill)))
      diffParts.push({ id: "silkLine", label: "Silk Line", value: -1 });
    if (phase === "escape" || ctx.escape) {
      for (const e of effects) {
        if (e.kind !== "escapeDiff") continue;
        const id = `effect:${e.id ?? e.label}`;
        if (option(id, "diff", `${e.label || "Escape"} (${int(e.value) > 0 ? "+" : ""}${int(e.value)})`, int(e.value), true))
          diffParts.push({ id, label: e.label || "Escape", value: int(e.value) });
      }
      const hasRoutesEffect = effects.some(e => e.kind === "escapeDiff" && /escape routes/i.test(e.label ?? ""));
      if (has(keys, K.escapeRoutes) && !hasRoutesEffect && option("escapeRoutes", "diff", "Escape Routes: you lead (−1)", -1, !!ctx.escapeLeader))
        diffParts.push({ id: "escapeRoutes", label: "Escape Routes", value: -1 });
    }
    for (const e of effects) {
      if (e.kind !== "diff" || !appliesToSkill(e.skills, skill)) continue;
      const v = int(e.value);
      if (!v) continue;
      const id = `effect:${e.id ?? e.label}`;
      if (option(id, "diff", `${e.label || "Effect"} (${v > 0 ? "+" : ""}${v})`, v, true))
        diffParts.push({ id, label: e.label || "Effect", value: v });
    }
    if (improvise) diffParts.push({ id: "improvise", label: `Improvise${input.calledSkill ? ` (for ${HEISTY.skills[input.calledSkill]?.label ?? input.calledSkill})` : ""}`, value: 1 });
    const mod = int(input.modifier);
    if (mod) diffParts.push({ id: "modifier", label: "Modifier", value: mod });

    const raw = diffParts.reduce((n, p) => n + p.value, 0);
    difficulty = Math.max(1, raw);
    if (raw < 1) diffParts.push({ id: "minimum", label: "Minimum Difficulty 1", value: 1 - raw });
  }

  const casing = phase === "planning" && CASING_SKILLS.includes(skill)
    ? option("casing", "flag", "Casing roll (Planning: a Success reveals intel)", 0, ctx.casing ?? true)
    : false;

  return {
    kind, pool, basePool, difficulty, baseDifficulty, diffParts, poolParts,
    bonus: { requested, applied, capped, parts: bonusParts },
    silkDice, silkCost, silkSpends, improvise, overclock,
    botch: kind !== "assist" && pool <= 0,
    consumePending, warnings, options,
    alertState, alertApplied, alertDiff: alertApplied ? alertDiff : 0, fullAlert,
    valid, casing, showOff, isStealth, vitalityPenalty: vit
  };
}

/* -------------------------------------------- */
/*  Resolution                                  */
/* -------------------------------------------- */

/**
 * Successes and the result for a set of faces.
 * @param {number[]} faces
 * @param {number|null} difficulty
 * @param {{botch?:boolean}} [opts]  `botch`: the pool bottomed out and this is the one Botch die.
 * @returns {{successes:number, result:string}}
 */
export function resolveRoll(faces, difficulty, { botch = false } = {}) {
  const f = (faces ?? []).map(Number);
  if (botch) return { successes: 0, result: classifyBotch(f[0]) };
  const successes = countSuccesses(f);
  if (difficulty == null) return { successes, result: successes > 0 ? "success" : "failure" };
  return { successes, result: classifyResult(successes, difficulty) };
}

/**
 * Indices of the dice that didn't succeed, lowest faces first, at most `max`
 * of them (3 for a Silk Reroll; Infinity for Run It Again).
 */
export function rerollIndices(faces, max = SILK_REROLL_MAX) {
  const lim = max === Infinity ? Infinity : Math.max(0, int(max));
  return (faces ?? [])
    .map((f, i) => ({ f: Number(f), i }))
    .filter(x => x.f < SUCCESS_FACE)
    .sort((a, b) => a.f - b.f || a.i - b.i)
    .slice(0, lim)
    .map(x => x.i)
    .sort((a, b) => a - b);
}

/** Replace the rerolled dice; every Success stays where it was. */
export function applyReroll(faces, indices, newFaces) {
  const out = [...(faces ?? [])].map(Number);
  if ((indices ?? []).length !== (newFaces ?? []).length) throw new Error("applyReroll: one new face per rerolled die");
  indices.forEach((idx, n) => {
    if (idx < 0 || idx >= out.length) throw new Error(`applyReroll: no die at ${idx}`);
    if (out[idx] >= SUCCESS_FACE) throw new Error("applyReroll: a Success is never rerolled");
    out[idx] = Number(newFaces[n]);
  });
  return out;
}

/**
 * Silk Clutch (3 SP): a Failure on your own roll becomes a Success; the Alert
 * trigger becomes the Clutch's +1. A Partial isn't a Failure, and a Botch die
 * (Botch or clean failure) can't be saved (Ch 8, v4.8).
 * @returns {object} A new card.
 */
export function applyClutch(card) {
  const r = card?.roll;
  if (!r || r.result !== "failure" || r.botch) throw new Error("Silk Clutch works only on a Failure on your own roll (not a Partial, not a Botch die).");
  if (r.clutched) throw new Error("This roll has already been Clutched.");
  const next = structuredClone(card);
  next.roll.clutched = true;
  next.roll.preClutchResult = r.result;
  next.roll.result = "success";
  if (next.consequences) { next.consequences.caught = false; next.consequences.hit = null; next.consequences.partialCost = null; }
  return next;
}

/* -------------------------------------------- */
/*  Full Alert Partials and engaged threats     */
/* -------------------------------------------- */

/**
 * The strongest attacker among engaged threats ("if several see you fail, the
 * biggest attack lands"; N18). Ties keep the first listed.
 * @param {{pool:number}[]} engaged
 */
export function strongestAttacker(engaged) {
  let best = null;
  for (const e of engaged ?? []) if (e && (best == null || num(e.pool) > num(best.pool))) best = e;
  return best;
}

/**
 * At Full Alert a Partial's noise costs nothing, so it costs a hit from an
 * engaged threat if there is one, otherwise −1 die on the next roll (N14).
 * @returns {"hit"|"penalty"}
 */
export function fullAlertPartialCost(engaged) {
  return strongestAttacker(engaged) ? "hit" : "penalty";
}

/* -------------------------------------------- */
/*  Alert triggers                              */
/* -------------------------------------------- */

const T = (key, delta, label) => ({ key, delta, label, src: "roll" });

/**
 * The Alert triggers and cancels a check card carries (§3.1 with §16): a
 * Failure or clean failure +1, a Partial +1 (its default complication; none at
 * Full Alert, where it costs a hit or −1 die instead), a Botch +2, a Critical
 * −1 only at final Difficulty 3+ and never at Full Alert, a Clutch +1 in place
 * of the Failure, the approach's own noise, and a fight's +1 landed / +2 lost.
 * Smoke and Mirrors cancels a failed Deception roll's Alert; a Contingency
 * cancels everything. A GM swap or "no consequence" removes the default
 * trigger (and cancels the event if nothing else is left).
 *
 * @param {object} card   Card flags (§7): uses card.roll, card.consequences.
 * @param {object} [ctx]
 * @param {object} [ctx.alertState]   Alert state at the roll (getAlertState).
 * @param {string} [ctx.phase]
 * @param {string[]} [ctx.abilityKeys]  The roller's ability keys.
 * @returns {{triggers:{key:string,delta:number,label:string}[], cancels:{key:string}[]}}
 */
export function rollAlertTriggers(card, { alertState = null, phase = "idle", abilityKeys = [] } = {}) {
  const r = card?.roll ?? {};
  const triggers = [];
  const cancels = [];
  if (ALERT_OFF_PHASES.includes(phase)) return { triggers, cancels };
  const atLimit = !!alertState?.atLimit;
  const swap = card?.consequences?.swap ?? null;
  const noConsequence = !!card?.consequences?.noConsequence;

  if (r.contingency) return { triggers, cancels: [{ key: "contingency", src: "roll" }] };
  // Rolls that never touch the Alert themselves (That All You Got?, a Flaw check
  // whose cost is something else, an Assist).
  if (r.noAlert) return { triggers, cancels };

  let defaultKey = null;
  if (r.clutched) triggers.push(T("clutch", 1, "Silk Clutch"));
  else switch (r.result) {
    case "failure":
      triggers.push(T("failure", 1, "Failure")); defaultKey = "failure"; break;
    case "cleanfail":
      triggers.push(T("failure", 1, "Clean failure (an ordinary Failure)")); defaultKey = "failure"; break;
    case "botch":
      triggers.push(T("botch", 2, "Botch")); defaultKey = "botch"; break;
    case "partial":
      // A pass-or-fail check: a Partial passes and costs nothing extra (Ch 2).
      if (!atLimit && !r.passFail) { triggers.push(T("partial", 1, "Partial: noise")); defaultKey = "partial"; }
      break;
    case "critical":
      if (!atLimit && num(r.difficulty) >= CRITICAL_ALERT_MIN_DIFFICULTY) triggers.push(T("critical", -1, "Critical (Difficulty 3+)"));
      break;
  }
  const alertOnUse = int(r.alertOnUse);
  if (alertOnUse > 0) triggers.push(T("approach", alertOnUse, "Loud approach"));
  if (r.fight) {
    if (isPassing(r.result)) triggers.push(T("fightLanded", 1, "A fight: the roll lands"));
    else triggers.push(T("loud", 2, "A lost fight is a Loud Failure"));
  }

  // GM decisions that replace the default cost.
  const dropDefault = (swap && defaultKey === "partial") || (noConsequence && defaultKey === "failure");
  const out = dropDefault ? triggers.filter(t => t.key !== defaultKey) : triggers;
  if (dropDefault && !out.some(t => t.delta > 0)) cancels.push({ key: swap ? "swapped" : "noConsequence", src: "roll" });

  if (r.skill === "deception" && isFailed(r.result) && !r.clutched && has(abilityKeys, K.smokeAndMirrors))
    cancels.push({ key: "smokeAndMirrors", src: "roll" });

  return { triggers: out, cancels };
}

/**
 * Merge freshly computed roll triggers into a card's Alert block, keeping
 * everything added by a GM button or a reaction (src !== "roll").
 */
export function mergeAlert(alert, computed) {
  const keepT = (alert?.triggers ?? []).filter(t => t.src && t.src !== "roll");
  const keepC = (alert?.cancels ?? []).filter(c => c.src && c.src !== "roll");
  return {
    triggers: [...computed.triggers, ...keepT],
    cancels: [...computed.cancels, ...keepC]
  };
}

/**
 * One card's own Alert change, for display (the ledger owns the real value):
 * any cancel → 0; else the largest positive trigger; else the smallest
 * negative one. "One event, one trigger."
 */
export function cardAlertDelta(alert) {
  if ((alert?.cancels ?? []).length) return 0;
  const ds = (alert?.triggers ?? []).map(t => num(t.delta));
  const pos = ds.filter(d => d > 0);
  if (pos.length) return Math.max(...pos);
  const neg = ds.filter(d => d < 0);
  return neg.length ? Math.min(...neg) : 0;
}

/**
 * Recompute a check card's pending consequences and Alert triggers after its
 * result changed (roll time, a reroll, a Clutch, a GM swap). Returns a new card.
 *
 * Reads `card.ctx` (captured at roll time): {engaged:[{uuid,index,name,label,pool,…}],
 * autoHits:"auto"|"prompt"|"off", autoCapture, fullAlert, phase, alertState, abilityKeys}.
 * Sets `consequences`: caught (Full Alert Escape Failure), hit (pending: a hazard's
 * Failure, the strongest engaged attacker with autoHits=auto, a Full Alert
 * Partial's hit, or a GM-chosen hit), partialCost ("hit"|"penalty" at Full
 * Alert), candidates (autoHits=prompt). A final card's consequences don't move.
 */
export function recomputeCheckCard(card) {
  const next = structuredClone(card);
  const r = next.roll;
  const x = next.ctx ?? {};
  const c = next.consequences ?? (next.consequences = { status: "pending" });
  if (c.status !== "final") {
    const failed = isFailed(r.result) && !r.clutched && !r.contingency;
    const partial = r.result === "partial" && !r.clutched;
    const engaged = x.engaged ?? [];
    const strongest = strongestAttacker(engaged);
    const autoHits = x.autoHits ?? "prompt";
    // A Full Alert Escape: a spider who fails is caught once the roll is final.
    c.caught = failed && !!x.fullAlert && x.phase === "escape" && x.autoCapture !== false;
    // Hits that wait for the roll to be final.
    if (!c.hitMessageId) {
      let hit = null;
      if (failed && r.hazard && autoHits !== "off") hit = { hazard: true, name: r.hazard.label || "The hazard", label: "Hazard", pool: hazardPool(r.hazard.difficulty) };
      else if (failed && autoHits === "auto" && strongest) hit = strongest;
      else if (partial && c.swap?.kind === "hit" && c.hit) hit = c.hit;
      else if (partial && x.fullAlert && !c.swap && strongest && autoHits !== "off") hit = strongest;
      else if (failed && c.hit?.manual) hit = c.hit;
      // Caught means Out: the hit no longer matters.
      c.hit = c.caught ? null : hit;
    }
    c.partialCost = partial && x.fullAlert && !c.swap ? (c.hit ? "hit" : fullAlertPartialCost(autoHits === "off" ? [] : engaged)) : null;
    if (c.partialCost === "hit" && !c.hit) c.partialCost = "penalty";
    c.candidates = (failed || (partial && x.fullAlert)) && autoHits === "prompt" && !c.caught && !c.hitMessageId ? engaged : [];
  }
  next.alert = mergeAlert(next.alert, rollAlertTriggers(next, { alertState: x.alertState, phase: x.phase, abilityKeys: x.abilityKeys }));
  return next;
}

/* -------------------------------------------- */
/*  Heist roll context (WP-C) → roll plan       */
/* -------------------------------------------- */

/** Chapter 15 human rows (fallback when the context gives only a key). */
export const HUMAN_ROW_DIFFICULTY = Object.freeze({
  sleeping: { label: "Sleeping Human", difficulty: 2, skills: ["stealth"] },
  distracted: { label: "Distracted Human", difficulty: 1, skills: ["stealth"] },
  alert: { label: "Alert Human", difficulty: 4, skills: ["deception", "stealth"] },
  broom: { label: "Human With Broom", difficulty: 3, skills: ["athletics"] },
  lightsOn: { label: "Human in the kitchen, lights on", difficulty: 2, skills: ["stealth"] }
});

/** A human row from a key ("alert") or an object ({difficulty, label}). */
export function humanRowOf(row) {
  if (!row) return null;
  if (typeof row === "object") return row.difficulty != null ? { key: row.key ?? "", label: row.label ?? "Human", difficulty: int(row.difficulty), skills: row.skills ?? null } : null;
  const def = HUMAN_ROW_DIFFICULTY[row];
  return def ? { key: row, ...def } : null;
}

/**
 * Normalize `heist.rollContext(actor, skill)` (WP-C) for the roll plan and the
 * card: the obstacle, its approaches (with their opposed creature resolved to
 * an actor uuid where the heist maps one), effects, the engaged threats as
 * attackers, the open group check and the human row.
 * @param {object|null} rc
 * @param {{creatures?:{id:string,key:string,name?:string,actorUuid?:string}[], actorId?:string, skill?:string}} [opts]
 */
export function normalizeRollContext(rc, { creatures = [], actorId = null, skill = "" } = {}) {
  if (!rc) return null;
  const ob = rc.obstacle ?? null;
  const byKey = k => creatures.find(c => c.key === k) ?? null;
  const byId = id => creatures.find(c => c.id === id) ?? null;
  const human = humanRowOf(ob?.human ?? rc.humanRow ?? null);
  const humanApplies = human && (!human.skills?.length || !skill || human.skills.includes(skill));
  const approaches = (rc.approaches ?? []).map(a => {
    let opposed = null;
    if (a.opposed) {
      const c = a.opposed.uuid ? null : byKey(a.opposed.creature);
      opposed = {
        uuid: a.opposed.uuid ?? c?.actorUuid ?? null, name: c?.name ?? a.opposed.creature ?? "Creature",
        roll: a.opposed.roll ?? null, index: Number.isInteger(a.opposed.index) ? a.opposed.index : null, pool: a.opposed.pool ?? null
      };
    }
    const skillsTxt = (a.skills ?? []).map(k => HEISTY.skills[k]?.label ?? k).join("/");
    return {
      id: a.id, label: a.label ?? (a.note ? `${skillsTxt}: ${a.note}` : (skillsTxt || a.id)), skills: [...(a.skills ?? [])],
      difficulty: a.difficulty ?? null, opposed, alertOnUse: int(a.alertOnUse), fight: !!a.fight, mode: a.mode ?? "single",
      matches: a.matches ?? (a.skills ?? []).includes(skill)
    };
  });
  const effects = [...(rc.effects ?? [])];
  if (rc.escapeDiff && !effects.some(e => e.kind === "escapeDiff"))
    effects.push({ id: "escapeDiff", kind: "escapeDiff", value: int(rc.escapeDiff), label: "Escape (I Know a Way / Escape Routes)" });
  const engaged = (rc.engaged ?? []).map(e => {
    if (e.uuid) return e;
    const c = byId(e.id) ?? byKey(e.key);
    const atk = e.attack ?? {};
    if (!atk.pool && !e.pool) return null;
    return {
      uuid: c?.actorUuid ?? null, key: e.key ?? c?.key ?? "", name: e.name ?? c?.name ?? "Threat",
      index: Number.isInteger(atk.index) ? atk.index : (e.index ?? null), label: atk.label ?? e.label ?? "Attack", pool: int(atk.pool ?? e.pool),
      human: !!e.human, critToOut: !!e.human, capture: e.key === "curious-child"
    };
  }).filter(Boolean);
  const g = rc.group ?? null;
  return {
    phase: rc.phase ?? "idle",
    obstacleId: ob?.id ?? rc.obstacleId ?? null,
    obstacleName: ob?.name ?? rc.obstacleName ?? "",
    tags: [...(ob?.tags ?? rc.tags ?? [])],
    silkLinePrepared: !!(ob?.silkLinePrepared ?? rc.silkLinePrepared),
    humanRow: humanApplies ? human : null,
    vsHuman: !!human || (ob?.tags ?? rc.tags ?? []).includes("human"),
    approaches, effects, engaged,
    group: g ? {
      groupId: g.groupId, approachId: g.approachId ?? null, ledBy: g.ledBy ?? null,
      opposed: g.opposed ? { name: g.opposed.name ?? byKey(g.opposed.creature)?.name ?? g.opposed.creature ?? "Creature", label: g.opposed.label ?? "", successes: int(g.opposed.successes), difficulty: int(g.opposed.successes) + 1 } : null
    } : null,
    drafting: !!g?.ledBy && g.ledBy !== actorId,
    casing: rc.casing ?? null,
    contingency: rc.contingency ?? null
  };
}

/* -------------------------------------------- */
/*  Assists                                     */
/* -------------------------------------------- */

/**
 * An Assist's pool: one Skill, no Attribute, at least 1 and at most 3 dice
 * (after the Vitality penalty), plus the helper's own Silk dice outside that
 * maximum (N21).
 */
export function assistPool(skillValue, { vitalityPenalty: vp = 0, silkDice = 0 } = {}) {
  return Math.min(3, Math.max(1, int(skillValue) + int(vp))) + Math.max(0, int(silkDice));
}

/* -------------------------------------------- */
/*  Card buttons                                */
/* -------------------------------------------- */

/**
 * Which reroll a card allows now.
 * @param {object} card
 * @param {"silk"|"wolf"|"silverTongue"} by
 */
export function canReroll(card, by) {
  const r = card?.roll;
  if (!r || card?.consequences?.status === "final") return false;
  if (r.clutched || r.contingency) return false;
  if (by === "silverTongue") {
    return r.skill === "persuasion" && isFailed(r.result) && !(r.rerolls ?? []).some(x => x.by === "silverTongue");
  }
  if (r.botch) return false; // the one Botch die isn't a pool to reroll
  if (!rerollIndices(r.faces, Infinity).length) return false;
  if (by === "silk") return r.result !== "critical";
  if (by === "wolf") {
    return (r.result === "failure" || r.result === "partial") && !!r.physical
      && !(r.rerolls ?? []).some(x => x.by === "wolf");
  }
  return false;
}

/** Silk Clutch is open: a pending Failure, not a Botch die, on your own roll. */
export function canClutch(card) {
  const r = card?.roll;
  return !!r && r.result === "failure" && !r.botch && !r.clutched && !r.contingency
    && card?.consequences?.status !== "final" && card?.kind === "check";
}

/**
 * The buttons a viewer gets on a check card (§3.3). Pure: the runtime supplies
 * what the viewer owns and can afford.
 *
 * @param {object} card
 * @param {object} viewer
 * @param {boolean} viewer.isGM
 * @param {boolean} viewer.isOwner        Owns the card's actor.
 * @param {number}  viewer.silk           The card actor's SP (when owner).
 * @param {string[]} viewer.abilityKeys   The card actor's ability keys.
 * @param {object}  [viewer.available]    {abilityKey: false} when a limited use is spent.
 * @param {"auto"|"confirm"|"manual"} [viewer.alertMode]
 * @param {boolean} [viewer.autoSilk]     When false, SP is advice only.
 * @param {{actorId:string,name:string,keys:string[],silk:number,available?:object}[]} [viewer.crew]
 *        Other spiders the viewer owns (reactions on a crewmate's card).
 * @param {boolean} [viewer.contingencyOpen]  A Contingency is recorded and unused.
 * @returns {{action:string,label:string,cost?:number,actorId?:string,cls?:string,title?:string,value?:any}[]}
 */
export function cardActions(card, viewer = {}) {
  const out = [];
  if (!card || card.kind !== "check") return out;
  const r = card.roll ?? {};
  const pending = card.consequences?.status !== "final";
  const keys = viewer.abilityKeys ?? [];
  const avail = k => viewer.available?.[k] !== false;
  const sp = viewer.autoSilk === false ? Infinity : num(viewer.silk, 0);
  const mode = viewer.alertMode ?? "manual";
  const failed = isFailed(r.result) && !r.clutched;

  if (viewer.isOwner && pending) {
    if (canReroll(card, "silk")) out.push({ action: "reroll", label: "Reroll (2 SP)", cost: SILK_COSTS.reroll, disabled: sp < SILK_COSTS.reroll, title: "Reroll up to 3 dice that didn't succeed. Your Successes stay." });
    if (canClutch(card)) out.push({ action: "clutch", label: "Silk Clutch (3 SP)", cost: SILK_COSTS.clutch, disabled: sp < SILK_COSTS.clutch, title: "Turn this Failure into a Success. The Alert rises by 1." });
    if (has(keys, K.runItAgain) && canReroll(card, "wolf") && avail(K.runItAgain)) out.push({ action: "wolf", label: "Run It Again", title: "Wolf Spider, once per scene: reroll every die that didn't succeed." });
    if (has(keys, K.silverTongue) && canReroll(card, "silverTongue")) out.push({ action: "silverTongue", label: "Silver Tongue", title: "Reroll this failed Persuasion roll once." });
    out.push({ action: "accept", label: "Accept", cls: "subtle", title: "Lock the result in now (no more rerolls or reactions on it)." });
  }

  // Reactions: That's Not What Happened (any roll, this round), Plausible Deniability (+1 only), Abort Abort (a Failure's Alert).
  const delta = cardAlertDelta(card.alert);
  const cancelled = (card.alert?.cancels ?? []).length > 0;
  for (const c of (cancelled || delta <= 0) ? [] : (viewer.crew ?? [])) {
    const ck = c.keys ?? [];
    const cav = k => c.available?.[k] !== false;
    const csp = viewer.autoSilk === false ? Infinity : num(c.silk, 0);
    if (has(ck, K.thatsNotWhatHappened) && cav(K.thatsNotWhatHappened))
      out.push({ action: "cancel", value: "thatsNotWhatHappened", actorId: c.actorId, label: `That's Not What Happened (2 SP)${c.name ? ` — ${c.name}` : ""}`, cost: 2, disabled: csp < 2 });
    if (has(ck, K.plausibleDeniability) && cav(K.plausibleDeniability) && delta === 1)
      out.push({ action: "cancel", value: "plausibleDeniability", actorId: c.actorId, label: `Plausible Deniability${c.name ? ` — ${c.name}` : ""}` });
    if (has(ck, K.abortAbort) && cav(K.abortAbort) && failed)
      out.push({ action: "cancel", value: "abortAbort", actorId: c.actorId, label: `Abort, Abort${c.name ? ` — ${c.name}` : ""}` });
  }

  if (viewer.isGM) {
    if (mode !== "manual") {
      out.push({ action: "trigger", value: "spotted", label: "Spotted +1", cls: "gm" });
      out.push({ action: "trigger", value: "confirmed", label: "Confirmed +2", cls: "gm" });
      out.push({ action: "trigger", value: "loud", label: "Loud Failure +2", cls: "gm" });
      if (failed && r.result !== "botch" && !card.consequences?.noConsequence) out.push({ action: "noConsequence", label: "No consequence", cls: "gm" });
    }
    if (r.result === "partial" && !r.clutched && pending) {
      for (const s of ["penalty", "drop", "hit", "custom"]) {
        if (card.consequences?.swap?.kind === s) continue;
        out.push({ action: "swap", value: s, cls: "gm", label: { penalty: "Swap: −1 die next roll", drop: "Swap: drops an item", hit: "Swap: a hit from an engaged threat", custom: "Swap: custom…" }[s] });
      }
    }
    if (failed && pending && !card.consequences?.hitMessageId && !card.consequences?.caught) out.push({ action: "hit", label: "Engaged threat lands a hit…", cls: "gm" });
    if (failed && !(card.silk?.earned ?? []).some(e => e.type === "spectacular")) out.push({ action: "spectacular", label: "Spectacular Failure +1 SP", cls: "gm" });
    if (viewer.contingencyOpen && !r.contingency) out.push({ action: "contingency", label: "Contingency: trigger happened", cls: "gm" });
  }
  return out;
}
