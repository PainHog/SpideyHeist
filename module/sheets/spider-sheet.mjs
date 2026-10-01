/**
 * HEISTY SPIDEYS — Spider Character Sheet
 * ---------------------------------------
 * ApplicationV2 + HandlebarsApplicationMixin sheet for the player spider.
 * Click an Attribute or Skill to roll its pool; the Vitality ladder and Silk
 * pips are click-to-set. Species / Role / Perks / Flaws / Gadgets are embedded
 * items shown on the Kit tab.
 */

import { HEISTY } from "../config.mjs";
import { abilityRows, SILK_MENU, FREQ_LABELS } from "../logic/abilities.mjs";
import { itemAbilityKey } from "../logic/keys.mjs";
import { actorOps } from "../runtime/actor-ops.mjs";
import { abilityActions } from "../runtime/ability-actions.mjs";
import { AdvancementApp } from "../apps/advancement-app.mjs";

const renderTemplate = (path, data) => foundry.applications.handlebars.renderTemplate(path, data);

const KIND_LABELS = { species: "Species", signature: "Signature", perk: "Perk", flaw: "Flaw", unknown: "Text" };
const STATUS_LABELS = {
  active: { label: "Active", cls: "active" },
  waiting: { label: "Waiting Web", cls: "waiting" },
  out: { label: "Out", cls: "out" },
  escaped: { label: "Escaped", cls: "escaped" },
  benched: { label: "Benched", cls: "benched" }
};
const PHASE_LABELS = { idle: "Freeplay", score: "The Score", planning: "Planning", heist: "The Heist", escape: "The Escape", debrief: "Debrief" };

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const enrich = (html, doc) => {
  const TE = foundry.applications.ux.TextEditor;
  const impl = TE.implementation ?? TE;
  return impl.enrichHTML(html ?? "", { secrets: doc?.isOwner ?? false, relativeTo: doc });
};

export class SpiderSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    // The parchment/ink art is designed light-only: pin the light theme so v13+ dark
    // UI mode never flips core form colours underneath it.
    classes: ["heisty-spideys", "themed", "theme-light", "sheet", "actor", "spider"],
    position: { width: 760, height: 780 },
    window: { resizable: true, icon: "fa-solid fa-spider" },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      rollSkill: SpiderSheet.#onRollSkill,
      rollAttribute: SpiderSheet.#onRollAttribute,
      setVitality: SpiderSheet.#onSetVitality,
      silkAdjust: SpiderSheet.#onSilkAdjust,
      itemEdit: SpiderSheet.#onItemEdit,
      itemDelete: SpiderSheet.#onItemDelete,
      itemCreate: SpiderSheet.#onItemCreate,
      useAbility: SpiderSheet.#onUseAbility,
      setupAbility: SpiderSheet.#onSetupAbility,
      fireFlaw: SpiderSheet.#onFireFlaw,
      delayFlaw: SpiderSheet.#onDelayFlaw,
      resetAbility: SpiderSheet.#onResetAbility,
      spendSilk: SpiderSheet.#onSpendSilk,
      assist: SpiderSheet.#onAssist,
      advance: SpiderSheet.#onAdvance,
      removePending: SpiderSheet.#onRemovePending
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

    // Silk pips (earned Silk can go above the starting total — Ch 8)
    const silkMax = Math.max(sys.silk.max, sys.silk.value, 1);
    context.silkPips = Array.from({ length: silkMax }, (_, i) => ({ filled: i < sys.silk.value, extra: i >= sys.silk.max }));
    context.silkMenu = SILK_MENU.map(s => ({ ...s, affordable: sys.silk.value >= s.cost }));

    // Heist automation: status chip, queued bonuses, the Abilities panel.
    const clock = actorOps.clock();
    const heist = sys.heist ?? {};
    context.heistStatus = STATUS_LABELS[heist.status] ?? STATUS_LABELS.active;
    context.showHeistStatus = heist.status && heist.status !== "active";
    context.camouflaged = !!heist.camouflaged;
    context.replacement = !!heist.replacementOf;
    context.pending = actorOps.listPending(actor, clock).map(p => ({
      id: p.id,
      label: p.label || p.source || "Bonus",
      text: [p.dice ? `${p.dice > 0 ? "+" : ""}${p.dice} ${Math.abs(p.dice) === 1 ? "die" : "dice"}` : "",
        p.diff ? `Difficulty ${p.diff > 0 ? "+" : ""}${p.diff}` : "",
        p.skills?.length ? p.skills.map(k => HEISTY.skills[k]?.label ?? k).join("/") : "",
        p.jobOnly ? "job rolls" : "",
        p.expires === "round" ? "this round" : p.expires === "scene" ? "this scene" : "next roll"].filter(Boolean).join(" · ")
    }));
    context.isGM = game.user.isGM;
    context.canAdvance = actor.isOwner;
    context.speedNotes = (sys.speed.notes ?? []).join("; ");
    context.abilitiesHTML = await renderTemplate("systems/heisty-spideys/templates/actor/spider-abilities.hbs", this._abilitiesContext(clock));

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

  /** Rows for the Abilities panel (Kit tab). */
  _abilitiesContext(clock) {
    const actor = this.actor;
    const sys = actor.system;
    const entries = actor.items
      .filter(i => ["species", "role", "perk", "flaw"].includes(i.type))
      .map(i => ({ id: i.id, key: itemAbilityKey(i), name: i.name, usage: i.system.usage }))
      .filter(e => e.key);
    const owner = actor.isOwner;
    const rows = abilityRows(entries, clock, { silk: sys.silk.value, isGM: game.user.isGM }).map(r => ({
      ...r,
      kindLabel: KIND_LABELS[r.kind] ?? "",
      canUse: r.canUse && owner,
      showDelay: r.canDelay && owner && !game.user.isGM,
      canReset: game.user.isGM && r.used,
      useLabel: r.key === "species:crab" ? (sys.heist?.camouflaged ? "Move (end it)" : "Hold still") : "Use",
      setupValue: r.needsSetup ? (sys.heist?.[r.needsSetup] ?? "") : ""
    }));
    // Crab camouflage is a toggle: always clickable by the owner.
    for (const r of rows) if (r.key === "species:crab") r.canUse = owner;
    const phase = clock.phase ?? "idle";
    const clockLabel = clock.heistId && clock.heistId !== "freeplay"
      ? `${PHASE_LABELS[phase] ?? phase} · scene ${clock.sceneSerial} · round ${clock.round ?? clock.roundSerial}`
      : "Freeplay";
    return { rows, clockLabel, freqLabels: FREQ_LABELS };
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
    // Earned Silk can take you above your starting total (Ch 8), so only the
    // floor is clamped.
    const delta = Number(target.dataset.delta ?? 0);
    const next = Math.max(0, (this.actor.system.silk.value ?? 0) + delta);
    await this.actor.update({ "system.silk.value": next });
  }

  static async #onUseAbility(event, target) {
    await abilityActions.use(this.actor, target.dataset.key, { force: event.shiftKey && game.user.isGM });
  }
  static async #onSetupAbility(event, target) {
    await abilityActions.setup(this.actor, target.dataset.key);
  }
  static async #onFireFlaw(event, target) {
    await abilityActions.fireFlaw(this.actor, target.dataset.key);
  }
  static async #onDelayFlaw() {
    await abilityActions.delayFlaw(this.actor);
  }
  static async #onResetAbility(event, target) {
    if (!game.user.isGM) return;
    const item = this.actor.items.get(target.dataset.itemId ?? target.closest("[data-item-id]")?.dataset.itemId);
    await actorOps.resetUsage(item);
  }
  static async #onSpendSilk(event, target) {
    await abilityActions.spendSilkMenu(this.actor, target.dataset.key);
  }
  static async #onAssist() {
    await abilityActions.assist(this.actor);
  }
  static #onAdvance() {
    AdvancementApp.open(this.actor);
  }
  static async #onRemovePending(event, target) {
    const id = target.dataset.pendingId;
    const list = (this.actor.system.heist?.pending ?? []).filter(p => p.id !== id);
    await this.actor.update({ "system.heist.pending": list });
  }


  static #onItemEdit(event, target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    this.actor.items.get(id)?.sheet.render({ force: true });
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
    created[0]?.sheet.render({ force: true });
  }
}
