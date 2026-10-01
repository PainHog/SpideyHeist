/**
 * HEISTY SPIDEYS — The Dice Engine (system 1.8.0, rulebook v4.8)
 * ----------------------------------------------------------------
 * Roll a pool of d6s, count every 5 or 6 as a Success, compare to the
 * Difficulty. The rules themselves are pure (logic/rolls.mjs, logic/hits.mjs,
 * logic/rules.mjs); this module gathers the inputs, shows the roll-plan dialog,
 * deducts Silk, rolls, and posts a card whose flags (§7 of
 * docs/AUTOMATION-DESIGN.md) drive everything after: the buttons
 * (chat/card-actions.mjs), the Alert ledger and progress (WP-C), and hits
 * (chat/hit-flow.mjs).
 *
 * Late-bound (each optional, `game.heistySpideys.<ns>?.`):
 *  - heist.rollContext(actor, skillKey) — the active obstacle, approaches,
 *    effects, engaged threats, human row, phase;
 *  - actorOps — Silk, usage stamps, pending bonuses (WP-A);
 *  - alert — value/limit (and, with WP-C, the ledger).
 */

import { HEISTY } from "../config.mjs";
import { CARD, HOOKS, SETTINGS } from "../contracts.mjs";
import { BONUS_DICE_CAP, countSuccesses, opposedDifficulty } from "../logic/rules.mjs";
import {
  buildRollPlan, resolveRoll, isFailed, FIGHT_SKILLS, PHYSICAL_SKILLS, ALERT_OFF_PHASES
} from "../logic/rolls.mjs";
import { newCard, renderCardContent } from "../chat/card-flags.mjs";
import {
  ns, setting, alertMode, abilityKeysOf, markUsed, earnSilk, addPending, silkOf, clockNow, alertNow,
  rollDice, recomputeCard, finalizeActorCards, finalizeCard, finalizePending, registerCardActions, registerCardOps
} from "../chat/card-actions.mjs";
import { HitFlow } from "../chat/hit-flow.mjs";

const renderTemplate = (path, data) => foundry.applications.handlebars.renderTemplate(path, data);
const esc = s => foundry.utils.escapeHTML?.(String(s ?? "")) ?? String(s ?? "");

/** Post a chat message honouring the player's roll/visibility mode (v13 and v14). */
async function postMessage(data, { keepId = false } = {}) {
  const msgData = { style: CONST.CHAT_MESSAGE_STYLES.OTHER, ...data };
  // v14 replaced roll modes with message visibility modes (core.messageMode);
  // applyMode() with no mode uses the player's current chat selector.
  // applyRollMode is the v13 path (deprecated in v14, removed in v16).
  if (typeof ChatMessage.applyMode === "function") Object.assign(msgData, ChatMessage.applyMode(msgData));
  else ChatMessage.applyRollMode(msgData, game.settings.get("core", "rollMode"));
  return ChatMessage.create(msgData, { keepId });
}

/** Ability keys of the rest of the crew (for Negotiating Position). */
function crewKeysFor(actor) {
  const crewIds = new Set((ns().heist?.state?.crew ?? []).map(c => c.actorId));
  return (game.actors?.contents ?? [])
    .filter(a => a.type === "spider" && a.id !== actor.id && (crewIds.size ? crewIds.has(a.id) : a.hasPlayerOwner))
    .flatMap(a => abilityKeysOf(a));
}

/** Is a threat a human (humans never roll to spot you, E4)? */
function isHuman(actor) {
  const key = actor?.system?.automation?.key || "";
  return key === "human" || /^human\b/i.test(actor?.name ?? "");
}

export const HeistyDice = {

  /* -------------------------------------------- */
  /*  Public entry points                         */
  /* -------------------------------------------- */

  /** Roll a Skill check: the governing Attribute + the Skill. */
  async skillCheck(actor, skillKey, options = {}) {
    return this.rollCheck(actor, skillKey, options);
  },

  /** Roll an Attribute alone (an untrained roll — a Skill of 0). */
  async attributeCheck(actor, attrKey, options = {}) {
    return this.rollCheck(actor, { attr: attrKey }, options);
  },

  /**
   * Roll a check through the roll plan and post its card.
   * @param {Actor} actor
   * @param {string|{skill?:string, attr?:string}} which  A Skill key, or {attr} for an Attribute alone.
   * @param {object} [options]
   * @param {number}  [options.difficulty]   Base Difficulty (default: the approach's, else 3).
   * @param {boolean} [options.fast]         Skip the dialog.
   * @param {string}  [options.approachId]   Pre-bind an approach of the active obstacle.
   * @param {string}  [options.groupId]      Group check id (also the Alert eventId).
   * @param {{successes:number,name?:string,label?:string}} [options.opposed]  A creature roll already made.
   * @param {{difficulty:number,label?:string}} [options.humanRow]
   * @param {object[]} [options.bonuses]     Extra preset bonus dice {id, dice, label, capped}.
   * @param {object[]} [options.engaged]     Engaged threats {uuid, index, name, label, pool, human, critToOut}.
   * @param {boolean} [options.forced]       A forced roll (free, not an Action).
   * @param {boolean} [options.passFail]     A pass-or-fail check (a Partial costs nothing extra).
   * @param {boolean} [options.noAlert]      The roll itself never touches the Alert.
   * @param {string}  [options.label]        Card label override; [options.reason] forced-roll reason.
   * @param {boolean} [options.physical]     Counts for Run It Again.
   * @param {{difficulty:number,label?:string}} [options.hazard]  Rolling to avoid a hazard: a Failure is the hit.
   * @returns {Promise<ChatMessage|null>}
   */
  async rollCheck(actor, which, options = {}) {
    if (!actor) return null;
    const skill = typeof which === "string" ? which : (which?.skill ?? "");
    if (skill && !HEISTY.skills[skill]) return null;
    const attr = (typeof which === "object" && which?.attr) || HEISTY.skills[skill]?.attr;
    if (!HEISTY.attributes[attr]) return null;
    if (!actor.isOwner) { ui.notifications?.warn(`You don't control ${actor.name}.`); return null; }

    const base = await this._baseInput(actor, skill, attr, options);
    let choice;
    if (options.fast) choice = this._defaultChoice(base, options);
    else {
      choice = await this._prompt(base, options);
      if (!choice) return null;
    }
    return this._execute(actor, base, choice, options);
  },

  /**
   * A forced roll (a Flaw's check, Fear of Vacuums…): free, no dialog. On the
   * GM's client with `forcedRolls = player`, the spider's connected player is
   * asked to roll it on theirs (ui.forcedRoll); otherwise it rolls here.
   * @param {Actor} actor
   * @param {{skill?:string, attr?:string, difficulty?:number, label?:string, reason?:string, passFail?:boolean, noAlert?:boolean}} spec
   */
  async rollForced(actor, spec = {}, { local = false } = {}) {
    if (!actor) return null;
    if (!local && game.user.isGM && setting(SETTINGS.forcedRolls, "player") === "player") {
      const res = await HitFlow.askOwner(actor, spec);
      if (res?.messageId) return game.messages.get(res.messageId) ?? null;
    }
    const which = spec.skill ? spec.skill : { attr: spec.attr ?? "nerve" };
    return this.rollCheck(actor, which, {
      fast: true, forced: true, difficulty: spec.difficulty ?? 3, label: spec.label, reason: spec.reason,
      passFail: spec.passFail ?? true, noAlert: !!spec.noAlert, physical: !!spec.physical
    });
  },

  /**
   * Roll one of a Threat's listed pools. When it resists a spider, its
   * Successes + 1 are the spider's Difficulty (the card says so).
   */
  async threatRoll(actor, index, options = {}) {
    const res = await this._threatPool(actor, index, options);
    return res?.message ?? null;
  },

  /** A threat's attack on targets (default: this user's targeted tokens). */
  async threatAttack(threat, index = null, opts = {}) {
    return HitFlow.threatAttack(threat, index, opts);
  },

  /** A fall (1 die per 2 squares, rounded up) on a spider. */
  async fallAttack(target, squares = null) { return HitFlow.fallAttack(target, squares); },

  /** A hazard with no attack pool hits with its Difficulty in dice. */
  async hazardAttack(target, difficulty, label) { return HitFlow.hazardAttack(target, difficulty, label); },

  /**
   * Assist (as your Action): roll one Skill, no Attribute, 1–3 dice, plus your
   * own Silk dice outside that maximum; each Success queues +1 die on the
   * target's next roll (only one Assist per roll — the latest replaces).
   * @param {Actor} helper
   * @param {Actor|null} [target]
   * @param {string|null} [skillKey]
   * @param {{silk?:number, fast?:boolean}} [opts]
   */
  async rollAssist(helper, target = null, skillKey = null, { silk = 0, fast = false } = {}) {
    if (!helper?.isOwner) return null;
    let choice = { targetId: target?.id, skill: skillKey, silk };
    if (!fast || !target || !skillKey) {
      choice = await this._assistPrompt(helper, target, skillKey);
      if (!choice) return null;
    }
    const tgt = game.actors.get(choice.targetId);
    const skill = choice.skill;
    if (!tgt || !HEISTY.skills[skill]) return null;
    if (tgt.id === helper.id) { ui.notifications?.warn("You can't Assist your own roll."); return null; }
    const autoSilk = setting(SETTINGS.autoSilk, true) !== false;
    const keys = abilityKeysOf(helper);
    const plan = buildRollPlan({
      kind: "assist", skill, skillValue: helper.system.skills?.[skill]?.value ?? 0,
      vitality: helper.system.vitality?.state, abilityKeys: keys, silkDice: choice.silk,
      silkAvailable: autoSilk ? silkOf(helper) : null
    });
    if (autoSilk && plan.silkCost) await helper.update({ "system.silk.value": silkOf(helper) - plan.silkCost });
    const { roll, faces } = await rollDice(plan.pool);
    const successes = countSuccesses(faces);
    let queued = false;
    if (successes > 0) queued = await addPending(tgt, { dice: successes, capped: true, source: "assist", label: `Assist (${helper.name})`, expires: "nextRoll" }, { sourceActor: helper, ability: "assist" });
    const clock = clockNow();
    const id = foundry.utils.randomID();
    const card = newCard(CARD.assist, {
      actorUuid: helper.uuid, actorId: helper.id, actorName: helper.name, actorImg: helper.img, userId: game.user.id,
      heistId: clock.heistId, obstacleSerial: clock.obstacleSerial, roundSerial: clock.roundSerial, sceneSerial: clock.sceneSerial,
      eventId: id,
      assist: { targetUuid: tgt.uuid, targetId: tgt.id, targetName: tgt.name, skill, pool: plan.pool, silkDice: plan.silkDice, faces, successes, queued },
      silk: { spent: plan.silkSpends.map(s => ({ ...s, label: "Silk dice", advice: !autoSilk })), earned: [] }
    });
    const message = await postMessage({
      _id: id, content: await renderCardContent(card), rolls: roll ? [roll] : [],
      speaker: ChatMessage.getSpeaker({ actor: helper }), flags: { "heisty-spideys": { card } }
    }, { keepId: true });
    Hooks.callAll(HOOKS.rollResolved, message, card);
    return message;
  },

  /** Lock a check card's result in now (no more rerolls or reactions). */
  finalizeCard(message) { return finalizeCard(message); },

  /** GM: finalize every pending card (End Round). */
  finalizePending() { return finalizePending(); },

  /* -------------------------------------------- */
  /*  Threat pools                                */
  /* -------------------------------------------- */

  /** Roll a threat's pool, post its card, and return the message and Successes. */
  async _threatPool(actor, index, { opposing = "" } = {}) {
    const entry = actor?.system?.rolls?.[index];
    if (!entry) return null;
    const pool = Math.max(0, entry.pool);
    const { roll, faces } = await rollDice(pool);
    const successes = countSuccesses(faces);
    const clock = clockNow();
    const id = foundry.utils.randomID();
    const card = newCard(CARD.threat, {
      actorUuid: actor.uuid, actorId: actor.id, actorName: actor.name, actorImg: actor.img, userId: game.user.id,
      heistId: clock.heistId, obstacleSerial: clock.obstacleSerial, roundSerial: clock.roundSerial, eventId: id,
      alertMode: alertMode(),
      roll: { index, label: entry.label || "Action", note: entry.note || "", pool, faces, successes, opposing },
      alert: { triggers: [], cancels: [] }
    });
    const message = await postMessage({
      _id: id, content: await renderCardContent(card), rolls: roll ? [roll] : [],
      speaker: ChatMessage.getSpeaker({ actor }), flags: { "heisty-spideys": { card } }
    }, { keepId: true });
    return { message, successes, pool, label: entry.label || "Action" };
  },

  /**
   * Threat pools a spider can roll against: threats on the viewed scene (hidden
   * tokens only for the GM), then — for the GM — every threat in the Actors
   * directory. Humans are left out: they never roll to spot you (E4).
   * @returns {{value:string,label:string,actor:Actor,index:number}[]}
   */
  _opposedChoices() {
    const out = [];
    const seen = new Set();
    const add = (actor, where) => {
      if (!actor || actor.type !== "threat" || seen.has(actor.uuid) || isHuman(actor)) return;
      seen.add(actor.uuid);
      (actor.system.rolls ?? []).forEach((r, index) => {
        if (!(r?.pool > 0)) return;
        out.push({ value: `${actor.uuid}#${index}`, label: `${actor.name}${where} — ${r.label || "Action"} (${r.pool}d6)`, actor, index });
      });
    };
    try {
      for (const tok of game.scenes?.viewed?.tokens ?? []) {
        if (tok.hidden && !game.user.isGM) continue;
        add(tok.actor, " (scene)");
      }
      if (game.user.isGM) for (const a of game.actors ?? []) add(a, "");
    } catch (e) { /* no scene/actors available — opposed rolls stay manual */ }
    return out;
  },

  /* -------------------------------------------- */
  /*  Building the plan                           */
  /* -------------------------------------------- */

  /** Everything the plan needs that doesn't come from the dialog. */
  async _baseInput(actor, skill, attr, options) {
    const keys = abilityKeysOf(actor);
    const clock = clockNow();
    let rc = null;
    try { rc = await ns().heist?.rollContext?.(actor, skill) ?? null; } catch (e) { console.warn("Heisty Spideys | rollContext failed", e); }
    const phase = options.phase ?? rc?.phase ?? clock.phase ?? "idle";
    const alert = alertNow();
    const h = actor.system.heist ?? {};
    const pendingAll = Array.isArray(h.pending) ? h.pending.map(p => ({ ...p })) : [];
    const autoSilk = setting(SETTINGS.autoSilk, true) !== false;
    const approaches = (rc?.approaches ?? []).map(a => ({ ...a }));
    const approachId = options.approachId ?? rc?.approachId ?? null;
    return {
      actor, skill, attr, keys, clock, rc, phase, alert, autoSilk, approaches, approachId,
      pending: pendingAll,
      showOffMarker: pendingAll.find(p => p.source === "show-off") ?? null,
      opposers: this._opposedChoices(),
      input: {
        kind: skill ? "skill" : "attribute", attr, skill,
        attrValue: actor.system.attributes?.[attr]?.value ?? 0,
        skillValue: skill ? (actor.system.skills?.[skill]?.value ?? 0) : 0,
        vitality: actor.system.vitality?.state ?? "unharmed",
        abilityKeys: keys, crewKeys: crewKeysFor(actor),
        alert: { value: alert.value, limit: alert.limit }, phase,
        effects: rc?.effects ?? [],
        pending: pendingAll.filter(p => p.source !== "show-off"),
        bonuses: options.bonuses ?? rc?.bonuses ?? [],
        humanRow: options.humanRow ?? rc?.humanRow ?? null,
        silkAvailable: autoSilk ? silkOf(actor) : null,
        context: {
          tags: rc?.tags ?? [], cover: options.cover ?? rc?.cover ?? false, moving: options.moving ?? true,
          vsHuman: rc?.vsHuman ?? false, silkLinePrepared: !!rc?.silkLinePrepared,
          camouflaged: !!h.camouflaged, showOffArmed: options.showOff ?? !!pendingAll.find(p => p.source === "show-off"),
          escapeLeader: !!rc?.escapeLeader && (rc.escapeLeader === true || rc.escapeLeader === actor.id),
          longConIdentity: h.longConIdentity ?? "", methodActorTarget: h.methodActorTarget ?? "",
          drafting: options.drafting ?? rc?.drafting ?? false, forget: options.forget ?? false, height: options.height ?? false,
          escape: phase === "escape"
        }
      }
    };
  },

  /** The approach a choice binds, if any. */
  _approach(base, id) {
    return id ? base.approaches.find(a => a.id === id) ?? null : null;
  },

  /** Choice values for a roll with no dialog. */
  _defaultChoice(base, options) {
    const appr = this._approach(base, base.approachId);
    const calledSkill = appr && !(appr.skills ?? []).includes(base.skill) ? appr.skills?.[0] ?? null : null;
    return {
      approachId: appr?.id ?? null, difficulty: options.difficulty ?? appr?.difficulty ?? 3,
      modifier: 0, bonusDice: 0, silkDice: 0, penaltyDice: 0, toggles: {},
      improvise: false, calledSkill, overclock: false, opposed: "",
      physical: options.physical ?? PHYSICAL_SKILLS.includes(base.skill),
      fight: options.fight ?? !!appr?.fight,
      hazard: options.hazard ?? null
    };
  },

  /** Merge base input and dialog choice into a buildRollPlan input. */
  _planInput(base, choice, opposed = null) {
    const appr = this._approach(base, choice.approachId);
    return {
      ...base.input,
      difficulty: choice.difficulty,
      modifier: choice.modifier,
      bonusDice: choice.bonusDice,
      silkDice: choice.silkDice,
      penaltyDice: choice.penaltyDice,
      improvise: choice.improvise,
      calledSkill: choice.calledSkill,
      overclock: choice.overclock,
      toggles: choice.toggles,
      opposed: opposed ?? null,
      humanRow: appr?.humanRow ?? base.input.humanRow
    };
  },

  /* -------------------------------------------- */
  /*  Executing a roll                            */
  /* -------------------------------------------- */

  async _execute(actor, base, choice, options) {
    const appr = this._approach(base, choice.approachId);

    // Opposed: a resisting creature rolls first (once per round in a group check — then it's passed in).
    let opposed = options.opposed ? { ...options.opposed } : null;
    if (opposed && opposed.difficulty == null) opposed.difficulty = opposedDifficulty(opposed.successes);
    if (!opposed && choice.opposed) {
      const src = base.opposers.find(o => o.value === choice.opposed);
      if (src) {
        const label = HEISTY.skills[base.skill]?.label ?? HEISTY.attributes[base.attr]?.label;
        const res = await this._threatPool(src.actor, src.index, { opposing: `${actor.name} — ${label}` });
        if (res) opposed = { uuid: src.actor.uuid, name: src.actor.name, label: res.label, successes: res.successes, difficulty: opposedDifficulty(res.successes) };
      }
    }

    const plan = buildRollPlan(this._planInput(base, choice, opposed));
    if (!plan.valid) { ui.notifications?.warn(plan.warnings.join(" ")); return null; }

    // Earlier pending cards of this spider become final (its next roll closes their window).
    await finalizeActorCards(actor.uuid);

    const n = plan.botch ? 1 : plan.pool;
    const { roll, faces } = await rollDice(n);
    const res = resolveRoll(faces, plan.difficulty, { botch: plan.botch });

    // Silk and queued bonuses: one update on the roller's own actor.
    const update = {};
    if (base.autoSilk && plan.silkCost) update["system.silk.value"] = Math.max(0, silkOf(actor) - plan.silkCost);
    const consumed = new Set(plan.consumePending);
    if (plan.showOff && base.showOffMarker) consumed.add(base.showOffMarker.id);
    if (consumed.size && Array.isArray(actor.system.heist?.pending))
      update["system.heist.pending"] = actor.system.heist.pending.filter(p => !consumed.has(p.id)).map(p => ({ ...p }));
    if (Object.keys(update).length) {
      try {
        if (typeof ns().actorOps?.applyRollCosts === "function") await ns().actorOps.applyRollCosts(actor, update);
        else await actor.update(update);
      } catch (e) { console.error("Heisty Spideys | couldn't deduct Silk / consume bonuses", e); }
    }

    const clock = base.clock;
    const id = foundry.utils.randomID();
    const skillLbl = base.skill ? HEISTY.skills[base.skill].label : null;
    const attrDef = HEISTY.attributes[base.attr];
    const fightDefault = !!opposed && FIGHT_SKILLS.includes(base.skill);
    const card = recomputeCard(newCard(CARD.check, {
      actorUuid: actor.uuid, actorId: actor.id, actorName: actor.name, actorImg: actor.img, userId: game.user.id,
      heistId: clock.heistId, obstacleId: base.rc?.obstacleId ?? null, obstacleSerial: clock.obstacleSerial,
      roundSerial: clock.roundSerial, sceneSerial: clock.sceneSerial,
      groupId: options.groupId ?? null, approachId: appr?.id ?? null, eventId: options.groupId ?? id,
      phase: base.phase, fullAlert: plan.fullAlert, alertMode: alertMode(), alertOff: ALERT_OFF_PHASES.includes(base.phase),
      roll: {
        label: options.label ?? (skillLbl ?? attrDef.label),
        subtitle: skillLbl ? `${attrDef.abbr} + ${skillLbl}` : `${attrDef.abbr} only`,
        attr: base.attr, skill: base.skill, calledSkill: choice.improvise ? choice.calledSkill : null, improvise: plan.improvise,
        pool: plan.pool, difficulty: plan.difficulty, baseDifficulty: plan.baseDifficulty,
        diffParts: plan.diffParts, poolParts: plan.poolParts, bonus: plan.bonus,
        faces, rerolls: [], successes: res.successes, result: res.result, botch: plan.botch,
        clutched: false, contingency: false, forced: !!options.forced, reason: options.reason ?? "",
        fight: !!(choice.fight ?? fightDefault), hazard: choice.hazard ?? null, physical: !!choice.physical,
        casing: plan.casing, opposed, humanRow: opposed ? null : (this._planInput(base, choice).humanRow ?? null),
        showOff: plan.showOff, alertOnUse: Number(appr?.alertOnUse) || 0, approachLabel: appr ? (appr.label ?? appr.note ?? appr.id) : "",
        passFail: !!options.passFail, noAlert: !!options.noAlert, warnings: plan.warnings.filter(w => !/capped/.test(w))
      },
      silk: {
        spent: plan.silkSpends.map(s => ({ ...s, label: { die: `Silk dice ×${plan.silkDice}`, overclock: "Overclock", improvise: "Improvise" }[s.type] ?? s.type, advice: !base.autoSilk })),
        earned: []
      },
      alert: { triggers: [], cancels: [] },
      consequences: { status: "pending", hit: null, caught: false, partialCost: null, swap: null, candidates: [], noConsequence: false, applied: false, hitMessageId: null, penaltyApplied: false, custom: null },
      ctx: {
        engaged: (options.engaged ?? base.rc?.engaged ?? []).map(e => ({ ...e })),
        autoHits: setting(SETTINGS.autoHits, "prompt"), autoCapture: setting(SETTINGS.autoCapture, true) !== false,
        fullAlert: plan.fullAlert, phase: base.phase,
        alertState: { atLimit: plan.alertState.atLimit, key: plan.alertState.key, label: plan.alertState.label, stealth: plan.alertState.stealth, all: plan.alertState.all },
        abilityKeys: base.keys
      }
    }));

    // Show-Off: it pays the Flaw Moment if it costs you (Partial/Failure) or you Critical anyway.
    if (plan.showOff) {
      await markUsed(actor, "show-off");
      if (isFailed(res.result) || res.result === "partial" || res.result === "critical") {
        await earnSilk(actor, 1, "Show-Off Flaw Moment");
        card.silk.earned.push({ type: "flawMoment", sp: 1, label: "Show-Off Flaw Moment" });
      }
    }

    const message = await postMessage({
      _id: id, content: await renderCardContent(card), rolls: roll ? [roll] : [],
      speaker: ChatMessage.getSpeaker({ actor }), flags: { "heisty-spideys": { card } }
    }, { keepId: true });
    Hooks.callAll(HOOKS.rollResolved, message, card);
    return message;
  },

  /* -------------------------------------------- */
  /*  Roll dialog                                 */
  /* -------------------------------------------- */

  async _prompt(base, options) {
    const def = this._defaultChoice(base, options);
    const plan = buildRollPlan(this._planInput(base, def));
    const appr = this._approach(base, def.approachId);
    const skillLbl = base.skill ? HEISTY.skills[base.skill].label : null;
    const attrDef = HEISTY.attributes[base.attr];
    const label = options.label ?? (skillLbl ?? attrDef.label);
    const subtitle = skillLbl ? `${attrDef.abbr} + ${skillLbl}` : `${attrDef.abbr} only`;
    const opposerValue = o => o ? `${o.uuid ?? o.creatureUuid ?? o.actorUuid ?? ""}#${o.index ?? o.roll ?? 0}` : "";
    const approaches = base.approaches.map(a => ({
      id: a.id, selected: a.id === def.approachId,
      label: `${a.label ?? a.note ?? a.id} — ${(a.skills ?? []).map(k => HEISTY.skills[k]?.label ?? k).join("/")} (${a.difficulty ?? "?"})${(a.skills ?? []).includes(base.skill) ? "" : " · Improvise"}`,
      difficulty: a.difficulty ?? 3, called: (a.skills ?? []).includes(base.skill) ? "" : (a.skills?.[0] ?? ""),
      opposed: a.opposed ? opposerValue(a.opposed) : "", fight: a.fight ? "1" : ""
    }));
    const opp = appr?.opposed ? opposerValue(appr.opposed) : "";
    const pick = list => list.map(o => ({ id: o.id, label: o.label, checked: o.checked }));
    const vit = base.input.vitality;
    const content = await renderTemplate("systems/heisty-spideys/templates/apps/roll-dialog.hbs", {
      label, subtitle,
      plan, poolNum: plan.botch ? 0 : plan.pool, diffNum: plan.difficulty,
      phase: base.phase, isScore: base.phase === "score", isPlanning: base.phase === "planning",
      obstacleName: base.rc?.obstacleName ?? "",
      alertValue: base.alert.value, alertLimit: base.alert.limit, band: base.alert.state,
      vitLabel: HEISTY.vitality[vit]?.label ?? vit, vitPenalty: plan.vitalityPenalty, hasVitPenalty: plan.vitalityPenalty !== 0,
      approaches, hasApproaches: approaches.length > 0, noApproachSelected: !def.approachId,
      opposers: base.opposers.map(o => ({ value: o.value, label: o.label, selected: o.value === opp })),
      hasOpposers: base.opposers.length > 0 && !options.opposed, presetOpposed: options.opposed ?? null,
      defaultDifficulty: def.difficulty, difficulties: HEISTY.difficulties,
      diffOptions: pick(plan.options.filter(o => o.group === "diff")),
      diceOptions: pick(plan.options.filter(o => o.group === "dice")),
      flagOptions: pick(plan.options.filter(o => o.group === "flag")),
      bonusCap: BONUS_DICE_CAP,
      autoSilk: base.autoSilk, silkValue: silkOf(base.actor), silkMax: base.autoSilk ? silkOf(base.actor) : 20,
      canImprovise: !!base.skill, improviseChecked: !!(appr && def.calledSkill), calledSkill: def.calledSkill ?? "",
      skillChoices: Object.entries(HEISTY.skills).filter(([k]) => k !== base.skill).map(([k, s]) => ({ key: k, label: s.label, selected: k === def.calledSkill })),
      canOverclock: base.skill === "engineering" && base.keys.includes("overclock"),
      physicalChecked: def.physical, showFight: FIGHT_SKILLS.includes(base.skill), fightChecked: def.fight,
      hasWolf: base.keys.includes("species:wolf")
    });

    return foundry.applications.api.DialogV2.prompt({
      window: { title: `${label} Check`, icon: "fa-solid fa-dice-d6" },
      classes: ["heisty-spideys", "themed", "theme-light", "heisty-roll-dialog"],
      position: { width: 460 },
      content,
      rejectClose: false,
      ok: {
        label: "Roll the Pool", icon: "fa-solid fa-dice",
        callback: (event, button) => this._readChoice(button.form, base, def)
      },
      render: (event, dialog) => this._wireDialog(dialog ?? event?.target, base, def)
    });
  },

  /** Read the dialog's form into a choice. */
  _readChoice(form, base, def) {
    if (!form) return def;
    const el = name => form.elements.namedItem(name);
    const val = (name, d = 0) => { const e = el(name); return e ? Number(e.value) : d; };
    const checked = name => !!el(name)?.checked;
    const toggles = {};
    form.querySelectorAll("[data-opt]").forEach(cb => { toggles[cb.dataset.opt] = cb.checked; });
    const approachId = el("approach")?.value || null;
    const hazardOn = checked("hazard");
    return {
      approachId,
      difficulty: Math.max(1, Math.round(val("difficulty", def.difficulty)) || def.difficulty),
      modifier: Math.round(val("modifier")) || 0,
      bonusDice: Math.max(0, Math.round(val("bonus"))) || 0,
      silkDice: Math.max(0, Math.round(val("silk"))) || 0,
      penaltyDice: Math.max(0, Math.round(val("penalty"))) || 0,
      toggles,
      improvise: checked("improvise"),
      calledSkill: el("calledSkill")?.value || null,
      overclock: checked("overclock"),
      opposed: String(el("opposed")?.value ?? ""),
      physical: checked("physical"),
      fight: checked("fight"),
      hazard: hazardOn ? { difficulty: Math.max(1, Math.round(val("hazardDifficulty", 3)) || 3), label: "The hazard" } : null
    };
  },

  /** Live preview: rebuild the plan on every change and show pool, Difficulty, Silk and parts. */
  _wireDialog(dialog, base, def) {
    const root = dialog?.element ?? (dialog instanceof HTMLElement ? dialog : null);
    const form = root?.querySelector?.("form") ?? root;
    if (!form?.querySelector) return;
    const q = s => form.querySelector(s);
    const approach = q("select[name='approach']");
    const opposed = q("select[name='opposed']");
    const diff = q("input[name='difficulty']");
    const improvise = q("input[name='improvise']");
    const called = q("select[name='calledSkill']");
    const fight = q("input[name='fight']");

    const refresh = () => {
      const choice = this._readChoice(form, base, def);
      const opp = choice.opposed ? { successes: 0 } : null; // the creature rolls on Roll; preview its +1 floor
      const plan = buildRollPlan(this._planInput(base, choice, opp));
      const set = (sel, text) => { const n = q(sel); if (n) n.textContent = text; };
      set("[data-preview='pool']", plan.botch ? "0" : String(plan.pool));
      set("[data-preview='difficulty']", choice.opposed ? `${plan.difficulty}+` : String(plan.difficulty));
      set("[data-preview='silk']", plan.silkCost ? `Costs ${plan.silkCost} SP${base.autoSilk ? ` of ${silkOf(base.actor)}` : " (advice only)"}` : "");
      const parts = q("[data-preview='parts']");
      if (parts) {
        const lines = [
          ...plan.poolParts.filter(p => p.kind !== "note" && p.value).map(p => `${p.label} ${p.value > 0 ? "+" : ""}${p.value}`),
          ...plan.diffParts.filter(p => p.value).map(p => p.id === "base" ? `${p.label} ${p.value}` : `${p.label}: Diff ${p.value > 0 ? "+" : ""}${p.value}`)
        ];
        parts.replaceChildren(...lines.map(t => { const li = document.createElement("li"); li.textContent = t; return li; }));
      }
      const warn = q("[data-preview='warnings']");
      if (warn) {
        const w = [...plan.warnings];
        if (plan.botch) w.unshift("Pool at 0 or below: you roll one die — 1–3 Botch (+2 Alert), 4–6 a clean failure (+1).");
        if (choice.opposed) w.push("The creature rolls first: its Successes + 1 replace the Difficulty above.");
        warn.textContent = w.join(" ");
        warn.hidden = !w.length;
      }
      if (diff) {
        diff.disabled = !!choice.opposed;
        diff.closest(".form-group")?.classList.toggle("dim", !!choice.opposed);
      }
      if (called) called.closest(".form-group")?.toggleAttribute("hidden", !improvise?.checked);
    };

    approach?.addEventListener("change", () => {
      const opt = approach.selectedOptions[0];
      if (opt?.value) {
        if (diff) diff.value = opt.dataset.difficulty || diff.value;
        if (opposed && opt.dataset.opposed != null) opposed.value = opt.dataset.opposed;
        if (improvise) improvise.checked = !!opt.dataset.called;
        if (called && opt.dataset.called) called.value = opt.dataset.called;
        if (fight) fight.checked = !!opt.dataset.fight;
      }
      refresh();
    });
    form.addEventListener("input", refresh);
    form.addEventListener("change", refresh);
    refresh();
  },

  /** Assist dialog: target, Skill, own Silk dice. */
  async _assistPrompt(helper, target, skillKey) {
    const spiders = (game.actors?.contents ?? []).filter(a => a.type === "spider" && a.id !== helper.id && a.system?.vitality?.state !== "out");
    if (!spiders.length) { ui.notifications?.warn("No crewmate to Assist."); return null; }
    const skills = Object.entries(HEISTY.skills).map(([k, s]) => ({ k, label: `${s.label} (${helper.system.skills?.[k]?.value ?? 0})`, v: helper.system.skills?.[k]?.value ?? 0 }));
    const best = skillKey ?? skills.slice().sort((a, b) => b.v - a.v)[0]?.k;
    const sp = silkOf(helper);
    const content = `<div class="heisty-roll-dialog-body">
      <p class="hrd-note">Roll one Skill that plausibly helps — no Attribute — at least 1 die, at most 3. Each Success adds a die to their roll (the roll still gains at most +${BONUS_DICE_CAP}). Your own Silk dice can go into your Assist, outside its 3-die maximum.</p>
      <div class="form-group"><label>Helping</label><select name="target">${spiders.map(a => `<option value="${a.id}" ${a.id === target?.id ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</select></div>
      <div class="form-group"><label>Skill</label><select name="skill">${skills.map(s => `<option value="${s.k}" ${s.k === best ? "selected" : ""}>${esc(s.label)}</option>`).join("")}</select></div>
      <div class="form-group"><label>Silk dice <span class="dim">(1 SP each; you have ${sp})</span></label><input type="number" name="silk" value="0" min="0" max="${setting(SETTINGS.autoSilk, true) !== false ? sp : 20}" /></div>
    </div>`;
    return foundry.applications.api.DialogV2.prompt({
      window: { title: `${helper.name} Assists`, icon: "fa-solid fa-handshake-angle" },
      classes: ["heisty-spideys", "themed", "theme-light", "heisty-roll-dialog"],
      content, rejectClose: false,
      ok: {
        label: "Assist", icon: "fa-solid fa-dice",
        callback: (e, b) => ({ targetId: b.form.elements.target.value, skill: b.form.elements.skill.value, silk: Math.max(0, Number(b.form.elements.silk.value) || 0) })
      }
    });
  },

  /* -------------------------------------------- */
  /*  Registration                                */
  /* -------------------------------------------- */

  /** Kept for the 1.7 entry point: registers the full WP-B chat automation. */
  registerChatListeners() {
    registerDiceAutomation();
  }
};

let registeredOps = false;

/**
 * WP-B registration (call at init): chat listeners for check/threat/attack/
 * shrug/assist cards and the GM ops card.patch, hit.retarget, ui.forcedRoll
 * (on WP-C's registry, now or once it exists at ready). Idempotent.
 */
export function registerDiceAutomation() {
  registerCardActions();
  const tryOps = () => {
    if (registeredOps) return;
    registeredOps = registerCardOps(ns().gm);
  };
  tryOps();
  if (!registeredOps) {
    Hooks.once("setup", tryOps);
    Hooks.once("ready", tryOps);
  }
}

