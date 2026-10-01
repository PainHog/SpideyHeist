/**
 * HEISTY SPIDEYS — Waiting Web replacement dialog (WP-A)
 * ------------------------------------------------------
 * Shown on the player's client when their spider goes Out (the GM asks via the
 * `ui.promptReplacement` op). The player names the fresh spider (or rolls on
 * the Ch 20 name table) and may swap the species. No answer within the timeout
 * → the defaults stand, so the heist never waits on a dialog.
 */

import { HEISTY } from "../config.mjs";
import { speciesKeyOf } from "../logic/keys.mjs";
import { NAME_TABLE } from "./character-builder.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class ReplacementDialog extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(actor, { timeout = 60000, defaultName = "", resolve = null } = {}, options = {}) {
    super(options);
    this.actor = actor;
    this.timeout = timeout;
    this.state = { name: defaultName || "", speciesUuid: "" };
    this._resolve = resolve;
    this._timer = null;
    this._deadline = Date.now() + timeout;
    this._species = null;
  }

  static DEFAULT_OPTIONS = {
    classes: ["heisty-spideys", "themed", "theme-light", "heisty-replacement"],
    tag: "form",
    form: { handler: ReplacementDialog.#onSubmit, submitOnChange: false, closeOnSubmit: true },
    window: { title: "The Waiting Web", icon: "fa-solid fa-spider", resizable: false },
    position: { width: 460, height: "auto" },
    actions: {
      rollName: ReplacementDialog.#onRollName
    }
  };

  static PARTS = {
    body: { template: "systems/heisty-spideys/templates/apps/replacement.hbs" }
  };

  /**
   * Open the dialog and wait for the player's answer.
   * @returns {Promise<{name:string, speciesUuid:string|null}|null>} null if closed without answering.
   */
  static prompt(actor, { timeout = 60000, defaultName = "" } = {}) {
    return new Promise(resolve => {
      const app = new ReplacementDialog(actor, { timeout, defaultName, resolve });
      app.render({ force: true });
    });
  }

  get title() { return `The Waiting Web — ${this.actor?.name ?? "your spider"} is Out`; }

  async _loadSpecies() {
    if (this._species) return this._species;
    const out = [];
    const pack = game.packs.get(`${HEISTY.id}.species`);
    if (pack) {
      const docs = await pack.getDocuments();
      for (const d of docs) out.push({ uuid: d.uuid, name: d.name, key: speciesKeyOf(d), speed: d.system.speed, bonusSummary: d.system.bonusSummary, ability: d.system.ability });
    }
    for (const d of game.items.filter(i => i.type === "species")) {
      out.push({ uuid: d.uuid, name: d.name, key: speciesKeyOf(d), speed: d.system.speed, bonusSummary: d.system.bonusSummary, ability: d.system.ability });
    }
    this._species = out;
    return out;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const current = this.actor?.items?.find(i => i.type === "species");
    const currentKey = current ? speciesKeyOf(current) : "";
    const species = (await this._loadSpecies())
      .filter(s => s.key !== currentKey)
      .map(s => ({ ...s, selected: s.uuid === this.state.speciesUuid }));
    return Object.assign(context, {
      actor: this.actor,
      name: this.state.name,
      currentSpecies: current?.name ?? "No species",
      keepSelected: !this.state.speciesUuid,
      species,
      silkHalf: Math.floor((this.actor?.system?.silk?.max ?? 0) / 2),
      seconds: Math.max(0, Math.round((this._deadline - Date.now()) / 1000))
    });
  }

  _onFirstRender(context, options) {
    super._onFirstRender?.(context, options);
    this._timer = setTimeout(() => this._finish(this._defaults(), true), this.timeout);
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const input = this.element?.querySelector("input[name='name']");
    input?.addEventListener("input", ev => { this.state.name = ev.currentTarget.value; });
    this.element?.querySelectorAll("input[name='speciesUuid']").forEach(r =>
      r.addEventListener("change", ev => { this.state.speciesUuid = ev.currentTarget.value; }));
  }

  _defaults() {
    return { name: this.state.name || "", speciesUuid: null };
  }

  /** Resolve once (answer, timeout or close). */
  _finish(result, closeNow = false) {
    if (this._timer) { clearTimeout(this._timer); this._timer = null; }
    const resolve = this._resolve;
    this._resolve = null;
    resolve?.(result);
    if (closeNow && this.rendered) this.close();
  }

  _onClose(options) {
    super._onClose?.(options);
    // Closed without answering: the defaults stand.
    this._finish(null);
  }

  static #onRollName() {
    const r = (1 + Math.floor(Math.random() * 6)) + (1 + Math.floor(Math.random() * 6));
    this.state.name = NAME_TABLE[r] ?? "Gerald";
    const input = this.element?.querySelector("input[name='name']");
    if (input) input.value = this.state.name;
  }

  static async #onSubmit(event, form, formData) {
    const data = formData.object ?? {};
    this._finish({ name: String(data.name ?? this.state.name ?? "").trim(), speciesUuid: data.speciesUuid || null });
  }
}
