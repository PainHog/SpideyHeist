/**
 * HEISTY SPIDEYS — Cross-package contracts (automation, 1.8.0).
 * Constants only: no imports, no Foundry globals. Copied verbatim from
 * docs/AUTOMATION-DESIGN.md Appendix A; change only through the integrator.
 */
export const SYSTEM_ID = "heisty-spideys";
export const FLAG = "heisty-spideys";
export const QUERY = "heisty-spideys.op";
export const SOCKET = "system.heisty-spideys";

export const SETTINGS = Object.freeze({
  heistState: "heistState", autoAlert: "autoAlert", autoSilk: "autoSilk", autoHits: "autoHits",
  autoVitality: "autoVitality", autoCreatures: "autoCreatures", autoClock: "autoClock",
  autoStall: "autoStall", autoRecovery: "autoRecovery", autoWaitingWeb: "autoWaitingWeb",
  autoCapture: "autoCapture", autoFlaws: "autoFlaws", autoProcedures: "autoProcedures",
  autoEndRound: "autoEndRound", forcedRolls: "forcedRolls", trackerForPlayers: "trackerForPlayers",
  movementWarnings: "movementWarnings", trackerPosition: "trackerPosition"
});

export const PHASES = Object.freeze(["idle", "score", "planning", "heist", "escape", "debrief"]);

export const CARD = Object.freeze({
  check: "check", threat: "threat", attack: "attack", shrug: "shrug", assist: "assist",   // WP-B renders
  group: "group", request: "request", alertEvent: "alertEvent", complication: "complication",
  procedure: "procedure", flaw: "flaw", prompt: "prompt", debrief: "debrief"             // WP-C renders
});

export const OPS = Object.freeze({
  alertCancel: "alert.cancel", alertPledge: "alert.pledge", crewNptp: "crew.nptp",       // WP-C
  heistActed: "heist.acted", heistLoot: "heist.loot", heistPrep: "heist.prep",
  heistCasingReveal: "heist.casingReveal", heistAddEffect: "heist.addEffect",
  actorAddPending: "actor.addPending", actorHeal: "actor.heal",                          // WP-A
  uiPromptReplacement: "ui.promptReplacement",
  cardPatch: "card.patch", hitRetarget: "hit.retarget", uiForcedRoll: "ui.forcedRoll"    // WP-B
});

export const HOOKS = Object.freeze({
  rollResolved: "heistySpideys.rollResolved",       // (message, card)
  heistChanged: "heistySpideys.heistChanged",       // (state, diff)
  alertChanged: "heistySpideys.alertChanged",       // (value, entry)
  vitalityChanged: "heistySpideys.vitalityChanged", // (actor, from, to, cause)
  obstacleStarted: "heistySpideys.obstacleStarted", // (state)
  roundEnded: "heistySpideys.roundEnded",           // (state)
  phaseChanged: "heistySpideys.phaseChanged"        // (state, from, to)
});

export const FREQ = Object.freeze({ always: "always", round: "round", scene: "scene", heist: "heist", planning: "planning" });

/** Alert trigger and cancel keys (ledger, §3.1). */
export const TRIGGERS = Object.freeze(["failure", "partial", "botch", "critical", "spotted", "confirmed", "loud",
  "fightLanded", "approach", "clutch", "creature", "spike", "out", "capture", "complication", "manual"]);
export const CANCELS = Object.freeze(["thatsNotWhatHappened", "plausibleDeniability", "abortAbort",
  "smokeAndMirrors", "notPartOfThePlan", "noConsequence", "swapped", "contingency"]);
