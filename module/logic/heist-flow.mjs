/**
 * HEISTY SPIDEYS — Heist flow (pure; design §2, §3.4, §3.5, §3.9, §3.13, §16)
 * ---------------------------------------------------------------------------
 * Every mutation of the heist state is a pure function here: (state, …) →
 * new state. The GM's store (module/heist/store.mjs) serializes them and writes
 * the world setting. Rules (rulebook v4.8):
 *
 *  - Phases: Score → Planning → Heist → Escape → Debrief. "A scene is one
 *    obstacle — heist or Escape. Planning is its own scene": sceneSerial rises
 *    on Planning and on every obstacle start (and on the Escape).
 *  - A heist obstacle is done after two successful rolls (Partial or better; a
 *    Critical counts as one), by one spider or several; a group check counts as
 *    both: done once every spider is through (a spider who fails tries again
 *    next round). An Escape obstacle takes one roll — or a group check with
 *    every spider through (N1).
 *  - The clock: when the crew STARTS round 3 at one obstacle, roll a Mid-Heist
 *    Complication (E14). After five rounds stuck, the ST ends it: in the heist
 *    the objective slips out of reach; in the Escape anyone still inside is caught.
 *  - Casing: one roll per spider; each Success reveals one detail, capped at
 *    what the ST holds, never the unknown obstacle.
 *  - Out: +2 Alert (a Curious Child's capture +3 instead, same event); loot the
 *    spider carried alone is lost; the replacement arrives at the next obstacle
 *    — or waits at the exit if it was the last Escape obstacle, and that player
 *    earns half AP (N13).
 *  - Debrief: full AP for the objective, half (rounded down) for a Partial,
 *    none for a Loss; AP to every spider of the slot (original and replacement).
 */

import { PHASES } from "../contracts.mjs";
import { HEISTY } from "../config.mjs";
import { AP_BY_DIFFICULTY, heistObstacles, proceduresFor } from "./heist-catalog.mjs";
import {
  CREATURE_AUTOMATION, creatureDef, newCreatureState, perRoundDelta, creatureStatus,
  driveOff, shutIn, payOff, beat, backupState, isEngaged
} from "./creatures.mjs";
import { clockDue as complicationClockDue } from "./complications.mjs";

export const LOG_MAX = 200;
export const PASS_RESULTS = Object.freeze(["partial", "success", "critical"]);
export const STALL_ROUNDS = 5;

const clone = v => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
const uniq = arr => [...new Set(arr ?? [])];
const num = v => Number(v) || 0;

/* ------------------------------------------------------------------ state -- */

/** A fresh (freeplay) heist state. */
export function newHeistState(opts = {}) {
  return {
    v: 1, heistId: opts.heistId ?? "freeplay", catalogKey: null, name: opts.name ?? "", journalUuid: null,
    difficulty: opts.difficulty ?? "standard", limit: Math.max(1, num(opts.limit) || 8),
    phase: "idle", sceneSerial: num(opts.sceneSerial), obstacleSerial: 0, roundSerial: num(opts.roundSerial), round: 0,
    obstacles: [], current: null, progress: {}, groups: {}, acted: {},
    crew: [], creatures: [], humans: [],
    effects: [], crewUsage: { damageControl: null, notPartOfThePlan: null },
    intel: { list: [], casingRolled: [] }, preparations: {}, contingency: null,
    loot: [], objective: { taken: false, lost: false }, fullAlert: { atObstacle: null, objectiveLostByIt: false },
    assists: [], flawSchedule: [], procedures: {}, pendingCaptures: {},
    alertLedger: opts.alertLedger ?? [], log: opts.log ?? [],
    debrief: { outcome: null, awarded: false, awards: [] }
  };
}

/** The heist clock (ability usage stamps compare against it). */
export function clock(state) {
  return {
    heistId: state?.heistId ?? "freeplay", phase: state?.phase ?? "idle",
    sceneSerial: num(state?.sceneSerial), obstacleSerial: num(state?.obstacleSerial),
    roundSerial: num(state?.roundSerial), round: num(state?.round)
  };
}

/** Append to the log (capped). */
export function addLog(state, text, t = null) {
  const s = { ...state, log: [...(state.log ?? []), { t: t ?? null, text: String(text) }] };
  if (s.log.length > LOG_MAX) s.log = s.log.slice(-LOG_MAX);
  return s;
}

/** Freeplay: the GM's New Scene button. */
export function newScene(state) {
  return { ...state, sceneSerial: num(state.sceneSerial) + 1, roundSerial: num(state.roundSerial) + 1, round: 1 };
}

export function getObstacle(state, id) {
  return (state?.obstacles ?? []).find(o => o.id === id) ?? null;
}

export function currentObstacle(state) {
  return getObstacle(state, state?.current);
}

/** Crew members on the board (not Out, not waiting, not escaped). */
export function presentCrew(state) {
  return (state?.crew ?? []).filter(c => c.status === "present");
}

/**
 * Start a heist from a catalog entry (or a custom one).
 * @param {object} state
 * @param {object} opts
 * @param {object} opts.heist             a catalog heist
 * @param {{actorId, userId?, slot?, name?}[]} opts.crew
 * @param {string} opts.heistId
 * @param {number} [opts.limit]
 * @param {string} [opts.difficulty]
 * @param {string} [opts.journalUuid]
 */
export function startHeist(state, { heist, crew = [], heistId, limit = null, difficulty = null, journalUuid = null } = {}) {
  if (!heist) throw new Error("startHeist: no heist");
  const lim = Math.max(1, num(limit) || num(heist.limit) || 8);
  const obstacles = heistObstacles(heist).map(o => ({
    id: o.id, name: o.name, phase: o.phase, kind: o.kind ?? "environment", tags: [...(o.tags ?? [])],
    threats: [...(o.threats ?? [])], awake: [...(o.awake ?? [])], unknown: !!o.unknown, revealed: !o.unknown,
    objective: !!o.objective, postObjective: !!o.postObjective, keyLock: !!o.keyLock, silkLinePrepared: false,
    human: o.human ?? null, ratDeal: !!o.ratDeal, flawTrigger: o.flawTrigger ?? null, note: o.note ?? "",
    improvise: [...(o.improvise ?? [])],
    approaches: (o.approaches ?? []).map(a => clone(a)),
    status: "pending"
  }));
  const unknownIds = obstacles.filter(o => o.unknown).map(o => o.id);
  const fresh = newHeistState({ heistId, limit: lim, difficulty: difficulty ?? heist.difficulty, log: state?.log ?? [] });
  const s = {
    ...fresh,
    catalogKey: heist.key ?? null, name: heist.name ?? "", journalUuid,
    phase: "score",
    obstacles,
    crew: crew.map(c => ({
      slot: c.slot || c.actorId, actorId: c.actorId, userId: c.userId ?? null, name: c.name ?? "",
      status: "present", arrivesAtSerial: null, caughtLastEscape: false, replacementOf: c.replacementOf ?? null
    })),
    creatures: (heist.creatures ?? []).map(c => ({
      id: c.id, key: c.key, name: c.name ?? CREATURE_AUTOMATION[c.key]?.name ?? c.key, actorUuid: c.actorUuid ?? null,
      atObstacles: [...(c.atObstacles ?? [])], earshot: [...(c.earshot ?? [])], postObstacles: [...(c.post ?? [])],
      backupOf: null, state: newCreatureState()
    })),
    humans: (heist.humans ?? []).map(h => ({ ...clone(h), awake: false })),
    intel: {
      list: (heist.intel ?? []).map((i, n) => ({ id: i.id ?? `i${n + 1}`, text: i.text, obstacle: i.obstacle ?? null, revealed: false, unknown: unknownIds.includes(i.obstacle) })),
      casingRolled: []
    },
    loot: (heist.loot ?? []).map(l => ({ id: l.id, name: l.name, tier: l.tier ?? heist.lootTier ?? "trinket", objective: !!l.objective, carriers: [], sled: false, status: "inPlace", incomplete: false, note: l.note ?? "" })),
    procedures: {},
    alertLedger: []
  };
  return addLog(s, `Heist started: ${heist.name} (Limit ${lim}).`);
}

/** End a heist (after the Debrief): back to a freeplay clock, the log kept. */
export function endHeist(state) {
  const s = newHeistState({ limit: state?.limit, log: state?.log ?? [], sceneSerial: num(state?.sceneSerial) + 1, roundSerial: num(state?.roundSerial) + 1 });
  s.lastHeist = { heistId: state?.heistId, name: state?.name, outcome: state?.debrief?.outcome ?? null };
  return s;
}

/**
 * Change phase. Planning and the Escape are new scenes; reaching the Debrief
 * marks everyone still on the board as escaped.
 */
export function setPhase(state, phase) {
  if (!PHASES.includes(phase)) throw new Error(`Unknown phase ${phase}`);
  const from = state.phase;
  if (from === phase) return state;
  let s = { ...state, phase };
  if (phase === "planning" || phase === "escape") s.sceneSerial = num(s.sceneSerial) + 1;
  if (phase === "planning" || phase === "escape") { s.round = 1; s.roundSerial = num(s.roundSerial) + 1; }
  if (phase === "escape" && s.current && getObstacle(s, s.current)?.phase === "heist") {
    s = closeObstacle(s, s.current);
    s.current = null;
  }
  if (phase === "debrief") {
    s = finishEscape(s);
    s.debrief = { ...(s.debrief ?? {}), outcome: debriefOutcome(s) };
  }
  return addLog(s, `Phase: ${from} → ${phase}.`);
}

function closeObstacle(state, id) {
  const cleared = isCleared(state, id);
  return {
    ...state,
    obstacles: state.obstacles.map(o => (o.id === id && o.status === "active" ? { ...o, status: cleared ? "cleared" : "skipped" } : o))
  };
}

/**
 * Start an obstacle. Returns the state plus what happened at the start
 * (arrivals, a guard's backup taking its post, creatures awake from the start,
 * procedures that fire, squeeze warnings).
 * @returns {{state:object, events:object[]}}
 */
export function startObstacleWithEvents(state, id) {
  const ob = getObstacle(state, id);
  if (!ob) throw new Error(`No obstacle ${id}`);
  const events = [];
  let s = state.current && state.current !== id ? closeObstacle(state, state.current) : { ...state };
  const firstObstacle = !s.obstacles.some(o => o.status !== "pending" && o.id !== id);
  s.sceneSerial = num(s.sceneSerial) + 1;
  s.obstacleSerial = num(s.obstacleSerial) + 1;
  s.roundSerial = num(s.roundSerial) + 1;
  s.round = 1;
  s.current = id;
  if (ob.phase === "escape" && s.phase !== "escape") s.phase = "escape";
  if (ob.phase === "heist" && ["idle", "score", "planning"].includes(s.phase)) s.phase = "heist";
  s.obstacles = s.obstacles.map(o => (o.id === id ? { ...o, status: "active", revealed: true, startedSerial: s.obstacleSerial } : o));
  s.progress = { ...(s.progress ?? {}) };
  s.progress[id] = s.progress[id] ?? { rolls: {}, manual: 0, passedActors: [], manualPassed: [], cleared: false, manualCleared: false };
  // Open group checks from the last obstacle close.
  s.groups = Object.fromEntries(Object.entries(s.groups ?? {}).map(([k, g]) => [k, g.obstacleId === id ? g : { ...g, closed: true }]));
  // Effects that lasted the scene end.
  s.effects = (s.effects ?? []).filter(e => e.untilSceneSerial === null || e.untilSceneSerial === undefined || num(e.untilSceneSerial) >= s.sceneSerial);
  // Waiting Web arrivals: next to any crewmate, at the start of the next obstacle.
  s.crew = (s.crew ?? []).map(c => {
    if (c.status === "waiting" && c.arrivesAtSerial !== null && num(c.arrivesAtSerial) <= s.obstacleSerial) {
      events.push({ type: "arrival", actorId: c.actorId });
      return { ...c, status: "present" };
    }
    return c;
  });
  // Creatures: a beaten guard's backup takes its post; "awake from the start" here.
  s.creatures = (s.creatures ?? []).map(c => {
    let st = { ...c.state };
    if (st.arrivesAtSerial !== null && st.arrivesAtSerial !== undefined && !st.arrived && num(st.arrivesAtSerial) <= s.obstacleSerial) {
      st = { ...st, arrived: true, aware: true, active: true };
      events.push({ type: "backupArrives", creatureId: c.id });
    }
    if ((ob.awake ?? []).includes(c.key) && c.atObstacles.includes(id) && !st.beaten && !st.paid && !st.active) {
      st = { ...st, active: true, aware: c.key === "guard-spider" ? true : st.aware };
      events.push({ type: "creatureAwake", creatureId: c.id });
    }
    return { ...c, state: st };
  });
  // Squeezes: loot bigger than a Trinket won't fit (unless an Escape roll covers it).
  if ((ob.tags ?? []).includes("squeeze")) {
    for (const l of s.loot ?? []) {
      if (l.status === "carried" && !HEISTY.lootTiers[l.tier]?.fitsSqueeze) events.push({ type: "squeeze", lootId: l.id });
    }
  }
  // Procedures that fire as the crew arrives.
  for (const key of ["obstacleStart", ...(firstObstacle ? ["firstObstacle"] : [])]) events.push({ type: "procedures", trigger: key, obstacleId: id });
  s = addLog(s, `Obstacle ${id}: ${ob.name}.`);
  return { state: s, events };
}

/** Start an obstacle (Appendix B signature). */
export function startObstacle(state, id) {
  return startObstacleWithEvents(state, id).state;
}

/** The next obstacle in play order after the current one (skipping cleared/skipped ones). */
export function nextObstacleId(state) {
  const list = state?.obstacles ?? [];
  const i = list.findIndex(o => o.id === state?.current);
  const rest = list.slice(i + 1).filter(o => o.status === "pending");
  return rest[0]?.id ?? null;
}

/** Is this the last Escape obstacle? */
export function isLastEscapeObstacle(state, id = state?.current) {
  const esc = (state?.obstacles ?? []).filter(o => o.phase === "escape" && o.status !== "skipped");
  return !!esc.length && esc[esc.length - 1].id === id;
}

/* -------------------------------------------------------------- progress -- */

/** Successful rolls an obstacle takes: 2 in the Heist, 1 in the Escape. */
export function requiredPasses(obstacle) {
  return obstacle?.phase === "escape" ? 1 : 2;
}

function recomputeProgress(state, obstacleId) {
  const prog = state.progress?.[obstacleId];
  if (!prog) return state;
  const passed = uniq([
    ...Object.values(prog.rolls ?? {}).filter(r => r.pass).map(r => r.actorId),
    ...(prog.manualPassed ?? [])
  ]);
  const p2 = { ...prog, passedActors: passed };
  const s = { ...state, progress: { ...state.progress, [obstacleId]: p2 } };
  const cleared = isCleared(s, obstacleId);
  s.progress[obstacleId] = { ...p2, cleared };
  return s;
}

/**
 * Is the obstacle done? Two passing rolls in the Heist (one in the Escape),
 * counting the GM's manual +1s; or every present spider through (a group
 * check counts as both); or the GM marked it cleared.
 */
export function isCleared(state, obstacleId) {
  const ob = getObstacle(state, obstacleId);
  const prog = state?.progress?.[obstacleId];
  if (!ob || !prog) return false;
  if (prog.manualCleared) return true;
  const rolls = Object.values(prog.rolls ?? {});
  const solo = rolls.filter(r => r.pass && !r.groupId).length + num(prog.manual);
  if (solo >= requiredPasses(ob)) return true;
  const present = presentCrew(state).map(c => c.actorId);
  const passed = new Set(prog.passedActors ?? []);
  const anyGroupOrIndividual = rolls.some(r => r.groupId || r.mode === "individual") || (prog.manualPassed ?? []).length > 0;
  return anyGroupOrIndividual && present.length > 0 && present.every(a => passed.has(a));
}

/**
 * Record a roll card against the obstacle it was made at (idempotent: keyed by
 * message id, so a Reroll or Clutch on the same card simply updates it).
 * card: { messageId|id, actorId, obstacleId, approachId, groupId, result, roundSerial, difficulty, noProgress }
 */
export function recordRoll(state, card) {
  const messageId = card?.messageId ?? card?.id;
  const actorId = card?.actorId ?? null;
  let s = { ...state };
  const roundSerial = card?.roundSerial ?? s.roundSerial;
  if (actorId) s = markActed(s, actorId, roundSerial);
  const ob = getObstacle(s, card?.obstacleId);
  if (!ob || !messageId) return s;
  const approach = (ob.approaches ?? []).find(a => a.id === card.approachId) ?? null;
  const pass = PASS_RESULTS.includes(card.result) && !card.noProgress;
  const prog = s.progress?.[ob.id] ?? { rolls: {}, manual: 0, passedActors: [], manualPassed: [], cleared: false, manualCleared: false };
  const wasCleared = !!prog.cleared;
  const difficulty = num(card.difficulty ?? card.roll?.difficulty);
  const rolls = {
    ...prog.rolls,
    [messageId]: {
      actorId, approachId: card.approachId ?? null, pass, groupId: card.groupId ?? null, result: card.result ?? null,
      roundSerial, mode: approach?.mode ?? null, critAlert: card.result === "critical" && difficulty >= 3
    }
  };
  s.progress = { ...(s.progress ?? {}), [ob.id]: { ...prog, rolls } };
  // Group check bookkeeping.
  if (card.groupId && s.groups?.[card.groupId]) {
    const g = s.groups[card.groupId];
    const results = { ...(g.results ?? {}), [actorId]: { result: card.result, critAlert: card.result === "critical" && difficulty >= 3, messageId } };
    const gRolls = { ...(g.rolls ?? {}), [actorId]: messageId };
    const closed = g.closed || (g.expected ?? []).every(a => gRolls[a]);
    s.groups = { ...s.groups, [card.groupId]: { ...g, rolls: gRolls, results, closed } };
  }
  // One-shot dice effects "on the next roll here" are used up.
  s.effects = (s.effects ?? []).filter(e => !(e.once && (!e.obstacleId || e.obstacleId === ob.id) && (!e.actors?.length || e.actors.includes(actorId))));
  s = recomputeProgress(s, ob.id);
  const nowCleared = !!s.progress[ob.id].cleared;
  if (nowCleared && !wasCleared) s = onCleared(s, ob.id, { approachId: card.approachId, actorId, messageId, roundSerial });
  if (!nowCleared && wasCleared && !s.progress[ob.id].manualCleared) {
    s.obstacles = s.obstacles.map(o => (o.id === ob.id && o.status === "cleared" ? { ...o, status: "active", clearedBy: null } : o));
  }
  return s;
}

/**
 * The obstacle just cleared: what clearing it does to its creatures (drive
 * off, shut in, pay off, a beaten guard) and the objective.
 */
function onCleared(state, obstacleId, by) {
  const ob = getObstacle(state, obstacleId);
  let s = {
    ...state,
    obstacles: state.obstacles.map(o => (o.id === obstacleId ? { ...o, status: o.status === "active" ? "cleared" : o.status, clearedBy: by } : o))
  };
  const approach = (ob.approaches ?? []).find(a => a.id === by.approachId) ?? null;
  if (approach) {
    const fightish = approach.fight || (approach.skills ?? []).some(k => k === "brawl" || k === "intimidation");
    const backups = [];
    const creatures = (s.creatures ?? []).map(c => {
      const located = (c.atObstacles ?? []).includes(obstacleId) || (c.postObstacles ?? []).includes(obstacleId);
      if (!(ob.threats ?? []).includes(c.key) || !located) return c;
      if (c.backupOf && !c.state?.arrived) return c;
      let st = c.state;
      const def = CREATURE_AUTOMATION[c.key];
      if (approach.hold === c.key) st = shutIn(st);
      else if (approach.pays === c.key) st = payOff(st);
      else if (approach.weakness === c.key) st = driveOff(st, s.obstacleSerial, by.roundSerial);
      else if (approach.fight && fightish && def?.backupOnBeaten) {
        const r = beat(def, st, s.obstacleSerial, by.roundSerial);
        st = r.st;
        if (r.backup) backups.push(c.id);
      } else if (fightish && (ob.threats ?? []).includes(c.key)) st = driveOff(st, s.obstacleSerial, by.roundSerial);
      return { ...c, state: st };
    });
    s = { ...s, creatures };
    for (const cid of backups) s = addBackup(s, cid);
  }
  if (ob.objective && !s.objective?.taken && !s.objective?.lost) {
    s = takeObjective(s, by.actorId);
  }
  return addLog(s, `Obstacle ${obstacleId} cleared.`);
}

/** A beaten guard's backup: fresh, aware, arrives at the start of the next obstacle, holds the post. */
export function addBackup(state, creatureId) {
  const c = (state.creatures ?? []).find(x => x.id === creatureId);
  if (!c) return state;
  const id = `${c.id}-backup${(state.creatures ?? []).filter(x => x.backupOf === c.id).length + 1}`;
  const post = (c.postObstacles?.length ? c.postObstacles : c.atObstacles);
  const backup = {
    id, key: c.key, name: `${c.name} (backup)`, actorUuid: c.actorUuid, atObstacles: [...post], earshot: [],
    postObstacles: [...post], backupOf: c.id, state: backupState(num(state.obstacleSerial) + 1)
  };
  backup.state.active = false;
  backup.state.aware = false;
  return addLog({ ...state, creatures: [...state.creatures, backup] }, `${c.name} is out of the heist: a backup takes its post at the next obstacle.`);
}

/** GM: +1 / −1 progress, mark a spider passed, mark cleared. */
export function adjustProgress(state, obstacleId, { manual = 0, passActor = null, unpassActor = null, cleared = null } = {}) {
  const ob = getObstacle(state, obstacleId);
  if (!ob) return state;
  const prog = state.progress?.[obstacleId] ?? { rolls: {}, manual: 0, passedActors: [], manualPassed: [], cleared: false, manualCleared: false };
  const wasCleared = !!prog.cleared;
  const p = { ...prog, manual: Math.max(0, num(prog.manual) + num(manual)) };
  if (passActor) p.manualPassed = uniq([...(p.manualPassed ?? []), passActor]);
  if (unpassActor) {
    p.manualPassed = (p.manualPassed ?? []).filter(a => a !== unpassActor);
    p.rolls = Object.fromEntries(Object.entries(p.rolls ?? {}).map(([k, r]) => [k, r.actorId === unpassActor ? { ...r, pass: false } : r]));
  }
  if (cleared !== null) p.manualCleared = !!cleared;
  let s = recomputeProgress({ ...state, progress: { ...state.progress, [obstacleId]: p } }, obstacleId);
  if (s.progress[obstacleId].cleared && !wasCleared) s = onCleared(s, obstacleId, { approachId: null, actorId: passActor, messageId: null, roundSerial: s.roundSerial });
  if (!s.progress[obstacleId].cleared && wasCleared) s.obstacles = s.obstacles.map(o => (o.id === obstacleId ? { ...o, status: o.id === s.current ? "active" : "pending" } : o));
  return s;
}

/** Progress pips for the tracker. */
export function progressView(state, obstacleId) {
  const ob = getObstacle(state, obstacleId);
  const prog = state?.progress?.[obstacleId];
  const need = requiredPasses(ob);
  const solo = prog ? Object.values(prog.rolls ?? {}).filter(r => r.pass && !r.groupId).length + num(prog.manual) : 0;
  return { need, have: Math.min(need, solo), cleared: !!prog?.cleared, passedActors: prog?.passedActors ?? [] };
}

/* ----------------------------------------------------------- group checks -- */

/**
 * Open a group check: every present spider not yet through is expected.
 * @returns {object} state
 */
export function openGroup(state, { groupId, obstacleId = state.current, approachId = null, expected = null, ledBy = null } = {}) {
  const prog = state.progress?.[obstacleId];
  const passed = new Set(prog?.passedActors ?? []);
  const exp = expected ?? presentCrew(state).map(c => c.actorId).filter(a => !passed.has(a));
  const g = { obstacleId, approachId, round: state.round, roundSerial: state.roundSerial, expected: exp, rolls: {}, results: {}, closed: exp.length === 0, ledBy, opposed: null };
  return { ...state, groups: { ...(state.groups ?? {}), [groupId]: g } };
}

/** Close a group check (every expected spider rolled, or the GM's Close). */
export function closeGroup(state, groupId) {
  const g = state.groups?.[groupId];
  if (!g) return state;
  return { ...state, groups: { ...state.groups, [groupId]: { ...g, closed: true } } };
}

/** The creature's one roll for this round of a group check (N2). */
export function setGroupOpposed(state, groupId, { creature, successes, roundSerial = state.roundSerial }) {
  const g = state.groups?.[groupId];
  if (!g) return state;
  const opposed = { creature, successes: num(successes), difficulty: num(successes) + 1, roundSerial };
  return { ...state, groups: { ...state.groups, [groupId]: { ...g, opposed } } };
}

/** The ledger's view of a group: closed, and every roll a Critical at Difficulty 3+. */
export function groupSummary(group) {
  if (!group) return null;
  const results = Object.values(group.results ?? {});
  const allRolled = (group.expected ?? []).every(a => group.rolls?.[a]);
  const allCritical = results.length > 0 && allRolled && results.every(r => r.critAlert);
  return { closed: !!group.closed, allCritical: !!group.closed && allCritical };
}

/* ----------------------------------------------------------------- rounds -- */

/** Mark a spider as having acted this round (a roll, an Assist, an ability, "I acted"). */
export function markActed(state, actorId, roundSerial = state.roundSerial) {
  const key = String(roundSerial);
  const list = state.acted?.[key] ?? [];
  if (list.includes(actorId)) return state;
  return { ...state, acted: { ...(state.acted ?? {}), [key]: [...list, actorId] } };
}

/** Has every present spider not yet through acted this round? */
export function allActed(state) {
  const present = presentCrew(state).map(c => c.actorId);
  if (!present.length) return false;
  const acted = new Set(state.acted?.[String(state.roundSerial)] ?? []);
  const passed = new Set(state.progress?.[state.current]?.passedActors ?? []);
  return present.every(a => acted.has(a) || passed.has(a));
}

/** The clock: the crew starts round 3 at one obstacle. */
export function clockDue(round) {
  return complicationClockDue(round);
}

/** Five rounds stuck at one obstacle: the ST ends it. */
export function stallDue(round) {
  return num(round) >= STALL_ROUNDS;
}

/** Context for a creature at the current obstacle. */
export function creatureContext(state, c, { alert = 0, fullAlert = false } = {}) {
  const here = !!state.current && (c.atObstacles ?? []).includes(state.current) && (!c.backupOf || !!c.state?.arrived);
  const earshot = !!state.current && (c.earshot ?? []).includes(state.current);
  return { here, earshot, obstacleSerial: state.obstacleSerial, roundSerial: state.roundSerial, alert, fullAlert, escape: state.phase === "escape" };
}

/**
 * End the round (§3.5). Pure: returns the next state and the actions the
 * runtime carries out, in order:
 *   alert (creature +X, one event each) · procedure (round-end tables, timers) ·
 *   groupClosed · capture (Full Alert Escape captures held until now) ·
 *   finalizePending · flawFire · quietRecovery · stall · clock.
 * @param {object} state
 * @param {{alert?:number, fullAlert?:boolean, heist?:object, defs?:Function}} ctx
 * @returns {{state:object, actions:object[]}}
 */
export function endRound(state, ctx = {}) {
  const { alert = 0, fullAlert = false, heist = null } = ctx;
  const defOf = ctx.defs ?? (key => creatureDef(key));
  const actions = [];
  let s = { ...state };
  const rs = num(s.roundSerial);
  const ob = currentObstacle(s);
  const inPlay = s.phase === "heist" || s.phase === "escape";

  // 1. Creature contributions: each creature is its own event.
  if (inPlay && ob) {
    for (const c of s.creatures ?? []) {
      const def = defOf(c.key);
      const delta = perRoundDelta(def, c.state, creatureContext(s, c, { alert, fullAlert }));
      if (delta > 0) actions.push({ type: "alert", eventId: `creature:${c.id}:${rs}`, cause: "creature", triggers: [{ key: "creature", delta, label: `${c.name} (+${delta} this round)`, src: "creature" }] });
    }
  }

  // 2. Procedures: round-end tables, every-N-round tables, timers.
  if (inPlay && heist) {
    for (const p of proceduresFor(heist, "roundEnd")) actions.push({ type: "procedure", procId: p.id, reason: "roundEnd" });
    for (const p of proceduresFor(heist, "everyNRounds")) {
      const n = num(p.everyNRounds) || 5;
      const started = num(s.procedures?.[p.id]?.since ?? 0);
      if (rs > started && (rs - started) % n === 0) actions.push({ type: "procedure", procId: p.id, reason: "everyNRounds" });
    }
  }
  for (const [procId, ps] of Object.entries(s.procedures ?? {})) {
    if (!ps?.timer || ps.timer.done) continue;
    const elapsed = rs - num(ps.timer.startedRoundSerial) + 1;
    if (elapsed >= num(ps.timer.rounds)) actions.push({ type: "procedureTimerEnd", procId });
    else actions.push({ type: "procedureTimerTick", procId, elapsed });
  }

  // 3. Round effects expire.
  s.effects = (s.effects ?? []).filter(e => e.untilRoundSerial === null || e.untilRoundSerial === undefined || num(e.untilRoundSerial) > rs);

  // Group checks of this round close (a spider who failed retries next round).
  const groups = { ...(s.groups ?? {}) };
  for (const [gid, g] of Object.entries(groups)) {
    if (!g.closed && num(g.roundSerial) <= rs) {
      groups[gid] = { ...g, closed: true };
      actions.push({ type: "groupClosed", groupId: gid });
    }
  }
  s.groups = groups;

  // 4. Pending consequences finalize: Full Alert Escape captures held until now.
  for (const [mid, pc] of Object.entries(s.pendingCaptures ?? {})) {
    if (!pc.voided) actions.push({ type: "capture", actorId: pc.actorId, messageId: mid });
  }
  s.pendingCaptures = {};
  actions.push({ type: "finalizePending", roundSerial: rs });

  // 5. Delayed Flaws come due at the start of the next round.
  const due = (s.flawSchedule ?? []).filter(f => num(f.dueRoundSerial) <= rs + 1);
  for (const f of due) actions.push({ type: "flawFire", actorId: f.actorId, flawKey: f.flawKey });
  s.flawSchedule = (s.flawSchedule ?? []).filter(f => num(f.dueRoundSerial) > rs + 1);

  // 6. Quiet round: no threat able to reach the crew → recovery prompt.
  if (inPlay && ob) {
    const engaged = (s.creatures ?? []).some(c => {
      const def = defOf(c.key);
      const cx = creatureContext(s, c, { alert, fullAlert });
      return def && (isEngaged(def, c.state, cx) || (cx.here && creatureStatus(def, c.state, alert, fullAlert).active));
    });
    const human = (ob.tags ?? []).includes("human");
    if (!engaged && !human) actions.push({ type: "quietRecovery", obstacleSerial: s.obstacleSerial });
  }

  // 7. Five rounds stuck.
  if (inPlay && ob && stallDue(s.round) && !isCleared(s, ob.id)) actions.push({ type: "stall", obstacleId: ob.id, phase: ob.phase });

  // 8. Next round.
  s.round = num(s.round) + 1;
  s.roundSerial = rs + 1;
  // Keep only recent "acted" lists.
  s.acted = Object.fromEntries(Object.entries(s.acted ?? {}).filter(([k]) => num(k) >= rs - 2));

  // The clock: the crew starts round 3 here.
  if (inPlay && ob && clockDue(s.round) && !isCleared(s, ob.id)) actions.push({ type: "clock", obstacleId: ob.id });

  return { state: s, actions };
}

/**
 * Five rounds: end it. In the heist the objective slips out of reach; in the
 * Escape every spider not through is caught.
 * @returns {{state:object, caught:string[]}}
 */
export function applyStall(state) {
  const ob = currentObstacle(state);
  if (!ob) return { state, caught: [] };
  if (ob.phase === "escape") {
    const passed = new Set(state.progress?.[ob.id]?.passedActors ?? []);
    const cleared = isCleared(state, ob.id);
    const caught = cleared ? [] : presentCrew(state).map(c => c.actorId).filter(a => !passed.has(a));
    return { state: addLog(state, `Five rounds in the Escape: ${caught.length} caught.`), caught };
  }
  const s = { ...state, objective: { ...state.objective, lost: !state.objective?.taken ? true : !!state.objective?.lost } };
  return { state: addLog(s, "Five rounds stuck: the objective slips out of reach."), caught: [] };
}

/* ------------------------------------------------------------- Full Alert -- */

/**
 * The fold locked at the Limit: note where, and — if the crew doesn't have the
 * objective yet — it's out of reach.
 * @returns {{state:object, objectiveLost:boolean}}
 */
export function onFullAlert(state) {
  if (state.fullAlert?.atObstacle) return { state, objectiveLost: false };
  const lose = !state.objective?.taken && !state.objective?.lost;
  const s = {
    ...state,
    fullAlert: { atObstacle: state.current ?? state.phase, objectiveLostByIt: lose },
    objective: { ...state.objective, lost: lose ? true : !!state.objective?.lost }
  };
  return { state: addLog(s, "FULL ALERT."), objectiveLost: lose };
}

/** An amendment pulled the Alert back under the Limit (the GM confirmed): undo what Full Alert did. Creatures stay awake. */
export function undoFullAlert(state) {
  if (!state.fullAlert?.atObstacle) return state;
  const s = {
    ...state,
    objective: { ...state.objective, lost: state.fullAlert.objectiveLostByIt ? false : !!state.objective?.lost },
    fullAlert: { atObstacle: null, objectiveLostByIt: false }
  };
  return addLog(s, "Full Alert undone.");
}

/** A Failure in a Full Alert Escape: caught — Out — once the roll is final. */
export function addPendingCapture(state, { messageId, actorId, roundSerial = state.roundSerial }) {
  return { ...state, pendingCaptures: { ...(state.pendingCaptures ?? {}), [messageId]: { actorId, roundSerial, voided: false } } };
}

/** A Clutch or a reroll to Partial or better saves them. */
export function voidPendingCapture(state, messageId) {
  if (!state.pendingCaptures?.[messageId]) return state;
  const pc = { ...state.pendingCaptures };
  delete pc[messageId];
  return { ...state, pendingCaptures: pc };
}

/** Finalize one pending capture now (Accept, or the same spider rolls again). */
export function takePendingCapture(state, messageId) {
  const pc = state.pendingCaptures?.[messageId];
  if (!pc) return { state, capture: null };
  return { state: voidPendingCapture(state, messageId), capture: { actorId: pc.actorId, messageId } };
}

/** Pending captures of a spider other than on `exceptMessageId` (its next roll finalizes them). */
export function pendingCapturesOf(state, actorId, exceptMessageId = null) {
  return Object.entries(state.pendingCaptures ?? {}).filter(([mid, pc]) => pc.actorId === actorId && mid !== exceptMessageId).map(([mid]) => mid);
}

/* ------------------------------------------------------- Out, Waiting Web -- */

/**
 * A spider goes Out. Returns the Alert event (+2; a capture +3 on the same
 * event — "this replaces, not adds to"), and loses loot it carried alone.
 * @returns {{state:object, alert:{eventId, triggers, cause}, lostLoot:string[], lastEscape:boolean}}
 */
export function markOut(state, actorId, { capture = false } = {}) {
  const lastEscape = state.phase === "escape" && isLastEscapeObstacle(state);
  const lostLoot = [];
  const loot = (state.loot ?? []).map(l => {
    if (!(l.carriers ?? []).includes(actorId)) return l;
    const others = l.carriers.filter(a => a !== actorId);
    if (!others.length) { lostLoot.push(l.id); return { ...l, carriers: [], status: "lost" }; }
    return { ...l, carriers: others };
  });
  const crew = (state.crew ?? []).map(c => (c.actorId === actorId ? { ...c, status: "out", caughtLastEscape: c.caughtLastEscape || lastEscape } : c));
  let s = { ...state, crew, loot };
  if (lostLoot.some(id => loot.find(l => l.id === id)?.objective) && !s.objective?.lost) s.objective = { ...s.objective, lost: true };
  s = addLog(s, `${crew.find(c => c.actorId === actorId)?.name || "A spider"} is Out${capture ? " (captured)" : ""}.`);
  const eventId = `out:${actorId}:${num(state.sceneSerial)}`;
  const triggers = [{ key: "out", delta: 2, label: "A spider goes Out", src: "out" }];
  if (capture) triggers.push({ key: "capture", delta: 3, label: "Captured! (+3 replaces the +2)", src: "out" });
  return { state: s, alert: { eventId, triggers, cause: "out" }, lostLoot, lastEscape };
}

/**
 * The Waiting Web: the replacement joins the crew — at the next obstacle, next
 * to any crewmate; or, Out in the last Escape obstacle, waiting at the exit.
 */
export function addReplacement(state, { slot, actorId, userId = null, name = "", replacementOf = null } = {}) {
  const orig = (state.crew ?? []).find(c => c.actorId === replacementOf);
  const lastEscape = !!orig?.caughtLastEscape || (state.phase === "escape" && isLastEscapeObstacle(state));
  const entry = {
    slot: slot || orig?.slot || replacementOf || actorId, actorId, userId, name, replacementOf,
    status: lastEscape ? "escaped" : "waiting",
    arrivesAtSerial: lastEscape ? null : num(state.obstacleSerial) + 1, caughtLastEscape: false
  };
  const s = { ...state, crew: [...(state.crew ?? []).filter(c => c.actorId !== actorId), entry] };
  return addLog(s, lastEscape ? `${name || "The replacement"} is waiting at the exit.` : `${name || "The replacement"} arrives at the next obstacle.`);
}

/** No crew spider present or escaped (pending replacements don't count): everyone is Out at once. */
export function isLoss(crew) {
  const list = crew ?? [];
  return list.length > 0 && !list.some(c => c.status === "present" || c.status === "escaped");
}

/**
 * Gap recovery (§3.9): every spider not yet recovered during the obstacle just
 * finished recovers one level. snapshots: [{actorId, vitality, recoveredSerial}]
 * @returns {string[]} actor ids to recover
 */
export function gapRecoveryTargets(snapshots, obstacleSerial) {
  return (snapshots ?? [])
    .filter(s => ["rattled", "hurt", "critical"].includes(s.vitality) && num(s.recoveredSerial) !== num(obstacleSerial))
    .map(s => s.actorId);
}

/** One level better on the Vitality ladder (never past Unharmed; Out stays Out). */
export function recoverOne(vitality) {
  const order = HEISTY.vitalityOrder;
  const i = order.indexOf(vitality);
  if (i <= 0 || vitality === "out") return vitality;
  return order[i - 1];
}

/* -------------------------------------------------------------- planning -- */

/** Casing: each Success reveals one detail, capped at what the ST holds, never the unknown obstacle. */
export function casingReveal(successes, intel) {
  const avail = (intel ?? []).filter(i => !i.revealed && !i.unknown).length;
  return Math.max(0, Math.min(num(successes), avail));
}

/** Can this spider still make its one Casing roll? */
export function canCase(state, actorId) {
  return state.phase === "planning" && !(state.intel?.casingRolled ?? []).includes(actorId);
}

/**
 * Record a Casing roll: the pre-ticked reveal list in book order.
 * @returns {{state:object, reveal:string[], refused:boolean}}
 */
export function recordCasing(state, actorId, successes) {
  if (!canCase(state, actorId)) return { state, reveal: [], refused: true };
  const list = state.intel?.list ?? [];
  const n = casingReveal(successes, list);
  const reveal = list.filter(i => !i.revealed && !i.unknown).slice(0, n).map(i => i.id);
  const s = { ...state, intel: { ...state.intel, casingRolled: [...(state.intel?.casingRolled ?? []), actorId] } };
  return { state: markActed(s, actorId), reveal, refused: false };
}

/** Reveal intel to the crew. */
export function revealIntel(state, ids) {
  const set = new Set(ids ?? []);
  return { ...state, intel: { ...state.intel, list: (state.intel?.list ?? []).map(i => (set.has(i.id) && !i.unknown ? { ...i, revealed: true } : i)) } };
}

/** Preparation kinds that don't use up the spider's one Preparation. */
export const FREE_PREPS = Object.freeze(["entry", "perk", "deadDrop"]);
export const PREP_KINDS = Object.freeze(["entry", "silkLine", "stash", "perk", "deadDrop", "contingency", "other"]);

/** May this spider make this Preparation? One per spider; entry squares and Perk-granted ones are free. */
export function canPrepare(state, actorId, kind) {
  if (!PREP_KINDS.includes(kind)) return false;
  if (FREE_PREPS.includes(kind)) return true;
  return !(state.preparations?.[actorId] ?? []).some(p => !FREE_PREPS.includes(p.kind));
}

/**
 * Record a Preparation. A pre-placed Silk Line lowers that obstacle's
 * climb/crossing Difficulty by 1 for the heist.
 * @returns {{state:object, ok:boolean}}
 */
export function addPreparation(state, actorId, { kind = "other", text = "", obstacleId = null, complication = "", id = null } = {}) {
  if (!canPrepare(state, actorId, kind)) return { state, ok: false };
  const prep = { id: id ?? `prep-${actorId}-${(state.preparations?.[actorId] ?? []).length + 1}`, kind, text, obstacleId, complication: complication || "Note one texture complication.", free: FREE_PREPS.includes(kind) };
  let s = { ...state, preparations: { ...(state.preparations ?? {}), [actorId]: [...(state.preparations?.[actorId] ?? []), prep] } };
  if (kind === "silkLine" && obstacleId) s.obstacles = s.obstacles.map(o => (o.id === obstacleId ? { ...o, silkLinePrepared: true } : o));
  return { state: s, ok: true };
}

/** Remove a Preparation. */
export function removePreparation(state, actorId, prepId) {
  const list = (state.preparations?.[actorId] ?? []).filter(p => p.id !== prepId);
  const removed = (state.preparations?.[actorId] ?? []).find(p => p.id === prepId);
  let s = { ...state, preparations: { ...state.preparations, [actorId]: list } };
  if (removed?.kind === "silkLine" && removed.obstacleId) {
    const still = Object.values(s.preparations).flat().some(p => p.kind === "silkLine" && p.obstacleId === removed.obstacleId);
    if (!still) s.obstacles = s.obstacles.map(o => (o.id === removed.obstacleId ? { ...o, silkLinePrepared: false } : o));
  }
  return s;
}

/* ------------------------------------------------------------------ loot -- */

/** Take the objective: the clearing spider carries it. */
export function takeObjective(state, actorId) {
  const loot = (state.loot ?? []).map(l => (l.objective && l.status === "inPlace" ? { ...l, status: actorId ? "carried" : "inPlace", carriers: actorId ? [actorId] : [] } : l));
  return addLog({ ...state, loot, objective: { ...state.objective, taken: true } }, "The objective is taken.");
}

/** Loot actions: pickUp (an Action), handOver (free), drop, sled, incomplete, lose. */
export function lootAction(state, lootId, action, { actorId = null, toActorId = null, value = true } = {}) {
  const loot = (state.loot ?? []).map(l => {
    if (l.id !== lootId) return l;
    switch (action) {
      case "pickUp": return { ...l, status: "carried", carriers: uniq([...(l.carriers ?? []), actorId].filter(Boolean)) };
      case "join": return { ...l, carriers: uniq([...(l.carriers ?? []), actorId].filter(Boolean)) };
      case "leave": { const c = (l.carriers ?? []).filter(a => a !== actorId); return { ...l, carriers: c, status: c.length ? l.status : "dropped" }; }
      case "handOver": return { ...l, carriers: uniq((l.carriers ?? []).map(a => (a === actorId ? toActorId : a)).filter(Boolean)) };
      case "drop": return { ...l, status: "dropped", carriers: [] };
      case "sled": return { ...l, sled: !!value };
      case "incomplete": return { ...l, incomplete: !!value };
      case "lose": return { ...l, status: "lost", carriers: [] };
      default: return l;
    }
  });
  let s = { ...state, loot };
  if (action === "pickUp" && actorId) s = markActed(s, actorId);
  const l = loot.find(x => x.id === lootId);
  if (l?.objective && action === "pickUp") s.objective = { ...s.objective, taken: true };
  return s;
}

/** Carry info for one spider (SpiderData.carryLookup): the heaviest loot it's carrying. */
export function carryFor(state, actorId) {
  const order = ["crumb", "trinket", "prize", "treasure", "score"];
  const carried = (state?.loot ?? []).filter(l => l.status === "carried" && (l.carriers ?? []).includes(actorId));
  if (!carried.length) return null;
  carried.sort((a, b) => order.indexOf(b.tier) - order.indexOf(a.tier));
  const l = carried[0];
  return { tier: l.tier, carriers: (l.carriers ?? []).length, sled: !!l.sled, lootId: l.id, present: presentCrew(state).length };
}

/** Who is being carried (Critical spiders): [{carrier, passenger}]. */
export function setAssist(state, carrier, passenger, on = true) {
  const list = (state.assists ?? []).filter(a => !(a.carrier === carrier && a.passenger === passenger) && a.passenger !== passenger);
  return { ...state, assists: on ? [...list, { carrier, passenger }] : list };
}

/* --------------------------------------------------------------- effects -- */

let effectCounter = 0;

/** Add a round/scene effect. */
export function addEffect(state, effect) {
  const id = effect.id ?? `fx-${num(state.roundSerial)}-${(state.effects ?? []).length + 1}-${++effectCounter}`;
  return { ...state, effects: [...(state.effects ?? []), { skills: [], actors: [], excludeActors: [], ...effect, id }] };
}

export function removeEffect(state, id) {
  return { ...state, effects: (state.effects ?? []).filter(e => e.id !== id) };
}

/** Effects that apply to a roll by this spider with this Skill at this obstacle. */
export function activeEffects(state, { actorId = null, skill = null, obstacleId = state?.current ?? null } = {}) {
  return (state?.effects ?? []).filter(e => {
    if (e.skills?.length && skill && !e.skills.includes(skill)) return false;
    if (e.skills?.length && !skill) return false;
    if (e.actors?.length && !e.actors.includes(actorId)) return false;
    if (e.excludeActors?.length && e.excludeActors.includes(actorId)) return false;
    if (e.obstacleId && obstacleId && e.obstacleId !== obstacleId) return false;
    return true;
  });
}

/* ------------------------------------------------------------- flaws, etc -- */

/** Schedule (or delay) a once-per-heist Flaw to fire at a round. */
export function scheduleFlaw(state, { actorId, flawKey, dueRoundSerial }) {
  const rest = (state.flawSchedule ?? []).filter(f => !(f.actorId === actorId && f.flawKey === flawKey));
  return { ...state, flawSchedule: [...rest, { actorId, flawKey, dueRoundSerial: num(dueRoundSerial) }] };
}

/** Delay a Flaw by a round (1 SP). */
export function delayFlaw(state, actorId, flawKey) {
  return scheduleFlaw(state, { actorId, flawKey, dueRoundSerial: num(state.roundSerial) + 1 });
}

/** Lookout's Contingency: the named roll becomes a Success, once. */
export function setContingency(state, { actorId, trigger, rollDesc = "" }) {
  return { ...state, contingency: { actorId, trigger, rollDesc, used: false } };
}

/* --------------------------------------------------------- creatures ops -- */

/** Patch one creature's state. */
export function patchCreature(state, creatureId, patch) {
  return {
    ...state,
    creatures: (state.creatures ?? []).map(c => (c.id === creatureId ? { ...c, ...(patch.record ?? {}), state: { ...c.state, ...(patch.state ?? patch) } } : c))
  };
}

/* --------------------------------------------------------------- escape -- */

/** The Escape is over: everyone still on the board got out, with what they carry. */
export function finishEscape(state) {
  const crew = (state.crew ?? []).map(c => (c.status === "present" ? { ...c, status: "escaped" } : c));
  const escaped = new Set(crew.filter(c => c.status === "escaped").map(c => c.actorId));
  const loot = (state.loot ?? []).map(l => (l.status === "carried" && (l.carriers ?? []).some(a => escaped.has(a)) ? { ...l, status: "escaped" } : l));
  return { ...state, crew, loot };
}

/* --------------------------------------------------------------- debrief -- */

/**
 * full: a carrier escaped with the objective loot, complete and not lost;
 * partial: otherwise, if any spider escaped; loss: nobody escaped.
 */
export function debriefOutcome(state) {
  const escaped = new Set((state?.crew ?? []).filter(c => c.status === "escaped").map(c => c.actorId));
  if (!escaped.size) return "loss";
  const obj = (state.loot ?? []).find(l => l.objective);
  const gotIt = !!obj && obj.status !== "lost" && !obj.incomplete &&
    (obj.status === "escaped" || (obj.status === "carried" && (obj.carriers ?? []).some(a => escaped.has(a))));
  return gotIt ? "full" : "partial";
}

/** AP for the outcome: full award, half (rounded down) for a Partial, none for a Loss. */
export function apAward(difficultyKey, outcome) {
  const full = AP_BY_DIFFICULTY[difficultyKey] ?? HEISTY.advancement?.awards?.[difficultyKey] ?? 0;
  if (outcome === "full") return full;
  if (outcome === "partial") return Math.floor(full / 2);
  return 0;
}

/**
 * AP per player slot: every spider of the slot (the original and any
 * replacement) gets it; a slot whose spider was caught in the last Escape
 * obstacle earns half, rounded down (N13).
 * @returns {{slot, actorIds:string[], ap:number, half:boolean}[]}
 */
export function apAwards(state, outcome = debriefOutcome(state)) {
  const base = apAward(state.difficulty, outcome);
  const slots = new Map();
  for (const c of state.crew ?? []) {
    const k = c.slot || c.actorId;
    const e = slots.get(k) ?? { slot: k, actorIds: [], half: false };
    e.actorIds.push(c.actorId);
    if (c.caughtLastEscape) e.half = true;
    slots.set(k, e);
  }
  return [...slots.values()].map(e => ({ ...e, actorIds: uniq(e.actorIds), ap: e.half ? Math.floor(base / 2) : base }));
}

/* ---------------------------------------------------------- roll context -- */

/**
 * What a roll by this spider with this Skill is up against right now (for the
 * roll dialog, WP-B): the phase, the obstacle and its approaches using the
 * Skill, round effects, an open group check (with its creature's one roll this
 * round), Casing in Planning.
 */
export function rollContext(state, { actorId = null, skillKey = null, roleKey = null, alert = 0, fullAlert = false } = {}) {
  const phase = state?.phase ?? "idle";
  const ob = currentObstacle(state);
  const inPlay = phase === "heist" || phase === "escape";
  const approaches = inPlay && ob
    ? (ob.approaches ?? []).filter(a => !(a.excludeRoles ?? []).includes(roleKey)).map(a => ({ ...a, matches: !skillKey || (a.skills ?? []).includes(skillKey) }))
    : [];
  const group = Object.entries(state?.groups ?? {}).find(([, g]) => !g.closed && g.obstacleId === state.current && (g.expected ?? []).includes(actorId) && !g.rolls?.[actorId]);
  const passed = new Set(state?.progress?.[state?.current]?.passedActors ?? []);
  const engaged = inPlay && ob ? (state.creatures ?? []).filter(c => {
    const def = creatureDef(c.key);
    return def && isEngaged(def, c.state, creatureContext(state, c, { alert, fullAlert }));
  }).map(c => ({ id: c.id, key: c.key, name: c.name, attack: creatureDef(c.key)?.attack ?? null })) : [];
  const humanRow = ob?.human ?? null;
  return {
    active: phase !== "idle",
    heistId: state?.heistId ?? "freeplay",
    phase,
    clock: clock(state),
    noRolls: phase === "score",
    alertOff: phase === "planning" || phase === "score",
    casing: phase === "planning" && ["perception", "tactics"].includes(skillKey) && canCase(state, actorId),
    obstacle: ob ? {
      id: ob.id, name: ob.name, phase: ob.phase, kind: ob.kind, tags: [...(ob.tags ?? [])], human: humanRow,
      silkLinePrepared: !!ob.silkLinePrepared, keyLock: !!ob.keyLock, threats: [...(ob.threats ?? [])]
    } : null,
    approaches,
    effects: activeEffects(state, { actorId, skill: skillKey }),
    group: group ? { groupId: group[0], approachId: group[1].approachId, opposed: group[1].opposed?.roundSerial === state.roundSerial ? group[1].opposed : null, ledBy: group[1].ledBy ?? null } : null,
    passed: passed.has(actorId),
    engaged,
    fullAlertEscape: phase === "escape" && !!fullAlert,
    contingency: state?.contingency && !state.contingency.used && state.contingency.actorId ? { ...state.contingency } : null,
    round: num(state?.round)
  };
}
