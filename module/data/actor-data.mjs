/**
 * HEISTY SPIDEYS — Actor Data Models
 * ----------------------------------
 * TypeDataModel schemas for the two Actor subtypes: the player Spider and the
 * Storyteller's Threat. Registered on CONFIG.Actor.dataModels during `init`.
 */

import { HEISTY } from "../config.mjs";

/** A player spider: four Attributes, twelve Skills, Speed, Silk, Vitality. */
export class SpiderData extends foundry.abstract.TypeDataModel {
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
        })
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
    // Starting Silk Points = WIT + NERVE (using final Attribute values).
    this.silk.max = this.attributes.wit.value + this.attributes.nerve.value;

    // Resolve the Vitality state into its mechanical effects.
    const v = HEISTY.vitality[this.vitality.state] ?? HEISTY.vitality.unharmed;
    this.vitality.penalty = v.penalty;
    this.vitality.halfSpeed = v.halfSpeed;
    this.vitality.out = v.out;
    this.vitality.label = v.label;
    this.vitality.order = v.order;

    // Speed is halved (round down) while Hurt, Critical, or Out.
    this.speed.effective = v.halfSpeed ? Math.floor(this.speed.value / 2) : this.speed.value;
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
      biography: new f.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}
