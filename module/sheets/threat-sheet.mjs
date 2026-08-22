/**
 * HEISTY SPIDEYS — Threat Sheet
 * -----------------------------
 * ApplicationV2 sheet for the Storyteller's threats (the cat, the vacuum, the
 * guard spider...). Lists the creature's action pools with one-click rolls and
 * holds its senses / passive / escalation / weakness notes.
 */

import { HEISTY } from "../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const enrich = (html, doc) => {
  const TE = foundry.applications.ux.TextEditor;
  const impl = TE.implementation ?? TE;
  return impl.enrichHTML(html ?? "", { secrets: doc?.isOwner ?? false, relativeTo: doc });
};

export class ThreatSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["heisty-spideys", "sheet", "actor", "threat"],
    position: { width: 620, height: 700 },
    window: { resizable: true, icon: "fa-solid fa-cat" },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      rollThreat: ThreatSheet.#onRollThreat,
      rollAdd: ThreatSheet.#onRollAdd,
      rollRemove: ThreatSheet.#onRollRemove,
      editImage: ThreatSheet.#onEditImage
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

  static #onRollThreat(event, target) {
    this.actor.rollThreat(Number(target.dataset.index));
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
  static async #onEditImage(event, target) {
    const fp = new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      current: this.actor.img,
      callback: path => this.actor.update({ img: path })
    });
    return fp.browse();
  }
}
