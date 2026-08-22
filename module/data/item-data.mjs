/**
 * HEISTY SPIDEYS — Item Data Models
 * ---------------------------------
 * TypeDataModel schemas for the five Item subtypes: Species, Role, Perk, Flaw,
 * and Gadget. Registered on CONFIG.Item.dataModels during `init`.
 */

/** A spider Species: passive ability, Attribute bonuses, and Speed. */
export class SpeciesData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;
    return {
      speciesKey: new f.StringField({ required: false, blank: true, initial: "" }),
      ability: new f.StringField({ required: false, blank: true, initial: "" }),
      abilityText: new f.HTMLField({ required: false, blank: true, initial: "" }),
      speed: new f.NumberField({ required: true, integer: true, min: 0, initial: 5 }),
      bonuses: new f.SchemaField({
        body: new f.NumberField({ required: true, integer: true, initial: 0 }),
        wit: new f.NumberField({ required: true, integer: true, initial: 0 }),
        nerve: new f.NumberField({ required: true, integer: true, initial: 0 }),
        grace: new f.NumberField({ required: true, integer: true, initial: 0 })
      }),
      blurb: new f.HTMLField({ required: false, blank: true, initial: "" })
    };
  }

  /** A short "+1 BODY, +2 WIT" style summary of the Attribute bonuses. */
  get bonusSummary() {
    const parts = [];
    for (const [k, v] of Object.entries(this.bonuses)) {
      if (v) parts.push(`+${v} ${k.toUpperCase()}`);
    }
    return parts.join(", ");
  }
}

/** A Crew Role: core skills, Role bonus points, and a Signature Move. */
export class RoleData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;
    return {
      roleKey: new f.StringField({ required: false, blank: true, initial: "" }),
      coreSkills: new f.ArrayField(new f.StringField({ required: true, blank: true })),
      roleBonus: new f.NumberField({ required: true, integer: true, min: 0, initial: 3 }),
      signature: new f.StringField({ required: false, blank: true, initial: "" }),
      signatureText: new f.HTMLField({ required: false, blank: true, initial: "" }),
      blurb: new f.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}

/** A Role Perk. `role` is the roleKey it belongs to. */
export class PerkData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;
    return {
      role: new f.StringField({ required: false, blank: true, initial: "" }),
      effect: new f.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}

/** A Flaw. `rollValue` is its slot on the 1d10 Flaw table. */
export class FlawData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;
    return {
      rollValue: new f.NumberField({ required: true, integer: true, min: 1, max: 10, initial: 1 }),
      effect: new f.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}

/** Silk, a Gadget, or a Found Material a spider is carrying. */
export class GadgetData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;
    return {
      effect: new f.HTMLField({ required: false, blank: true, initial: "" }),
      uses: new f.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      consumable: new f.BooleanField({ initial: true }),
      source: new f.StringField({ required: false, blank: true, initial: "" }),
      description: new f.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}
