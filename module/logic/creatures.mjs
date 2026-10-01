/**
 * HEISTY SPIDEYS — Creature automation (pure; design §3.7, §16 #5–8)
 * -------------------------------------------------------------------
 * Activation, Escalation steps and spikes, per-round +X, shut / back-off /
 * beaten states and "engaged" for the Chapter 16 stat blocks. Rules (v4.8):
 *
 *  - A creature is active from the first Escalation step the Alert reaches —
 *    or from the start if the heist says it is awake or aware — and stays
 *    active for the rest of the heist (Ch 9). Full Alert counts as every step
 *    at once (Ch 16, E43).
 *  - Its +X is added at the end of every round the crew spends at its
 *    obstacle — the round they clear it included — and at every obstacle once
 *    it roams (a cat once awake, anything hunting, a guard once aware), or
 *    wherever it can hear them if it hears a whole floor (the parrot).
 *  - Clearing a creature's obstacle with its Weakness, Brawl or Intimidation
 *    backs it off for the rest of that obstacle (no attacks, no +X there; the
 *    clearing round's +X still counts). A Weakness that shuts it in stays shut
 *    all heist: the snake can't strike, hunt or roam but still counts at its own
 *    obstacle; a covered parrot is quiet all night (no +1, no shriek).
 *  - A beaten guard is out of the heist; its backup, already aware, takes its
 *    post at the start of the next obstacle and never follows the crew beyond it.
 *  - A paid-off guard's awareness ends (no +X for the rest of the heist).
 *  - Dog: +2 once, the first time the Alert reaches 4. Parrot: +2 once, at
 *    Alert 7, at the first spider it can SEE. Rat: +2 once when the deal goes bad.
 *
 * Creature runtime state (heistState.creatures[].state):
 *   { active, hunting, aware, pursuit, bad, paid, onMap, shut, beaten, holdsPost,
 *     drivenOffAt, drivenOffRound, suppressedUntilRound, stepMax, spikesFired: [] }
 */

/** The Chapter 15 human rows (Difficulty you roll against; humans never roll to spot you). */
export const HUMAN_ROWS = Object.freeze({
  sleeping: { label: "Sleeping Human", difficulty: 2, skills: ["stealth"] },
  distracted: { label: "Distracted Human", difficulty: 1, skills: ["stealth"] },
  alert: { label: "Alert Human", difficulty: 4, skills: ["deception", "stealth"] },
  broom: { label: "Human With Broom", difficulty: 3, skills: ["athletics"] },
  lightsOn: { label: "Human in the kitchen, lights on", difficulty: 2, skills: ["stealth"] }
});

const step = (at, text) => ({ at, text });

/**
 * The automation table, keyed by pack key. `perRoundWhen`: when the +X counts —
 * active | aware | pursuit | repeating | onMap | none. `roams`: active | hunting |
 * aware | always | earshot | never | route | procedure. `attackWhen`: active |
 * hunting | bad. A threat actor's `system.automation.*` fields override these.
 */
export const CREATURE_AUTOMATION = Object.freeze({
  "house-cat": {
    key: "house-cat", name: "House Cat", aliases: ["cat", "library cat", "the cat"],
    perRound: 1, perRoundWhen: "active", wakeAt: 3, huntAt: 7, roams: "active",
    perception: { label: "Perception", pool: 4, index: 0 },
    attack: { label: "Pounce", pool: 4, index: 2 }, attackWhen: "active",
    weakness: "Shiny objects (Difficulty 1 to redirect), loud noises the other way, cucumbers.",
    steps: [step(3, "Wakes: ears rotate and it starts to prowl — awake, so it roams."), step(5, "Moves toward the sound."), step(7, "Hunting.")],
    spikes: []
  },
  "house-dog": {
    key: "house-dog", name: "House Dog", aliases: ["dog", "the dog"],
    perRound: 2, perRoundWhen: "active", wakeAt: 2, huntAt: null, roams: "active",
    perception: { label: "Nose", pool: 5, index: 0 },
    attack: { label: "Chase", pool: 4, index: 1 }, attackWhen: "active",
    weakness: "Treats, another animal to fixate on, going outside.",
    steps: [step(2, "Smells a spider — no line of sight needed."), step(4, "Barks: +2, once.")],
    spikes: [{ key: "bark", at: 4, delta: 2, label: "The dog barks (+2, once)" }]
  },
  vacuum: {
    key: "vacuum", name: "Vacuum", aliases: ["the vacuum", "robot vacuum"],
    perRound: 1, perRoundWhen: "pursuit", wakeAt: null, huntAt: null, roams: "route",
    perception: { label: "Navigation", pool: 2, index: 0 },
    attack: { label: "Pursuit", pool: 3, index: 1 }, attackWhen: "active",
    fearOfVacuums: true,
    weakness: "Furniture legs, small obstacles, and stairs.",
    steps: [], spikes: []
  },
  "curious-child": {
    key: "curious-child", name: "Curious Child", aliases: ["child", "the child", "kid"],
    perRound: 0, perRoundWhen: "none", wakeAt: 0, huntAt: null, roams: "always",
    perception: { label: "Spotting", pool: 4, index: 0 },
    attack: { label: "Capture Attempt", pool: 3, index: 1 }, attackWhen: "active",
    capture: true, captureAlert: 3,
    weakness: "Television (1), toys (1), snacks (0).",
    steps: [step(7, "Shouts for a parent (automatic at Alert 7+).")], spikes: []
  },
  "guard-spider": {
    key: "guard-spider", name: "Guard Spider", aliases: ["guard", "the guard", "guard spider backup"],
    perRound: 1, perRoundWhen: "aware", wakeAt: null, huntAt: null, roams: "aware",
    perception: { label: "Perception", pool: 4, index: 0 },
    attack: { label: "Brawl", pool: 3, index: 1 }, attackWhen: "active",
    spottedIsTrigger: true, backupOnBeaten: true,
    weakness: "Bribery, the Grifter's Decoy (once), the Bruiser (loudly). Not charmed by the Face.",
    steps: [], spikes: []
  },
  "corn-snake": {
    key: "corn-snake", name: "Corn Snake", aliases: ["snake", "the snake"],
    perRound: 1, perRoundWhen: "active", wakeAt: 3, huntAt: 7, roams: "hunting",
    perception: { label: "Perception", pool: 3, index: 0 },
    attack: { label: "Strike", pool: 4, index: 1 }, attackWhen: "hunting",
    shutKeepsHereX: true,
    weakness: "A heat lamp; a lid that's actually shut (no strikes or hunting; it still counts at its own obstacle).",
    steps: [step(3, "Tongue flicks toward the crew."), step(5, "Noses at the loose lid."), step(7, "Out of the tank and hunting.")],
    spikes: []
  },
  "alert-parrot": {
    key: "alert-parrot", name: "Alert Parrot", aliases: ["parrot", "the parrot"],
    perRound: 1, perRoundWhen: "repeating", wakeAt: 5, huntAt: null, roams: "earshot",
    perception: { label: "Perception", pool: 4, index: 0 },
    attack: null, attackWhen: "active",
    shutSilences: true,
    weakness: "A cloth over the cage (quiet all night); a cracker (Persuasion 1).",
    steps: [step(3, "Mutters."), step(5, "Repeats every noise — its +1 counts anywhere on its floor."), step(7, "Shrieks at the first spider it sees: +2, once.")],
    spikes: [{ key: "shriek", at: 7, delta: 2, label: "The parrot shrieks (+2, once)", needsSight: true }]
  },
  "protection-rat": {
    key: "protection-rat", name: "The Rat", aliases: ["rat", "the rat", "protection rat"],
    perRound: 0, perRoundWhen: "none", wakeAt: null, huntAt: null, roams: "never",
    perception: { label: "Perception", pool: 3, index: 0 },
    attack: { label: "Brawl", pool: 4, index: 1 }, attackWhen: "bad",
    haggle: { label: "Haggle", pool: 4, index: 2 },
    dealBadAlert: 2,
    weakness: "Food, a favour owed, being treated like a professional.",
    steps: [], spikes: []
  },
  "the-exterminator": {
    key: "the-exterminator", name: "The Exterminator", aliases: ["exterminator"],
    perRound: 1, perRoundWhen: "onMap", wakeAt: null, huntAt: null, roams: "always",
    perception: { label: "Perception", pool: 5, index: 0 },
    attack: { label: "Spray", pool: 5, index: 1 }, attackWhen: "active",
    callableAt: 7, sprayInOpenIsOut: true,
    weakness: "Can't fit anywhere small; leaves once the job looks done.",
    steps: [step(7, "The humans could call the Exterminator now (the ST's call).")], spikes: []
  },
  goldfish: {
    key: "goldfish", name: "Goldfish", aliases: ["fish"],
    perRound: 0, perRoundWhen: "none", wakeAt: null, huntAt: null, roams: "never",
    perception: { label: "Perception", pool: 1, index: 0 }, attack: null, attackWhen: "active",
    weakness: "None that matter.", steps: [], spikes: []
  },
  human: {
    key: "human", name: "Human", aliases: ["the human", "librarian", "staff", "staffer", "cleaner", "the librarian"],
    perRound: 0, perRoundWhen: "none", wakeAt: null, huntAt: null, roams: "procedure",
    perception: { label: "Perception", pool: 3, index: 1 },
    attack: { label: "Swat", pool: 3, index: 0 }, attackWhen: "active",
    isHuman: true, glassOnCritical: true,
    weakness: "Its phone, the TV, and a deep conviction that it imagined you.",
    steps: [step(5, "Stirs."), step(7, "Up with the lights on (also at Full Alert). Its row doesn't change.")],
    spikes: []
  }
});

/** Slugify like the pack keys (`slug("Spider-Sense… Sort Of") = "spider-sense-sort-of"`). */
export function slug(s) {
  return String(s ?? "")
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[‘’']/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Pack key for a creature name, key or alias ("The Rat" → "protection-rat").
 * @returns {string|null}
 */
export function resolveCreatureKey(nameOrKey) {
  const s = slug(nameOrKey);
  if (!s) return null;
  if (CREATURE_AUTOMATION[s]) return s;
  for (const def of Object.values(CREATURE_AUTOMATION)) {
    if (slug(def.name) === s) return def.key;
    if ((def.aliases ?? []).some(a => slug(a) === s)) return def.key;
  }
  // "Guard Spider (backup)" and the like.
  for (const def of Object.values(CREATURE_AUTOMATION)) {
    if (s.startsWith(`${slug(def.name)}-`)) return def.key;
  }
  return null;
}

/**
 * The effective definition: the table entry, overridden by a threat actor's
 * `system.automation` fields where they aren't null/blank.
 */
export function creatureDef(key, overrides = null) {
  const base = CREATURE_AUTOMATION[key] ?? null;
  if (!overrides) return base;
  const out = { ...(base ?? { key, name: key, perRound: 0, perRoundWhen: "active", wakeAt: null, huntAt: null, roams: "never", attack: null, attackWhen: "active", steps: [], spikes: [] }) };
  if (overrides.perRound !== null && overrides.perRound !== undefined) out.perRound = Number(overrides.perRound) || 0;
  if (overrides.wakeAt !== null && overrides.wakeAt !== undefined) out.wakeAt = Number(overrides.wakeAt);
  if (overrides.huntAt !== null && overrides.huntAt !== undefined) out.huntAt = Number(overrides.huntAt);
  if (overrides.roams) out.roams = overrides.roams;
  if (overrides.attackPool !== null && overrides.attackPool !== undefined && out.attack) out.attack = { ...out.attack, pool: Number(overrides.attackPool) };
  if (overrides.attackIndex !== null && overrides.attackIndex !== undefined && out.attack) out.attack = { ...out.attack, index: Number(overrides.attackIndex) };
  return out;
}

/** A fresh state object. */
export function newCreatureState(patch = {}) {
  return {
    active: false, hunting: false, aware: false, pursuit: false, bad: false, paid: false, onMap: false,
    shut: false, beaten: false, holdsPost: false, drivenOffAt: null, drivenOffRound: null,
    suppressedUntilRound: null, stepMax: -1, spikesFired: [], engaged: false,
    ...patch
  };
}

const eff = (alert, fullAlert) => (fullAlert ? Infinity : Math.max(0, Number(alert) || 0));
const finite = v => v !== null && v !== undefined && Number.isFinite(Number(v));

/**
 * What the creature is doing at this Alert.
 * @returns {{active:boolean, hunting:boolean, roams:boolean, canAttack:boolean, silent:boolean}}
 */
export function creatureStatus(def, st = {}, alert = 0, fullAlert = false) {
  const none = { active: false, hunting: false, roams: false, canAttack: false, silent: false };
  if (!def) return none;
  const a = eff(alert, fullAlert);
  if (st.beaten || st.paid) return { ...none, silent: true };
  let active;
  switch (def.perRoundWhen) {
    case "aware": active = !!(st.aware || st.active); break;
    case "pursuit": active = !!(st.pursuit || st.active); break;
    case "onMap": active = !!st.onMap; break;
    default:
      if (def.key === "protection-rat") active = !!st.bad;
      else active = !!st.active || (finite(def.wakeAt) && a >= Number(def.wakeAt));
  }
  const silent = !!(st.shut && def.shutSilences);
  if (silent) active = false;
  const hunting = active && !st.shut && finite(def.huntAt) && (!!st.hunting || a >= Number(def.huntAt));
  let roams = false;
  switch (def.roams) {
    case "active": roams = active && !st.shut; break;
    case "hunting": roams = hunting; break;
    case "aware": roams = active && !st.holdsPost; break;
    case "always": roams = active; break;
    default: roams = false;
  }
  let canAttack = !!def.attack && active && !st.shut;
  if (canAttack && def.attackWhen === "hunting") canAttack = hunting;
  if (canAttack && def.attackWhen === "bad") canAttack = !!st.bad;
  return { active, hunting, roams, canAttack, silent };
}

/**
 * Escalation after the Alert moves from `prevAlert` to `newAlert`.
 * Activation is permanent; a step once reached stays reached ("whatever woke up
 * stays awake"); spikes fire once. Full Alert counts as every step at once.
 * @param {object} def
 * @param {object} st
 * @param {number} prevAlert
 * @param {number} newAlert
 * @param {boolean} fullAlert
 * @param {{seesCrew?:boolean}} [ctx]  the parrot shrieks only at a spider it can see
 * @returns {{spikes:{key,delta,label,eventKey}[], patch:object, steps:{at,text}[], armed:string[]}}
 */
export function escalationEvents(def, st = {}, prevAlert = 0, newAlert = 0, fullAlert = false, ctx = {}) {
  const out = { spikes: [], patch: {}, steps: [], armed: [] };
  if (!def || st.beaten || st.paid) return out;
  const a = eff(newAlert, fullAlert);
  const stepMax = Number.isFinite(Number(st.stepMax)) ? Number(st.stepMax) : -1;
  const reached = (def.steps ?? []).filter(s => s.at > stepMax && a >= s.at);
  if (reached.length) {
    out.steps = reached.map(s => ({ ...s }));
    out.patch.stepMax = Math.max(stepMax, ...reached.map(s => s.at));
  }
  const silenced = !!(st.shut && def.shutSilences);
  if (!silenced && !st.active && finite(def.wakeAt) && a >= Number(def.wakeAt)) out.patch.active = true;
  if (!st.shut && !st.hunting && finite(def.huntAt) && a >= Number(def.huntAt)) out.patch.hunting = true;
  const fired = new Set(st.spikesFired ?? []);
  for (const sp of def.spikes ?? []) {
    if (fired.has(sp.key) || a < sp.at) continue;
    if (st.shut) continue;
    if (sp.needsSight && !ctx.seesCrew) { out.armed.push(sp.key); continue; }
    out.spikes.push({ key: sp.key, delta: sp.delta, label: sp.label });
    fired.add(sp.key);
  }
  if (out.spikes.length) out.patch.spikesFired = [...fired];
  return out;
}

/**
 * The creature's +X for one End Round.
 * @param {object} def
 * @param {object} st
 * @param {{here?:boolean, earshot?:boolean, obstacleSerial?:number, roundSerial?:number, alert?:number, fullAlert?:boolean}} ctx
 * @returns {number}
 */
export function perRoundDelta(def, st = {}, ctx = {}) {
  if (!def || !(Number(def.perRound) > 0)) return 0;
  const { here = false, earshot = false, obstacleSerial = null, roundSerial = 0, alert = 0, fullAlert = false } = ctx;
  const s = creatureStatus(def, st, alert, fullAlert);
  if (!s.active) return 0;
  if (st.paid || st.beaten) return 0;
  if (finite(st.suppressedUntilRound) && Number(roundSerial) <= Number(st.suppressedUntilRound)) return 0;
  // Driven off: no +X for the rest of that obstacle — the clearing round's still counts.
  if (st.drivenOffAt !== null && st.drivenOffAt !== undefined && st.drivenOffAt === obstacleSerial) {
    if (!finite(st.drivenOffRound) || Number(roundSerial) > Number(st.drivenOffRound)) return 0;
  }
  const counts = here || s.roams || (earshot && def.roams === "earshot");
  return counts ? Number(def.perRound) : 0;
}

/**
 * Is the creature engaged with a spider who just failed? (N18) Already active
 * and able to reach them this round, or fighting them; a hunting creature
 * reaches anyone; in a Full Alert Escape everything active is after the crew.
 */
export function isEngaged(def, st = {}, ctx = {}) {
  const { here = false, alert = 0, fullAlert = false, escape = false, fighting = false } = ctx;
  const s = creatureStatus(def, st, alert, fullAlert);
  if (!s.canAttack) return false;
  if (st.drivenOffAt !== null && st.drivenOffAt !== undefined && st.drivenOffAt === ctx.obstacleSerial) return false;
  return !!(fighting || st.engaged || (here && s.active) || s.hunting || (fullAlert && escape && (here || s.roams)));
}

/**
 * The engaged attackers, biggest attack first ("if several see you fail, the
 * biggest attack lands"). `list` = [{id, def, st, here}].
 * @returns {{id, pool, label, index}[]}
 */
export function engagedAttackers(list, ctx = {}) {
  return (list ?? [])
    .filter(c => c?.def?.attack && isEngaged(c.def, c.st, { ...ctx, here: !!c.here }))
    .map(c => ({ id: c.id, key: c.def.key, pool: Number(c.def.attack.pool) || 0, label: `${c.name ?? c.def.name} — ${c.def.attack.label}`, index: c.def.attack.index }))
    .sort((a, b) => b.pool - a.pool);
}

/* ------------------------------------------------------------ state changes -- */

/**
 * Clearing a creature's obstacle with its Weakness, Brawl or Intimidation backs
 * it off for the rest of that obstacle (the clearing round's +X still counts).
 */
export function driveOff(st, obstacleSerial, roundSerial) {
  return { ...st, drivenOffAt: obstacleSerial, drivenOffRound: roundSerial };
}

/** A Weakness that shuts it in (the snake's lid, the parrot's cover) holds all heist. */
export function shutIn(st) {
  return { ...st, shut: true, hunting: false };
}

/** A bribe (or a successful talk) ends a guard's awareness: no +X for the rest of the heist. */
export function payOff(st) {
  return { ...st, paid: true, aware: false };
}

/**
 * Beaten in a fight. A guard is out of the heist and its backup (already aware)
 * takes the post at the start of the next obstacle; anything else is driven off.
 * @returns {{st:object, backup:boolean}}
 */
export function beat(def, st, obstacleSerial, roundSerial) {
  if (def?.backupOnBeaten && !st.holdsPost) return { st: { ...st, beaten: true, aware: false, active: false }, backup: true };
  if (def?.backupOnBeaten && st.holdsPost) return { st: { ...st, beaten: true, aware: false, active: false }, backup: false };
  return { st: driveOff(st, obstacleSerial, roundSerial), backup: false };
}

/** The guard's backup: a fresh guard, already aware, holding the post. */
export function backupState(arrivesAtSerial) {
  return newCreatureState({ aware: true, active: true, holdsPost: true, arrivesAtSerial });
}

/**
 * The Rat's deal goes bad (a fight, a failed pitch, or leaving with the trap set):
 * +2 Alert once, then he fights (Brawl 4).
 * @returns {{st:object, spike:object|null}}
 */
export function dealGoesBad(def, st) {
  if (st.bad) return { st, spike: null };
  const fired = new Set(st.spikesFired ?? []);
  fired.add("dealBad");
  return {
    st: { ...st, bad: true, active: true, spikesFired: [...fired] },
    spike: { key: "dealBad", delta: Number(def?.dealBadAlert ?? 2), label: "The Rat's deal goes bad (+2, once)" }
  };
}

/** The guard spots the crew: aware for the heist; its "spotted" +1 is the trigger itself. */
export function spotted(def, st) {
  if (!def?.spottedIsTrigger) return { st, trigger: null };
  return { st: { ...st, aware: true, active: true }, trigger: st.aware ? null : { key: "spotted", delta: 1, label: `${def.name} spots the crew` } };
}

/** Can the ST call the Exterminator now? Only at Lockdown (7+) or Full Alert. */
export function canCallExterminator(alert, fullAlert) {
  return !!fullAlert || Number(alert) >= 7;
}
