/**
 * HEISTY SPIDEYS — Item Document
 * ------------------------------
 * Thin extension of the core Item. Roll data inherits the owning actor's data
 * so item-scoped formulas resolve against the spider carrying them. Ability
 * items (Species, Role, Perk, Flaw) expose their ABILITIES key and definition.
 */

import { itemAbilityKey, slugKey } from "../logic/keys.mjs";
import { getAbility } from "../logic/abilities.mjs";

export class HeistyItem extends Item {

  /** Roll data: the item's own system data layered over its owner's. */
  getRollData() {
    const own = { ...this.system };
    if (!this.actor) return own;
    return { ...this.actor.getRollData(), item: own };
  }

  /** The ABILITIES key this item resolves to ("" for gadgets). */
  get abilityKey() { return itemAbilityKey(this); }

  /** The ABILITIES definition for this item, or null. */
  get ability() { return getAbility(this.abilityKey); }

  /** New Perks and Flaws get a stable key from their name (if they have none). */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;
    if ((this.type === "perk" || this.type === "flaw") && !this.system?.key) {
      const key = slugKey(this.name);
      if (key) this.updateSource({ "system.key": key });
    }
  }
}
