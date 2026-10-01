/**
 * HEISTY SPIDEYS — Taking Hits at the table (WP-B, §3.8)
 * -----------------------------------------------------
 * Attack card → shrug-off card → Vitality.
 *
 *  1. An attack card (normally GM-authored) rolls the attack pool against one
 *     target: an engaged threat after a Failure, a human's swat, a hazard's
 *     Failure (pool = its Difficulty), a fall (1 die per 2 squares, rounded
 *     up), a Partial swap, or a threat sheet's attack.
 *  2. Take the Hit: an adjacent Bruiser's owner may claim it before the
 *     shrug-off (once per scene; `hit.retarget` GM op).
 *  3. Shrug it off: the target's owner (or the GM; `forcedRolls = auto` rolls
 *     it at once) rolls BODY + Endurance + the Vitality penalty. Vitality is
 *     written from the stored "before" state, so re-resolving is idempotent;
 *     That All You Got? rolls itself when the hit would drop the spider to
 *     Critical. The shrug card offers a Silk Reroll and Run It Again.
 */

import { CARD, OPS, HOOKS, SETTINGS, QUERY } from "../contracts.mjs";
import { HEISTY } from "../config.mjs";
import { ABILITY_KEYS, SILK_COSTS, SILK_REROLL_MAX, rerollIndices, applyReroll, vitalityPenalty } from "../logic/rolls.mjs";
import { shrugPool, shrugOutcome, taygPasses, hazardPool, fallPool, pickAttackIndex } from "../logic/hits.mjs";
import { countSuccesses } from "../logic/rules.mjs";
import { getCard, newCard, renderCardContent, cardUpdateData } from "./card-flags.mjs";
import {
  ns, setting, abilityKeysOf, abilityAvailable, markUsed, spendSilk, silkOf, gmRun, clockNow, actorFrom,
  rollDice, updateCard, isActiveGM
} from "./card-actions.mjs";

const bump = card => ({ ...card, version: (Number(card.version) || 0) + 1 });

/** Chebyshev distance in grid squares between two actors' tokens on the viewed scene, or null. */
function squaresBetween(a, b) {
  try {
    const scene = game.scenes?.viewed ?? canvas?.scene;
    const ta = scene?.tokens?.find(t => t.actorId === a.id);
    const tb = scene?.tokens?.find(t => t.actorId === b.id);
    if (!ta || !tb) return null;
    const size = scene.grid?.size || canvas?.grid?.size || 100;
    return Math.max(Math.abs(ta.x - tb.x), Math.abs(ta.y - tb.y)) / size;
  } catch (e) { return null; }
}

/** Is `a` adjacent to `b` (8 surrounding squares)? Unknown (no tokens) → null. */
function adjacent(a, b) {
  const d = squaresBetween(a, b);
  return d == null ? null : d <= 1;
}

export const HitFlow = {

  /** The index of a threat's attack pool. */
  attackIndex(threat) {
    const auto = threat?.system?.automation?.attackIndex;
    if (Number.isInteger(auto) && auto >= 0) return auto;
    try {
      const viaHeist = ns().heist?.attackIndexFor?.(threat);
      if (Number.isInteger(viaHeist) && viaHeist >= 0) return viaHeist;
    } catch (e) { /* none */ }
    return pickAttackIndex(threat?.system?.rolls ?? []);
  },

  /** Write a Vitality state (WP-A actorOps when present) and fire the hook. */
  async setVitality(actor, to, cause = "hit") {
    // WP-A's setVitality(actor, state, cause) takes the cause as a string.
    if (cause && typeof cause === "object") cause = cause.cause ?? "hit";
    cause = String(cause ?? "hit");
    const from = actor.system?.vitality?.state ?? "unharmed";
    if (from === to) return;
    const ops = ns().actorOps;
    // WP-A's setVitality writes the state and fires the vitalityChanged hook itself.
    if (typeof ops?.setVitality === "function") return ops.setVitality(actor, to, cause);
    const data = { "system.vitality.state": to };
    if (actor.system?.schema?.getField?.("vitality.outCause")) data["system.vitality.outCause"] = to === "out" ? cause : "";
    await actor.update(data);
    Hooks.callAll(HOOKS.vitalityChanged, actor, from, to, cause);
  },

  /* ------------------------------------------ */
  /*  Attack cards                              */
  /* ------------------------------------------ */

  /**
   * Post an attack card: roll the pool and name the target.
   * @param {object} o
   * @param {Actor} o.target
   * @param {number} o.pool
   * @param {string} o.label          "Pounce", "Swat", "Fall (3 squares)"…
   * @param {Actor|null} [o.source]   The threat (null for a hazard or fall).
   * @param {number} [o.index]        The threat's roll index.
   * @param {string} [o.sourceName]
   * @param {string} [o.why]          "after a Failure", "Partial cost"…
   * @param {boolean} [o.critToOut]   Human glass.
   * @param {boolean} [o.outIfLands]  Exterminator in the open.
   * @param {boolean} [o.capture]     Curious Child capture.
   * @param {string} [o.sourceMessageId]
   * @returns {Promise<ChatMessage|null>}
   */
  async postAttack(o) {
    const target = o.target;
    if (!target) return null;
    const pool = Math.max(0, Math.round(Number(o.pool) || 0));
    const { roll, faces } = await rollDice(pool);
    const successes = countSuccesses(faces);
    const clock = clockNow();
    const id = foundry.utils.randomID();
    const src = o.source ?? null;
    const card = newCard(CARD.attack, {
      actorUuid: src?.uuid ?? null, actorName: src?.name ?? o.sourceName ?? "Hazard", actorImg: src?.img ?? "",
      userId: game.user.id, heistId: clock.heistId, obstacleSerial: clock.obstacleSerial, roundSerial: clock.roundSerial,
      eventId: id,
      attack: {
        threatUuid: src?.uuid ?? null, rollIndex: o.index ?? null, label: o.label ?? "Attack", pool, faces, successes,
        targetUuid: target.uuid, targetName: target.name, targetImg: target.img,
        sourceName: src?.name ?? o.sourceName ?? "Hazard", sourceImg: src?.img ?? o.sourceImg ?? "",
        why: o.why ?? "", redirectedFrom: null, redirectedFromName: null,
        critToOut: !!o.critToOut, outIfLands: !!o.outIfLands, capture: !!o.capture,
        hazard: !!o.hazard, fall: o.fall ?? null, sourceMessageId: o.sourceMessageId ?? null,
        shrugMessageId: null, result: null
      },
      alert: { triggers: [], cancels: [] },
      consequences: { status: "pending" }
    });
    const content = await renderCardContent(card);
    const data = {
      _id: id, content, rolls: roll ? [roll] : [],
      speaker: src ? ChatMessage.getSpeaker({ actor: src }) : { alias: card.attack.sourceName },
      style: CONST.CHAT_MESSAGE_STYLES.OTHER,
      flags: { "heisty-spideys": { card } }
    };
    return ChatMessage.create(data, { keepId: true });
  },

  /** Post the attack for a check card's consequence ({uuid,index,name,label,pool,hazard,…}). */
  async hitFromConsequence(hit, target, { sourceMessageId = null } = {}) {
    const threat = hit.uuid ? actorFrom(hit.uuid) : null;
    const flags = this.threatFlags(threat, hit);
    return this.postAttack({
      target, source: threat, index: hit.index, pool: hit.pool, label: hit.label ?? "Attack",
      sourceName: hit.name, why: hit.hazard ? "the hazard lands" : "it sees you fail", hazard: !!hit.hazard,
      sourceMessageId, ...flags
    });
  },

  /** Out-on-hit flags from the threat, its automation key, or the hit record. */
  threatFlags(threat, hit = {}) {
    const key = threat?.system?.automation?.key || (threat ? String(threat.name).toLowerCase() : "");
    return {
      critToOut: hit.critToOut ?? (hit.human || /^human/.test(key)),
      outIfLands: hit.outIfLands ?? false,
      capture: hit.capture ?? (/curious[- ]child/.test(key) && /capture/i.test(hit.label ?? ""))
    };
  },

  /**
   * A threat sheet's attack on its targets (default: the user's targeted tokens).
   * @param {Actor} threat
   * @param {number} [index]  Its roll index (default: its attack).
   * @param {{targets?:Actor[], outIfLands?:boolean}} [opts]
   */
  async threatAttack(threat, index = null, { targets = null, outIfLands = false, why = "" } = {}) {
    const idx = Number.isInteger(index) ? index : this.attackIndex(threat);
    const entry = threat?.system?.rolls?.[idx];
    if (!entry) { ui.notifications?.warn(`${threat?.name ?? "That threat"} has no attack pool.`); return []; }
    const list = targets ?? Array.from(game.user.targets ?? []).map(t => t.actor).filter(Boolean);
    if (!list.length) { ui.notifications?.warn("Target a spider's token first (or pass targets)."); return []; }
    const out = [];
    for (const target of list) {
      const flags = this.threatFlags(threat, { label: entry.label, outIfLands });
      out.push(await this.postAttack({ target, source: threat, index: idx, pool: entry.pool, label: entry.label || "Attack", why, ...flags }));
    }
    return out;
  },

  /** A real fall: 1 die per 2 squares, rounded up (N17). Prompts for squares when not given. */
  async fallAttack(target, squares = null) {
    let sq = squares;
    if (sq == null) {
      sq = await foundry.applications.api.DialogV2.prompt({
        window: { title: `${target.name} falls` }, rejectClose: false,
        classes: ["heisty-spideys", "themed", "theme-light"],
        content: `<div class="form-group"><label>Squares fallen (chair 2, counter 3, shelf 6, ceiling 8)</label><input type="number" name="sq" value="3" min="1" max="20" autofocus /></div>`,
        ok: { label: "Fall", callback: (e, b) => Number(b.form.elements.sq.value) || 0 }
      });
      if (!sq) return null;
    }
    return this.postAttack({ target, pool: fallPool(sq), label: `Fall (${sq} square${sq === 1 ? "" : "s"})`, sourceName: "The floor", why: "1 die per 2 squares, rounded up", fall: sq, sourceImg: "icons/svg/falling.svg" });
  },

  /** A hazard with no attack pool hits with its Ch 15 Difficulty in dice. */
  async hazardAttack(target, difficulty, label = "Hazard") {
    return this.postAttack({ target, pool: hazardPool(difficulty), label, sourceName: label, why: `Difficulty ${difficulty} in dice`, hazard: true });
  },

  /* ------------------------------------------ */
  /*  Buttons                                   */
  /* ------------------------------------------ */

  /** Bruisers (owned by this user, or any for the GM) who could Take the Hit. */
  takeTheHitCandidates(card) {
    const target = actorFrom(card.attack?.targetUuid);
    if (!target) return [];
    return (game.actors?.contents ?? []).filter(a => a.type === "spider" && a.id !== target.id && a.isOwner
      && abilityKeysOf(a).includes(ABILITY_KEYS.takeTheHit) && abilityAvailable(a, ABILITY_KEYS.takeTheHit)
      && a.system?.vitality?.state !== "out"
      && (game.user.isGM || adjacent(a, target) !== false));
  },

  attackButtons(message, card) {
    const a = card.attack ?? {};
    if (a.shrugMessageId || a.result) return [];
    const out = [];
    const target = actorFrom(a.targetUuid);
    if (!target) return out;
    const isTargetOwner = target.isOwner;
    if (isTargetOwner && !game.user.isGM) out.push({ action: "shrug", label: "Shrug it off", title: "BODY + Endurance against the attack. Free: it isn't your Action." });
    if (game.user.isGM) out.push({ action: "shrug", label: target.hasPlayerOwner ? "Shrug it off for them" : "Shrug it off", cls: "gm" });
    for (const b of this.takeTheHitCandidates(card)) {
      out.push({ action: "takeTheHit", actorId: b.id, label: `Take the Hit — ${b.name}`, cls: game.user.isGM && !b.hasPlayerOwner ? "gm" : "", title: "Once per scene, before the shrug-off: the hit is yours, and so is the roll." });
    }
    return out;
  },

  shrugButtons(message, card) {
    const s = card.shrug ?? {};
    const out = [];
    const actor = actorFrom(card.actorUuid);
    if (!actor) return out;
    const owner = actor.isOwner && (!game.user.isGM || !actor.hasPlayerOwner);
    const canImprove = !s.shrugged && s.pool > 0 && rerollIndices(s.faces, Infinity).length > 0 && !s.locked;
    if (owner && canImprove) {
      out.push({ action: "shrugReroll", value: "silk", label: "Reroll (2 SP)", disabled: setting(SETTINGS.autoSilk, true) !== false && silkOf(actor) < SILK_COSTS.reroll, title: "Reroll up to 3 dice that didn't succeed; your Successes stay." });
      const used = (card.roll?.rerolls ?? []).some(r => r.by === "wolf");
      if (!used && abilityKeysOf(actor).includes(ABILITY_KEYS.runItAgain) && abilityAvailable(actor, ABILITY_KEYS.runItAgain))
        out.push({ action: "shrugReroll", value: "wolf", label: "Run It Again", title: "A shrug-off counts: reroll every die that didn't succeed." });
    }
    if (game.user.isGM && s.applied === false) out.push({ action: "applyVitality", label: `Apply: ${HEISTY.vitality[s.vitalityAfter]?.label ?? s.vitalityAfter}`, cls: "gm" });
    return out;
  },

  /* ------------------------------------------ */
  /*  Actions                                   */
  /* ------------------------------------------ */

  async onAction(message, card, b) {
    switch (b.action) {
      case "shrug": return this.rollShrug(message);
      case "takeTheHit": {
        const args = { attackMessageId: message.id, bruiserId: b.actorId, userId: game.user.id };
        if (game.user.isGM) {
          const chk = this.retargetOp.check(args, game.user);
          if (chk !== true) return ui.notifications?.warn(chk);
          return this.retargetOp.apply(args, game.user);
        }
        return gmRun(OPS.hitRetarget, args);
      }
      case "shrugReroll": return this.rerollShrug(message, b.value);
      case "applyVitality": {
        if (!game.user.isGM) return;
        const actor = actorFrom(card.actorUuid);
        if (!actor) return;
        await this.setVitality(actor, card.shrug.vitalityAfter, card.shrug.cause);
        const next = bump(structuredClone(card));
        next.shrug.applied = true;
        return updateCard(message, next);
      }
    }
  },

  /** Roll the shrug-off for an attack card. Returns the shrug message. */
  async rollShrug(attackMessage) {
    const atk = getCard(attackMessage);
    const a = atk?.attack;
    if (!a || a.shrugMessageId || a.result) return null;
    const target = actorFrom(a.targetUuid);
    if (!target) return null;
    if (!target.isOwner) { ui.notifications?.warn(`Only ${target.name}'s player or the Storyteller can roll that.`); return null; }
    if (this._rolling?.has(attackMessage.id)) return null;
    (this._rolling ??= new Set()).add(attackMessage.id);
    try {
      const keys = abilityKeysOf(target);
      const before = target.system?.vitality?.state ?? "unharmed";
      const pen = vitalityPenalty(before, keys);
      const body = Number(target.system?.attributes?.body?.value) || 0;
      const endurance = Number(target.system?.skills?.endurance?.value) || 0;
      const pool = shrugPool({ body, endurance, vitalityPenalty: pen });
      const { roll, faces } = await rollDice(pool);
      const hasTayg = keys.includes(ABILITY_KEYS.thatAllYouGot);
      const shrug = await this._resolveShrug({
        attackSuccesses: a.successes, faces, vitalityBefore: before, hasTayg, tayg: null,
        critToOut: a.critToOut, outIfLands: a.outIfLands, capture: a.capture, taygPool: pool
      });
      Object.assign(shrug, { attackMessageId: attackMessage.id, attackLabel: `${a.sourceName}: ${a.label}`, attackSuccesses: a.successes, pool, faces });
      const auto = setting(SETTINGS.autoVitality, true) !== false;
      shrug.applied = auto;
      const id = foundry.utils.randomID();
      const clock = clockNow();
      const card = newCard(CARD.shrug, {
        actorUuid: target.uuid, actorName: target.name, actorImg: target.img, userId: game.user.id,
        heistId: clock.heistId, obstacleSerial: clock.obstacleSerial, roundSerial: clock.roundSerial,
        eventId: id, roll: { rerolls: [], forced: true }, shrug, silk: { spent: [], earned: [] }
      });
      const msg = await ChatMessage.create({
        _id: id, content: await renderCardContent(card), rolls: roll ? [roll] : [],
        speaker: ChatMessage.getSpeaker({ actor: target }), style: CONST.CHAT_MESSAGE_STYLES.OTHER,
        flags: { "heisty-spideys": { card } }
      }, { keepId: true });
      if (auto) await this.setVitality(target, shrug.vitalityAfter, shrug.cause);
      await this._linkAttack(attackMessage, msg, shrug);
      return msg;
    } finally {
      this._rolling.delete(attackMessage.id);
    }
  },

  /** Resolve a shrug-off, rolling That All You Got? when it's needed and not rolled yet. */
  async _resolveShrug({ attackSuccesses, faces, vitalityBefore, hasTayg, tayg, critToOut, outIfLands, capture, taygPool }) {
    let taygState = hasTayg ? (tayg ? tayg.passed : null) : false;
    let res = shrugOutcome({ attackSuccesses, faces, vitalityBefore, tayg: taygState, critToOut, outIfLands, capture });
    let taygRoll = tayg ?? null;
    if (res.needsTayg) {
      const n = Math.max(0, taygPool);
      const { faces: tf } = await rollDice(n);
      taygRoll = { faces: tf, successes: countSuccesses(tf), passed: taygPasses(tf, n), pool: n };
      res = shrugOutcome({ attackSuccesses, faces, vitalityBefore, tayg: taygRoll.passed, critToOut, outIfLands, capture });
    }
    return { ...res, tayg: taygRoll, hasTayg, critToOut, outIfLands, capture, taygPool };
  },

  /** Note the shrug-off's result on its attack card (direct, or via card.patch). */
  async _linkAttack(attackMessage, shrugMessage, shrug) {
    const atk = getCard(game.messages.get(attackMessage.id) ?? attackMessage);
    if (!atk) return;
    const next = bump(structuredClone(atk));
    next.attack.shrugMessageId = shrugMessage?.id ?? next.attack.shrugMessageId;
    next.attack.result = { shrugged: shrug.shrugged, vitalityBefore: shrug.vitalityBefore, vitalityAfter: shrug.vitalityAfter, out: shrug.out, drop: shrug.drop };
    next.consequences = { ...next.consequences, status: "final" };
    try { await updateCard(attackMessage, next); }
    catch (e) { console.warn("Heisty Spideys | couldn't note the shrug on the attack card", e); }
  },

  /** Silk Reroll or Run It Again on a shrug card: re-resolve and re-apply Vitality. */
  async rerollShrug(message, by) {
    const card = getCard(message);
    const s = card?.shrug;
    const actor = actorFrom(card?.actorUuid);
    if (!s || !actor?.isOwner || s.shrugged) return;
    if (by === "wolf" && (card.roll?.rerolls ?? []).some(r => r.by === "wolf")) return;
    const indices = rerollIndices(s.faces, by === "silk" ? SILK_REROLL_MAX : Infinity);
    if (!indices.length) return;
    let spent = null;
    if (by === "silk") {
      const res = await spendSilk(actor, SILK_COSTS.reroll, "a Reroll");
      if (!res.ok) return;
      spent = { type: "reroll", cost: SILK_COSTS.reroll, label: "Reroll", advice: !!res.advice };
    }
    const { faces: newFaces } = await rollDice(indices.length, { show: true });
    const faces = applyReroll(s.faces, indices, newFaces);
    const res = await this._resolveShrug({
      attackSuccesses: s.attackSuccesses, faces, vitalityBefore: s.vitalityBefore, hasTayg: s.hasTayg, tayg: s.tayg,
      critToOut: s.critToOut, outIfLands: s.outIfLands, capture: s.capture, taygPool: s.taygPool ?? s.pool
    });
    const next = bump(structuredClone(card));
    next.shrug = { ...s, ...res, faces, attackMessageId: s.attackMessageId, attackLabel: s.attackLabel, attackSuccesses: s.attackSuccesses, pool: s.pool };
    next.roll = { ...(next.roll ?? {}), rerolls: [...(card.roll?.rerolls ?? []), { by, indices, faces: newFaces }] };
    if (spent) (next.silk ??= { spent: [], earned: [] }).spent.push(spent);
    if (by === "wolf") await markUsed(actor, ABILITY_KEYS.runItAgain);
    const auto = setting(SETTINGS.autoVitality, true) !== false;
    next.shrug.applied = auto ? true : false;
    await updateCard(message, next);
    if (auto) await this.setVitality(actor, next.shrug.vitalityAfter, next.shrug.cause);
    const atkMsg = game.messages.get(s.attackMessageId);
    if (atkMsg) await this._linkAttack(atkMsg, message, next.shrug);
    return next;
  },

  /** Active GM: `forcedRolls = auto` rolls the shrug-off as soon as the attack is posted. */
  async onAttackCreated(message, card) {
    if (!isActiveGM() || setting(SETTINGS.forcedRolls, "player") !== "auto") return;
    if (card.attack?.shrugMessageId) return;
    try { await this.rollShrug(message); } catch (e) { console.error("Heisty Spideys | auto shrug failed", e); }
  },

  /* ------------------------------------------ */
  /*  GM ops                                    */
  /* ------------------------------------------ */

  /** hit.retarget: Take the Hit (once/scene, before the shrug-off, adjacent; the GM may override). */
  retargetOp: {
    check(args, ctx) {
      const user = game.users.get(ctx?.user?.id ?? ctx?.id ?? ctx?.userId ?? args?.userId);
      const message = game.messages.get(args?.attackMessageId);
      const card = getCard(message);
      const bruiser = game.actors.get(args?.bruiserId);
      if (!user || !card || card.kind !== CARD.attack || !bruiser) return "No such attack.";
      if (card.attack.shrugMessageId || card.attack.result) return "Too late: the shrug-off is already rolled.";
      if (!user.isGM && !bruiser.testUserPermission(user, "OWNER")) return "That isn't your spider.";
      if (!abilityKeysOf(bruiser).includes(ABILITY_KEYS.takeTheHit)) return `${bruiser.name} doesn't have Take the Hit.`;
      if (!abilityAvailable(bruiser, ABILITY_KEYS.takeTheHit)) return "Take the Hit is used this scene.";
      const target = actorFrom(card.attack.targetUuid);
      if (target?.id === bruiser.id) return "The hit is already yours.";
      if (!user.isGM && target && adjacent(bruiser, target) === false) return `${bruiser.name} isn't adjacent to ${target.name}.`;
      return true;
    },
    async apply(args) {
      const message = game.messages.get(args.attackMessageId);
      const card = getCard(message);
      const bruiser = game.actors.get(args.bruiserId);
      const next = bump(structuredClone(card));
      next.attack.redirectedFrom = card.attack.targetUuid;
      next.attack.redirectedFromName = card.attack.targetName;
      next.attack.targetUuid = bruiser.uuid;
      next.attack.targetName = bruiser.name;
      next.attack.targetImg = bruiser.img;
      // The glass applies to whoever is hit; the capture/exterminator flags travel with the hit.
      await message.update(cardUpdateData(next, await renderCardContent(next)));
      await markUsed(bruiser, ABILITY_KEYS.takeTheHit);
      return { ok: true };
    }
  },

  /**
   * ui.forcedRoll (GM → owner): the owner's client rolls a forced roll and
   * returns the message id. args: {actorUuid, spec} where spec is a
   * HeistyDice.rollForced spec, or {type:"shrug", attackMessageId}.
   */
  forcedRollOp: {
    check(args, ctx) {
      const user = game.users.get(ctx?.user?.id ?? ctx?.id ?? ctx?.userId ?? args?.userId);
      return user?.isGM ? true : "Only the Storyteller can call for a forced roll.";
    },
    async apply(args) {
      if (args?.spec?.type === "shrug") {
        const m = await HitFlow.rollShrug(game.messages.get(args.spec.attackMessageId));
        return { messageId: m?.id ?? null };
      }
      const actor = actorFrom(args?.actorUuid);
      if (!actor) return { messageId: null };
      const m = await ns().dice?.rollForced?.(actor, args.spec ?? {}, { local: true });
      return { messageId: m?.id ?? null };
    }
  },

  /**
   * GM → owner: ask the spider's player to make a forced roll on their client
   * (WP-C's query transport); falls back to rolling here.
   */
  async askOwner(actor, spec) {
    const owner = game.users?.find(u => u.active && !u.isGM && actor.testUserPermission(u, "OWNER"));
    if (owner && owner.id !== game.user.id) {
      try {
        const args = { actorUuid: actor.uuid, spec, userId: game.user.id, requestId: foundry.utils.randomID() };
        const gm = ns().gm;
        if (typeof gm?.ask === "function") {
          const res = await gm.ask(owner.id, OPS.uiForcedRoll, args);
          return res?.ok ? res.result : null;
        }
        if (typeof owner.query === "function") return await owner.query(QUERY, { op: OPS.uiForcedRoll, args, userId: game.user.id, requestId: args.requestId }, { timeout: 30000 });
      } catch (e) { console.warn("Heisty Spideys | the player's client didn't answer; rolling here", e); }
    }
    return null;
  }
};
