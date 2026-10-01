/**
 * HEISTY SPIDEYS — Actor Data Models
 * ----------------------------------
 * TypeDataModel schemas for the two Actor subtypes: the player Spider and the
 * Storyteller's Threat. Registered on CONFIG.Actor.dataModels during `init`.
 */

import { HEISTY } from "../config.mjs";
import { startingSilk } from "../logic/rules.mjs";
import { itemAbilityKey } from "../logic/keys.mjs";
import { effectiveSpeed, deriveVitality } from "../logic/speed.mjs";

/** A player spider: four Attributes, twelve Skills, Speed, Silk, Vitality. */
export class SpiderData extends foundry.abstract.TypeDataModel {

  /**
   * Injected by the heist runtime (WP-C) at init: `(actor) => carry | null`,
   * where carry is a speed.carryRule result or `{tier, carriers, sled}`, and may
   * carry `carryingPassenger: true`. The default keeps the model testable.
   * @type {(actor: object) => object|null}
   */
  static carryLookup = () => null;

  static defineSchema() {
    const f = foundry.data.fields;

    const attribute = () => new f.SchemaField({
      value: new f.NumberField({ required: true, integer: true, min: 1, max: 5, initial: 1 })
    });

    const skillFields = {};
    for (const key of Object.keys(HEISTY.skills)) {
      skillFields[key] = new f.SchemaField({
        value: new f.NumberField({ required: true, integer: true, min: 0, max: 5, initial: 0 })
      });
    }

    return {
      attributes: new f.SchemaField({
        body: attribute(),
        wit: attribute(),
        nerve: attribute(),
        grace: attribute()
      }),
      skills: new f.SchemaField(skillFields),
      speed: new f.SchemaField({
        value: new f.NumberField({ required: true, integer: true, min: 0, initial: 5 })
      }),
      silk: new f.SchemaField({
        value: new f.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        max: new f.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      vitality: new f.SchemaField({
        state: new f.StringField({
          required: true, blank: false, initial: "unharmed", choices: HEISTY.vitalityOrder
        }),
        outCause: new f.StringField({ required: false, blank: true, initial: "" })
      }),
      // Heist automation (1.8.0). Every field has a default, so no migration is
      // needed for the shape (docs/AUTOMATION-DESIGN.md §6).
      heist: new f.SchemaField({
        status: new f.StringField({
          required: true, blank: false, initial: "active", choices: ["active", "waiting", "out", "escaped", "benched"]
        }),
        slot: new f.StringField({ required: false, blank: true, initial: "" }),
        replacementOf: new f.StringField({ required: false, blank: true, initial: "" }),
        recoveredSerial: new f.NumberField({ required: true, integer: true, initial: -1 }),
        camouflaged: new f.BooleanField({ initial: false }),
        methodActorTarget: new f.StringField({ required: false, blank: true, initial: "" }),
        longConIdentity: new f.StringField({ required: false, blank: true, initial: "" }),
        pending: new f.ArrayField(new f.SchemaField({
          id: new f.StringField({ required: true, blank: true, initial: "" }),
          dice: new f.NumberField({ required: true, integer: true, initial: 0 }),
          diff: new f.NumberField({ required: true, integer: true, initial: 0 }),
          capped: new f.BooleanField({ initial: true }),
          skills: new f.ArrayField(new f.StringField({ required: true, blank: true })),
          jobOnly: new f.BooleanField({ initial: false }),
          expires: new f.StringField({ required: true, blank: false, initial: "nextRoll", choices: ["nextRoll", "round", "scene"] }),
          serial: new f.NumberField({ required: true, integer: true, initial: 0 }),
          label: new f.StringField({ required: false, blank: true, initial: "" }),
          source: new f.StringField({ required: false, blank: true, initial: "" })
        }))
      }),
      advancement: new f.SchemaField({
        value: new f.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        earned: new f.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),
      details: new f.SchemaField({
        pronouns: new f.StringField({ required: false, blank: true, initial: "" }),
        concept: new f.StringField({ required: false, blank: true, initial: "" }),
        waitingWeb: new f.HTMLField({ required: false, blank: true, initial: "" }),
        notes: new f.HTMLField({ required: false, blank: true, initial: "" })
      }),
      biography: new f.HTMLField({ required: false, blank: true, initial: "" })
    };
  }

  prepareDerivedData() {
    const items = this.parent?.items;
    // A worn Species item supplies Speed and the Attribute bonuses.
    const species = items?.find?.(i => i.type === "species");
    // Ability keys of every Perk / Flaw / Role / Species, for passive effects.
    const abilityKeys = [];
    for (const i of items ?? []) {
      const k = itemAbilityKey(i);
      if (k) abilityKeys.push(k);
    }
    this.abilityKeys = abilityKeys;

    // Starting Silk Points = WIT + NERVE + 1, counting only the points placed —
    // the species bonus doesn't count (rulebook v4.7: "Silk is practice, not
    // anatomy"). The stored Attributes include the bonus, so take it back off.
    // We never mutate the stored silk.value here — the +/- control clamps it on
    // write; recomputing stored, spendable state in derived data risks losing it.
    this.silk.max = startingSilk(
      { wit: this.attributes.wit.value, nerve: this.attributes.nerve.value },
      species?.system?.bonuses ?? {}
    );

    // Resolve the Vitality state into its mechanical effects. Unfazed ignores
    // the Rattled penalty.
    const v = deriveVitality(this.vitality.state, abilityKeys);
    this.vitality.penalty = v.penalty;
    this.vitality.halfSpeed = v.halfSpeed;
    this.vitality.assisted = v.assisted;
    this.vitality.out = v.out;
    this.vitality.label = v.label;
    this.vitality.order = v.order;
    this.vitality.unfazed = v.unfazed;

    // A worn Species item sets Speed; otherwise the stored value stands.
    const baseSpeed = (species?.system?.speed ?? this.speed.value) || 0;
    this.speed.base = baseSpeed;

    // Hurt halves Speed (round down); carrying loot or a Critical crewmate may
    // halve it too, but halvings don't stack. At Critical the spider can't move
    // on its own, so its own effective Speed is 0. The carry info comes from
    // the heist state through an injected lookup (default: not carrying).
    let carry = null;
    try { carry = SpiderData.carryLookup?.(this.parent) ?? null; } catch (err) { carry = null; }
    const sp = effectiveSpeed({ base: baseSpeed, vitalityKey: this.vitality.state, carry, perks: abilityKeys });
    this.speed.effective = sp.speed;
    this.speed.notes = sp.notes;
    this.speed.halved = sp.half;
    this.speed.carrying = !!carry;
  }
}

/** A Storyteller threat: the cat, the vacuum, the guard spider, the child. */
export class ThreatData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;
    return {
      threatLevel: new f.StringField({ required: false, blank: true, initial: "Standard" }),
      alertContribution: new f.StringField({ required: false, blank: true, initial: "" }),
      speed: new f.SchemaField({
        value: new f.NumberField({ required: true, integer: true, min: 0, initial: 6 })
      }),
      rolls: new f.ArrayField(new f.SchemaField({
        label: new f.StringField({ required: true, blank: true, initial: "" }),
        pool: new f.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        note: new f.StringField({ required: false, blank: true, initial: "" })
      })),
      senses: new f.HTMLField({ required: false, blank: true, initial: "" }),
      passive: new f.HTMLField({ required: false, blank: true, initial: "" }),
      escalation: new f.HTMLField({ required: false, blank: true, initial: "" }),
      weakness: new f.HTMLField({ required: false, blank: true, initial: "" }),
      notes: new f.HTMLField({ required: false, blank: true, initial: "" }),
      biography: new f.HTMLField({ required: false, blank: true, initial: "" }),
      // Heist automation overrides (1.8.0). null / blank = use the creature
      // table (CREATURE_AUTOMATION) by key.
      automation: new f.SchemaField({
        key: new f.StringField({ required: false, blank: true, initial: "" }),
        perRound: new f.NumberField({ required: false, nullable: true, integer: true, initial: null }),
        wakeAt: new f.NumberField({ required: false, nullable: true, integer: true, initial: null }),
        huntAt: new f.NumberField({ required: false, nullable: true, integer: true, initial: null }),
        roams: new f.StringField({ required: false, blank: true, initial: "" }),
        attackIndex: new f.NumberField({ required: false, nullable: true, integer: true, min: 0, initial: null }),
        humanRow: new f.StringField({ required: false, blank: true, initial: "" })
      })
    };
  }
}
