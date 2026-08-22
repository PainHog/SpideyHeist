/**
 * HEISTY SPIDEYS — Item Sheet
 * ---------------------------
 * One ApplicationV2 sheet for all five Item subtypes. The body template
 * branches on the item type; rich-text fields are enriched per type.
 */

import { HEISTY } from "../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

const enrich = (html, doc) => {
  const TE = foundry.applications.ux.TextEditor;
  const impl = TE.implementation ?? TE;
  return impl.enrichHTML(html ?? "", { secrets: doc?.isOwner ?? false, relativeTo: doc });
};

/** Which rich-text fields to enrich for each item type. */
const HTML_FIELDS = {
  species: ["abilityText", "blurb"],
  role: ["signatureText", "blurb"],
  perk: ["effect"],
  flaw: ["effect"],
  gadget: ["effect", "description"]
};

export class HeistyItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    classes: ["heisty-spideys", "sheet", "item"],
    position: { width: 560, height: 620 },
    window: { resizable: true, icon: "fa-solid fa-scroll" },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      editImage: HeistyItemSheet.#onEditImage
    }
  };

  static PARTS = {
    header: { template: "systems/heisty-spideys/templates/item/item-header.hbs" },
    body: { template: "systems/heisty-spideys/templates/item/item-body.hbs", scrollable: [""] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.item;

    context.item = item;
    context.system = item.system;
    context.editable = this.isEditable;
    context.typeLabel = HEISTY.itemTypes[item.type] ?? item.type;

    // Enrich the type's rich-text fields.
    context.enriched = {};
    for (const field of (HTML_FIELDS[item.type] ?? [])) {
      context.enriched[field] = await enrich(item.system[field], item);
    }

    // Selection lists for structured fields.
    context.attributeChoices = Object.entries(HEISTY.attributes).map(([k, a]) => ({ key: k, label: a.label }));
    context.skillChoices = Object.entries(HEISTY.skills).map(([k, s]) => ({ key: k, label: s.label }));
    context.roleChoices = Object.entries(HEISTY.roles).map(([k, r]) => ({ key: k, label: r.label }));
    context.speciesChoices = Object.entries(HEISTY.species).map(([k, s]) => ({ key: k, label: s.label }));

    return context;
  }

  static async #onEditImage(event, target) {
    const fp = new foundry.applications.apps.FilePicker.implementation({
      type: "image",
      current: this.item.img,
      callback: path => this.item.update({ img: path })
    });
    return fp.browse();
  }
}
