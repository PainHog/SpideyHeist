/**
 * HEISTY SPIDEYS — Threat Sheet
 * -----------------------------
 * ApplicationV2 sheet for the Storyteller's threats (the cat, the vacuum, the
 * guard spider...). Lists the creature's action pools with one-click rolls and
 * holds its senses / passive / escalation / weakness notes.
 */

import { HEISTY } from "../config.mjs";
import { THREAT_KEYS, threatKeyFor } from "../helpers/migration.mjs";

/** WP-C's creature table, loaded lazily (the sheet works without it). */
let creaturesModule = null;
async function creatureTable() {
  if (creaturesModule === null) {
    try { creaturesModule = await import("../logic/creatures.mjs"); } catch (err) { creaturesModule = false; }
  }
  return creaturesModule || null;
}

const ROAMS = ["active", "hunting", "aware", "always", "earshot", "never", "route", "procedure"];
const HUMAN_ROWS = { sleeping: "Sleeping (2)", distracted: "Distracted (1)", alert: "Alert (4)", broom: "With broom (3)", lightsOn: "Lights on (2)" };

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const enrich = (html, doc) => {
  const TE = foundry.applications.ux.TextEditor;
  const impl = TE.implementation ?? TE;
  return impl.enrichHTML(html ?? "", { secrets: doc?.isOwner ?? false, relativeTo: doc });
};

export class ThreatSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["heisty-spideys", "themed", "theme-light", "sheet", "actor", "threat"],
    position: { width: 620, height: 700 },
    window: { resizable: true, icon: "fa-solid fa-cat" },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      rollThreat: ThreatSheet.#onRollThreat,
      rollAdd: ThreatSheet.#onRollAdd,
      rollRemove: ThreatSheet.#onRollRemove,
    }
  };

  static PARTS = {
    header: { template: "systems/heisty-spideys/templates/actor/threat-header.hbs" },
    body: { template: "systems/heisty-spideys/templates/actor/threat-body.hbs", scrollable: [""] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const sys = actor.system;

    context.actor = actor;
    context.system = sys;
    context.editable = this.isEditable;
    context.rolls = (sys.rolls ?? []).map((r, i) => ({ ...r, index: i }));
    context.automation = await this._automationContext();
    context.enriched = {
      senses: await enrich(sys.senses, actor),
      passive: await enrich(sys.passive, actor),
      escalation: await enrich(sys.escalation, actor),
      weakness: await enrich(sys.weakness, actor),
      notes: await enrich(sys.notes, actor),
      biography: await enrich(sys.biography, actor)
    };
    return context;
  }

  /** The automation override fields, with the creature table's defaults as hints. */
  async _automationContext() {
    const a = this.actor.system.automation ?? {};
    const mod = await creatureTable();
    const guessed = a.key || (mod?.resolveCreatureKey?.(this.actor.name) ?? threatKeyFor(this.actor.name));
    let def = null;
    try { def = guessed && mod?.creatureDef ? mod.creatureDef(guessed) : null; } catch (err) { def = null; }
    const hint = v => (v === null || v === undefined || v === "" ? "—" : String(v));
    return {
      key: a.key ?? "",
      guessed: guessed || "",
      keys: THREAT_KEYS.map(k => ({ key: k, selected: k === a.key })),
      perRound: a.perRound ?? "",
      wakeAt: a.wakeAt ?? "",
      huntAt: a.huntAt ?? "",
      attackIndex: a.attackIndex ?? "",
      roams: ROAMS.map(r => ({ key: r, selected: r === a.roams })),
      humanRows: Object.entries(HUMAN_ROWS).map(([k, label]) => ({ key: k, label, selected: k === a.humanRow })),
      defaults: {
        perRound: hint(def?.perRound), wakeAt: hint(def?.wakeAt), huntAt: hint(def?.huntAt),
        roams: hint(def?.roams), attackIndex: hint(def?.attack?.index)
      },
      hasTable: !!def
    };
  }

  /**
   * Roll a pool. With spider tokens targeted, a GM's click is an attack on them:
   * one attack card per target, each with its shrug-off (§3.8). Otherwise the
   * pool is just rolled (an opposed roll, a check).
   */
  static #onRollThreat(event, target) {
    const index = Number(target.dataset.index);
    const targets = game.user.isGM ? [...(game.user.targets ?? [])].map(t => t.actor).filter(a => a?.type === "spider") : [];
    const dice = game.heistySpideys?.dice;
    if (targets.length && typeof dice?.threatAttack === "function") return dice.threatAttack(this.actor, index, { targets });
    return this.actor.rollThreat(index);
  }
  static async #onRollAdd() {
    const rolls = foundry.utils.deepClone(this.actor.system.rolls ?? []);
    rolls.push({ label: "New Action", pool: 3, note: "" });
    await this.actor.update({ "system.rolls": rolls });
  }
  static async #onRollRemove(event, target) {
    const rolls = foundry.utils.deepClone(this.actor.system.rolls ?? []);
    rolls.splice(Number(target.dataset.index), 1);
    await this.actor.update({ "system.rolls": rolls });
  }
}
