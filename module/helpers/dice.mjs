/**
 * HEISTY SPIDEYS — The Dice Engine
 * --------------------------------
 * The entire engine: roll a pool of d6s, count every 5 or 6 as a Success,
 * compare to the Difficulty. Handles the Botch (pool at 0 or below), Critical
 * (double the required Successes; Alert −1 at Difficulty 3+, never at Full
 * Alert), Partial (at least half the Difficulty, rounded up), and Failure, and
 * reads the spider's Vitality penalty and the current Alert automatically.
 *
 * Rulebook v4.6 also adds:
 *  - the bonus-dice limit: at most +2 dice per roll from Assists, Perks,
 *    Signature Moves and intel together; Silk dice are separate and uncapped;
 *  - opposed rolls: a resisting creature rolls its pool first and its
 *    Successes + 1 become the spider's Difficulty, before cover/Alert/Perks.
 */

import { HEISTY } from "../config.mjs";
import { HeistyAlert } from "./alert.mjs";
import {
  SUCCESS_FACE, BONUS_DICE_CAP, countSuccesses, classifyResult, classifyBotch,
  alertForResult, capBonusDice, opposedDifficulty
} from "../logic/rules.mjs";

const renderTemplate = (path, data) => foundry.applications.handlebars.renderTemplate(path, data);

export const HeistyDice = {

  /* -------------------------------------------- */
  /*  Public entry points                         */
  /* -------------------------------------------- */

  /** Roll a Skill check: the governing Attribute + the Skill. */
  async skillCheck(actor, skillKey, options = {}) {
    const skill = HEISTY.skills[skillKey];
    if (!skill) return null;
    const attrKey = skill.attr;
    const base = (actor.system.attributes?.[attrKey]?.value ?? 0)
      + (actor.system.skills?.[skillKey]?.value ?? 0);
    return this._resolve(actor, {
      label: skill.label,
      subtitle: `${HEISTY.attributes[attrKey].abbr} + ${skill.label}`,
      isStealth: skillKey === "stealth",
      base,
      defaultDifficulty: options.difficulty ?? 3,
      fast: options.fast ?? false
    });
  },

  /** Roll an Attribute alone (an untrained roll — a Skill of 0). */
  async attributeCheck(actor, attrKey, options = {}) {
    const attr = HEISTY.attributes[attrKey];
    if (!attr) return null;
    const base = actor.system.attributes?.[attrKey]?.value ?? 0;
    return this._resolve(actor, {
      label: attr.label,
      subtitle: `${attr.abbr} only`,
      isStealth: false,
      base,
      defaultDifficulty: options.difficulty ?? 3,
      fast: options.fast ?? false
    });
  },

  /**
   * Roll one of a Threat's listed action pools. When it resists a spider, its
   * Successes + 1 are the spider's Difficulty (the card says so).
   * @param {Actor} actor
   * @param {number} index
   * @param {object} [options]
   * @param {string} [options.opposing]  Who/what it is resisting, for the card.
   * @returns {Promise<ChatMessage|null>}
   */
  async threatRoll(actor, index, options = {}) {
    const res = await this._threatPool(actor, index, options);
    return res?.message ?? null;
  },

  /** Roll a threat's pool, post its card, and return the message and Successes. */
  async _threatPool(actor, index, { opposing = "" } = {}) {
    const entry = actor.system.rolls?.[index];
    if (!entry) return null;
    const pool = Math.max(0, entry.pool);
    const roll = await this._rollPool(pool || 1);
    const faces = this._readFaces(roll);
    const successes = countSuccesses(faces.map(f => f.result));
    const content = await renderTemplate("systems/heisty-spideys/templates/chat/threat-card.hbs", {
      actorName: actor.name,
      actorImg: actor.img,
      label: entry.label || "Action",
      note: entry.note || "",
      pool,
      faces,
      successes,
      opposedDifficulty: opposedDifficulty(successes),
      opposing,
      isGM: game.user.isGM
    });
    const message = await this._post(actor, roll, content);
    return { message, successes, pool, label: entry.label || "Action" };
  },

  /* -------------------------------------------- */
  /*  Core resolution                             */
  /* -------------------------------------------- */

  async _resolve(actor, cfg) {
    const vitPenalty = actor.system.vitality?.penalty ?? 0;
    const alertValue = HeistyAlert.value;
    const alertLimit = HeistyAlert.limit;
    const band = HEISTY.getAlertState(alertValue, alertLimit);
    const alertDiff = cfg.isStealth ? band.stealth : band.all;
    const opposers = this._opposedChoices();

    let choice;
    if (cfg.fast) {
      choice = { difficulty: cfg.defaultDifficulty, modifier: 0, bonus: 0, silk: 0, penalty: 0, applyAlert: alertDiff > 0, opposed: "" };
    } else {
      choice = await this._prompt({ cfg, vitPenalty, alertValue, alertLimit, band, alertDiff, opposers });
      if (!choice) return null;
    }

    // Opposed (C3): the creature rolls first; its Successes + 1 are the Difficulty.
    let opposed = null;
    const source = choice.opposed ? opposers.find(o => o.value === choice.opposed) : null;
    if (source) {
      const res = await this._threatPool(source.actor, source.index, { opposing: `${actor.name} — ${cfg.label}` });
      if (res) opposed = { name: source.actor.name, label: res.label, successes: res.successes, difficulty: opposedDifficulty(res.successes) };
    }
    const baseDifficulty = opposed ? opposed.difficulty : choice.difficulty;

    // Bonus dice: at most +2 from everything except Silk.
    const dice = capBonusDice(choice.bonus, choice.silk);

    const difficulty = Math.max(1, baseDifficulty + choice.modifier + (choice.applyAlert ? alertDiff : 0));
    const pool = cfg.base + vitPenalty + dice.total - choice.penalty;

    const ctx = { difficulty, baseDifficulty, pool, vitPenalty, choice, alertDiff, band, dice, opposed };

    // The Botch: pool reduced to 0 or below. Roll one die anyway.
    if (pool <= 0) return this._botch(actor, cfg, ctx);

    const roll = await this._rollPool(pool);
    const faces = this._readFaces(roll);
    const successes = countSuccesses(faces.map(f => f.result));
    const resultKey = classifyResult(successes, difficulty);
    const content = await this._card(actor, cfg, ctx, { faces, successes, resultKey, pool });
    return this._post(actor, roll, content);
  },

  async _botch(actor, cfg, ctx) {
    const roll = await this._rollPool(1);
    const die = roll.dice[0].results[0].result;
    const resultKey = classifyBotch(die);
    const content = await this._card(actor, cfg, ctx, {
      faces: [{ result: die, success: false }], successes: 0, resultKey, pool: 1, isBotch: true, botchDie: die
    });
    return this._post(actor, roll, content);
  },

  /** Render the roll card for a resolved roll. */
  async _card(actor, cfg, ctx, { faces, successes, resultKey, pool, isBotch = false, botchDie = null }) {
    const res = HEISTY.results[resultKey];
    const suggested = alertForResult(resultKey, ctx.difficulty, ctx.band);
    return renderTemplate("systems/heisty-spideys/templates/chat/roll-card.hbs", {
      actorName: actor.name,
      actorImg: actor.img,
      label: cfg.label,
      subtitle: cfg.subtitle,
      pool,
      faces,
      successes,
      difficulty: ctx.difficulty,
      baseDifficulty: ctx.baseDifficulty,
      modifier: ctx.choice.modifier,
      alertApplied: ctx.choice.applyAlert && ctx.alertDiff > 0,
      alertDiff: ctx.alertDiff,
      vitPenalty: ctx.vitPenalty,
      bonus: ctx.dice.bonus,
      bonusRequested: ctx.dice.requested,
      bonusCapped: ctx.dice.capped,
      bonusCap: BONUS_DICE_CAP,
      silk: ctx.dice.silk,
      penalty: ctx.choice.penalty,
      opposed: ctx.opposed,
      fullAlert: ctx.band.atLimit,
      resultKey,
      resultLabel: res.label,
      resultCss: res.css,
      blurb: res.blurb,
      suggested,
      isBotch,
      botchDie,
      isGM: game.user.isGM
    });
  },

  /* -------------------------------------------- */
  /*  Roll dialog                                 */
  /* -------------------------------------------- */

  /**
   * Threat pools a spider can roll against: threats on the viewed scene (hidden
   * tokens only for the GM), then — for the GM — every threat in the Actors
   * directory. Each option is one of the creature's action pools.
   * @returns {{value:string,label:string,actor:Actor,index:number}[]}
   */
  _opposedChoices() {
    const out = [];
    const seen = new Set();
    const add = (actor, where) => {
      if (!actor || actor.type !== "threat" || seen.has(actor.uuid)) return;
      seen.add(actor.uuid);
      (actor.system.rolls ?? []).forEach((r, index) => {
        if (!(r?.pool > 0)) return;
        out.push({
          value: `${actor.uuid}#${index}`,
          label: `${actor.name}${where} — ${r.label || "Action"} (${r.pool}d6)`,
          actor, index
        });
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

  async _prompt({ cfg, vitPenalty, alertValue, alertLimit, band, alertDiff, opposers }) {
    const content = await renderTemplate("systems/heisty-spideys/templates/apps/roll-dialog.hbs", {
      label: cfg.label,
      subtitle: cfg.subtitle,
      base: cfg.base,
      defaultDifficulty: cfg.defaultDifficulty,
      vitPenalty,
      hasVitPenalty: vitPenalty !== 0,
      alertValue,
      alertLimit,
      band,
      alertDiff,
      hasAlertDiff: alertDiff > 0,
      isStealth: cfg.isStealth,
      difficulties: HEISTY.difficulties,
      bonusCap: BONUS_DICE_CAP,
      opposers: opposers.map(o => ({ value: o.value, label: o.label })),
      hasOpposers: opposers.length > 0
    });

    const data = await foundry.applications.api.DialogV2.input({
      window: { title: `${cfg.label} Check`, icon: "fa-solid fa-dice-d6" },
      classes: ["heisty-spideys", "themed", "theme-light", "heisty-roll-dialog"],
      position: { width: 420 },
      content,
      ok: { label: "Roll the Pool", icon: "fa-solid fa-dice" },
      rejectClose: false,
      render: (event, dialog) => this._wireDialog(dialog ?? event?.target)
    });
    if (!data) return null;

    return {
      difficulty: Math.max(1, Number(data.difficulty) || cfg.defaultDifficulty),
      modifier: Math.round(Number(data.modifier) || 0),
      bonus: Math.max(0, Number(data.bonus) || 0),
      silk: Math.max(0, Number(data.silk) || 0),
      penalty: Math.max(0, Number(data.penalty) || 0),
      applyAlert: !!data.applyAlert,
      opposed: String(data.opposed ?? "")
    };
  },

  /** Live hints in the roll dialog: the bonus-dice cap and the opposed Difficulty. */
  _wireDialog(dialog) {
    const root = dialog?.element ?? (dialog instanceof HTMLElement ? dialog : null);
    if (!root?.querySelector) return;
    const bonus = root.querySelector("input[name='bonus']");
    const capNote = root.querySelector(".hrd-cap-note");
    const opposed = root.querySelector("select[name='opposed']");
    const diff = root.querySelector("input[name='difficulty']");
    const syncCap = () => {
      if (!bonus || !capNote) return;
      const over = (Number(bonus.value) || 0) > BONUS_DICE_CAP;
      capNote.classList.toggle("warn", over);
      capNote.querySelector(".hrd-cap-over")?.toggleAttribute("hidden", !over);
    };
    const syncOpposed = () => {
      if (!opposed || !diff) return;
      diff.disabled = !!opposed.value;
      diff.closest(".form-group")?.classList.toggle("dim", !!opposed.value);
    };
    bonus?.addEventListener("input", syncCap);
    opposed?.addEventListener("change", syncOpposed);
    syncCap();
    syncOpposed();
  },

  /* -------------------------------------------- */
  /*  Mechanics helpers                           */
  /* -------------------------------------------- */

  /** Roll N six-sided dice. */
  async _rollPool(n) {
    const roll = new Roll(`${Math.max(1, n)}d6`);
    await roll.evaluate();
    return roll;
  },

  /** Read each die face and flag Successes (5, 6). */
  _readFaces(roll) {
    const die = roll.dice[0];
    return die.results.filter(r => r.active !== false).map(r => ({
      result: r.result,
      success: r.result >= SUCCESS_FACE
    }));
  },

  /* -------------------------------------------- */
  /*  Chat plumbing                               */
  /* -------------------------------------------- */

  async _post(actor, roll, content) {
    const msgData = {
      speaker: ChatMessage.getSpeaker({ actor }),
      rolls: [roll],
      content,
      style: CONST.CHAT_MESSAGE_STYLES.OTHER
    };
    // v14 replaced "roll modes" with message visibility modes (core.messageMode);
    // applyMode() with no mode uses the player's current chat selector.
    // applyRollMode is the v13 path (deprecated in v14, removed in v16).
    if (typeof ChatMessage.applyMode === "function") Object.assign(msgData, ChatMessage.applyMode(msgData));
    else ChatMessage.applyRollMode(msgData, game.settings.get("core", "rollMode"));
    return ChatMessage.create(msgData);
  },

  /** Wire the Alert buttons on posted roll cards — GM only; hidden for players. */
  registerChatListeners() {
    Hooks.on("renderChatMessageHTML", (message, html) => {
      const root = html instanceof HTMLElement ? html : html?.[0];
      if (!root) return;
      const controls = root.querySelector(".hrc-alert-controls");
      if (controls && !game.user.isGM) {
        controls.remove();
        return;
      }
      root.querySelectorAll("[data-heisty-alert]").forEach(btn => {
        btn.addEventListener("click", async ev => {
          ev.preventDefault();
          if (!game.user.isGM) return;
          await HeistyAlert.applyDelta(Number(ev.currentTarget.dataset.heistyAlert));
        });
      });
    });
  }
};
