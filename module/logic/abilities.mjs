/**
 * HEISTY SPIDEYS — Abilities registry and usage (pure)
 * ----------------------------------------------------
 * Every species ability, Signature Move, Perk and Flaw in the compendium has an
 * entry here, keyed by its ability key (see keys.mjs). An entry says how often
 * it can be used (`freq`), when (`timing`), and how much of it the system does
 * by itself (`automation`):
 *   auto     — applied with no click (roll plan, derived data, hooks)
 *   button   — one click by the owner (the sheet's Abilities panel)
 *   reaction — a card button at the right moment (roll / attack / Alert cards)
 *   prompt   — a one-click Storyteller prompt with a rules-correct default
 *   text     — narrative only; the system just shows the text
 *
 * "Once per X" uses are stamped on the item as a snapshot of the heist clock
 * (`system.usage = {heistId, sceneSerial, roundSerial, count}`); an ability is
 * available again as soon as the clock has moved past the stamp, so resets
 * need no writes at all (docs/AUTOMATION-DESIGN.md §1, §3.11).
 *
 * Foundry-free; unit-tested in test/abilities.test.mjs.
 */

import { FREQ } from "../contracts.mjs";

/* -------------------------------------------- */
/*  Registry                                    */
/* -------------------------------------------- */

const def = (key, o) => Object.freeze({
  key,
  kind: o.kind,
  name: o.name,
  freq: o.freq ?? FREQ.always,
  scope: o.scope ?? "spider",
  cost: o.cost ?? 0,
  timing: o.timing ?? "passive",
  automation: o.automation ?? "auto",
  effect: o.effect ?? "",
  ...(o.extra ?? {})
});

const species = (key, o) => def(`species:${key}`, { kind: "species", ...o, extra: { species: key, ...(o.extra ?? {}) } });
const sig = (key, o) => def(`sig:${key}`, { kind: "signature", ...o, extra: { role: key, ...(o.extra ?? {}) } });
const perk = (role, key, o) => def(key, { kind: "perk", ...o, extra: { role, ...(o.extra ?? {}) } });
const flaw = (key, o) => def(key, { kind: "flaw", ...o });

/**
 * The ability registry. Extra fields used by the runtime:
 *   action    — the ability-actions handler that runs the button
 *   modes     — choices offered when the button is clicked
 *   target    — "crewmate" | "npc" | "crew" | "self"
 *   roll      — a pre-bound roll { skill, difficulty, range? }
 *   phases    — the heist phases it can be used in (ignored in freeplay)
 *   setup     — a text field on system.heist that the ability needs
 *   stTriggered, delayCost — once-per-heist Flaws the ST fires (§3.12)
 *   rollMods  — what it does to a roll plan (read by WP-B's rolls.mjs)
 *   question  — the Storyteller prompt an information Perk whispers
 */
export const ABILITIES = Object.freeze(Object.fromEntries([

  /* ---------- Species (Chapter 4) ---------- */
  species("jumping", {
    name: "Did You See That Jump?!", freq: FREQ.scene, timing: "action", automation: "button",
    effect: "Automatic success on one straight leap up to your Speed in squares; it doesn't make you land quietly.",
    extra: { action: "autoSuccess" }
  }),
  species("orbweaver", {
    name: "Everything Connects", freq: FREQ.scene, timing: "action", automation: "button",
    effect: "Spin up to 3 connected squares. Snare: the first creature in is caught (Action, or Athletics/Brawl D3). Line: the crew crosses on it with no Acrobatics roll, until the scene ends.",
    extra: { action: "orbWeb", modes: [{ id: "line", label: "Line (safe footing)" }, { id: "snare", label: "Snare" }] }
  }),
  species("wolf", {
    name: "Run It Again", freq: FREQ.scene, timing: "reaction", automation: "reaction",
    effect: "On a Failure or Partial on a chase, pursuit or physical-confrontation roll (a shrug-off counts), reroll every die that didn't succeed; the Successes stay.",
    extra: { reroll: "allFailed" }
  }),
  species("cellar", {
    name: "Contortionist", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "Squeezes need no roll; may pass through occupied squares (not end there).",
    extra: { rollMods: { autoPassTags: ["squeeze"] } }
  }),
  species("spitting", {
    name: "Precision Application", freq: FREQ.scene, timing: "action", automation: "button",
    effect: "A strand up to 6 squares, no roll: jam a small mechanism, snag a light object, or pin a small target for one round.",
    extra: {
      action: "spit", range: 6,
      modes: [{ id: "jam", label: "Jam a small mechanism" }, { id: "snag", label: "Snag a light object" }, { id: "pin", label: "Pin a small target (1 round)" }]
    }
  }),
  species("crab", {
    name: "Wait, Was That There Before?", freq: FREQ.always, timing: "free", automation: "button",
    effect: "Hold still for one full turn: Stealth Difficulty −2 until you move (cleared automatically when your token moves).",
    extra: { action: "camouflage", rollMods: { skills: ["stealth"], diff: -2, when: "camouflaged" } }
  }),

  /* ---------- Signature Moves (Chapter 5) ---------- */
  sig("face", {
    name: "That's Not What Happened", freq: FREQ.heist, cost: 2, timing: "reaction", automation: "reaction",
    effect: "After any roll this round (an NPC's included): cancel the Alert it caused. A Failure still made no progress.",
    extra: { cancel: "thatsNotWhatHappened" }
  }),
  sig("ghost", {
    name: "Phase Through", freq: FREQ.scene, timing: "action", automation: "button",
    effect: "Through any gap a spider could fit: no roll, no Alert; you're past this obstacle. A Cellar Spider takes the loot through whatever its size.",
    extra: { action: "phaseThrough" }
  }),
  sig("tinkerer", {
    name: "I Made a Thing", freq: FREQ.scene, timing: "action", automation: "button",
    effect: "Bypass: −1 Difficulty on your next Engineering roll at a small mechanism (not the key lock). Boost: a crewmate gets +2 dice on their next roll. Distraction: nearby NPCs are distracted for one round.",
    extra: {
      action: "madeAThing",
      modes: [{ id: "bypass", label: "Bypass (−1 Difficulty, Engineering)" }, { id: "boost", label: "Boost (+2 dice to a crewmate)" }, { id: "distraction", label: "Distraction (NPCs, 1 round)" }]
    }
  }),
  sig("bruiser", {
    name: "Make a Scene", freq: FREQ.scene, timing: "free", automation: "button",
    effect: "Every NPC turns on you for one round; every other crewmate gets +2 dice this round. +1 Alert, the only Alert it costs.",
    extra: { action: "makeAScene", alert: 1 }
  }),
  sig("lookout", {
    name: "I Called It", freq: FREQ.heist, timing: "beforeRoll", automation: "button",
    effect: "Before any roll: the roller gets +1 die if it's plausible, +2 if it fits what's established (the ST picks), nothing if it contradicts.",
    extra: { action: "iCalledIt", target: "crewmate" }
  }),
  sig("wheelman", {
    name: "I Know a Way", freq: FREQ.heist, timing: "free", automation: "button",
    effect: "During the Escape only: every Escape roll is −1 Difficulty for the whole crew.",
    extra: { action: "iKnowAWay", phases: ["escape"] }
  }),
  sig("grifter", {
    name: "You're Looking at the Wrong Spider", freq: FREQ.heist, timing: "action", automation: "button",
    effect: "Decoy: every NPC that fails a Perception D3 investigates it for two rounds; job rolls get +1 die for those rounds.",
    extra: { action: "decoy", npcCheck: { difficulty: 3 }, rounds: 2 }
  }),

  /* ---------- Perks: the Face ---------- */
  perk("face", "silver-tongue", {
    name: "Silver Tongue", freq: FREQ.always, timing: "reaction", automation: "reaction",
    effect: "When you fail a Persuasion roll, reroll it once.",
    extra: { reroll: "whole", skills: ["persuasion"] }
  }),
  perk("face", "read-the-room", {
    name: "Read the Room", freq: FREQ.always, timing: "free", automation: "prompt",
    effect: "Before a social encounter, ask the ST one thing the NPC actually wants.",
    extra: { action: "infoPrompt", question: "What does this NPC actually want? (Answer honestly.)" }
  }),
  perk("face", "plausible-deniability", {
    name: "Plausible Deniability", freq: FREQ.heist, timing: "reaction", automation: "reaction",
    effect: "Talk away one +1 Alert rise this round (never a +2 or more).",
    extra: { cancel: "plausibleDeniability" }
  }),
  perk("face", "fast-talk", {
    name: "Fast Talk", freq: FREQ.scene, timing: "free", automation: "button",
    effect: "Distract one NPC, no roll, for exactly one round.",
    extra: { action: "fastTalk", target: "npc" }
  }),
  perk("face", "actually-i-planned-this", {
    name: "Actually, I Planned This", freq: FREQ.heist, timing: "free", automation: "button",
    effect: "After a plan visibly falls apart (the ST confirms): every crewmate gets +1 die on their next roll.",
    extra: { action: "plannedThis" }
  }),
  perk("face", "familiar-face", {
    name: "Familiar Face", freq: FREQ.always, timing: "free", automation: "prompt",
    effect: "You know one true detail about the target or location that wasn't in the briefing (never the unknown obstacle).",
    extra: { action: "infoPrompt", question: "Tell them one true detail about the target or location that wasn't in the briefing (never the unknown obstacle)." }
  }),

  /* ---------- Perks: the Ghost ---------- */
  perk("ghost", "silk-trail", {
    name: "Silk Trail", freq: FREQ.always, timing: "free", automation: "text",
    effect: "Leave a near-invisible line anywhere you've been; the crew can follow or zip along it (holds two)."
  }),
  perk("ghost", "dead-drop", {
    name: "Dead Drop", freq: FREQ.planning, timing: "planning", automation: "button",
    effect: "During Planning: stash a small item anywhere, no roll, no complication, and it isn't your Preparation.",
    extra: { action: "preparation", phases: ["planning"], prep: "stash" }
  }),
  perk("ghost", "soundless", {
    name: "Soundless", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "Stealth rolls while moving are −1 Difficulty.",
    extra: { rollMods: { skills: ["stealth"], diff: -1, when: "moving" } }
  }),
  perk("ghost", "second-story-spider", {
    name: "Second-Story Spider", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "Climb any surface at full Speed with no roll, slick or hostile ones included.",
    extra: { rollMods: { autoPassTags: ["slippery", "climb"] } }
  }),
  perk("ghost", "ghost-protocol", {
    name: "Ghost Protocol", freq: FREQ.always, timing: "reaction", automation: "button",
    effect: "When you're the one spotted, make a free Stealth roll at once to vanish before the NPC reacts.",
    extra: { action: "rollCheck", roll: { skill: "stealth", free: true } }
  }),
  perk("ghost", "i-was-never-here", {
    name: "I Was Never Here", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "Rolls to make an NPC forget or doubt it saw you are −2 Difficulty.",
    extra: { rollMods: { diff: -2, when: "makeThemForget" } }
  }),

  /* ---------- Perks: the Tinkerer ---------- */
  perk("tinkerer", "jury-rig", {
    name: "Jury-Rig", freq: FREQ.scene, timing: "action", automation: "button",
    effect: "Fix, jam or modify a small mechanical device: Engineering, Difficulty 2.",
    extra: { action: "rollCheck", roll: { skill: "engineering", difficulty: 2 } }
  }),
  perk("tinkerer", "spider-sense-sort-of", {
    name: "Spider-Sense… Sort Of", freq: FREQ.always, timing: "action", automation: "prompt",
    effect: "Spend a turn observing an area: the ST says whether any mechanical traps, alarms or sensors are present (not where).",
    extra: { action: "infoPrompt", usesAction: true, question: "Are any mechanical traps, alarms or sensors present in this area? (Yes or no — not where.)" }
  }),
  perk("tinkerer", "overclock", {
    name: "Overclock", freq: FREQ.always, cost: 1, timing: "beforeRoll", automation: "auto",
    effect: "1 SP: +2 dice on an Engineering roll (Silk dice, outside the +2 limit). An option in the roll dialog.",
    extra: { rollMods: { skills: ["engineering"], silkDice: 2, cost: 1 } }
  }),
  perk("tinkerer", "field-repair", {
    name: "Field Repair", freq: FREQ.scene, timing: "action", automation: "button",
    effect: "Patch an adjacent crewmate up one Vitality level: Engineering, Difficulty 2, threats present or not.",
    extra: { action: "fieldRepair", target: "crewmate", range: 1, roll: { skill: "engineering", difficulty: 2 } }
  }),
  perk("tinkerer", "trap-architect", {
    name: "Trap Architect", freq: FREQ.planning, timing: "planning", automation: "button",
    effect: "During Planning: set one web trap on the known map; an NPC that triggers it rolls Difficulty 3 to avoid it.",
    extra: { action: "preparation", phases: ["planning"], prep: "trap" }
  }),
  perk("tinkerer", "i-see-how-this-works", {
    name: "I See How This Works", freq: FREQ.always, timing: "free", automation: "prompt",
    effect: "The first time you meet a new lock, alarm or mechanism, ask the ST one yes/no question about it.",
    extra: { action: "infoPrompt", question: "They may ask one yes/no question about how this lock, alarm or mechanism works." }
  }),

  /* ---------- Perks: the Bruiser ---------- */
  perk("bruiser", "take-the-hit", {
    name: "Take the Hit", freq: FREQ.scene, timing: "reaction", automation: "reaction",
    effect: "Before the shrug-off, take a physical hit meant for an adjacent crewmate: the hit and the roll are yours.",
    extra: { range: 1 }
  }),
  perk("bruiser", "unfazed", {
    name: "Unfazed", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "Ignore the −1 die from being Rattled.",
    extra: { derived: "unfazed" }
  }),
  perk("bruiser", "thunderous-entrance", {
    name: "Thunderous Entrance", freq: FREQ.scene, timing: "free", automation: "button",
    effect: "Every NPC must pass a Difficulty 3 check or freeze in surprise for a round.",
    extra: { action: "thunderous", npcCheck: { difficulty: 3 }, rounds: 1 }
  }),
  perk("bruiser", "negotiating-position", {
    name: "Negotiating Position", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "The Face gets +1 die on Persuasion while you're visibly nearby.",
    extra: { rollMods: { skills: ["persuasion"], dice: 1, forRole: "face", when: "nearby" } }
  }),
  perk("bruiser", "silk-grapple", {
    name: "Silk Grapple", freq: FREQ.always, timing: "action", automation: "button",
    effect: "Grab and restrain a target up to 3 squares away: Brawl, Difficulty 3. Small targets are held one round.",
    extra: { action: "rollCheck", target: "npc", range: 3, roll: { skill: "brawl", difficulty: 3 } }
  }),
  perk("bruiser", "that-all-you-got", {
    name: "That All You Got?", freq: FREQ.always, timing: "reaction", automation: "auto",
    effect: "A hit that would drop you to Critical: roll BODY + Endurance (D3); on a pass you stop at Hurt.",
    extra: { roll: { attr: "body", skill: "endurance", difficulty: 3 } }
  }),

  /* ---------- Perks: the Lookout ---------- */
  perk("lookout", "early-warning", {
    name: "Early Warning", freq: FREQ.always, timing: "free", automation: "prompt",
    effect: "At the start of each obstacle the ST says which direction any threat there moves next, awake or not.",
    extra: { action: "infoPrompt", trigger: "obstacleStart", question: "Which direction does each threat here move next, awake or not?" }
  }),
  perk("lookout", "tactical-feed", {
    name: "Tactical Feed", freq: FREQ.round, timing: "free", automation: "button",
    effect: "A crewmate gets +1 die on their next roll (not an Assist; counts toward the +2 limit).",
    extra: { action: "pendingDie", target: "crewmate", dice: 1 }
  }),
  perk("lookout", "pattern-recognition", {
    name: "Pattern Recognition", freq: FREQ.always, timing: "free", automation: "prompt",
    effect: "After watching a patrol or recurring threat for a full round, you know its next three actions.",
    extra: { action: "infoPrompt", question: "They watched it for a full round: tell them its next three actions." }
  }),
  perk("lookout", "contingency", {
    name: "Contingency", freq: FREQ.planning, timing: "planning", automation: "button",
    effect: "During Planning: name a trigger and the roll it replaces. If it happens, that roll is a Success — no Alert, no complication.",
    extra: { action: "contingency", phases: ["planning"] }
  }),
  perk("lookout", "escape-routes", {
    name: "Escape Routes", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "Escape rolls are −1 Difficulty while you lead (the tracker's leader toggle).",
    extra: { rollMods: { escape: true, diff: -1, when: "leading" } }
  }),
  perk("lookout", "counter-surveillance", {
    name: "Counter-Surveillance", freq: FREQ.always, timing: "action", automation: "button",
    effect: "Detect whether an NPC is watching an area: Perception, Difficulty 2; on a success the ST says what's watched and from where.",
    extra: { action: "rollCheck", roll: { skill: "perception", difficulty: 2 }, question: "Counter-Surveillance passed: tell them what's watched and from where." }
  }),

  /* ---------- Perks: the Wheelman ---------- */
  perk("wheelman", "always-a-way-out", {
    name: "Always a Way Out", freq: FREQ.always, timing: "free", automation: "prompt",
    effect: "You can't be fully cornered: when you'd be trapped, you have one option left. It may be unpleasant.",
    extra: { action: "infoPrompt", question: "They're cornered, but they always have one way out. What is it (it may be unpleasant)?" }
  }),
  perk("wheelman", "shortcut", {
    name: "Shortcut", freq: FREQ.planning, timing: "planning", automation: "button",
    effect: "During Planning: one shortcut between two points on the known map; the crew can use it once.",
    extra: { action: "preparation", phases: ["planning"], prep: "shortcut" }
  }),
  perk("wheelman", "dont-look-down", {
    name: "Don't Look Down", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "No height penalty on Acrobatics rolls.",
    extra: { rollMods: { skills: ["acrobatics"], removes: "height" } }
  }),
  perk("wheelman", "passenger", {
    name: "Passenger", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "Carry one incapacitated crewmate at full Speed.",
    extra: { derived: "passenger" }
  }),
  perk("wheelman", "drafting", {
    name: "Drafting", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "Leading a group check on the move (Athletics, Acrobatics, or Stealth while moving): each crewmate gets +1 die.",
    extra: { rollMods: { skills: ["athletics", "acrobatics", "stealth"], dice: 1, when: "leadingGroup" } }
  }),
  perk("wheelman", "abort-abort", {
    name: "Abort, Abort", freq: FREQ.heist, timing: "reaction", automation: "reaction",
    effect: "Call an abort on a failed plan this round: the crew retreats without that Failure's Alert.",
    extra: { cancel: "abortAbort" }
  }),

  /* ---------- Perks: the Grifter ---------- */
  perk("grifter", "method-actor", {
    name: "Method Actor", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "Choose one NPC before the heist: +2 dice on Deception and Disguise involving them.",
    extra: { setup: "methodActorTarget", rollMods: { skills: ["deception", "disguise"], dice: 2, when: "methodActorTarget" } }
  }),
  perk("grifter", "double-bluff", {
    name: "Double Bluff", freq: FREQ.always, cost: 1, timing: "reaction", automation: "button",
    effect: "When an NPC sees through your disguise: 1 SP, the NPC is confused for a round.",
    extra: { action: "doubleBluff", target: "npc" }
  }),
  perk("grifter", "planted-evidence", {
    name: "Planted Evidence", freq: FREQ.planning, timing: "planning", automation: "button",
    effect: "During Planning: plant one false piece of information. The first NPC to find it believes it (a human for the heist, an animal for one scene).",
    extra: { action: "preparation", phases: ["planning"], prep: "evidence" }
  }),
  perk("grifter", "quick-change", {
    name: "Quick Change", freq: FREQ.always, timing: "free", automation: "text",
    effect: "Alter your disguise between scenes with no roll."
  }),
  perk("grifter", "the-long-con", {
    name: "The Long Con", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "A named false identity set up in Planning: +1 die on every roll that uses it.",
    extra: { setup: "longConIdentity", rollMods: { dice: 1, when: "longConIdentity" } }
  }),
  perk("grifter", "smoke-and-mirrors", {
    name: "Smoke and Mirrors", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "A failed Deception roll doesn't raise the Alert.",
    extra: { cancel: "smokeAndMirrors", skills: ["deception"] }
  }),

  /* ---------- Flaws (Chapter 7) ---------- */
  flaw("arachnophobe-magnet", {
    name: "Arachnophobe Magnet", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "Stealth Difficulty against humans +1 at all times.",
    extra: { rollMods: { skills: ["stealth"], diff: 1, when: "vsHuman" } }
  }),
  flaw("allergic-to-dust", {
    name: "Allergic to Dust", freq: FREQ.heist, timing: "st", automation: "prompt",
    effect: "Once a heist (the ST picks when): a forced Stealth D3 roll, or +1 Alert.",
    extra: { stTriggered: true, forcedRoll: { skill: "stealth", difficulty: 3 } }
  }),
  flaw("butterfingers", {
    name: "Butterfingers", freq: FREQ.heist, timing: "st", automation: "prompt",
    effect: "Once a heist: you drop what you hold. 1d6: 1–2 ahead, 3–4 to its left, 5–6 to its right (and down, if lower). An Action recovers it.",
    extra: { stTriggered: true }
  }),
  flaw("compulsive-planner", {
    name: "Compulsive Planner", freq: FREQ.heist, timing: "st", automation: "prompt",
    effect: "Once a heist the ST freezes your action for a round; if the crew acts anyway, −1 SP. 1 SP delays it a round.",
    extra: { stTriggered: true, delayCost: 1 }
  }),
  flaw("dramatic", {
    name: "Dramatic", freq: FREQ.heist, timing: "st", automation: "prompt",
    effect: "Once a heist your action needs spectacle: +1 Alert. 1 SP delays it a round.",
    extra: { stTriggered: true, delayCost: 1, alert: 1 }
  }),
  flaw("easily-distracted", {
    name: "Easily Distracted", freq: FREQ.heist, timing: "st", automation: "prompt",
    effect: "Once a heist the ST delays your action by one round.",
    extra: { stTriggered: true }
  }),
  flaw("fear-of-vacuums", {
    name: "Fear of Vacuums", freq: FREQ.always, timing: "forced", automation: "auto",
    effect: "When a vacuum activates in your scene: NERVE roll, Difficulty 3, or lose your action.",
    extra: { forcedRoll: { attr: "nerve", difficulty: 3 } }
  }),
  flaw("loud", {
    name: "Loud", freq: FREQ.always, timing: "passive", automation: "auto",
    effect: "At Alert 5+, your Stealth rolls are +1 Difficulty.",
    extra: { rollMods: { skills: ["stealth"], diff: 1, when: "alert5" } }
  }),
  flaw("overconfident", {
    name: "Overconfident", freq: FREQ.heist, timing: "st", automation: "prompt",
    effect: "Once a heist the ST makes you volunteer for something you shouldn't. 1 SP delays it a round.",
    extra: { stTriggered: true, delayCost: 1 }
  }),
  flaw("show-off", {
    name: "Show-Off", freq: FREQ.heist, timing: "st", automation: "prompt",
    effect: "Once a heist one roll becomes Difficulty 4 (or +1 if already 4+). Pays the Flaw Moment on a Partial, Failure or Critical. 1 SP delays it a round.",
    extra: { stTriggered: true, delayCost: 1 }
  }),

  /* ---------- Crew-wide and everyone ---------- */
  def("damage-control", {
    kind: "crew", name: "Damage Control", freq: FREQ.heist, scope: "crew", cost: 3, timing: "reaction", automation: "reaction",
    effect: "The crew spends 3 SP between them to reduce one Alert spike of +2 or more by 1. Before the round ends."
  }),
  def("not-part-of-the-plan", {
    kind: "crew", name: "Not Part of the Plan", freq: FREQ.heist, scope: "crew", cost: 4, timing: "reaction", automation: "reaction",
    effect: "4 SP from one spider: negate one complication the ST just introduced, a Partial's included."
  }),
  def("assist", {
    kind: "general", name: "Assist", freq: FREQ.always, timing: "action", automation: "button",
    effect: "Roll one of your Skills (1–3 dice, plus your own Silk dice); each Success is +1 die on a crewmate's roll.",
    extra: { action: "assist", target: "crewmate", range: 1 }
  })
].map(d => [d.key, d])));

/** Look up an ability definition. */
export function getAbility(key) {
  return ABILITIES[key] ?? null;
}

/* -------------------------------------------- */
/*  Usage                                       */
/* -------------------------------------------- */

/** A never-used usage stamp. */
export function blankUsage() {
  return { heistId: "", sceneSerial: -1, roundSerial: -1, count: 0 };
}

/** The freeplay clock (no heist running). */
export const FREEPLAY_CLOCK = Object.freeze({ heistId: "freeplay", phase: "idle", sceneSerial: 0, roundSerial: 0 });

const num = (v, d) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : d);

function normUsage(u) {
  return {
    heistId: String(u?.heistId ?? ""),
    sceneSerial: num(u?.sceneSerial, -1),
    roundSerial: num(u?.roundSerial, -1),
    count: Math.max(0, num(u?.count, 0))
  };
}

function normClock(c) {
  return {
    heistId: String(c?.heistId ?? FREEPLAY_CLOCK.heistId),
    phase: c?.phase ?? null,
    sceneSerial: num(c?.sceneSerial, 0),
    roundSerial: num(c?.roundSerial, 0)
  };
}

/** Phases in which phase limits don't apply (freeplay — the ST's judgement). */
const UNGATED_PHASES = new Set([null, undefined, "", "idle"]);

/** True when a stamp falls in the clock's current window for this frequency. */
function inWindow(freq, u, c) {
  if (!u.count || !u.heistId || u.heistId !== c.heistId) return false;
  switch (freq) {
    case FREQ.round: return u.roundSerial === c.roundSerial;
    case FREQ.scene: return u.sceneSerial === c.sceneSerial;
    case FREQ.heist:
    case FREQ.planning: return true;
    default: return false;
  }
}

/** The phases an ability is limited to (planning-frequency ones default to Planning). */
export function abilityPhases(def) {
  if (def?.phases?.length) return def.phases;
  if (def?.freq === FREQ.planning) return ["planning"];
  return null;
}

/**
 * Is the ability usable now?
 * @param {object} def    An ABILITIES entry.
 * @param {object} usage  The item's `system.usage` stamp (or a crew-usage stamp).
 * @param {object} clock  `{heistId, phase?, sceneSerial, roundSerial}`.
 * @returns {{available:boolean, reason:string, usedThis:boolean}}
 *   reason: "ready" | "passive" | "used-round" | "used-scene" | "used-heist"
 *         | "used-planning" | "phase" | "unknown"
 */
export function usageStatus(def, usage, clock) {
  if (!def) return { available: false, reason: "unknown", usedThis: false };
  const u = normUsage(usage);
  const c = normClock(clock);
  const usedThis = inWindow(def.freq, u, c);
  const phases = abilityPhases(def);
  if (phases && !UNGATED_PHASES.has(c.phase) && !phases.includes(c.phase)) {
    return { available: false, reason: "phase", usedThis };
  }
  if (usedThis) return { available: false, reason: `used-${def.freq}`, usedThis };
  const passive = def.automation === "auto" && !def.action;
  return { available: true, reason: passive ? "passive" : "ready", usedThis: false };
}

/**
 * Stamp a use. Within the same window the count goes up; otherwise it starts
 * again at 1. The returned object is the new `system.usage`.
 */
export function markUsage(def, usage, clock) {
  const u = normUsage(usage);
  const c = normClock(clock);
  const same = !!def && u.heistId === c.heistId && (
    def.freq === FREQ.round ? u.roundSerial === c.roundSerial
      : def.freq === FREQ.heist || def.freq === FREQ.planning ? true
        : u.sceneSerial === c.sceneSerial);
  return {
    heistId: c.heistId,
    sceneSerial: c.sceneSerial,
    roundSerial: c.roundSerial,
    count: same ? u.count + 1 : 1
  };
}

/** Short labels for the status chip. */
export function statusLabel(def, status) {
  switch (status?.reason) {
    case "ready": return def?.cost ? `Ready · ${def.cost} SP` : "Ready";
    case "passive": return "Always on";
    case "used-round": return "Used this round";
    case "used-scene": return "Used this scene";
    case "used-heist":
    case "used-planning": return "Used this heist";
    case "phase": {
      const p = abilityPhases(def) ?? [];
      return p.length === 1 ? `${p[0].charAt(0).toUpperCase()}${p[0].slice(1)} only` : "Not now";
    }
    default: return "Unknown";
  }
}

/** Human label for a frequency. */
export const FREQ_LABELS = Object.freeze({
  [FREQ.always]: "Any time",
  [FREQ.round]: "Once per round",
  [FREQ.scene]: "Once per scene",
  [FREQ.heist]: "Once per heist",
  [FREQ.planning]: "Once, in Planning"
});

/* -------------------------------------------- */
/*  Pending bonuses (system.heist.pending)      */
/* -------------------------------------------- */

let _pendingSeq = 0;
const newPendingId = () => `p${Date.now().toString(36)}${(++_pendingSeq).toString(36)}`;

/**
 * Normalise a queued bonus. `serial` is the clock serial its expiry is measured
 * against: the roundSerial for "round", the sceneSerial for "scene".
 */
export function makePending(bonus = {}, clock = null) {
  const c = normClock(clock);
  const expires = ["nextRoll", "round", "scene"].includes(bonus.expires) ? bonus.expires : "nextRoll";
  const serial = bonus.serial ?? (expires === "round" ? c.roundSerial : c.sceneSerial);
  return {
    id: String(bonus.id ?? newPendingId()),
    dice: Math.trunc(Number(bonus.dice) || 0),
    diff: Math.trunc(Number(bonus.diff) || 0),
    capped: bonus.capped !== false,
    skills: Array.isArray(bonus.skills) ? bonus.skills.map(String) : [],
    jobOnly: !!bonus.jobOnly,
    expires,
    serial: Math.trunc(Number(serial) || 0),
    label: String(bonus.label ?? ""),
    source: String(bonus.source ?? "")
  };
}

/**
 * Add a bonus to a pending list. An Assist replaces any earlier Assist ("only
 * one spider can Assist a given roll"; the latest wins, §15-Q19), and a bonus
 * with the same id replaces its older copy.
 */
export function addPendingBonus(list, bonus, clock = null) {
  const b = makePending(bonus, clock);
  const out = (list ?? []).filter(p => p.id !== b.id && !(b.source === "assist" && p.source === "assist"));
  out.push(b);
  return out;
}

/** Drop bonuses whose round / scene has passed. `nextRoll` ones wait for a roll. */
export function prunePending(list, clock) {
  const c = normClock(clock);
  return (list ?? []).filter(p => {
    if (p.expires === "round") return Number(p.serial) >= c.roundSerial;
    if (p.expires === "scene") return Number(p.serial) >= c.sceneSerial;
    return true;
  });
}

/** The bonuses that apply to a roll of this skill (job = part of the actual job). */
export function applicablePending(list, { skill = null, job = true } = {}) {
  return (list ?? []).filter(p =>
    (!p.skills?.length || (skill && p.skills.includes(skill))) && (!p.jobOnly || job));
}

/** Remove the listed bonuses (consumed by a roll). Round/scene bonuses stay until they expire. */
export function consumePendingIds(list, ids) {
  const drop = new Set(ids ?? []);
  return (list ?? []).filter(p => !(drop.has(p.id) && p.expires === "nextRoll"));
}

/* -------------------------------------------- */
/*  Spend Silk menu (§3.3)                      */
/* -------------------------------------------- */

/** Pre-roll Silk spends that aren't tied to a roll card. */
export const SILK_MENU = Object.freeze([
  { key: "silk-line", label: "Silk Line", cost: 1, usesAction: true,
    text: "Run a silk line up to 5 squares, no roll (it still takes your Action). Safe footing; under pressure, −1 Difficulty to the climb or crossing it serves." },
  { key: "web-structure", label: "Web Structure", cost: 2, usesAction: true,
    text: "A small web structure with no roll — a net, a tripwire, a platform, a hammock." },
  { key: "silk-sled", label: "Silk Sled", cost: 1, usesAction: false,
    text: "Haul a Treasure at full Speed." },
  { key: "delay-flaw", label: "Delay my Flaw", cost: 1, usesAction: false,
    text: "Push your Flaw back one round. It still fires." }
]);

/* -------------------------------------------- */
/*  Abilities panel rows (pure)                 */
/* -------------------------------------------- */

const KIND_ORDER = { species: 0, signature: 1, perk: 2, flaw: 3, crew: 4, general: 5 };

/**
 * Build the Abilities panel rows from a spider's items.
 * @param {Array<{id, key, name, usage}>} entries  One per ability item (key resolved).
 * @param {object} clock
 * @param {{silk?:number, isGM?:boolean}} [opts]
 */
export function abilityRows(entries, clock, { silk = Infinity, isGM = false } = {}) {
  return (entries ?? []).map(e => {
    const d = getAbility(e.key);
    const st = usageStatus(d, e.usage, clock);
    const affordable = !d?.cost || silk >= d.cost;
    const clickable = !!d && !!d.action && st.available && affordable
      && (d.kind !== "flaw") && d.automation !== "reaction";
    return {
      id: e.id, key: e.key, itemName: e.name,
      name: d?.name ?? e.name,
      kind: d?.kind ?? "unknown",
      known: !!d,
      freq: d?.freq ?? FREQ.always,
      freqLabel: FREQ_LABELS[d?.freq] ?? "",
      automation: d?.automation ?? "text",
      cost: d?.cost ?? 0,
      effect: d?.effect ?? "",
      available: st.available,
      reason: st.reason,
      used: st.usedThis,
      status: d ? statusLabel(d, st) : "Text only",
      statusClass: st.usedThis ? "used" : st.reason === "passive" ? "passive" : st.available ? "ready" : "blocked",
      canUse: clickable,
      canFire: !!d?.stTriggered && isGM && st.available,
      canDelay: !!d?.delayCost && st.available,
      needsSetup: d?.setup ?? null,
      affordable,
      sort: KIND_ORDER[d?.kind] ?? 9
    };
  }).sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name));
}
