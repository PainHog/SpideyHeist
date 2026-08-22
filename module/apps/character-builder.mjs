/**
 * HEISTY SPIDEYS — The Character Builder
 * --------------------------------------
 * A guided, step-by-step wizard that walks the nine creation steps from the
 * book — Species, Role, Attributes, Skills, Perks, Flaw, Silk, Speed, Name —
 * enforces the point-buy rules with live counters, and exports a finished
 * spider Actor (with its Species/Role/Perk/Flaw items embedded) plus opens the
 * character sheet. Content is pulled live from the system compendiums.
 */

import { HEISTY } from "../config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** The book's 2d6 Spider Name table (Chapter 20). */
const NAME_TABLE = {
  2: "Gerald", 3: "Pebbles", 4: "Dusty", 5: "Crinkle", 6: "Jar Lid", 7: "The Architect",
  8: "Filament", 9: "Nook", 10: "Cassette", 11: "Widow", 12: "Eight"
};

export class CharacterBuilder extends HandlebarsApplicationMixin(ApplicationV2) {

  constructor(options = {}) {
    super(options);
    this.state = {
      speciesId: null,
      roleId: null,
      attributes: { body: 1, wit: 1, nerve: 1, grace: 1 },
      skills: Object.fromEntries(Object.keys(HEISTY.skills).map(k => [k, 0])),
      perkIds: [],
      flawId: null,
      name: "",
      pronouns: ""
    };
    this._loaded = false;
    this._species = [];
    this._roles = [];
    this._perks = [];
    this._flaws = [];
  }

  static DEFAULT_OPTIONS = {
    id: "heisty-character-builder",
    classes: ["heisty-spideys", "heisty-builder"],
    tag: "form",
    window: {
      title: "Build a Spider",
      icon: "fa-solid fa-spider",
      resizable: true
    },
    position: { width: 760, height: 720 },
    actions: {
      selectSpecies: CharacterBuilder.#onSelectSpecies,
      selectRole: CharacterBuilder.#onSelectRole,
      attrInc: CharacterBuilder.#onAttrInc,
      attrDec: CharacterBuilder.#onAttrDec,
      skillInc: CharacterBuilder.#onSkillInc,
      skillDec: CharacterBuilder.#onSkillDec,
      togglePerk: CharacterBuilder.#onTogglePerk,
      selectFlaw: CharacterBuilder.#onSelectFlaw,
      randomSpecies: CharacterBuilder.#onRandomSpecies,
      randomRole: CharacterBuilder.#onRandomRole,
      randomFlaw: CharacterBuilder.#onRandomFlaw,
      randomName: CharacterBuilder.#onRandomName,
      goStep: CharacterBuilder.#onGoStep,
      next: CharacterBuilder.#onNext,
      back: CharacterBuilder.#onBack,
      create: CharacterBuilder.#onCreate
    }
  };

  static PARTS = {
    steps: { template: "systems/heisty-spideys/templates/builder/steps.hbs" },
    species: { template: "systems/heisty-spideys/templates/builder/species.hbs", scrollable: [""] },
    role: { template: "systems/heisty-spideys/templates/builder/role.hbs", scrollable: [""] },
    attributes: { template: "systems/heisty-spideys/templates/builder/attributes.hbs", scrollable: [""] },
    skills: { template: "systems/heisty-spideys/templates/builder/skills.hbs", scrollable: [""] },
    perks: { template: "systems/heisty-spideys/templates/builder/perks.hbs", scrollable: [""] },
    flaw: { template: "systems/heisty-spideys/templates/builder/flaw.hbs", scrollable: [""] },
    finish: { template: "systems/heisty-spideys/templates/builder/finish.hbs", scrollable: [""] },
    footer: { template: "systems/heisty-spideys/templates/builder/footer.hbs" }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: "species", icon: "fa-solid fa-spider", label: "Species" },
        { id: "role", icon: "fa-solid fa-user-secret", label: "Role" },
        { id: "attributes", icon: "fa-solid fa-dumbbell", label: "Attributes" },
        { id: "skills", icon: "fa-solid fa-list-check", label: "Skills" },
        { id: "perks", icon: "fa-solid fa-star", label: "Perks" },
        { id: "flaw", icon: "fa-solid fa-heart-crack", label: "Flaw" },
        { id: "finish", icon: "fa-solid fa-flag-checkered", label: "Finish" }
      ],
      initial: "species"
    }
  };

  static #STEP_ORDER = ["species", "role", "attributes", "skills", "perks", "flaw", "finish"];

  /* -------------------------------------------- */
  /*  Data loading                                */
  /* -------------------------------------------- */

  async _loadPacks() {
    if (this._loaded) return;
    const get = async (name) => {
      const pack = game.packs.get(`heisty-spideys.${name}`);
      if (!pack) return [];
      const docs = await pack.getDocuments();
      return docs.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0) || a.name.localeCompare(b.name));
    };
    this._species = await get("species");
    this._roles = await get("roles");
    this._perks = await get("perks");
    this._flaws = await get("flaws");
    this._loaded = true;
  }

  /* -------------------------------------------- */
  /*  Derived build math                          */
  /* -------------------------------------------- */

  get speciesDoc() { return this._species.find(s => s.id === this.state.speciesId) ?? null; }
  get roleDoc() { return this._roles.find(r => r.id === this.state.roleId) ?? null; }

  /** Attribute bonuses granted by the chosen Species. */
  get speciesBonuses() {
    const b = this.speciesDoc?.system?.bonuses ?? {};
    return { body: b.body ?? 0, wit: b.wit ?? 0, nerve: b.nerve ?? 0, grace: b.grace ?? 0 };
  }

  /** Final attribute values (base + species bonus). */
  finalAttributes() {
    const bonus = this.speciesBonuses;
    const out = {};
    for (const k of Object.keys(this.state.attributes)) {
      out[k] = this.state.attributes[k] + (bonus[k] ?? 0);
    }
    return out;
  }

  /** Core skill keys of the chosen Role. */
  get coreSkills() {
    return this.roleDoc?.system?.coreSkills ?? [];
  }

  /** Point accounting for the Skills step. */
  skillBudget() {
    const core = this.coreSkills;
    const total = Object.values(this.state.skills).reduce((a, b) => a + b, 0);
    const coreSum = core.reduce((a, k) => a + (this.state.skills[k] ?? 0), 0);
    const roleBonusUsed = Math.min(3, coreSum);
    const generalSpent = total - roleBonusUsed;
    return { total, coreSum, roleBonusUsed, generalSpent, generalMax: 12, roleBonusMax: 3 };
  }

  /** Validate the whole build; returns { ok, issues[] }. */
  validate() {
    const issues = [];
    if (!this.speciesDoc) issues.push("Choose a Species.");
    if (!this.roleDoc) issues.push("Choose a Crew Role.");

    const attrSpent = Object.values(this.state.attributes).reduce((a, b) => a + b, 0);
    if (attrSpent !== 10) issues.push(`Spend all 10 Attribute points (currently ${attrSpent}/10).`);
    const finals = this.finalAttributes();
    for (const [k, v] of Object.entries(finals)) {
      if (v > 5) issues.push(`${HEISTY.attributes[k].abbr} exceeds 5 with the species bonus.`);
    }

    const sb = this.skillBudget();
    if (sb.generalSpent !== 12) issues.push(`Spend all 12 Skill points (currently ${sb.generalSpent}/12).`);
    if (this.roleDoc && sb.roleBonusUsed !== 3) {
      issues.push(`Place all 3 Role-bonus points on your core skills (currently ${sb.roleBonusUsed}/3).`);
    }

    if (this.state.perkIds.length !== 2) issues.push(`Choose exactly 2 Perks (currently ${this.state.perkIds.length}).`);
    if (!this.state.flawId) issues.push("Choose a Flaw.");
    if (!this.state.name.trim()) issues.push("Name your spider.");

    return { ok: issues.length === 0, issues };
  }

  /* -------------------------------------------- */
  /*  Render context                              */
  /* -------------------------------------------- */

  async _prepareContext(options) {
    await this._loadPacks();
    const context = await super._prepareContext(options);

    const current = this.tabGroups?.primary ?? "species";
    const bonus = this.speciesBonuses;
    const finals = this.finalAttributes();
    const attrSpent = Object.values(this.state.attributes).reduce((a, b) => a + b, 0);
    const sb = this.skillBudget();
    const validation = this.validate();

    context.tabs = this._prepareTabs("primary");
    context.currentStep = current;
    context.stepOrder = CharacterBuilder.#STEP_ORDER;
    context.stepIndex = CharacterBuilder.#STEP_ORDER.indexOf(current);
    context.isFirst = context.stepIndex <= 0;
    context.isLast = context.stepIndex >= CharacterBuilder.#STEP_ORDER.length - 1;

    context.state = this.state;
    context.species = this._species.map(s => ({
      id: s.id, name: s.name, img: s.img, system: s.system,
      selected: s.id === this.state.speciesId,
      bonusSummary: s.system.bonusSummary
    }));
    context.roles = this._roles.map(r => ({
      id: r.id, name: r.name, img: r.img, system: r.system,
      selected: r.id === this.state.roleId,
      coreLabels: (r.system.coreSkills ?? []).map(k => HEISTY.skills[k]?.label ?? k).join(" & ")
    }));

    // Attributes step
    context.attributes = Object.entries(HEISTY.attributes).map(([key, a]) => ({
      key, label: a.label, abbr: a.abbr, hint: a.hint,
      base: this.state.attributes[key],
      bonus: bonus[key] ?? 0,
      final: finals[key],
      atMax: (this.state.attributes[key] + (bonus[key] ?? 0)) >= 5,
      atMin: this.state.attributes[key] <= 1
    }));
    context.attrSpent = attrSpent;
    context.attrRemaining = 10 - attrSpent;

    // Skills step
    const core = this.coreSkills;
    context.skillGroups = Object.entries(HEISTY.skillsByAttribute).map(([attr, keys]) => ({
      attr, abbr: HEISTY.attributes[attr].abbr,
      skills: keys.map(k => ({
        key: k, label: HEISTY.skills[k].label, hint: HEISTY.skills[k].hint,
        value: this.state.skills[k],
        isCore: core.includes(k),
        atMax: this.state.skills[k] >= 3,
        atMin: this.state.skills[k] <= 0
      }))
    }));
    context.skillBudget = sb;

    // Perks step
    const roleKey = this.roleDoc?.system?.roleKey;
    context.rolePerks = this._perks
      .filter(p => !roleKey || p.system.role === roleKey)
      .map(p => ({
        id: p.id, name: p.name, effect: p.system.effect,
        selected: this.state.perkIds.includes(p.id),
        disabled: !this.state.perkIds.includes(p.id) && this.state.perkIds.length >= 2
      }));
    context.needsRole = !this.roleDoc;
    context.perkCount = this.state.perkIds.length;

    // Flaw step
    context.flaws = this._flaws
      .slice()
      .sort((a, b) => (a.system.rollValue ?? 0) - (b.system.rollValue ?? 0))
      .map(fl => ({
        id: fl.id, name: fl.name, effect: fl.system.effect,
        rollValue: fl.system.rollValue,
        selected: fl.id === this.state.flawId
      }));

    // Finish step
    context.summary = {
      species: this.speciesDoc?.name ?? "—",
      role: this.roleDoc?.name ?? "—",
      speed: this.speciesDoc?.system?.speed ?? 5,
      silk: (finals.wit ?? 0) + (finals.nerve ?? 0),
      attributes: Object.entries(HEISTY.attributes).map(([k, a]) => ({ abbr: a.abbr, value: finals[k] })),
      perks: this.state.perkIds.map(id => this._perks.find(p => p.id === id)?.name).filter(Boolean),
      flaw: this._flaws.find(fl => fl.id === this.state.flawId)?.name ?? "—"
    };
    context.validation = validation;

    return context;
  }

  _onRender(context, options) {
    const root = this.element;
    if (!root) return;
    // Capture free-text fields without forcing a re-render.
    const name = root.querySelector("input[name='spiderName']");
    if (name) name.addEventListener("change", ev => { this.state.name = ev.currentTarget.value; this.#refreshFooter(); });
    const pronouns = root.querySelector("input[name='spiderPronouns']");
    if (pronouns) pronouns.addEventListener("change", ev => { this.state.pronouns = ev.currentTarget.value; });
  }

  /** Lightweight refresh of just the footer's validity state after a text edit. */
  #refreshFooter() {
    const v = this.validate();
    const btn = this.element?.querySelector("[data-action='create']");
    if (btn) btn.disabled = !v.ok;
  }

  /* -------------------------------------------- */
  /*  Step navigation                             */
  /* -------------------------------------------- */

  /** Current step id. */
  #current() { return this.tabGroups?.primary ?? "species"; }

  /** Move to a step and re-render so the footer, chips, and active section all update. */
  #goto(step) {
    this.tabGroups ??= {};
    this.tabGroups.primary = step;
    this.render();
  }

  static #onGoStep(event, target) {
    this.#goto(target.dataset.step);
  }
  static #onNext() {
    const order = CharacterBuilder.#STEP_ORDER;
    const i = order.indexOf(this.#current());
    if (i < order.length - 1) this.#goto(order[i + 1]);
  }
  static #onBack() {
    const order = CharacterBuilder.#STEP_ORDER;
    const i = order.indexOf(this.#current());
    if (i > 0) this.#goto(order[i - 1]);
  }

  /* -------------------------------------------- */
  /*  Selection handlers                          */
  /* -------------------------------------------- */

  static #onSelectSpecies(event, target) {
    this.state.speciesId = target.dataset.id;
    this.#clampAttributes();
    this.render();
  }

  static #onSelectRole(event, target) {
    if (this.state.roleId !== target.dataset.id) this.state.perkIds = [];
    this.state.roleId = target.dataset.id;
    this.render();
  }

  /** Keep base attributes legal (final ≤ 5) after a species change. */
  #clampAttributes() {
    const bonus = this.speciesBonuses;
    for (const k of Object.keys(this.state.attributes)) {
      const maxBase = 5 - (bonus[k] ?? 0);
      if (this.state.attributes[k] > maxBase) this.state.attributes[k] = Math.max(1, maxBase);
    }
  }

  static #onAttrInc(event, target) {
    const key = target.dataset.attr;
    const bonus = this.speciesBonuses[key] ?? 0;
    const spent = Object.values(this.state.attributes).reduce((a, b) => a + b, 0);
    if (spent >= 10) return;
    if (this.state.attributes[key] + bonus >= 5) return;
    this.state.attributes[key] += 1;
    this.render();
  }
  static #onAttrDec(event, target) {
    const key = target.dataset.attr;
    if (this.state.attributes[key] <= 1) return;
    this.state.attributes[key] -= 1;
    this.render();
  }

  static #onSkillInc(event, target) {
    const key = target.dataset.skill;
    if (this.state.skills[key] >= 3) return;
    const sb = this.skillBudget();
    const isCore = this.coreSkills.includes(key);
    // Incrementing consumes role-bonus first for core skills; otherwise general.
    const willUseGeneral = !(isCore && sb.roleBonusUsed < 3);
    if (willUseGeneral && sb.generalSpent >= 12) return;
    this.state.skills[key] += 1;
    this.render();
  }
  static #onSkillDec(event, target) {
    const key = target.dataset.skill;
    if (this.state.skills[key] <= 0) return;
    this.state.skills[key] -= 1;
    this.render();
  }

  static #onTogglePerk(event, target) {
    const id = target.dataset.id;
    const i = this.state.perkIds.indexOf(id);
    if (i >= 0) this.state.perkIds.splice(i, 1);
    else if (this.state.perkIds.length < 2) this.state.perkIds.push(id);
    this.render();
  }

  static #onSelectFlaw(event, target) {
    this.state.flawId = this.state.flawId === target.dataset.id ? null : target.dataset.id;
    this.render();
  }

  /* -------------------------------------------- */
  /*  Random rollers (Chapter 20)                 */
  /* -------------------------------------------- */

  static #onRandomSpecies() {
    if (!this._species.length) return;
    this.state.speciesId = this._species[Math.floor(Math.random() * this._species.length)].id;
    this.#clampAttributes();
    this.render();
  }
  static #onRandomRole() {
    if (!this._roles.length) return;
    const pick = this._roles[Math.floor(Math.random() * this._roles.length)];
    if (this.state.roleId !== pick.id) this.state.perkIds = [];
    this.state.roleId = pick.id;
    this.render();
  }
  static #onRandomFlaw() {
    if (!this._flaws.length) return;
    this.state.flawId = this._flaws[Math.floor(Math.random() * this._flaws.length)].id;
    this.render();
  }
  static #onRandomName() {
    const roll = (1 + Math.floor(Math.random() * 6)) + (1 + Math.floor(Math.random() * 6));
    this.state.name = NAME_TABLE[roll] ?? "Gerald";
    const input = this.element?.querySelector("input[name='spiderName']");
    if (input) input.value = this.state.name;
    this.#refreshFooter();
  }

  /* -------------------------------------------- */
  /*  Create the spider                           */
  /* -------------------------------------------- */

  static async #onCreate() {
    const v = this.validate();
    if (!v.ok) {
      ui.notifications?.warn("The build isn't finished yet: " + v.issues[0]);
      return;
    }

    const finals = this.finalAttributes();
    const speciesDoc = this.speciesDoc;
    const roleDoc = this.roleDoc;

    const systemData = {
      attributes: {
        body: { value: finals.body },
        wit: { value: finals.wit },
        nerve: { value: finals.nerve },
        grace: { value: finals.grace }
      },
      skills: Object.fromEntries(Object.keys(HEISTY.skills).map(k => [k, { value: this.state.skills[k] }])),
      speed: { value: speciesDoc?.system?.speed ?? 5 },
      silk: { value: finals.wit + finals.nerve, max: finals.wit + finals.nerve },
      vitality: { state: "unharmed" },
      details: { pronouns: this.state.pronouns }
    };

    const embedded = [];
    for (const doc of [speciesDoc, roleDoc]) if (doc) embedded.push(doc.toObject());
    for (const id of this.state.perkIds) {
      const p = this._perks.find(x => x.id === id);
      if (p) embedded.push(p.toObject());
    }
    const flaw = this._flaws.find(x => x.id === this.state.flawId);
    if (flaw) embedded.push(flaw.toObject());

    let actor;
    try {
      actor = await Actor.create({
        name: this.state.name.trim(),
        type: "spider",
        img: speciesDoc?.img ?? "systems/heisty-spideys/assets/icons/spider.svg",
        system: systemData,
        items: embedded
      });
    } catch (err) {
      console.error("Heisty Spideys | Failed to create spider:", err);
      ui.notifications?.error("Something went wrong creating the spider — check the console.");
      return;
    }

    ui.notifications?.info(`${actor.name} has joined the crew.`);
    await this.close();
    actor.sheet?.render(true);
  }
}
