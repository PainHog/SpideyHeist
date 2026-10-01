/**
 * HEISTY SPIDEYS — Advancement (WP-A)
 * -----------------------------------
 * The sheet's Advance button. Spend AP per Chapter 11: 1 AP for +1 to a Skill,
 * 2 AP for +1 to an Attribute, 3 AP for a new Perk from your Role list. Caps
 * of 5 (Attributes include the species bonus). Unspent AP carry over; the
 * Silk maximum follows WIT and NERVE by itself.
 */

import { HEISTY } from "../config.mjs";
import { slugKey, roleKeyOf, itemAbilityKey } from "../logic/keys.mjs";
import { advanceOptions, applyAdvance, advanceReasonLabel } from "../logic/advancement.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class AdvancementApp extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(actor, options = {}) {
    super({ id: `heisty-advance-${actor.id}`, ...options });
    this.actor = actor;
    this._hook = null;
  }

  static DEFAULT_OPTIONS = {
    classes: ["heisty-spideys", "themed", "theme-light", "heisty-advancement"],
    window: { title: "Advance", icon: "fa-solid fa-trophy", resizable: true },
    position: { width: 560, height: 640 },
    actions: {
      buy: AdvancementApp.#onBuy
    }
  };

  static PARTS = {
    body: { template: "systems/heisty-spideys/templates/apps/advancement.hbs", scrollable: [".adv-body"] }
  };

  /** Open (or focus) the app for an actor. */
  static open(actor) {
    if (!actor?.isOwner) return ui.notifications?.warn("You can only advance your own spider.");
    const id = `heisty-advance-${actor.id}`;
    const app = foundry.applications.instances.get(id) ?? new AdvancementApp(actor);
    return app.render({ force: true });
  }

  get title() { return `Advance — ${this.actor.name}`; }

  /** The snapshot the pure advancement logic works on. */
  _snapshot() {
    const sys = this.actor.system;
    const role = this.actor.items.find(i => i.type === "role");
    const species = this.actor.items.find(i => i.type === "species");
    const roleKey = role ? roleKeyOf(role) : "";
    return {
      attributes: Object.fromEntries(Object.keys(HEISTY.attributes).map(k => [k, sys.attributes[k].value])),
      skills: Object.fromEntries(Object.keys(HEISTY.skills).map(k => [k, sys.skills[k].value])),
      speciesBonuses: species?.system?.bonuses ?? {},
      ap: sys.advancement.value,
      ownedPerkKeys: this.actor.items.filter(i => i.type === "perk").map(i => itemAbilityKey(i)),
      rolePerkKeys: (HEISTY.roles[roleKey]?.perks ?? []).map(slugKey),
      roleKey
    };
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const snap = this._snapshot();
    const opts = advanceOptions(snap);
    const perkNames = Object.fromEntries((HEISTY.roles[snap.roleKey]?.perks ?? []).map(n => [slugKey(n), n]));
    const decorate = o => ({ ...o, why: advanceReasonLabel(o.reason) });
    return Object.assign(context, {
      actor: this.actor,
      ap: snap.ap,
      earned: this.actor.system.advancement.earned,
      silkMax: this.actor.system.silk.max,
      skills: opts.filter(o => o.type === "skill").map(o => ({ ...decorate(o), label: HEISTY.skills[o.key].label, attr: HEISTY.attributes[HEISTY.skills[o.key].attr].abbr })),
      attributes: opts.filter(o => o.type === "attribute").map(o => ({ ...decorate(o), label: HEISTY.attributes[o.key].label, abbr: HEISTY.attributes[o.key].abbr })),
      perks: opts.filter(o => o.type === "perk").map(o => ({ ...decorate(o), label: perkNames[o.key] ?? o.key })),
      hasRole: !!snap.roleKey,
      roleLabel: HEISTY.roles[snap.roleKey]?.label ?? ""
    });
  }

  _onFirstRender(context, options) {
    super._onFirstRender?.(context, options);
    this._hook = Hooks.on("updateActor", actor => { if (actor.id === this.actor.id) this.render(); });
  }

  _onClose(options) {
    super._onClose?.(options);
    if (this._hook !== null) Hooks.off("updateActor", this._hook);
    this._hook = null;
  }

  /** Pull a Perk from the Perks compendium (or the world) by key. */
  async _findPerk(key) {
    const pack = game.packs.get(`${HEISTY.id}.perks`);
    if (pack) {
      const docs = await pack.getDocuments();
      const hit = docs.find(d => itemAbilityKey(d) === key);
      if (hit) return hit;
    }
    return game.items.find(i => i.type === "perk" && itemAbilityKey(i) === key) ?? null;
  }

  static async #onBuy(event, target) {
    const choice = { type: target.dataset.type, key: target.dataset.key };
    let result;
    try {
      result = applyAdvance(this._snapshot(), choice);
    } catch (err) {
      return ui.notifications?.warn(err.message);
    }
    if (result.addPerk) {
      const perk = await this._findPerk(result.addPerk);
      if (!perk) return ui.notifications?.error("That Perk isn't in the Perks compendium.");
      const data = perk.toObject();
      delete data._id;
      data.system = { ...data.system, key: result.addPerk };
      await this.actor.createEmbeddedDocuments("Item", [data]);
    }
    await this.actor.update(result.updates);
    const label = choice.type === "perk" ? `the Perk ${result.addPerk}` : `+1 ${choice.key}`;
    ui.notifications?.info(`${this.actor.name}: ${label} for ${result.apSpent} AP.`);
  }
}
