/**
 * HEISTY SPIDEYS — Item Document
 * ------------------------------
 * Thin extension of the core Item. Roll data inherits the owning actor's data
 * so item-scoped formulas resolve against the spider carrying them.
 */

export class HeistyItem extends Item {

  /** Roll data: the item's own system data layered over its owner's. */
  getRollData() {
    const own = { ...this.system };
    if (!this.actor) return own;
    return { ...this.actor.getRollData(), item: own };
  }
}
