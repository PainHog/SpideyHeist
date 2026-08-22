/**
 * HEISTY SPIDEYS — Spider Character Sheet
 * ---------------------------------------
 * ApplicationV2 + HandlebarsApplicationMixin sheet for the player spider.
 * Click an Attribute or Skill to roll its pool; the Vitality ladder and Silk
 * pips are click-to-set. Species / Role / Perks / Flaws / Gadgets are embedded
 * items shown on the Kit tab.
 */

import { HEISTY } from "../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const enrich = (html, doc) => {
  const TE = foundry.applications.ux.TextEditor;
  const impl = TE.implementation ?? TE;
  return impl.enrichHTML(html ?? "", { secrets: doc?.isOwner ?? false, relativeTo: doc });
};

export class SpiderSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["heisty-spideys", "sheet", "actor", "spider"],
    position: { width: 760, height: 780 },
    window: { resizable: true, icon: "fa-solid fa-spider" },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      rollSkill: SpiderSheet.#onRollSkill,
      rollAttribute: SpiderSheet.#onRollAttribute,
      setVitality: SpiderSheet.#onSetVitality,
      silkAdjust: SpiderSheet.#onSilkAdjust,
      editImage: SpiderSheet.#onEditImage,
      itemEdit: SpiderSheet.#onItemEdit,
      itemDelete: SpiderSheet.#onItemDelete,
      itemCreate: SpiderSheet.#onItemCreate
    }
  };

  static PARTS = {
    header: { template: "systems/heisty-spideys/templates/actor/spider-header.hbs" },
    tabs: { template: "systems/heisty-spideys/templates/actor/spider-tabs.hbs" },
    main: { template: "systems/heisty-spideys/templates/actor/spider-main.hbs", scrollable: [""] },
    kit: { template: "systems/heisty-spideys/templates/actor/spider-kit.hbs", scrollable: [""] },
    bio: { template: "systems/heisty-spideys/templates/actor/spider-bio.hbs", scrollable: [""] }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: "main", icon: "fa-solid fa-dice-d6", label: "HEISTY.Tab.Main" },
        { id: "kit", icon: "fa-solid fa-toolbox", label: "HEISTY.Tab.Kit" },
        { id: "bio", icon: "fa-solid fa-book", label: "HEISTY.Tab.Bio" }
      ],
      initial: "main"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.actor;
    const sys = actor.system;

    context.actor = actor;
    context.system = sys;
    context.editable = this.isEditable;
    context.tabs = this._prepareTabs("primary");

    // Attributes
    context.attributes = Object.entries(HEISTY.attributes).map(([key, a]) => ({
      key, label: a.label, abbr: a.abbr, hint: a.hint,
      value: sys.attributes[key].value
    }));

    // Skills grouped by governing Attribute, with the current pool shown.
    context.skillGroups = Object.entries(HEISTY.skillsByAttribute).map(([attr, keys]) => ({
      attr, abbr: HEISTY.attributes[attr].abbr, label: HEISTY.attributes[attr].label,
      skills: keys.map(k => ({
        key: k, label: HEISTY.skills[k].label, hint: HEISTY.skills[k].hint,
        value: sys.skills[k].value,
        pool: sys.attributes[attr].value + sys.skills[k].value
      }))
    }));

    // Vitality ladder
    context.vitality = HEISTY.vitalityOrder.map(key => ({
      key, ...HEISTY.vitality[key],
      selected: sys.vitality.state === key
    }));
    context.vitalityState = HEISTY.vitality[sys.vitality.state] ?? HEISTY.vitality.unharmed;

    // Silk pips
    const silkMax = Math.max(sys.silk.max, sys.silk.value, 1);
    context.silkPips = Array.from({ length: silkMax }, (_, i) => ({ filled: i < sys.silk.value }));

    // Embedded kit
    const species = actor.species;
    const role = actor.role;
    context.species = species ? {
      name: species.name, img: species.img, ability: species.system.ability, id: species.id,
      speed: species.system.speed, bonusSummary: species.system.bonusSummary,
      abilityText: await enrich(species.system.abilityText, species)
    } : null;
    context.role = role ? {
      name: role.name, img: role.img, signature: role.system.signature, id: role.id,
      signatureText: await enrich(role.system.signatureText, role)
    } : null;
    context.perks = actor.perks.map(p => ({ id: p.id, name: p.name, img: p.img, effect: p.system.effect }));
    context.flaws = actor.flaws.map(f => ({ id: f.id, name: f.name, img: f.img, effect: f.system.effect }));
    context.gadgets = actor.gadgets.map(g => ({
      id: g.id, name: g.name, img: g.img, uses: g.system.uses,
      consumable: g.system.consumable, effect: g.system.effect, description: g.system.description
    }));

    // Biography tab (enriched rich text)
    context.enrichedBio = await enrich(sys.biography, actor);
    context.enrichedNotes = await enrich(sys.details.notes, actor);
    context.enrichedWaitingWeb = await enrich(sys.details.waitingWeb, actor);

    return context;
  }

  /* -------------------------------------------- */
  /*  Actions                                     */
  /* -------------------------------------------- */

  static #onRollSkill(event, target) {
    this.actor.rollSkill(target.dataset.skill, { fast: event.shiftKey });
  }
  static #onRollAttribute(event, target) {
    this.actor.rollAttribute(target.dataset.attr, { fast: event.shiftKey });
  }
  static async #onSetVitality(event, target) {
    await this.actor.update({ "system.vitality.state": target.dataset.state });
  }
  static async #onSilkAdjust(event, target) {
    const delta = Number(target.dataset.delta ?? 0);
    const next = Math.max(0, (this.actor.system.silk.value ?? 0) + delta);
    await this.actor.update({ "system.silk.value": next });
  }

  static async #onEditImage(event, target) {
    const current = this.actor.img;
    const fp = new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      current,
      callback: path => this.actor.update({ img: path })
    });
    return fp.browse();
  }

  static #onItemEdit(event, target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    this.actor.items.get(id)?.sheet.render(true);
  }
  static async #onItemDelete(event, target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(id);
    if (!item) return;
    const esc = foundry.utils.escapeHTML ?? (s => String(s));
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Remove Item" },
      content: `<p>Remove <strong>${esc(item.name)}</strong> from ${esc(this.actor.name)}?</p>`,
      rejectClose: false
    });
    if (ok) await item.delete();
  }
  static async #onItemCreate(event, target) {
    const type = target.dataset.type ?? "gadget";
    const created = await this.actor.createEmbeddedDocuments("Item", [{
      name: `New ${HEISTY.itemTypes[type] ?? "Item"}`, type
    }]);
    created[0]?.sheet.render(true);
  }
}
