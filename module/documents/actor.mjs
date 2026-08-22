/**
 * HEISTY SPIDEYS — Actor Document
 * -------------------------------
 * Thin extension of the core Actor: roll-data flattening for @-formulas and
 * convenience accessors for the embedded Species / Role / Perk / Flaw items.
 * The dice orchestration itself lives in helpers/dice.mjs.
 */

import { HeistyDice } from "../helpers/dice.mjs";

export class HeistyActor extends Actor {

  /** Flatten attributes and skills so formulas can use @body, @skills.stealth, etc. */
  getRollData() {
    const data = super.getRollData();
    if (this.type === "spider") {
      for (const [k, a] of Object.entries(this.system.attributes ?? {})) data[k] = a.value;
      data.skills = {};
      for (const [k, s] of Object.entries(this.system.skills ?? {})) data.skills[k] = s.value;
      data.silk = this.system.silk?.value ?? 0;
      data.vit = this.system.vitality?.penalty ?? 0;
    }
    return data;
  }

  /* -------------------------------------------- */
  /*  Embedded-item accessors                     */
  /* -------------------------------------------- */

  /** The spider's Species item, if one has been assigned. */
  get species() { return this.items.find(i => i.type === "species") ?? null; }

  /** The spider's Crew Role item, if one has been assigned. */
  get role() { return this.items.find(i => i.type === "role") ?? null; }

  /** All Perk items on the spider. */
  get perks() { return this.items.filter(i => i.type === "perk"); }

  /** All Flaw items on the spider. */
  get flaws() { return this.items.filter(i => i.type === "flaw"); }

  /** All Silk / Gadget / Found-Material items on the spider. */
  get gadgets() { return this.items.filter(i => i.type === "gadget"); }

  /* -------------------------------------------- */
  /*  Roll shortcuts                              */
  /* -------------------------------------------- */

  /** Roll a Skill check (Attribute + Skill). */
  async rollSkill(skillKey, options = {}) {
    return HeistyDice.skillCheck(this, skillKey, options);
  }

  /** Roll an Attribute check (Attribute alone — the Improvise path). */
  async rollAttribute(attrKey, options = {}) {
    return HeistyDice.attributeCheck(this, attrKey, options);
  }

  /** Roll one of a Threat's listed action pools. */
  async rollThreat(index, options = {}) {
    return HeistyDice.threatRoll(this, index, options);
  }
}
