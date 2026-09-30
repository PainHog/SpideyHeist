/**
 * Stats + issue-detector recorder. One Recorder per (variant, heist); the
 * engine calls it, run.mjs aggregates and prints.
 */

/**
 * Issue detectors. `kind`:
 *   gap     — the rules do not define what happens (the simulator had to choose)
 *   broken  — the rules define it, and the result looks wrong / degenerate
 *   info    — worth knowing; not necessarily a problem
 */
export const ISSUES = {
  STUCK_OBSTACLE: { kind: "gap", title: "Obstacle stuck in repeated failure until the round cap", ref: "Ch 2 Failure ('no progress'); Ch 13 'make failure a door'", note: "Nothing in the rules ends a run of failures except the Alert reaching the Limit — and in the Escape (Alert already past the Limit) not even that." },
  REPEATED_FAILURE: { kind: "info", title: "Same spider failed 3+ times in a row at one obstacle", ref: "Ch 2 Failure" },
  FULL_ALERT_BEFORE_OBJECTIVE: { kind: "info", title: "Full Alert before the objective was taken", ref: "Ch 9 At Limit" },
  CREW_WIPE: { kind: "info", title: "Crew wipe (Loss): every spider Out at once", ref: "Ch 11 Debrief" },
  NO_TRAINED_SPIDER: { kind: "info", title: "No spider present has a single rank in any called-for skill", ref: "Ch 6 Skill 0; Ch 8 Improvise" },
  IMPROVISE_USED: { kind: "info", title: "Improvise (2 SP) chosen because it beat every called-for skill", ref: "Ch 8 Improvise" },
  CRIT_IMPOSSIBLE: { kind: "info", title: "Critical impossible: final pool below 2× Difficulty", ref: "Ch 2 Critical Success" },
  PARTIAL_IMPOSSIBLE: { kind: "info", title: "Partial impossible: Difficulty 1 (one Success is a full success)", ref: "Ch 2 Types of Results" },
  BOTCH_PATH: { kind: "info", title: "Pool at 0 or below: rolled the Botch die", ref: "Ch 2 The Botch" },
  HOPELESS_ROLL: { kind: "broken", title: "Roll that cannot succeed: pool ≤ 0 even with the spider's Silk and a max Assist (only Silk Clutch gets through)", ref: "Ch 2 The Botch; Ch 10 Critical" },
  NO_ASSIST_HELPER: { kind: "info", title: "An uncertain roll with no free Assist helper", ref: "Ch 2 Assists" },
  CRITICAL_NO_CARRIER: { kind: "gap", title: "A Critical spider must move but no crewmate is free to carry it", ref: "Ch 3 Speed / Ch 10 Critical ('must be assisted')", note: "The rules never say what happens to a Critical spider nobody can carry." },
  CRITICAL_LEFT_BEHIND: { kind: "gap", title: "Critical spider left behind and counted as caught", ref: "Ch 10" },
  LOOT_CARRIER_OUT: { kind: "gap", title: "The spider carrying the loot went Out", ref: "Ch 10 Going Out (loot not covered)" },
  LOOT_LOST: { kind: "info", title: "Loot lost after its carrier went Out", ref: "(simulator param lootOnOut)" },
  REPLACEMENT_NEVER_ARRIVES: { kind: "broken", title: "Spider went Out in the last obstacle: its Waiting Web replacement never arrives", ref: "Ch 10 Going Out ('enter at the start of the next obstacle')" },
  REPLACEMENT_NEVER_ACTS: { kind: "info", title: "Waiting Web replacement arrived but never rolled or assisted", ref: "Ch 10 Going Out" },
  SILK_HOARDED: { kind: "info", title: "Spider ended the heist with ≥ 75% of its starting Silk unspent", ref: "Ch 8" },
  CREATURE_DROVE_FULL_ALERT: { kind: "broken", title: "Full Alert where creature per-round contributions were ≥ half of all Alert gained", ref: "Ch 9 +X row; Ch 16" },
  CREATURE_ALONE_FULL_ALERT: { kind: "broken", title: "Creature per-round Alert alone would have reached the Limit", ref: "Ch 9 +X row; Ch 16" },
  DIFFICULTY_ZERO: { kind: "gap", title: "Modifiers pushed a Difficulty to 0 or below (clamped to 1)", ref: "Ch 2 Difficulty (no floor stated); Ch 5 Soundless / Escape Routes / I Know a Way" },
  CRIT_AT_ZERO_ALERT: { kind: "info", title: "Critical at Alert 0: the −1 is wasted", ref: "Ch 9" },
  CRIT_D1_NO_ALERT: { kind: "info", title: "Critical on a Difficulty 1 roll: no Alert drop by rule", ref: "Ch 2 (ruling B28)" },
  ALERT_PAST_LIMIT: { kind: "gap", title: "Alert rose after Full Alert — no further effect is defined", ref: "Ch 9 At Limit; Ch 11 'the Alert carries over'" },
  ESCAPE_FAILURE_FREE: { kind: "broken", title: "Failed roll at Full Alert with no threat able to hit: the failure cost nothing", ref: "Ch 9; Ch 11 Phase 4" },
  OPPOSED_NO_PARTIAL: { kind: "gap", title: "Opposed roll: Partial and Critical are undefined (treated as win/lose only)", ref: "Ch 2 Opposed Rolls" },
  DEFENSE_POOL_ZERO: { kind: "gap", title: "Taking a hit with BODY+Endurance−penalty ≤ 0 (Botch rule undefined for defence)", ref: "Ch 10 Taking Hits; Ch 2 The Botch" },
  ASSIST_PENALTY: { kind: "gap", title: "Assist by a wounded spider: does the Vitality penalty apply to the 1–3 Skill dice?", ref: "Ch 2 Assists vs Ch 10 '−N dice on all rolls'" },
  CLUTCH_ON_BOTCH: { kind: "gap", title: "Silk Clutch used on a Botch — does the Botch's +2 still land?", ref: "Ch 8 Silk Clutch; Ch 2 The Botch" },
  FLAW_NEVER_FIRES: { kind: "info", title: "A once-per-heist Flaw never had a chance to fire", ref: "Ch 7 Flaws" },
  COMPULSIVE_NET_ZERO: { kind: "broken", title: "Compulsive Planner fired: −1 SP (crew acted anyway) and +1 SP (Flaw Moment) cancel out", ref: "Ch 7 Flaw 6; Ch 8 Flaw Moment" },
  SILK_LINE_BYPASS: { kind: "broken", title: "A climb/gap obstacle skipped entirely with one Silk Line (1 SP or a D2 roll)", ref: "Ch 8 / Ch 12 Silk Line ('no Acrobatics roll')" },
  SLIPPERY_DOUBLE_MOVE: { kind: "info", title: "Slippery obstacle skipped by taking double movement (no threat active)", ref: "Ch 3 / Ch 15" },
  MECH_BYPASS: { kind: "broken", title: "Mechanical obstacle auto-cleared with no roll (I Made a Thing: Bypass / Spitting jam)", ref: "Ch 5 I Made a Thing; Ch 4 Precision Application" },
  SPITTING_UNLIMITED: { kind: "gap", title: "Spitting Spider's no-roll jam used again in the same heist (no usage limit is given)", ref: "Ch 4 Precision Application" },
  JURY_RIG_LOCK: { kind: "broken", title: "Jury-Rig turned a harder lock into Difficulty 2", ref: "Ch 5 Jury-Rig ('Locks, sensors, that one drawer')" },
  MAKE_A_SCENE_FREE: { kind: "broken", title: "Make a Scene's +1 Alert cancelled by Plausible Deniability (+2 dice to the crew for free)", ref: "Ch 5 Make a Scene; Plausible Deniability" },
  SHOWOFF_EASIER: { kind: "broken", title: "Show-Off made a Difficulty 5 roll easier (the 'Difficulty 4 version')", ref: "Ch 7 Flaw 10" },
  PARROT_SHRIEK: { kind: "info", title: "Parrot shriek (+2 at Alert 7) — pushed straight to Full Alert", ref: "Ch 16 Alert Parrot" },
  CASING_OVERFLOW: { kind: "broken", title: "Casing earned more intel Successes than the heist has intel", ref: "Ch 11 Casing; Ch 19 intel lists (3 facts each)" },
  ESCAPE_STACK_D1: { kind: "info", title: "Escape Difficulty cut by 2 (Escape Routes + I Know a Way stack)", ref: "Ch 5 Lookout / Wheelman" },
  PERSUADE_REROLL_UNLIMITED: { kind: "info", title: "Silver Tongue reroll used more than once in a heist (no limit given)", ref: "Ch 5 Silver Tongue" },
  CONTINUOUS_FLAW_SILK: { kind: "gap", title: "An always-on Flaw (Loud / Arachnophobe Magnet) earned Silk 2+ times in one heist (no cap on Flaw Moments)", ref: "Ch 7; Ch 8 Flaw Moment" },
  NPC_NO_POOL: { kind: "gap", title: "A rule asked an NPC with no stat block to roll (humans vs Decoy / Thunderous Entrance)", ref: "Ch 5 Decoy / Thunderous Entrance; Ch 16" },
  CLUTCH_AT_LIMIT: { kind: "info", title: "Silk Clutch's +1 itself caused Full Alert", ref: "Ch 8 Silk Clutch" },
  FULL_ALERT_NO_LOCKDOWN: { kind: "info", title: "Full Alert Escape at a Limit ≤ 6 runs at the 'Active' band — no Lockdown roll penalty", ref: "Ch 9 (ruling B30)" },
  ABANDONED_OBJECTIVE: { kind: "gap", title: "Crew abandoned the objective after the round cap (no rule for giving up)", ref: "Ch 11" },
  EXTERMINATOR_OUT: { kind: "info", title: "Exterminator's Spray caught a spider in the open: straight to Out", ref: "Ch 16 The Exterminator" }
};

export class Recorder {
  constructor(label = "") {
    this.label = label;
    this.runs = 0;
    this.outcomes = { win: 0, partial: 0, loss: 0 };
    this.ap = 0;
    this.c = {};                // flat counters
    this.issues = {};           // code → { count, runs, examples[] }
    this.alertAfter = {};       // obstacleId → [sum, n]
    this.fullAlertAt = {};      // obstacleId → count
    this.outsHist = {};         // #Outs per run → count
    this.silkEarned = {};
    this.silkSpent = {};
    this.alertBy = {};          // cause → total Alert added
    this.obs = {};              // obstacleId → {rounds, rolls, stuck, clearedBy:{}}
    this.results = { critical: 0, success: 0, partial: 0, failure: 0, botch: 0, cleanfail: 0 };
    this.ability = {};          // key → { crews, wins, usedRuns, uses, flips }
    this._runIssues = new Set();
    this._runUse = new Set();
  }

  inc(key, n = 1) { this.c[key] = (this.c[key] ?? 0) + n; }

  issue(code, example) {
    const e = (this.issues[code] ??= { count: 0, runs: 0, examples: [] });
    e.count++;
    if (!this._runIssues.has(code)) { this._runIssues.add(code); e.runs++; }
    if (example && e.examples.length < 3 && !e.examples.includes(example)) e.examples.push(example);
  }

  earn(type, n) { this.silkEarned[type] = (this.silkEarned[type] ?? 0) + n; }
  spend(type, n) { this.silkSpent[type] = (this.silkSpent[type] ?? 0) + n; }
  alert(cause, n) { this.alertBy[cause] = (this.alertBy[cause] ?? 0) + n; }

  obstacle(id) {
    return (this.obs[id] ??= { entered: 0, rounds: 0, rolls: 0, stuck: 0, skipped: 0, clearedBy: {} });
  }

  /** An ability/perk/flaw was used this run; `flip` = it changed a result. */
  use(key, flip = false) {
    const a = (this.ability[key] ??= { crews: 0, wins: 0, usedRuns: 0, uses: 0, flips: 0 });
    a.uses++;
    if (flip) a.flips++;
    if (!this._runUse.has(key)) { this._runUse.add(key); a.usedRuns++; }
  }

  startRun() {
    this._runIssues = new Set();
    this._runUse = new Set();
  }

  endRun(result, crewKeys) {
    this.runs++;
    this.outcomes[result.outcome]++;
    this.ap += result.ap;
    this.outsHist[result.outs] = (this.outsHist[result.outs] ?? 0) + 1;
    for (const k of crewKeys) {
      const a = (this.ability[k] ??= { crews: 0, wins: 0, usedRuns: 0, uses: 0, flips: 0 });
      a.crews++;
      if (result.outcome === "win") a.wins++;
    }
  }
}
