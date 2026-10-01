/**
 * HEISTY SPIDEYS — The Heist Tracker (design §3.6)
 * ------------------------------------------------
 * One window for the whole heist. The GM sees: the phase stepper and the Alert
 * mirror; the obstacle list (the unknown hidden from players until revealed);
 * the current obstacle with its approaches (Call for roll, Group check),
 * progress pips and passed chips, the round, the clock and the stall; the
 * creatures; the crew (Vitality, SP, acted, Flaw Fire, awards); Planning
 * (Casing intel, Preparations with their complications, Contingency); loot;
 * the heist's procedures; the log. Players (setting trackerForPlayers) see the
 * phase, the current obstacle and its visible approaches with "Roll this
 * approach", progress, the round, revealed intel, their crew panel with
 * "I acted", and the loot.
 *
 * Every number comes from the heist state; every button is one call into
 * `game.heistySpideys.heist` (module/heist/automation.mjs). Opens from the
 * scene-control tool, `game.heistySpideys.openTracker()`, or by dropping a
 * heist journal on it (which preselects that heist on the Start form).
 */

import { SYSTEM_ID, SETTINGS, FLAG } from "../contracts.mjs";
import { HEISTY } from "../config.mjs";
import * as flow from "../logic/heist-flow.mjs";
import { findHeist } from "../logic/heist-catalog.mjs";
import { creatureDef, creatureStatus, perRoundDelta, canCallExterminator } from "../logic/creatures.mjs";
import { store, heistApi } from "../heist/store.mjs";
import { HeistyAlert } from "../helpers/alert.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const TPL = "systems/heisty-spideys/templates/apps/tracker";

function setting(key, fallback) {
  try { return game.settings.get(SYSTEM_ID, key) ?? fallback; } catch (e) { return fallback; }
}

const PHASE_LABELS = { score: "Score", planning: "Planning", heist: "Heist", escape: "Escape", debrief: "Debrief" };
const STATUS_LABELS = { pending: "Ahead", active: "Now", cleared: "Cleared", stalled: "Stalled", skipped: "Skipped" };
const CREW_STATUS = { present: "On the board", waiting: "Waiting Web", out: "Out", escaped: "Escaped" };
const LOOT_STATUS = { inPlace: "In place", carried: "Carried", dropped: "Dropped", lost: "Lost", escaped: "Got out" };
const PREP_KINDS = [
  { value: "entry", label: "Entry square (free)" },
  { value: "silkLine", label: "Pre-placed Silk Line (−1 on that obstacle)" },
  { value: "stash", label: "Stash an item" },
  { value: "perk", label: "Perk-granted (free)" },
  { value: "contingency", label: "Contingency (Lookout, free)" },
  { value: "other", label: "Other" }
];

const skillLabel = k => HEISTY.skills[k]?.label ?? k;

export class HeistTracker extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(options = {}) {
    const pos = setting(SETTINGS.trackerPosition, null);
    if (pos && Number.isFinite(pos.left) && Number.isFinite(pos.top)) {
      options.position = { ...(options.position ?? {}), left: pos.left, top: pos.top, ...(pos.width ? { width: pos.width } : {}), ...(pos.height ? { height: pos.height } : {}) };
    }
    super(options);
    this.selectedHeist = null;
  }

  static DEFAULT_OPTIONS = {
    id: "heisty-heist-tracker",
    classes: ["heisty-spideys", "themed", "theme-light", "heisty-tracker"],
    tag: "div",
    window: { title: "Heist Tracker", icon: "fa-solid fa-route", resizable: true },
    position: { width: 760, height: 780 },
    actions: {
      startHeist: HeistTracker.#onStartHeist,
      phase: HeistTracker.#onPhase,
      startObstacle: HeistTracker.#onStartObstacle,
      nextObstacle: HeistTracker.#onNextObstacle,
      endRound: HeistTracker.#onEndRound,
      nudge: HeistTracker.#onNudge,
      groupCheck: HeistTracker.#onGroupCheck,
      callRoll: HeistTracker.#onCallRoll,
      rollApproach: HeistTracker.#onRollApproach,
      progress: HeistTracker.#onProgress,
      passActor: HeistTracker.#onPassActor,
      unpassActor: HeistTracker.#onUnpassActor,
      clearObstacle: HeistTracker.#onClearObstacle,
      unclearObstacle: HeistTracker.#onUnclearObstacle,
      obstacle: HeistTracker.#onObstacle,
      creature: HeistTracker.#onCreature,
      creatureRoll: HeistTracker.#onCreatureRoll,
      callExterminator: HeistTracker.#onCallExterminator,
      acted: HeistTracker.#onActed,
      fireFlaw: HeistTracker.#onFireFlaw,
      award: HeistTracker.#onAward,
      revealIntel: HeistTracker.#onRevealIntel,
      addPrep: HeistTracker.#onAddPrep,
      removePrep: HeistTracker.#onRemovePrep,
      loot: HeistTracker.#onLoot,
      addLoot: HeistTracker.#onAddLoot,
      removeEffect: HeistTracker.#onRemoveEffect,
      runProc: HeistTracker.#onRunProc,
      stall: HeistTracker.#onStall,
      awardDebrief: HeistTracker.#onAwardDebrief,
      endHeist: HeistTracker.#onEndHeist,
      openSheet: HeistTracker.#onOpenSheet,
      addObstacle: HeistTracker.#onAddObstacle,
      addApproach: HeistTracker.#onAddApproach,
      moveObstacle: HeistTracker.#onMoveObstacle,
      saveToJournal: HeistTracker.#onSaveToJournal,
      newScene: HeistTracker.#onNewScene
    }
  };

  static PARTS = {
    header: { template: `${TPL}/header.hbs` },
    obstacles: { template: `${TPL}/obstacles.hbs` },
    current: { template: `${TPL}/current.hbs` },
    creatures: { template: `${TPL}/creatures.hbs` },
    crew: { template: `${TPL}/crew.hbs` },
    planning: { template: `${TPL}/planning.hbs` },
    loot: { template: `${TPL}/loot.hbs` },
    log: { template: `${TPL}/log.hbs` }
  };

  /* ------------------------------------------------------------- context -- */

  async _prepareContext(options) {
    const base = (typeof super._prepareContext === "function") ? await super._prepareContext(options) : {};
    const s = store.state;
    const isGM = game.user.isGM;
    const playersMay = !!setting(SETTINGS.trackerForPlayers, true);
    const alert = HeistyAlert.value;
    const limit = HeistyAlert.limit;
    const band = HEISTY.getAlertState(alert, limit);
    const idle = s.phase === "idle";
    const inPlay = s.phase === "heist" || s.phase === "escape";
    const order = ["score", "planning", "heist", "escape", "debrief"];
    const phaseIdx = order.indexOf(s.phase);
    const actorName = id => game.actors.get(id)?.name ?? "?";
    const myActorIds = new Set((s.crew ?? []).map(c => c.actorId).filter(id => game.actors.get(id)?.isOwner));

    // Header.
    const phases = order.map((k, i) => ({ key: k, label: PHASE_LABELS[k], active: k === s.phase, done: phaseIdx > i }));
    const heistChoices = isGM && idle ? heistApi.heistChoices().map(h => ({ ...h, selected: h.value === this.selectedHeist })) : [];
    const selected = findHeist(this.selectedHeist) ?? null;
    const defaultCrew = new Set(isGM && idle ? heistApi.defaultCrew() : []);
    const crewChoices = isGM && idle ? game.actors.filter(a => a.type === "spider").map(a => ({ id: a.id, name: a.name, checked: defaultCrew.has(a.id), status: a.system?.heist?.status ?? "active" })) : [];
    const limits = Object.values(HEISTY.alertLimits).map(l => ({ value: l.value, label: `${l.label} (${l.value})`, selected: l.value === (selected?.limit ?? limit) }));

    // Obstacles.
    const visible = o => isGM || o.revealed || o.status !== "pending";
    const obstacles = (s.obstacles ?? []).filter(visible).map(o => {
      const pv = flow.progressView(s, o.id);
      return {
        id: o.id, name: o.unknown && !o.revealed && !isGM ? "???" : o.name, phase: o.phase, phaseLabel: o.phase === "escape" ? "Escape" : "Heist",
        status: o.status, statusLabel: STATUS_LABELS[o.status] ?? o.status, isCurrent: o.id === s.current, unknown: o.unknown, revealed: o.revealed,
        objective: o.objective, canStart: isGM && o.id !== s.current && o.status !== "cleared", canSkip: isGM && o.status === "pending",
        canUnskip: isGM && o.status === "skipped", canReveal: isGM && o.unknown && !o.revealed, pips: Array.from({ length: pv.need }, (_, i) => ({ filled: i < pv.have || pv.cleared }))
      };
    });

    // Current obstacle.
    const ob = flow.currentObstacle(s);
    let current = null;
    if (ob && (isGM || playersMay)) {
      const pv = flow.progressView(s, ob.id);
      const present = flow.presentCrew(s);
      current = {
        id: ob.id, name: ob.name, note: ob.note, phaseLabel: ob.phase === "escape" ? "Escape obstacle: one roll (or everyone through)" : "Heist obstacle: two successful rolls (or everyone through)",
        tags: (ob.tags ?? []).join(", "), human: ob.human ? `${ob.human} human` : "", silkLine: !!ob.silkLinePrepared, keyLock: !!ob.keyLock,
        approaches: (ob.approaches ?? []).map(a => ({
          id: a.id, label: `${(a.skills ?? []).map(skillLabel).join(" / ")}${a.opposed ? `, opposed (${a.opposed.roll}${a.opposed.pool ? ` ${a.opposed.pool}` : ""})` : ` (${a.difficulty})`}`,
          note: a.note ?? "", loud: a.alertOnUse > 0 ? `+${a.alertOnUse} Alert` : "", fight: !!a.fight, mode: a.mode === "individual" ? "each spider" : "one roll",
          excluded: (a.excludeRoles ?? []).length ? `not the ${(a.excludeRoles ?? []).join(", ")}` : "",
          crew: present.map(c => ({ id: c.actorId, name: actorName(c.actorId) }))
        })),
        need: pv.need, have: pv.have, cleared: pv.cleared, pips: Array.from({ length: pv.need }, (_, i) => ({ filled: i < pv.have || pv.cleared })),
        passed: present.map(c => ({ id: c.actorId, name: actorName(c.actorId), passed: pv.passedActors.includes(c.actorId), acted: (s.acted?.[String(s.roundSerial)] ?? []).includes(c.actorId) })),
        round: s.round,
        clockText: s.round >= 3 ? "The clock has rung (Mid-Heist Complication at round 3)." : `A Mid-Heist Complication when round 3 starts (${3 - s.round} to go).`,
        stallText: `Round ${s.round} of 5 before the Storyteller ends it.`,
        stallNow: s.round >= 5 && !pv.cleared,
        effects: (s.effects ?? []).map(e => ({ id: e.id, label: e.label ?? `${e.kind} ${e.value ?? ""}`, until: e.untilRoundSerial !== null && e.untilRoundSerial !== undefined ? `until round ${s.round + (Number(e.untilRoundSerial) - s.roundSerial)}` : "this scene" })),
        hasEffects: (s.effects ?? []).length > 0,
        myActors: [...myActorIds].map(id => ({ id, name: actorName(id) }))
      };
    }

    // Creatures.
    const creatures = (isGM ? (s.creatures ?? []) : []).map(c => {
      const def = creatureDef(c.key);
      const st = c.state ?? {};
      const status = creatureStatus(def, st, alert, band.atLimit);
      const cx = flow.creatureContext(s, c, { alert, fullAlert: band.atLimit });
      const chips = [];
      if (st.beaten) chips.push("beaten — out of the heist");
      else if (c.backupOf && !st.arrived) chips.push("backup: arrives at the next obstacle");
      else {
        chips.push(status.active ? "active" : "asleep / unaware");
        if (status.hunting) chips.push("hunting");
        if (st.aware) chips.push("aware");
        if (st.pursuit) chips.push("in pursuit");
        if (st.bad) chips.push("deal gone bad");
        if (st.paid) chips.push("paid off");
        if (st.shut) chips.push("shut in");
        if (st.holdsPost) chips.push("holds its post");
        if (st.drivenOffAt !== null && st.drivenOffAt !== undefined && st.drivenOffAt === s.obstacleSerial) chips.push("driven off here");
        if (st.suppressedUntilRound !== null && st.suppressedUntilRound !== undefined && Number(st.suppressedUntilRound) >= s.roundSerial) chips.push("distracted");
        if (st.onMap) chips.push("on the map");
        if (st.engaged) chips.push("engaged");
      }
      return {
        id: c.id, name: c.name, key: c.key, chips, here: cx.here, roams: status.roams,
        perRound: perRoundDelta(def, st, cx), canAttack: status.canAttack, attackLabel: def?.attack ? `${def.attack.label} ${def.attack.pool}` : "",
        perceptionLabel: def?.perception ? `${def.perception.label} ${def.perception.pool}` : "",
        isGuard: c.key === "guard-spider", isRat: c.key === "protection-rat", isVacuum: c.key === "vacuum", isExterminator: c.key === "the-exterminator",
        shutAvailable: c.key === "corn-snake" || c.key === "alert-parrot", active: status.active, engaged: !!st.engaged, paid: !!st.paid
      };
    });
    const exterminatorCallable = isGM && inPlay && canCallExterminator(alert, band.atLimit) && !(s.creatures ?? []).some(c => c.key === "the-exterminator");

    // Crew.
    const crew = (s.crew ?? []).filter(c => isGM || myActorIds.has(c.actorId) || playersMay).map(c => {
      const a = game.actors.get(c.actorId);
      const flaw = a?.items?.find(i => i.type === "flaw");
      return {
        actorId: c.actorId, name: a?.name ?? c.name ?? "?", img: a?.img ?? "icons/svg/mystery-man.svg",
        vitality: HEISTY.vitality[a?.system?.vitality?.state]?.label ?? "", silk: Number(a?.system?.silk?.value) || 0, silkMax: Number(a?.system?.silk?.max) || 0,
        status: CREW_STATUS[c.status] ?? c.status, isPresent: c.status === "present",
        acted: (s.acted?.[String(s.roundSerial)] ?? []).includes(c.actorId),
        mine: myActorIds.has(c.actorId), flaw: flaw?.name ?? "", replacement: !!c.replacementOf, caughtLast: !!c.caughtLastEscape,
        leader: s.escapeLeader === c.actorId
      };
    });

    // Planning.
    const intel = (s.intel?.list ?? []).filter(i => isGM || i.revealed).map(i => ({ id: i.id, text: i.text, revealed: i.revealed, unknown: i.unknown, obstacle: i.obstacle ?? "" }));
    const preps = Object.entries(s.preparations ?? {}).flatMap(([actorId, list]) => (list ?? []).map(p => ({
      ...p, actorId, actorName: actorName(actorId), kindLabel: PREP_KINDS.find(k => k.value === p.kind)?.label ?? p.kind,
      obstacleName: p.obstacleId ? (flow.getObstacle(s, p.obstacleId)?.name ?? p.obstacleId) : ""
    })));
    const casingRolled = (s.intel?.casingRolled ?? []).map(actorName);
    const prepActors = (s.crew ?? []).filter(c => isGM || myActorIds.has(c.actorId)).map(c => ({ id: c.actorId, name: actorName(c.actorId) }));
    const prepObstacles = (s.obstacles ?? []).filter(o => !o.unknown || isGM).map(o => ({ id: o.id, name: `${o.id}: ${o.name}` }));

    // Loot.
    const loot = (s.loot ?? []).map(l => ({
      id: l.id, name: l.name, tier: HEISTY.lootTiers[l.tier]?.label ?? l.tier, carry: HEISTY.lootTiers[l.tier]?.carry ?? "",
      carriers: (l.carriers ?? []).map(actorName).join(", "), status: LOOT_STATUS[l.status] ?? l.status, sled: !!l.sled,
      incomplete: !!l.incomplete, objective: !!l.objective, isTreasure: l.tier === "treasure", canPick: l.status !== "lost" && l.status !== "escaped"
    }));
    const lootActors = flow.presentCrew(s).map(c => ({ id: c.actorId, name: actorName(c.actorId) }));

    // Procedures and log.
    const heist = store.heist(s);
    const procedures = isGM ? (heist?.procedures ?? []).map(p => ({ id: p.id, name: p.name, text: p.text ?? "", when: (p.when ?? []).join(", "), fired: !!s.procedures?.[p.id]?.fired, last: (s.procedures?.[p.id]?.lastRoll ?? []).join(", ") })) : [];
    const log = (s.log ?? []).slice(-40).reverse().map(l => l.text);

    return {
      ...base,
      isGM, playersMay, showTracker: isGM || playersMay,
      heistName: s.name || "No heist running", idle, inPlay, phase: s.phase, phaseLabel: PHASE_LABELS[s.phase] ?? "Freeplay",
      phases, heistChoices, crewChoices, limits, selectedName: selected?.name ?? "",
      alert, limit, bandLabel: band.label, bandKey: band.key, atLimit: band.atLimit, pct: Math.min(100, Math.round(alert / Math.max(1, limit) * 100)),
      difficulty: HEISTY.alertLimits[s.difficulty]?.label ?? s.difficulty,
      objectiveTaken: !!s.objective?.taken, objectiveLost: !!s.objective?.lost, fullAlertAt: s.fullAlert?.atObstacle ?? null,
      obstacles, hasObstacles: obstacles.length > 0, current, hasCurrent: !!current,
      creatures, hasCreatures: creatures.length > 0, exterminatorCallable,
      crew, hasCrew: crew.length > 0, isEscape: s.phase === "escape",
      intel, hasIntel: intel.length > 0, preps, hasPreps: preps.length > 0, casingRolled: casingRolled.join(", "), prepKinds: PREP_KINDS,
      prepActors, prepObstacles, isPlanning: s.phase === "planning", contingency: s.contingency ? { ...s.contingency, actorName: actorName(s.contingency.actorId) } : null,
      loot, hasLoot: loot.length > 0, lootActors, lootTiers: Object.entries(HEISTY.lootTiers).map(([k, t]) => ({ value: k, label: t.label })),
      procedures, hasProcedures: procedures.length > 0,
      log, hasLog: log.length > 0,
      isDebrief: s.phase === "debrief", outcome: s.debrief?.outcome ?? null, awarded: !!s.debrief?.awarded,
      lastHeist: s.lastHeist ?? null,
      skills: Object.entries(HEISTY.skills).map(([k, v]) => ({ value: k, label: v.label })),
      difficultyRungs: [1, 2, 3, 4, 5],
      customized: !!s.customized
    };
  }

  /* -------------------------------------------------------------- render -- */

  _onRender(context, options) {
    super._onRender?.(context, options);
    const root = this.element;
    if (!root) return;
    root.querySelectorAll("textarea[data-prep-complication]").forEach(t => t.addEventListener("change", ev => {
      const el = ev.currentTarget;
      heistApi.setPrepComplication(el.dataset.actor, el.dataset.prep, el.value);
    }));
    root.querySelectorAll("select[data-escape-leader]").forEach(sel => sel.addEventListener("change", ev => heistApi.setEscapeLeader(ev.currentTarget.value)));
    root.querySelectorAll("select[name='heistKey']").forEach(sel => sel.addEventListener("change", ev => { this.selectedHeist = ev.currentTarget.value; this.render(); }));
    if (!this._dropWired) {
      this._dropWired = true;
      root.addEventListener("dragover", ev => ev.preventDefault());
      root.addEventListener("drop", ev => this.#onDrop(ev));
    }
  }

  async #onDrop(event) {
    event.preventDefault();
    let data = null;
    try {
      const TE = foundry.applications?.ux?.TextEditor?.implementation ?? globalThis.TextEditor;
      data = TE.getDragEventData(event);
    } catch (e) { return; }
    if (data?.type !== "JournalEntry" && data?.type !== "JournalEntryPage") return;
    const doc = await fromUuid(data.uuid);
    const journal = doc?.documentName === "JournalEntryPage" ? doc.parent : doc;
    if (!journal) return;
    const flag = journal.getFlag?.(FLAG, "heist");
    const heist = (flag && typeof flag === "object" && flag.obstacles) ? flag : (findHeist(flag) ?? findHeist(journal.name));
    if (!heist) return ui.notifications?.warn(`${journal.name} isn't a heist the tracker knows.`);
    this.selectedHeist = heist.key && findHeist(heist.key) ? heist.key : `journal:${journal.uuid}`;
    this.render();
  }

  async _onClose(options) {
    try {
      const { left, top, width, height } = this.position ?? {};
      await game.settings.set(SYSTEM_ID, SETTINGS.trackerPosition, { left, top, width, height });
    } catch (e) { /* client setting missing */ }
    return super._onClose?.(options);
  }

  /* ------------------------------------------------------------- actions -- */

  static async #onStartHeist() {
    const root = this.element;
    const sel = root.querySelector("select[name='heistKey']")?.value ?? this.selectedHeist;
    const crewIds = [...root.querySelectorAll("input[name='crew']:checked")].map(i => i.value);
    const limit = Number(root.querySelector("select[name='limit']")?.value) || null;
    const isJournal = String(sel ?? "").startsWith("journal:");
    await heistApi.startHeist({ heistKey: isJournal ? null : sel, journalUuid: isJournal ? sel.slice(8) : null, crewIds, limit });
    this.selectedHeist = null;
  }

  static async #onPhase(event, target) { await heistApi.setPhase(target.dataset.phase); }
  static async #onStartObstacle(event, target) { await heistApi.nextObstacle(target.dataset.id); }
  static async #onNextObstacle() { await heistApi.nextObstacle(); }
  static async #onEndRound() { await heistApi.endRound(); }
  static async #onNudge() { await heistApi.nudge(); }
  static async #onGroupCheck(event, target) { await heistApi.groupCheck(target.dataset.approach); }

  static async #onCallRoll(event, target) {
    const sel = this.element.querySelector(`select[data-call-actor='${target.dataset.approach}']`);
    if (!sel?.value) return ui.notifications?.warn("Pick a spider.");
    await heistApi.callForRoll(target.dataset.approach, sel.value);
  }

  static async #onRollApproach(event, target) {
    const s = store.state;
    const ob = flow.currentObstacle(s);
    const a = (ob?.approaches ?? []).find(x => x.id === target.dataset.approach);
    const mine = (s.crew ?? []).map(c => game.actors.get(c.actorId)).filter(x => x?.isOwner && !game.user.isGM);
    const sel = this.element.querySelector("select[name='myActor']");
    const actor = (sel?.value && game.actors.get(sel.value)) || mine[0];
    if (!actor || !a) return ui.notifications?.warn("Pick your spider.");
    const g = Object.entries(s.groups ?? {}).find(([, x]) => !x.closed && x.obstacleId === ob.id && (x.expected ?? []).includes(actor.id) && !x.rolls?.[actor.id]);
    const opts = { approachId: a.id };
    if (g) opts.groupId = g[0];
    const dice = game.heistySpideys?.dice;
    if (typeof dice?.rollCheck === "function") return dice.rollCheck(actor, a.skills[0], opts);
    ui.notifications?.info(`Roll ${skillLabel(a.skills[0])} from ${actor.name}'s sheet.`);
  }

  static async #onProgress(event, target) { await heistApi.adjustProgress({ manual: Number(target.dataset.delta) || 0 }); }
  static async #onPassActor(event, target) { await heistApi.adjustProgress({ passActor: target.dataset.actor }); }
  static async #onUnpassActor(event, target) { await heistApi.adjustProgress({ unpassActor: target.dataset.actor }); }
  static async #onClearObstacle() { await heistApi.adjustProgress({ cleared: true }); }
  static async #onUnclearObstacle() { await heistApi.adjustProgress({ cleared: false }); }
  static async #onObstacle(event, target) { await heistApi.obstacleAction(target.dataset.id, target.dataset.op); }
  static async #onCreature(event, target) { await heistApi.creatureAction(target.dataset.id, target.dataset.op); }
  static async #onCreatureRoll(event, target) { await heistApi.creatureRoll(target.dataset.id, target.dataset.which); }
  static async #onCallExterminator() { await heistApi.callExterminator(); }
  static async #onActed(event, target) { await heistApi.markActed(target.dataset.actor); }
  static async #onFireFlaw(event, target) { await heistApi.fireFlaw(target.dataset.actor); }
  static async #onAward(event, target) { await heistApi.awardSilk(target.dataset.actor, Number(target.dataset.sp) || 1, target.dataset.reason ?? "award"); }
  static async #onRevealIntel(event, target) { await heistApi.revealIntel([target.dataset.id]); }

  static async #onAddPrep() {
    const root = this.element;
    const actorId = root.querySelector("select[name='prepActor']")?.value;
    const kind = root.querySelector("select[name='prepKind']")?.value ?? "other";
    const obstacleId = root.querySelector("select[name='prepObstacle']")?.value || null;
    const text = root.querySelector("input[name='prepText']")?.value ?? "";
    if (!actorId) return;
    await heistApi.addPreparation(actorId, { kind, obstacleId: kind === "silkLine" ? obstacleId : null, text, trigger: kind === "contingency" ? text : undefined });
  }

  static async #onRemovePrep(event, target) { await heistApi.removePreparation(target.dataset.actor, target.dataset.prep); }

  static async #onLoot(event, target) {
    const op = target.dataset.op;
    const sel = this.element.querySelector(`select[data-loot-actor='${target.dataset.loot}']`);
    const actorId = sel?.value || null;
    const value = target.dataset.value === undefined ? true : target.dataset.value === "true";
    await heistApi.lootAction(target.dataset.loot, op, { actorId, value });
  }

  static async #onAddLoot() {
    const root = this.element;
    const name = root.querySelector("input[name='lootName']")?.value || "Loot";
    const tier = root.querySelector("select[name='lootTier']")?.value || "trinket";
    await heistApi.addLoot({ name, tier });
  }

  static async #onRemoveEffect(event, target) { await heistApi.removeEffect(target.dataset.id); }
  static async #onRunProc(event, target) { await heistApi.runProcedure(target.dataset.proc); }
  static async #onStall() { await heistApi.applyStall(); }
  static async #onAwardDebrief() {
    const outcome = this.element.querySelector("select[name='debriefOutcome']")?.value ?? null;
    await heistApi.awardDebrief(outcome);
  }
  static async #onEndHeist() {
    const ok = await foundry.applications.api.DialogV2.confirm({ window: { title: "End the heist" }, content: "<p>Close this heist without the Debrief? (No AP are awarded.)</p>", rejectClose: false }).catch(() => false);
    if (ok) await heistApi.setPhase("idle");
  }
  static async #onAddObstacle() {
    const root = this.element;
    const name = root.querySelector("input[name='obName']")?.value || "New obstacle";
    const phase = root.querySelector("select[name='obPhase']")?.value || "heist";
    const skill = root.querySelector("select[name='obSkill']")?.value || "stealth";
    const difficulty = Number(root.querySelector("select[name='obDiff']")?.value) || 3;
    const mode = root.querySelector("select[name='obMode']")?.value || "individual";
    await heistApi.addObstacle({ name, phase, skill, difficulty, mode });
  }
  static async #onAddApproach() {
    const root = this.element;
    const skill = root.querySelector("select[name='apSkill']")?.value || "stealth";
    const difficulty = Number(root.querySelector("select[name='apDiff']")?.value) || 3;
    const mode = root.querySelector("select[name='apMode']")?.value || "single";
    await heistApi.addObstacle({ obstacleId: store.state.current, skill, difficulty, mode });
  }
  static async #onMoveObstacle(event, target) { await heistApi.moveObstacle(target.dataset.id, Number(target.dataset.dir) || -1); }
  static async #onSaveToJournal() { await heistApi.saveToJournal(); }
  static async #onOpenSheet(event, target) { game.actors.get(target.dataset.actor)?.sheet?.render({ force: true }); }
  static async #onNewScene() { await heistApi.newScene(); }
}
