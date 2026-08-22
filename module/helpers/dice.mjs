/**
 * HEISTY SPIDEYS — The Dice Engine
 * --------------------------------
 * The entire engine: roll a pool of d6s, count every 4, 5, or 6 as a Success,
 * compare to the Difficulty. Handles the Botch (pool at 0), Critical (double the
 * required Successes, Alert −1), Partial, and clean Failure, and reads the
 * spider's Vitality penalty and the current Alert automatically.
 */

import { HEISTY } from "../config.mjs";
import { HeistyAlert } from "./alert.mjs";

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

  /** Roll an Attribute alone (the Improvise path — the ST usually adds +1 Difficulty). */
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

  /** Roll one of a Threat's listed action pools (opposed — no fixed Difficulty). */
  async threatRoll(actor, index, options = {}) {
    const entry = actor.system.rolls?.[index];
    if (!entry) return null;
    const pool = Math.max(0, entry.pool);
    const roll = await this._rollPool(pool || 1);
    const faces = this._readFaces(roll);
    const successes = faces.filter(f => f.success).length;
    const content = await renderTemplate("systems/heisty-spideys/templates/chat/threat-card.hbs", {
      actorName: actor.name,
      actorImg: actor.img,
      label: entry.label || "Action",
      note: entry.note || "",
      pool,
      faces,
      successes,
      isGM: game.user.isGM
    });
    return this._post(actor, roll, content);
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

    let choice;
    if (cfg.fast) {
      choice = { difficulty: cfg.defaultDifficulty, bonus: 0, penalty: 0, applyAlert: alertDiff > 0 };
    } else {
      choice = await this._prompt({ cfg, vitPenalty, alertValue, alertLimit, band, alertDiff });
      if (!choice) return null;
    }

    const difficulty = Math.max(1, choice.difficulty + (choice.applyAlert ? alertDiff : 0));
    const pool = cfg.base + vitPenalty + choice.bonus - choice.penalty;

    // The Botch: pool reduced to 0 or below. Roll one die anyway.
    if (pool <= 0) return this._botch(actor, cfg, { difficulty, pool, vitPenalty, choice, alertDiff });

    const roll = await this._rollPool(pool);
    const faces = this._readFaces(roll);
    const successes = faces.filter(f => f.success).length;
    const resultKey = this._classify(successes, difficulty);
    const suggested = this._alertSuggestion(resultKey);
    const res = HEISTY.results[resultKey];

    const content = await renderTemplate("systems/heisty-spideys/templates/chat/roll-card.hbs", {
      actorName: actor.name,
      actorImg: actor.img,
      label: cfg.label,
      subtitle: cfg.subtitle,
      pool,
      faces,
      successes,
      difficulty,
      baseDifficulty: choice.difficulty,
      alertApplied: choice.applyAlert && alertDiff > 0,
      alertDiff,
      vitPenalty,
      bonus: choice.bonus,
      penalty: choice.penalty,
      resultKey,
      resultLabel: res.label,
      resultCss: res.css,
      blurb: res.blurb,
      suggested,
      isBotch: false,
      isGM: game.user.isGM
    });

    return this._post(actor, roll, content);
  },

  async _botch(actor, cfg, ctx) {
    const roll = await this._rollPool(1);
    const die = roll.dice[0].results[0].result;
    const isBotch = die <= 3;
    const resultKey = isBotch ? "botch" : "cleanfail";
    const res = HEISTY.results[resultKey];
    const suggested = this._alertSuggestion(resultKey);

    const content = await renderTemplate("systems/heisty-spideys/templates/chat/roll-card.hbs", {
      actorName: actor.name,
      actorImg: actor.img,
      label: cfg.label,
      subtitle: cfg.subtitle,
      pool: 1,
      faces: [{ result: die, success: false }],
      successes: 0,
      difficulty: ctx.difficulty,
      baseDifficulty: ctx.choice.difficulty,
      alertApplied: ctx.choice.applyAlert && ctx.alertDiff > 0,
      alertDiff: ctx.alertDiff,
      vitPenalty: ctx.vitPenalty,
      bonus: ctx.choice.bonus,
      penalty: ctx.choice.penalty,
      resultKey,
      resultLabel: res.label,
      resultCss: res.css,
      blurb: res.blurb,
      suggested,
      isBotch: true,
      botchDie: die,
      isGM: game.user.isGM
    });

    return this._post(actor, roll, content);
  },

  /* -------------------------------------------- */
  /*  Roll dialog                                 */
  /* -------------------------------------------- */

  async _prompt({ cfg, vitPenalty, alertValue, alertLimit, band, alertDiff }) {
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
      difficulties: HEISTY.difficulties
    });

    const data = await foundry.applications.api.DialogV2.input({
      window: { title: `${cfg.label} Check`, icon: "fa-solid fa-dice-d6" },
      classes: ["heisty-spideys", "heisty-roll-dialog"],
      position: { width: 400 },
      content,
      ok: { label: "Roll the Pool", icon: "fa-solid fa-dice" },
      rejectClose: false
    });
    if (!data) return null;

    return {
      difficulty: Math.max(1, Number(data.difficulty) || cfg.defaultDifficulty),
      bonus: Math.max(0, Number(data.bonus) || 0),
      penalty: Math.max(0, Number(data.penalty) || 0),
      applyAlert: !!data.applyAlert
    };
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

  /** Read each die face and flag Successes (4, 5, 6). */
  _readFaces(roll) {
    const die = roll.dice[0];
    return die.results.filter(r => r.active !== false).map(r => ({
      result: r.result,
      success: r.result >= 4
    }));
  },

  /** Classify a result against its Difficulty. */
  _classify(successes, difficulty) {
    if (successes <= 0) return "failure";
    if (successes >= difficulty * 2) return "critical";
    if (successes >= difficulty) return "success";
    return "partial";
  },

  /** The suggested Alert change for a result (the ST always has the final say). */
  _alertSuggestion(resultKey) {
    return HEISTY.results[resultKey]?.alert ?? 0;
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
    const apply = ChatMessage.applyRollMode ?? ChatMessage.applyMode;
    if (apply) apply.call(ChatMessage, msgData, this._currentRollMode());
    return ChatMessage.create(msgData);
  },

  _currentRollMode() {
    for (const key of ["rollMode", "messageMode"]) {
      try {
        const v = game.settings.get("core", key);
        if (v !== undefined && v !== null) return v;
      } catch (e) { /* not that key */ }
    }
    return "publicroll";
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
